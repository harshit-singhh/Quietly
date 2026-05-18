# Quietly — Web Pages

These static HTML files are deployed to quietly.pro via Cloudflare Pages.

## Deployment
- Service: Cloudflare Pages
- GitHub repo: this repo (Quietly)
- Publish directory: web
- Build command: (none — static files only)

## Pages
- /razorpay-checkout → Razorpay payment bridge for Indian users
- /payment-success   → Shown after successful payment
- /payment-cancelled → Shown if user cancels payment

## To update
Push changes to the `web/` folder in the main branch.
Cloudflare deploys automatically within 1-2 minutes.
