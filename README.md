# Car-auction-

## Mikes Auction Vintage Car Auction

A dynamic web prototype for a vintage car auction marketplace inspired by the planning brief. It uses a small Node.js server, API routes, and a JSON data store so auctions, bids, dashboard metrics, and seller drafts are generated at request time instead of being hardcoded in the browser. It focuses on the buyer, seller, and operator experience:

- Discover page with a first-viewport featured auction experience
- Search and filters by make, status, year, transmission, and price
- Ending-soon panel with live countdowns
- Watchlist saved in `localStorage`
- Auction detail view with specs, condition report, buyer fee, reserve status, bidding, and comments
- Two-minute anti-sniping extension when a bid is placed near the end
- Seller draft submission flow
- Results chart and admin operations cards
- Responsive layout for desktop and mobile

## Run Locally

This version has no build step and no third-party package install. Start the dynamic Node.js server:

```bash
npm start
```

If your shell cannot find Node from `npm`, run the server directly:

```bash
/opt/homebrew/bin/node server.js
```

Then open:

```text
http://localhost:5173
```

Useful API routes:

- `GET /api/auctions` lists live auction data
- `POST /api/auctions/:id/bids` records a bid and applies anti-sniping extension rules
- `POST /api/submissions` saves seller draft submissions
- `GET /api/dashboard` returns admin metrics
- `GET /api/results` returns market result chart data

## Deploy Online

This app needs Node.js hosting because the API routes write to `data/db.json`. Render is the simplest fit for the current MVP:

1. Go to `https://render.com`
2. Create a new Web Service
3. Connect this GitHub repository: `SiddhardhaR/Car-auction-`
4. Use these settings:
   - Build command: leave blank
   - Start command: `npm start`
   - Environment variable: `NODE_ENV=production`
5. Deploy and open the public Render URL

The included `render.yaml` can also be used as a Render blueprint.

## Production Roadmap

The next implementation phase should split this prototype into a Django + React application:

- Django models: `Vehicle`, `VehicleImage`, `Auction`, `Bid`, `Comment`, `Watchlist`, `Notification`, `SellerSubmission`, `EscrowTransaction`
- API: Django REST Framework endpoints for listings, bidding, comments, watchlists, seller drafts, admin review, and results
- Real time: Django Channels for bids, comments, outbid notices, and ending-soon updates
- Payments: Stripe PaymentIntents or setup intents for deposits, plus escrow/dispute state tracking
- Auth: Django auth with verified email, roles, and optional two-factor authentication
- Storage: S3-compatible object storage for galleries and inspection reports
- Tests: model tests for fee and bid rules, API tests for permissions, and integration tests for anti-sniping/payment flows
