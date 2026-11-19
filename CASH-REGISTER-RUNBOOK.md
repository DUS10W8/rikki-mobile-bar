# Cash register and drawer: how it works

## Staff sign-in
The bartender board, walk-up register and cash all unlock with the **walk-up staff code** (Vercel `WALKUP_STAFF_CODE`). The server checks it and keeps the device unlocked for 12 hours. The old bartender PIN is no longer used, and it was visible in the public site code.
Optional: set `WALKUP_MANAGER_CODE` in Vercel. When it's set, refunds, payouts, drops and closing the drawer also need that code.

## Opening (iPad → Walk-up orders → Cash drawer)
1. Enter your name, the event and the opening float. Tap **Open drawer**.

## A cash sale
1. Tap items. The ticket is on the right.
2. Tap **Take cash**. The screen shows the subtotal, the tax and the total due. Tax is the same rate Square adds on card sales, read from Square's tax settings.
3. Tap a shortcut (**Exact**, $30, $40, …) or type the amount handed over. If it's not enough, the screen shows **Short** and won't confirm.
4. Tap **Confirm cash received**. The ticket goes to the bar and stock comes out. The screen shows **Give $X.XX** until you tap **Start next order**.

If the connection drops after you've taken the cash, the screen says **"do not collect again"**. Tap **Check this sale**. Confirming again is safe: the same sale ID never records twice, even after a reload.
If a card attempt is still open in Square for that ticket, cash is blocked. Find or clear the Square payment first.

## Bar board
Walk-up drinks now show **Made**, then **Handed to guest**. Tickets say "Paid cash" or "Paid card".

## Refunds
Tap **Cash refund** on a paid cash order and enter the amount and what happened. This records only the money. A poured drink stays used. If you dumped it, log waste. If a sealed item came back, log it as returned stock (see INVENTORY-RUNBOOK.md). Card refunds stay in Square.

## Drops, payouts, paid-ins
Use these in the Cash drawer section, with an amount and a reason. Cash tips go in the tip jar, not the drawer. If a tip ends up in the drawer, record it as a **Paid in** with reason "tip" and pay it out with a **Payout** before you count.

## Closing
Count each bill and coin. The screen shows Counted, Expected and Over/Short live. Tap **Close drawer**. A later recount needs a reason. It's added as a new record, and the original close is kept.

## Reports (Supabase SQL editor)
```sql
select * from cash_shift_summary order by opened_at desc;   -- float, sales, refunds, drops, expected, counted, over/short
select * from walkup_sales where shift_id = '<shift>';      -- every walk-up sale once, with its tender
```
Each walk-up sale has exactly one tender. Card sales reconcile to Square, and cash sales reconcile to the drawer. Guest QR orders are always card and appear in Square.

## Rehearsal
`practice-register.html` runs the real register screen against a fake server, with tax set to 0 and no real money. Start it with `npm run dev` and open `/practice-register.html`.
