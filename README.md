# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Paid event orders

Apply the Supabase paid drink orders migration after the table-number migration, then apply the order handoff migration.
Coordinate the database migration and site deployment outside service hours. The new
dashboard only lists Square-verified tickets, so finish open tickets before switching.

Set these server-only variables on the Vercel project.

- `SUPABASE_URL` (or the existing `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID`
- `ORDER_SITE_URL` with the public HTTPS origin for this environment
- `SQUARE_ENVIRONMENT=sandbox` for test payments

Subscribe Square to `payment.created` and `payment.updated` at
`/api/drink-checkout` on that same origin. The endpoint uses notifications to
look up payments through Square's authenticated API. It releases a ticket only
after Square confirms a completed payment matching the order, location and amount.

In Sandbox, open the printed event QR URL on a phone and keep the bartender queue open on
the iPad. Confirm abandoned and declined checkouts leave the queue empty. Pay
for a drink and verify one ticket appears with the selected handoff option, even if the guest
closes the payment tab. Test both handoff paths. For outdoor pickup, mark the drink ready and then picked up. For upstairs handoff, mark it sent when the runner leaves and then delivered. Verify that each step appears in the guest tracker. Meet guests at the doorway at the top of the stairs. Confirm the event prices before enabling live payments.

## Walk-up checkout on the bar iPhone

Apply the walk-up orders migration after the paid orders and handoff migrations.
In Vercel, set SQUARE_POS_APPLICATION_ID to the production Square Application ID
and WALKUP_STAFF_CODE to a dedicated random staff passphrase of at least 16
characters. Save the passphrase as a server-only Secret. The existing casual
bartender PIN cannot authorize a walk-up charge.

In Square Developer, open the app's Point of Sale API page and register
https://www.rikkismobile.com/bartender as the Web Callback URL. Keep the existing
payment.created and payment.updated subscription. The POS callback can verify
the payment when the phone returns, and Square payment notifications can also
release it when they contain the order's payment note.

On the iPad, open Bartender and select Walk-up order. On the iPhone, sign in to
Square POS for the configured location, enable Tap to Pay and open
https://www.rikkismobile.com/bartender?walkup=phone in Safari. Enter the dedicated
walk-up code on both devices. Send an order from the iPad, open Square Checkout
on the iPhone, and confirm it appears in the drink queue only after Square
accepts payment. If Square is closed or a payment result is uncertain, check
Square POS before starting another charge for that guest.
