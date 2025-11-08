This is a [Next.js](https://nextjs.org) project.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## End-to-end tests (Playwright)

Minimal Playwright tests are provided for each page using a mocked API so the backend is not required.

Commands:

```bash
# run tests headless
npm run test:e2e

# run tests in UI mode
npm run test:e2e:ui

# run tests in headed mode
npm run test:e2e:headed
```

Notes:
- During tests, the frontend uses a mock API served by the Next.js app under `/api-mock`. This is wired via the `EVENTS_API_URL` env in `playwright.config.ts`.
- Pages covered: `/events`, `/events/[id]`, `/events/[id]/edit` (redirects to login when unauthenticated), and `/login`.
- The tests start the dev server automatically using Playwright's `webServer` setting.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
