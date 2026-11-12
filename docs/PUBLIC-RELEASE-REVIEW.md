# Public release review — 27 October 2026

The operator approved these drafts and publication of the contact details. The pages are live on Cloudflare Pages. Google sign-in was moved to **In production** on 28 October 2026; branding approval remains pending the ownership-record update described below.

## Pages to review

- [About Sprachpfad](../about.html): public description, account choices and contact.
- [Privacy policy](../privacy.html): Google identity, learning records, browser storage, service providers, retention and data requests.
- [Terms of use](../terms.html): free independent practice, responsible use, account security, availability and existing licences.

The approved pages name **Rohan Kumar Singh** as operator and publish **rohank.singh2002@gmail.com** as the support and privacy contact, matching the existing Google support settings. The operator approved this public contact and the handling of access, correction and deletion requests.

The published policy commits to no sale of account/learning data, no use of that data for targeted advertising or AI training, and handling account-deletion requests. Account records currently remain until deletion is requested; no automatic inactivity deletion is configured. Google Fonts and jsDelivr are disclosed because the learning app loads them. Operator approval and publication are not a legal compliance certification.

## Prepared technical changes

- Public pages work without JavaScript or login and use the existing site's visual style.
- About, Privacy policy and Terms of use links appear before sign-in and in the app footer.
- The Cloudflare packaging script includes the new pages, stylesheet and existing MIT licence.
- The public Google Search Console verification tag is included in the root page and About page. Search Console confirms **You are a verified owner** for the site's URL-prefix property. Keep the verification tag in future releases.
- Local build, JavaScript syntax, local links and desktop browser rendering checked.

## Publication and verification result

1. Deployed 3,041 public files to the existing Pages project, production branch `main`, deployment `44d7dd95`. Root, About, Privacy and Terms returned HTTP 200. Browser navigation through the live public pages passed; the signed-in profile still shows 10 known words and account-save confirmation.
2. Saved Google's homepage as `https://sprachpfad-learn-deutsch.pages.dev/about.html`, privacy URL as `/privacy.html`, and terms URL as `/terms.html`. Cloudflare redirects those public HTML pages to their extensionless equivalents.
3. Published the external Google app. The Audience dashboard confirms **In production**. Verification Center says data-access verification is not required because the app requests no sensitive or restricted scopes.
4. Ran **Verify branding**. Google returned a homepage-ownership issue and explicitly requested waiting **24 hours after ownership verification** before retrying. Search Console independently confirms verified ownership; the branding system has not yet recognised it. Branding is **not approved or shown to users** yet, and no manual review was requested.

## Remaining step

After the 24-hour update period (29 October 2026 is a conservative retry date), open Google Auth Platform → Branding → Information and summary → View issues, select **I have fixed the issues**, and request re-verification. Confirm the returned result; do not infer approval from the production publishing status or Search Console ownership. The current site and Google sign-in remain usable meanwhile. No automatic retry or reminder has been scheduled.

Evidence is saved locally under `hosting/verification/`: `google-in-production.png`, `google-branding-wait.png`, and `google-ownership-verified.png`.

Reference: [Google's branding verification requirements](https://developers.google.com/identity/verification/authentication-verification).
