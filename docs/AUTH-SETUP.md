# Google sign-in for Sprachpfad

## Current status

The website contains Google sign-in, account details and sign-out, plus private account progress sync. It uses the existing Supabase project, **Sprachpfad** (`deyquyepecvaozcvuzjc`, Ireland).

Both SQL migrations in `supabase/migrations/` have been applied to that project. The public project URL and publishable key are in `js/config.js`. The official Supabase browser SDK is pinned to **2.118.0** in `js/vendor/`, with its MIT license alongside it. No build step is required.

**Local Google sign-in is working.** On 25 October 2026, the public Supabase settings confirmed that Google was enabled, and the user completed a Google sign-in and reported reaching their profile. The user also confirmed saving the local redirect URLs, Google test-user entry and basic identity scopes.

The public website is hosted at **https://sprachpfad-learn-deutsch.pages.dev**. On 27 October 2026, that origin was added to the existing **Sprachpfad Web** Google OAuth client and saved as the app homepage. The existing localhost origin and Supabase callback were preserved. Supabase's Site URL is now `https://sprachpfad-learn-deutsch.pages.dev/`, with that root and `/index.html` added to its redirect allowlist alongside the two localhost URLs.

**Production Google sign-in is working.** The existing Google account completed sign-in on the Cloudflare site and returned to `/#/profile`. Its existing progress loaded with 10 known words, 14 practice answers and the saved-to-account status. A normal A2 navigation saved successfully: a read-only database check confirmed the account revision advanced from 17 to 18 and the selected level changed to A2. A1 was selected again afterward. No lesson answers or completion records were entered for this check.

Google's external audience was moved to **In production** on 28 October 2026. The client has only the basic email, profile and openid scopes; Verification Center confirms that data-access verification is not required. The approved public About, Privacy policy and Terms pages are live and saved in Google Branding. Search Console confirms website ownership, but Google's separate branding check requests a 24-hour wait for its ownership record to update before retrying. The app's branding is not approved or shown to users yet. See [the release record and remaining step](PUBLIC-RELEASE-REVIEW.md).

**The basic cross-device progress check passed on 27 October 2026.** The user signed in with the same Google account on their phone and confirmed both 10 known words and “Progress saved to your account,” matching the desktop profile. Combined with the verified desktop database writes, this confirms account saving and progress retrieval on a second physical device. Concurrent edits, offline recovery and conflicts were not exercised in this check. No automated tests were added or run for this configuration-only change. The broader checks under **Before publishing** remain a release checklist, not completed test results.

## 1. Create the Google sign-in client

Open [Google Cloud Console](https://console.cloud.google.com/) and select or create a project named **Sprachpfad**.

In **Google Auth Platform**, configure Branding with your app name and your own support/contact email. Choose an External audience for people outside your organisation; while testing, add your Google email as a test user. Use only the basic `openid`, email and profile scopes.

Under **Clients**, create an OAuth client of type **Web application**:

| Field | Value for this local setup |
| --- | --- |
| Name | Sprachpfad Web |
| Authorized JavaScript origin | `http://localhost:8000` |
| Authorized redirect URI | `https://deyquyepecvaozcvuzjc.supabase.co/auth/v1/callback` |

Save its **Client ID** and **Client secret** privately. Enter them directly into Supabase's Google provider settings, enable Google, and save. The secret belongs in Supabase, never in this website, Git, or a chat message. [Official Google provider setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)

## 2. Allow production and local website addresses in Supabase

Open the Sprachpfad project → **Authentication → URL Configuration**.

- Site URL: `https://sprachpfad-learn-deutsch.pages.dev/`
- Production redirect URLs: `https://sprachpfad-learn-deutsch.pages.dev/` and `https://sprachpfad-learn-deutsch.pages.dev/index.html`
- Local redirect URLs: `http://localhost:8000/` and `http://localhost:8000/index.html`

These are the website addresses Supabase returns to after Google finishes. Keep the host and port consistent: `localhost` and `127.0.0.1` have different browser storage. If you use another port, add its exact addresses before starting sign-in. [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls)

Start the existing static site from the project folder:

```powershell
python -m http.server 8000
```

Open [local sign-in](http://localhost:8000/#/login). Complete the Google flow in the same browser that started it. PKCE uses a verifier held in that browser; opening the callback in another browser won't work. [PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)

## Entry screen

Visitors without a restored account or an active guest choice first see a standalone login/sign-up screen. The website header, navigation, mobile dock and footer stay hidden on this screen, including during startup. Google sign-in opens the account profile; **Continue on this device** opens the home page with guest progress.

The guest choice lasts for the current tab's session using `sessionStorage`, so reloading an exercise keeps the learner in the website. If session storage is unavailable, the choice lasts until the page reloads. Restored Google sessions go directly into the website. Signing out clears the guest entry choice and returns to the login screen. Direct lesson links also go through the entry choice for new visitors.

This is an onboarding flow for public study content. Private account progress continues to be protected by Supabase authentication and database policies.

## How progress behaves

- **Guest practice remains available during this local setup.** The original `sprachpfad-v1` browser save stays separate from accounts. The site does not require sign-in to access the public learning material.
- An empty account offers **Use this browser's progress** or **Start fresh**. Import is explicit, and the original browser copy remains intact. Existing account progress is not automatically replaced or merged with guest progress.
- Lessons, words, review dates, practice days, test results and course plans share the signed-in account's save. Google supplies the display name and email; no separate public profile table is created.
- Changes are cached locally and sent after a short delay. The profile and footer show whether they reached the account. Offline changes remain associated with that account and retry when connectivity returns.
- This version allows **one editable account tab per browser** using Web Locks. A second tab asks you to close the first before continuing. Use a current browser over HTTPS or localhost.
- Across devices, revision checks detect competing saves. The learner chooses the account copy or the device copy, with an option to download a JSON backup first. Progress is not silently combined or overwritten.
- Signing out ends the local Supabase session and clears the active account from the page. A synced account cache is removed. An unsynced copy stays under that user's ID for recovery on their next sign-in; it is not loaded into another account.
- Account reset requires a connection and confirmation. It changes the account save, so another device with older unsynced work will see a conflict. Downloaded JSON files are backups for recovery; the interface does not yet include a general JSON restore tool.

## Database and security design

`public.learner_progress` has one row per `auth.users.id`. RLS permits authenticated users to read their own row. Anonymous users have no table access. Authenticated users have no direct insert, update or delete grants.

Writes use `public.save_learning_progress(owner_id, expected_revision, progress, write_id)`. It checks that the requested owner matches `auth.uid()`, validates the document's shape and size, locks the row, and rejects stale revisions. A stable write ID makes an interrupted write retry idempotent. Including the owner in the request also prevents an old in-flight save being applied to a newly signed-in account.

This function intentionally uses `SECURITY DEFINER`, with an empty search path, qualified table references, no dynamic SQL and execution granted only to `authenticated`. Supabase's [authenticated-function advisory](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) therefore remains applicable as a review notice. The default automatic-RLS helper's unnecessary client execution grants were revoked, following the [anonymous-function advisory](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable). The automatic-RLS event trigger remains in place.

Only the publishable key is delivered to the browser. Supabase verifies the user's access token for database requests. Session tokens use the SDK's browser storage; this is a static client application, not an HTTP-only server-cookie implementation. Keep third-party scripts trusted and pinned. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys) · [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Before publishing

Configure the final HTTPS website address in Supabase's Site URL and redirect list, and add the production origin to the Google client. For a site hosted in a subdirectory, include that path in Supabase's return URLs. Remove unused development redirects when they are no longer needed.

Complete Google's audience/branding requirements for public users, supply accurate privacy/contact information, and exercise the full Google flow, sign-out, account switching, progress import, offline recovery, reset, and competing-device saves before release. Email login, additional providers and account deletion are separate future work.
