# README Assets

The root GitHub README uses theme-aware PNGs generated from the actual P.UI
documentation application. The wordmark is the existing `BrandLogo`, not a new
logo. Component previews use the neutral palette in light and dark modes.

To refresh them, run the docs development server, then run in a second terminal:

```sh
node scripts/capture-readme.mjs http://127.0.0.1:5173
```

The origin can point to a different local port. The capture script uses the
workspace's Playwright dependency and installed Google Chrome. To use bundled
Chromium instead, install it with `npm exec -- playwright install chromium` and
set `PLAYWRIGHT_CHANNEL=chromium` in your shell. It waits for fonts and the
lazy calendar, disables motion, and pins the preview date to October 2, 2026 to
match the showcase's sample month. Avatars use the components' initials fallback
without fetching third-party portraits. Only the four generated PNGs are updated.

Review the images before committing them. These assets are repository
documentation, not part of the published `@plain/ui` package. They are covered
by the repository's [MIT license](../../../LICENSE).
