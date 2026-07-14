# Multiplication Tables

A small Progressive Web App for practising the multiplication tables of 1 to 12.

Built with **Vite**, **React**, **TypeScript**, **Tailwind CSS** and **shadcn/ui**,
and deployed to **GitHub Pages**.

## How it works

- The page opens empty. Pressing **=** reveals the first random exercise
  (anywhere from `1 × 1` to `12 × 12`).
- Enter the answer on the calculator-style numpad (or with your physical
  keyboard) and press **=** to check it. The next exercise appears immediately.
- Every submission is stored locally in **IndexedDB**: the exercise, whether the
  answer was correct, and how long it took from the moment the exercise was
  shown until it was submitted.
- Exercises you answer **incorrectly** or **slowly** come round a little more
  often, so practice concentrates where it is most needed.
- Leaving the page (switching tabs or apps) does **not** count as a submission.
  When you come back the page is empty again and the timer only starts once you
  press **=**, so timings are never inflated by time spent away.

> A dedicated statistics page is planned for a future version and is out of
> scope for v1.

## Development

```bash
npm install          # install dependencies
npm run dev          # start the dev server
npm run build        # type-check and build for production
npm run preview      # preview the production build
npm run generate-icons  # regenerate the PWA icons from the SVG artwork
```

## Deployment

Merging to `main` triggers the [`Deploy to GitHub Pages`](.github/workflows/deploy.yml)
workflow, which builds the app and publishes `dist/` to GitHub Pages.

Pull requests are validated by the [`CI`](.github/workflows/ci.yml) workflow
(type-check + build).

### One-time GitHub setup

In the repository settings, under **Settings → Pages**, set the **Source** to
**GitHub Actions**. The app is served from the `/tables/` base path (configured
in `vite.config.ts`); update `base` there if the repository is renamed.
