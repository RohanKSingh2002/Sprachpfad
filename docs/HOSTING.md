# Public hosting

## Cloudflare Pages (current hosting)

Published on 27 October 2026:

https://sprachpfad-learn-deutsch.pages.dev

The Cloudflare Pages project is `sprachpfad-learn-deutsch`, using production branch `main`. The first deployment is `https://d0432702.sprachpfad-learn-deutsch.pages.dev`. The latest release is `https://26f43cb8.sprachpfad-learn-deutsch.pages.dev` (4 November 2026): a circular profile navigation menu, a separate Settings page with original-light/dark theme choices, and sign-out moved from Profile to Settings. The theme is saved per browser, and Google sign-in returns to Home. The live menu, signed-in Settings page and both themes were verified; keyboard dismissal, reload persistence and phone layouts were checked locally. Release preparation now versions all module imports together to prevent stale routes after an update. See [theme and navigation validation](DARK-THEME.md). `wrangler.jsonc` contains the project name and isolated public asset directory.

The release `https://6fb65605.sprachpfad-learn-deutsch.pages.dev` (3 November 2026) simplified Home to one recommended activity, three direct study shortcuts, and optional plan/help details. Duplicate activity statistics, maps and the moving ticker were removed from Home, as was its level selector. Home uses the saved study level. Desktop and phone layouts, course-plan recommendations and direct activity starts were checked. See [the research and validation record](HOME-REDESIGN.md).

The release `https://2e10ada6.sprachpfad-learn-deutsch.pages.dev` (30 October 2026) moved each lesson's vocabulary before its exercises and added a button to review the words without clearing answers. The shared lesson layout applies to all 68 lessons; representative A1, A2 and B1 pages were checked in the browser.

The preceding release, `https://222fb6e2.sprachpfad-learn-deutsch.pages.dev` (30 October 2026), activated Cloudflare Web Analytics after the owner enabled it in Pages Metrics. It included the practice improvements and PDF progress certificate from earlier releases. The homepage, privacy page and certificate module returned HTTP 200 after publication. The homepage contained exactly one Cloudflare analytics beacon, and the privacy page now describes the traffic statistics.

Traffic dashboard: https://dash.cloudflare.com/6983cca32c5cc44066690bbc546f30cc/web-analytics/overview?siteTag~in=e45d31f085a34ae48ba732f4e7e1e1cd&excludeBots=Yes . Analytics starts with this activation; earlier visits are not recovered. Cloudflare injects its beacon automatically, so do not add a second analytics script to the source. The dashboard shows aggregate traffic rather than named visitors.

Prepare the release with `node tools/prepare_site.mjs cloudflare`. It copies the public website into `hosting/cloudflare/dist/`, independently of the earlier Sites checkout. Wrangler 4.152.0 is installed locally in `hosting/cloudflare-cli/`.

Wrangler is authenticated for Pages publishing. The separate Codex MCP authorization does not sign Wrangler in. Credentials are managed by Wrangler outside the repository.

From the project root, publish updates with:

```powershell
node tools/prepare_site.mjs cloudflare
node hosting/cloudflare-cli/node_modules/wrangler/bin/wrangler.js pages deploy hosting/cloudflare/dist --project-name sprachpfad-learn-deutsch --branch main --commit-dirty=true
```

This is a direct-upload project: local changes and GitHub pushes do not automatically deploy. The initial creation used Wrangler's `--force` opt-out of automatic Workers delegation to preserve the approved `.pages.dev` address. The project now exists; normal future deployments use the command above without that flag.

## Earlier Sites hosting

Published on 26 October 2026 through Sites:

https://sprachpfad-learn.validboar4098.chatgpt.site

The earlier Site remains public. Use the Cloudflare address above for sharing and future deployments. Both hosts run independently of this computer.

## Release files

The Site identity is saved in `.openai/hosting.json`. Reuse this identity for updates; do not create another Site.

Run `node tools/prepare_site.mjs` from this project to rebuild `hosting/sprachpfad/dist/` with only `index.html`, `about.html`, `privacy.html`, `terms.html`, `css/`, `js/`, `data/`, `audio/`, and the MIT licence copied as `LICENSE.txt`. The same public whitelist is used by the `cloudflare` target. Private references, internal documents, tools, and database migrations are not published. The isolated hosting checkout and archives are excluded from the main repository.

Use the Sites source workflow from `hosting/sprachpfad/` to commit and push the prepared release, package it, then save and deploy that exact version. Local edits and GitHub pushes do not automatically update the hosted Site.

## Google sign-in and account saves

Guest access and Google sign-in are working on the Cloudflare site. On 27 October 2026, the existing Google account returned successfully to the live profile and loaded its 10 known words. A reversible level selection saved to the account database and was restored to A1. The user then confirmed the same 10 known words and saved-to-account status on their phone using the same Google account, completing the basic cross-device progress check.

In [Supabase URL Configuration](https://supabase.com/dashboard/project/deyquyepecvaozcvuzjc/auth/url-configuration), the saved Site URL is:

`https://sprachpfad-learn-deutsch.pages.dev/`

Both exact redirect URLs are saved:

- `https://sprachpfad-learn-deutsch.pages.dev/`
- `https://sprachpfad-learn-deutsch.pages.dev/index.html`

Keep the existing localhost redirects while local development is needed. On 27 October 2026, `https://sprachpfad-learn-deutsch.pages.dev` was saved as an authorized JavaScript origin in the existing Google OAuth web client and as the app homepage. The Supabase callback remains `https://deyquyepecvaozcvuzjc.supabase.co/auth/v1/callback`.

The Google client requests only `openid`, email and profile; no sensitive or restricted scopes are configured. On 28 October 2026 its external audience was published and the dashboard confirmed **In production**. The saved homepage is now `/about.html`, with `/privacy.html` and `/terms.html` also saved. Data-access verification is not required for these scopes.

Search Console confirms verified ownership of the website. Google's separate branding check has not recognised that record yet and requests a 24-hour wait before retrying. The Sprachpfad branding is therefore not approved or shown on Google's sign-in screen yet. See [the release record and retry step](PUBLIC-RELEASE-REVIEW.md). Keep the public verification meta tag in `index.html` and `about.html`.

Basic sign-in, saving and two-device progress retrieval have passed; the additional account scenarios in [AUTH-SETUP.md](AUTH-SETUP.md), such as offline recovery and competing-device saves, remain a broader release checklist. Guest progress remains separate in each browser and does not automatically move from localhost to this new address.

References: [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Google sign-in setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

