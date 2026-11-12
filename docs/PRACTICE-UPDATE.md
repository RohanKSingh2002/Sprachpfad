# Practice workbook update — 28 October 2026

The practice page now contains 30 independently authored sets: 10 each for A1, A2 and B1. Across the three levels there are 126 exercise cards, containing 144 automatically checked answer points and six self-reviewed writing tasks. Matching cards contain five answer points each.

## Materials

Each level covers grammar, vocabulary, reading, listening and writing. Formats include connected-text gaps, constrained sentence building, phrase matching, contextual choices, messages and notices, original recorded announcements, and guided writing with model responses and checklists. Three new German recordings accompany the listening sets.

The local reference PDFs informed generic exercise formats and progression only. The passages, scenarios, prompts, answers, explanations, model messages and recordings were created for this site. Reference scans, excerpts and research files are excluded from the public asset package. See [the private reference notes](PRACTICE-REFERENCE-NOTES.md) for the sampled PDFs and formats.

## Behavior

Sets have a visible end and a review of the learner's answers. Checked answers stay visible with explanations. Missing responses are blocked unless explicitly skipped. Sentence building works with buttons and matching uses labeled dropdowns, including on phones. Search and skill filters help learners find a focused set.

Retries include only missed or skipped exercises and do not overwrite the first-attempt result. Repeated checking cannot log a task twice. Writing stays ungraded: learners compare a model, revise their message and record a checklist review.

Checked exercises use the existing practice calendar. Set drafts and results are held only while the learner remains on the current practice page; changing level, leaving the page or reloading clears them. This limitation is stated in the library. No account schema or sign-in configuration changed.

## Authoring and validation

- Edit `tools/build_practice.mjs` for A1 and `tools/practice_upper_levels.mjs` for A2/B1, then run `node tools/build_practice.mjs` to rebuild `data/practice.json`.
- Run `node tools/check_practice.mjs` for content invariants, accepted answers, finite rounds, duplicate submissions, partial matching, skips and isolated retries.
- Generate missing recordings with `tools/.audio-env/Scripts/python.exe tools/make_audio.py`; all three practice clips were verified present in the manifest and deployment package.
- The course-plan regression check passed after integrating the new content loader.
- Local guest browser checks covered empty-answer handling, keyboard submission, wrong answers, skips, completed results, retrying mistakes, matching partial credit, sentence chunk removal, writing comparison and self-review, and listening playback.
- Additional browser checks verified topic filtering, empty search results, restoring a draft within the page, A2/B1 navigation, and layouts at 390px and 320px viewport widths without horizontal overflow.

Publish with the established Cloudflare Pages workflow to `sprachpfad-learn-deutsch.pages.dev`. The asset whitelist contains only the public website files, not the reference books, authoring tools or verification artifacts.

Published on 28 October 2026 as deployment `7b73582f`. The production page was verified visually. The published practice bank, view, session engine, stylesheet and all three recordings returned HTTP 200 and matched the tested package byte for byte. No practice answers were submitted through the user's production account during verification.
