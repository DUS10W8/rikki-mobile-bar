# Rikki's Mobile Event System Audit

Audit date: 2026-05-14

## 1. Executive Summary

The current Rikki's Mobile event system is a Vite/React single-page app with dedicated routes for guest ordering (`/order`), bartender operations (`/bartender`), and tipping (`/tip`). Guests choose a drink, enter a name, optionally enter a phone number, and submit an order to Supabase. After submission, the guest sees a confirmation/tracker page with an estimated wait time, live status polling, tip/connect buttons, optional sound alert, and station-specific pickup messaging when available.

The bartender dashboard requires a PIN, then requires a local station selection: White Bar or Brown Bar. Orders are grouped into New, In Progress, Ready for Pickup, and Completed. Bartenders can Start, Ready, and Complete orders. Starting an unassigned order sets `status = In Progress` and assigns `bar_station` to the selected station. Ready preserves station assignment. The dashboard polls every 7 seconds and also subscribes to Supabase realtime changes.

Drink-limit and Square payment behavior is currently disabled by `ENABLE_DRINK_LIMITS = false`, but the code and links are preserved. SMS is not required for customer order creation; however, the bartender dashboard still attempts a ready SMS after a Ready status update.

## 2. Current Architecture

- `src/main.tsx`: simple pathname router. Routes `/tip`, `/order`, `/bartender`, `/privacy`, `/terms`; all other paths render the main site.
- `src/order/OrderPage.tsx`: customer ordering flow, Supabase drink loading, order insert, confirmation screen, estimated wait count, live order tracker polling, optional customer sound/vibration alert, hidden drink-limit/payment logic.
- `src/order/orderSupabaseClient.ts`: creates Supabase client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; validates basic URL/key presence.
- `src/order/eventConfig.ts`: event flags/config. Currently `ENABLE_DRINK_LIMITS = false` and `BARTENDER_POLL_INTERVAL_MS = 7000`.
- `src/order/eventMenu.ts`: local fallback event menu if Supabase drink loading fails or returns no active rows.
- `src/order/OrderPage.css`: customer order page styling and input styling.
- `src/bartender/BartenderPage.tsx`: bartender PIN gate, station selection, live order polling/realtime refresh, status updates, ready SMS attempt, section navigation, queue summary, order cards, hidden ticket/payment labels when drink limits are disabled.
- `src/pages/TipPage.tsx`: tip page content and links. Current page keeps Square amount/custom links and has updated Venmo/Cash App URLs.
- `src/pages/TipPage.css`: tip page styling.
- `api/send-ready-sms.js`: Vercel serverless function for bartender-triggered ready SMS. Uses Twilio env vars and optional Supabase service role key to mark `ready_sms_sent_at`.
- `scripts/create-spa-routes.mjs`: copies `dist/index.html` into route folders after build for static SPA fallback.
- `package.json`: scripts are `dev`, `build`, `lint`, and `preview`. There is no test script.

## 3. Event-Critical Flows

### Guest Places An Order

1. Guest opens `/order`.
2. App loads drinks from Supabase: `drinks.select("*").eq("active", true).order("category").order("name")`.
3. If Supabase drink loading fails or returns no rows, app falls back to `EVENT_DRINK_MENU`.
4. Guest selects a drink, enters a name, optionally enters a phone number.
5. Submit is enabled when a drink is selected, name length is at least 2, and submission is not already in progress.
6. Phone is not required. If a valid phone is entered, it is normalized to `+1...`; if partial/invalid text is entered, it is sent as trimmed text and does not block the order.
7. App inserts into `orders` with `name`, `phone`, `drink`, and `status: "New"`.
8. After insert succeeds, app counts active queued drinks and shows confirmation.

### Confirmation / Live Tracker

1. Confirmation stores the inserted order response, including `id`.
2. Estimated wait is calculated by counting orders with active statuses: `new`, `in_progress`, `New`, `In Progress`.
3. Confirmation polls Supabase every 4 seconds for the specific order id:
   - select `id,name,phone,drink,status,bar_station,created_at,updated_at`
4. Tracker maps status to:
   - `new` -> In the queue
   - `in_progress` -> Being made
   - `ready` -> Ready for pickup
   - `completed` -> Completed / picked up
5. If `bar_station` is present:
   - In Progress: "Your drink is being made at the White Bar/Brown Bar."
   - Ready: "Your drink is ready at the White Bar/Brown Bar!"
6. If polling fails, the page keeps working and shows: "Live updates are having trouble. Please listen for your name at pickup."
7. If status changes to Ready, it tries `navigator.vibrate(180)` and plays a chime only if the guest enabled sound.

### Bartender Station Selection

1. Bartender opens `/bartender`.
2. If not PIN-authorized, bartender enters `VITE_BARTENDER_PIN`.
3. After PIN, bartender chooses White Bar or Brown Bar.
4. Station is saved in `localStorage` under `rikki-bartender-station`.
5. Dashboard shows a visible station badge and a "Change station" button.

### Start / Ready / Complete Status Changes

Start:
- If selected station is missing, Start is blocked with an error.
- If order has no `bar_station`, update payload includes:
  - `status: "In Progress"`
  - `bar_station: selected station`
- If order already has `bar_station`, current code does not overwrite it.

Ready:
- Updates `status: "Ready"`.
- Does not send `bar_station`, so station is preserved.
- Then attempts ready SMS if `ready_sms_sent_at` is missing.

Complete:
- Updates `status: "Completed"`.
- Preserves `bar_station`.

### Tip Page

`/tip` shows existing Square amount links, custom amount link, and updated alternate payment links:
- Venmo: `https://venmo.com/code?user_id=4582001378067513032&created=1778814267.6042771&printed=1`
- Cash App: `https://cash.app/$rikkismobile`

## 4. Supabase Requirements

### `drinks` Table

Current app can read from a `drinks` table with at least:
- `id uuid`
- `name text`
- `category text`
- `description text`
- `active boolean`

Your updated table also includes:
- `ingredients text`
- `garnish text`
- `display_order int`
- `is_available boolean`

Current app behavior:
- Selects `*`
- Filters only `.eq("active", true)`
- Orders by `category`, then `name`
- Does not explicitly filter `is_available`
- Does not use `display_order`
- Does not display `ingredients` or `garnish`

RLS needed:
- Public/anon select for active/available drinks. Your policy uses:
  - `active = true and is_available = true`

### `orders` Table

Current app expects at least:
- `id`
- `name`
- `phone`
- `drink`
- `status`
- `created_at`
- `updated_at`
- `ready_sms_sent_at` optional, used by ready SMS logic
- `bar_station text nullable`

`bar_station` allowed values:
- `white_bar`
- `brown_bar`
- `null`

Status values used by the frontend:
- Inserts: `"New"`
- Start update: `"In Progress"`
- Ready update: `"Ready"`
- Complete update: `"Completed"`

Counts also include lowercase/underscore variants:
- `new`
- `in_progress`
- `ready`
- `completed`

RLS needed for anon client:
- `drinks`: select active/available rows.
- `orders`: insert guest orders from `/order`.
- `orders`: select by id for guest live tracker.
- `orders`: count/select active queue for wait time.
- `orders`: select recent orders for `/bartender`.
- `orders`: update status/bar_station from `/bartender`.

Important: If RLS blocks any of these, the relevant UI will fail or show fallback/error states.

## 5. Feature Flags / Disabled Features

- `ENABLE_DRINK_LIMITS = false` in `src/order/eventConfig.ts`.
- Drink ticket labels and customer ticket count UI are hidden/inactive while the flag is false.
- Repeat orders are not blocked.
- Square payment links remain in code in `OrderPage.tsx` but are hidden/inactive because payment is only created when drink limits are enabled.
- Bartender ticket/payment labels are also hidden when `ENABLE_DRINK_LIMITS` is false.
- SMS/Twilio is not part of customer order creation.
- Ready SMS still exists in `/bartender` after status changes to Ready:
  - status update happens first
  - SMS failure does not revert Ready status
  - bartender UI waits for SMS request to complete before clearing `updatingId`

## 6. Known Pain Points

### Critical

1. `orders` RLS may block live tracker or bartender updates.
   - The app relies on anon select/update for orders. If policies are not correct, orders may insert but tracking or dashboard updates can fail.

2. Status casing mismatch risk.
   - App writes `"New"`, `"In Progress"`, `"Ready"`, `"Completed"`.
   - If Supabase constraints or policies expect lowercase `new`, `in_progress`, etc., inserts/updates will fail.

3. `bar_station` migration must exist in production before using the station workflow.
   - `getOrderById` selects `bar_station`.
   - `updateOrderStatus` patches `bar_station`.
   - Missing column will break live tracker select and station assignment.

### High

4. Bartender ready SMS request can slow the Ready action.
   - The status update is safe, but the UI remains in updating state while the SMS endpoint returns/fails.
   - With Twilio not approved/configured, this may cause visible delay after pressing Ready.

5. Current drink ordering ignores `display_order`.
   - Your Supabase menu includes `display_order`, but code orders by category/name.
   - Menu may not appear in the intended event order.

6. Current drink loading does not explicitly filter `is_available`.
   - RLS policy should hide unavailable rows, but the client query itself only filters `active`.

7. Browser audio limitations.
   - Customer sound requires tapping "Enable sound alert."
   - Bartender ding is attempted automatically and may be blocked by browser autoplay policy until the page has user interaction.

8. Partial/invalid phone is stored if typed.
   - This is intentional for optional phone, but phone data may be messy.
   - If later SMS/ticket logic is re-enabled, partial phone values could affect counts/notifications.

### Medium

9. Live tracker polling is per open confirmation page.
   - 300 guests can create many polling clients if guests leave pages open.
   - 4-second polling is likely acceptable for one event, but it is load to watch.

10. Bartender dashboard uses both Supabase realtime and 7-second polling.
   - Good for reliability, but can duplicate refreshes.
   - Should be okay for event scale.

11. Completed is collapsed on mobile by default.
   - Good for rush mode, but bartender may not immediately see completed history without tapping.

12. Route typo is easy.
   - Correct route is `/bartender`, not `4173bartender`.
   - QR/internal docs should use exact URLs.

13. Mojibake characters appear in source strings.
   - Hidden customer drink-limit copy has `Youâ€™ve`.
   - Bartender station label source has `Â·` instead of a normal dot/bullet.
   - Some of this can be visible on bartender cards.

### Low

14. No automated tests.
   - Build and lint exist, but no unit/integration/e2e checks.

15. Local fallback menu can diverge from Supabase.
   - Useful safety net, but source of truth is now mixed.

16. Vite chunk warning.
   - Build reports large chunk warning. Not event-blocking.

## 7. Risk Ranking

Critical:
- Verify production RLS supports required `orders` reads/inserts/updates.
- Verify production status values match the app's Title Case statuses.
- Verify `bar_station` column exists in production.

High:
- Ready SMS can delay bartender UI if Twilio endpoint is slow/failing.
- Menu order may be wrong because `display_order` is not used.
- Autoplay restrictions may block bartender ding.
- Partial phone values are stored.

Medium:
- Live tracker polling load.
- Realtime plus polling duplicate refreshes.
- Completed collapsed on mobile.
- Route typo risk.
- Mojibake visible in bartender station labels.

Low:
- No tests.
- Fallback menu drift.
- Build chunk size warning.

## 8. Recommended Fixes Before Tomorrow

1. Confirm Supabase policies with a real anon-key browser session:
   - guest insert works
   - guest tracker select by order id works
   - bartender select/update works

2. Confirm status constraint, if any, allows:
   - `New`
   - `In Progress`
   - `Ready`
   - `Completed`

3. Confirm `bar_station` exists in production and updates from `/bartender`.

4. Consider one tiny safe fix: order drinks by `display_order` when available.
   - This matches your Supabase event menu.
   - Low risk if implemented as `.order("display_order").order("category").order("name")`.

5. Consider one tiny safe fix: filter `.eq("is_available", true)` if the column exists.
   - Since you recreated the drinks table, it exists now.

6. Consider disabling ready SMS for tomorrow if Twilio is not approved.
   - Even though it is non-blocking to order creation, it can slow the bartender action after Ready.

7. Fix visible mojibake strings if they appear in bartender cards.

8. Test on the actual phones/tablets and production Vercel URL, not only local.

## 9. Recommended Fixes After The Event

1. Move status and station values to shared constants.
2. Normalize statuses in the database and app to a single format.
3. Replace client-side bartender updates with a protected server endpoint or authenticated role.
4. Add e2e tests for order creation, station assignment, ready tracker, and tip links.
5. Add a formal migrations folder.
6. Decide one drink menu source of truth and remove fallback drift.
7. Refactor ticket/payment logic into a separate feature module.
8. Add analytics or lightweight operational logging for event troubleshooting.
9. Improve SMS feature with a proper feature flag and A2P-safe copy only after approval.

## 10. Verification Checklist

### Local `/order`

1. Open `http://127.0.0.1:4173/order`.
2. Confirm event menu appears.
3. Select a drink.
4. Enter a name.
5. Leave phone blank and confirm Order Drink enables.
6. Enter partial phone like `32` and confirm Order Drink still enables.
7. Submit a test order.
8. Confirm "Your order is in!" appears.
9. Confirm estimated wait appears.
10. Confirm live tracker appears.
11. Confirm tip/connect buttons appear.
12. Confirm no "Free drink" or payment prompt appears.

### Local `/bartender`

1. Open `http://127.0.0.1:4173/bartender`.
2. Enter bartender PIN if needed.
3. Choose White Bar.
4. Confirm station badge says White Bar.
5. Confirm New/In Progress/Ready/Completed sections are visible or reachable by quick nav.
6. Start a test order.
7. Confirm order moves to In Progress.
8. Confirm station label shows White Bar.
9. Press Ready.
10. Confirm order moves to Ready.
11. Confirm Ready age appears.
12. Press Complete.
13. Confirm order moves to Completed.
14. Change station to Brown Bar and repeat with another order.

### Local `/tip`

1. Open `http://127.0.0.1:4173/tip`.
2. Confirm Square amount buttons still exist.
3. Confirm custom amount still exists.
4. Confirm Venmo link points to the provided Venmo URL.
5. Confirm Cash App link points to `https://cash.app/$rikkismobile`.

### Production Vercel

1. Repeat all `/order`, `/bartender`, and `/tip` tests on the production URL.
2. Use a phone on cellular data.
3. Use bartender tablet/laptop on event WiFi.
4. Confirm Supabase rows are created.
5. Confirm `status` changes in Supabase.
6. Confirm `bar_station` changes in Supabase.
7. Confirm guest live tracker updates after bartender Start and Ready.
8. Confirm Ready message names the correct bar.

### Supabase Data

1. Check `orders` has the test order.
2. Check `orders.status` is updated correctly.
3. Check `orders.bar_station` is `white_bar` or `brown_bar`.
4. Check `drinks` has only intended active/available event rows visible to anon.
5. Check RLS policies do not block required operations.

## 11. Exact Files Reviewed

- `src/main.tsx`
- `src/order/OrderPage.tsx`
- `src/order/OrderPage.css`
- `src/order/orderSupabaseClient.ts`
- `src/order/eventConfig.ts`
- `src/order/eventMenu.ts`
- `src/bartender/BartenderPage.tsx`
- `src/pages/TipPage.tsx`
- `src/pages/TipPage.css`
- `api/send-ready-sms.js`
- `scripts/create-spa-routes.mjs`
- `package.json`

## 12. Open Questions For Melanie/ChatGPT

1. Should the production `orders.status` values be Title Case or lowercase/underscore?
2. Should ready SMS be fully disabled tomorrow to avoid Twilio delays/confusion?
3. Should the drink menu display `ingredients` instead of `description` now that Supabase has both?
4. Should the customer menu order follow `display_order` exactly?
5. Should unavailable drinks be hidden by explicit client filter as well as RLS?
6. Should bartenders be allowed to move an already assigned In Progress order to the other station?
7. Should the bartender ding require an explicit "Enable sound" button to avoid browser autoplay blocking?
8. Should phone entry be removed entirely from the order form for tomorrow, or remain optional?
9. What is the exact production URL/QR code that guests and bartenders will use?
10. Who will monitor Supabase during the event for stuck or duplicate orders?
