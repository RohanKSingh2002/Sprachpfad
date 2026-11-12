# Sprachpfad

A personal German practice site from A1 to B1 with a focused study home, the original light theme and a neutral dark option inspired by shadcn/ui. Plain HTML, CSS and JavaScript modules, no build step for development.

**Live website:** [Open Sprachpfad](https://sprachpfad-learn-deutsch.pages.dev), hosted on Cloudflare Pages. Guest access, Google sign-in and account saves work on the live site. The user confirmed the same saved progress on their phone on 27 October 2026. Google sign-in is **In production**, and the approved About, Privacy policy and Terms pages are published. Google's separate branding approval awaits an ownership-record update and a retry after 24 hours. See [hosting and update instructions](docs/HOSTING.md).

## Features

- **Three levels, all open**: A1 (32 sequenced lessons), A2 (18 lessons) and B1 (18 lessons). Switch levels on the Lessons or Practice page; the site remembers the one you last worked on
- **Appearance settings**: the original light theme is the default; Settings offers a dark theme with charcoal cards and Inter typography. Theme choice is saved per browser. Sign-out also lives in Settings. See [the theme reference and validation](docs/DARK-THEME.md).
- **A1 curriculum and roadmap**: 16 modules arranged into 8-, 16- or 24-week plans. Changing pace regroups the existing lessons and checkpoints into weekly targets, with six study days and one flexible review or rest day. Progress is preserved; the remaining daily plan starts at the first unfinished target. Each module has an original listening/reading workshop plus writing and partner-speaking tasks. [Read the complete curriculum](docs/A1-CURRICULUM.md)
- **A2/B1 learning paths**: nine A2 everyday communication modules and nine B1 communication modules, each with an original four-skill checkpoint, pronunciation practice, outcomes and a study plan. A1 also has 16 transfer activities with review links; all three levels include learning strategies. The A2 path includes ten additional lessons developed after reviewing the A2 notebook's teaching topics. [Read the reference-based update and its scope](docs/COURSE-REFERENCE-UPDATE.md)
- **A focused home page** with one recommended Start action: due vocabulary review first, otherwise the next course activity. Three smaller shortcuts open a lesson, flashcards or a practice set directly. The daily plan and study questions expand only when needed; course maps live on Lessons and activity statistics on Profile.
- **Today's plan** follows the selected pace with study, exercise, review and checkpoint days. Earlier unfinished targets take priority after missed days. Planned study hours include repeated practice, partner conversation and reviewed writing; they are not the amount of unique content in the app
- **Word topics**: 42 sets of everyday vocabulary (25 for A1, 6 for A2, 11 for B1), from the alphabet, numbers and dates to housing, work, health and exam instructions. Entries include an English meaning, noun plurals, example sentences and A1 verb reference forms
- **Review queue (spaced repetition)**: new words join the queue when you first answer them, and a finished lesson adds all its words. A word you know comes back after 1, 3, 7, 14 and then 30 days; a word you miss comes back the same day. The **Due today** deck shows what's due, each card says why it's back ("Missed last time", "Last seen 3 days ago"), and the Flashcards link shows how many are waiting
- **Sentence practice and personal collections**: save lesson examples, review checkpoint text imports, or add your own bilingual pairs. Under **Home → Sentence review**, choose active recall, listening, or word building. Filter by text, favorites, due status or rating, sort by difficulty, or choose a range. Listening supports repeat counts, speed, pauses, looping, round playback and optional English prompts. Recall ratings schedule the next review. Collections, settings and review dates sync with account progress.
- **Personal study tools**: choose a daily goal in minutes or practice actions and download a repeating calendar reminder from Settings. Home shows goal progress, recent lessons and favorite lessons or topics. Profile shows 7- or 30-day study activity. Flashcards can store a private memory cue for each word.
- **Route map**: one line showing your progress through A1, A2 and B1, with links to each level and any certificates
- **Grammar lessons** with tables, rules and example sentences read aloud in German. The sentence practice asks learners to listen, repeat aloud and recall the English meaning before revealing it
- **German audio**: locally generated recordings cover the spoken course lines. A1 mock dialogues alternate two distinct German voices. Browser speech is a fallback; official exam recordings are linked for further rehearsals. [Voice credits](audio/VOICE-CREDITS.md)
- **Exercises**: shuffled multiple choice, clearly cued fill-in tasks, word order with accepted natural alternatives, listening and writing with model answers
- **Practice workbook**: 30 original focused sets across A1, A2 and B1, with 126 exercise cards covering grammar, vocabulary, reading, listening and writing. Includes connected cloze, sentence building, matching, contextual choices, three recorded messages and six guided writing tasks. Finite rounds preserve answers, explain corrections and offer separate retries for missed exercises. Writing uses model comparison and self-review. [Read the practice update](docs/PRACTICE-UPDATE.md)
- **Instant answer checking**, including umlaut spellings like ae/oe/ue/ss
- **Swipeable flashcards** for what's due, today's new words, a topic, a lesson, a level or everything: swipe right if you knew it, left to see it again. With the card selected, the arrow keys work too (they leave buttons, menus and the browser's Alt+← alone). The back of a card shows the meaning, plural, available A1 verb forms and an example sentence; new A1 words follow the active module, then earlier gaps; under a topic deck, a word list lets you hear every word and example
- **Profile and progress**: a dedicated Profile page with the 17-week practice calendar, day streak, lessons completed, words known, progress by level and mock test results
- **Downloadable progress certificate**: the Profile button creates a minimal PDF with the learner's name, issue date, saved totals, level progress and best current mock-test scores. Extra pages list completed lessons and recorded checkpoint reviews. Generation stays in the browser and does not change progress; the recovery screen retains its separate JSON backup action. Validate with `node tools/check_progress_certificate.mjs`.
- **Welcome screen**: new visitors choose Google sign-in/sign-up or **Continue on this device** before entering the website. Navigation appears after the choice; guest access lasts for the tab's session, and returning signed-in users go straight into the site
- **Google accounts**: a sign-in page and account controls, with private Supabase progress sync, explicit import of existing browser progress, offline save status and conflict handling. Google sign-in, existing progress loading and saving have been checked on the Cloudflare website. The user also confirmed 10 known words and the saved-to-account status on their phone using the same Google account. See [account setup](docs/AUTH-SETUP.md)
- **A mock test for each level**: A1 has 15 listening items, 15 reading items, five form fields, a short-message task, word-card speaking rounds and a written-practice timer. Optional rehearsal mode applies listening playback limits and hides transcripts/models until the objective section is complete. Reviewed writing/speaking scores can produce a practice estimate; automatic scores and certificates describe objective practice only
- **Motion**: Home shows its Start button immediately. Other pages use gentle transitions, flashcards flip, and desktop wheel scrolling is smoothed.
- A circular profile button opens navigation on desktop and mobile, including the separate Settings page. German text is tagged for screen readers. With reduced motion turned on in your system settings, everything appears without animation
- Guest progress is saved in the browser (localStorage); account progress uses a separate cache and Supabase. Saves from earlier versions are converted automatically

## What each level covers

| Level | Lessons |
| --- | --- |
| A1 | Sounds and spelling, personal details, present verbs and questions, articles and possession, time, routines, food, shopping, modals and requests, common object pronouns and dative phrases, directions, housing, work, health, travel, weather, invitations, selected past forms, reading/listening strategies, forms, short messages and spoken interaction |
| A2 | Modal verbs, Perfekt, dative, two-way prepositions, weil/dass/wenn, comparisons, common Präteritum forms, als/wenn, indirect questions, polite requests, adjective endings, zu-infinitives, prepositional verbs, accusative/dative reflexive patterns, short messages and joint planning |
| B1 | Präteritum, Konjunktiv II, passive, relative clauses, verbs with prepositions, als/wenn/nachdem, infinitives and purpose clauses, adjective endings, concession, indirect questions, genitive, consequences and paired connectors, future reference, reflexives, opinions, formal requests and joint planning |

| Level | Word topics |
| --- | --- |
| A1 | Meeting people, the alphabet, numbers, days and months, family, people and animals, in class, food and shopping, meals and the kitchen, at home, things at home, free time, everyday verbs, around town, shops and places, colours and describing things, little words, looks and clothes, jobs and work, body and health, weather and seasons, travel, more everyday verbs, post and phone |
| A2 | Finding a flat, growing up and media, money and banking, traffic and transport, sport and accidents, holidays |
| B1 | Journeys, neighbours, the environment, shopping online, TV and entertainment, the old days, paperwork and authorities, a new job, office life, healthy eating, insurance |

## Run locally

The site loads JavaScript modules and JSON files, which browsers only allow over `http://`. Opening `index.html` straight from disk shows a short message instead of the lessons. Use any local server:

- **VS Code**: right-click `index.html` and choose **Open with Live Server** (Live Server extension)
- **Python**: run `python -m http.server` in this folder, then open <http://localhost:8000>
- **Node**: run `npx serve`

The learning material works on GitHub Pages or any static host. Account sign-in also needs Google and Supabase configuration; see [AUTH-SETUP.md](docs/AUTH-SETUP.md).

The local `Refrence Materials` folder contains private study references and is excluded from Git. Keep it, temporary files and internal documents outside the published website directory; do not upload the whole project folder. The release script publishes only `index.html`, the About/Privacy/Terms HTML pages, `css/`, `js/`, `data/`, required `audio/` assets and the MIT licence as `LICENSE.txt`.

Check all three A1 schedules, progress preservation and Home session selection with `node tools/check_course_plan.mjs`.

Audio needs nothing installed: the site plays the recordings in `audio/`.

## Project structure

```
sprachpfad/
├── index.html            page shell: header, footer, mobile nav; loads the CSS and js/main.js
├── audio/                MP3 recordings of every German line, named by a hash of the text
│   └── index.json        list of recorded lines (made by tools/make_audio.py)
├── css/
│   ├── base.css          colour tokens, reset, typography, navigation, buttons, toast
│   ├── components.css    departure board, level switch, panels and tables, exercises, score box
│   ├── home.css          hero, line of stops, compact progress, route, questions, not-found page
│   ├── profile.css       profile, practice calendar, level progress and test results
│   ├── account.css       sign-in, account details and save-status screens
│   ├── lesson.css        lesson page
│   ├── cards.css         flashcards
│   ├── test.css          mock test and certificate
│   ├── practice.css      level-wide practice page
│   └── course.css        shared course roadmaps and learning sections
├── js/
│   ├── main.js           entry point: loads the content, restores progress, starts the router
│   ├── content.js        loads data/*.json and builds the lookups (levels, lessons, topics, words)
│   ├── state.js          saved progress in localStorage, including converting older saves
│   ├── auth.js           Supabase Google sign-in and session lifecycle
│   ├── progress.js       account cache, cloud sync and save conflicts
│   ├── config.js         public Supabase connection settings
│   ├── vendor/           pinned Supabase browser library and license
│   ├── router.js         hash routes → views
│   ├── utils.js          small helpers (escaping, answer normalising, dates)
│   ├── ui/
│   │   ├── audio.js      plays the recordings (browser voice as a fallback) and the speaker button
│   │   ├── board.js      split-flap departure board and station clock
│   │   ├── duebadge.js   number of words due, on the Flashcards links
│   │   ├── effects.js    pointer effects (spotlight, magnetic button, tilt) and sliding pills
│   │   ├── icons.js      inline SVG icons
│   │   ├── motion.js     GSAP setup and animation helpers, reduced motion, clean-up between pages
│   │   ├── scroll.js     smooth wheel scrolling (Lenis) and scroll helpers
│   │   └── toast.js      status messages
│   └── views/            home, profile, lesson, cards, practice, roadmap, workshop, test, cert, notfound (+ shared.js)
├── data/
│   ├── levels.json       level order, names and the short summaries on the home page
│   ├── a1.json           A1 lessons, word topics and mock test
│   ├── a1-course.json    generated A1 extension, sequence, workshops and assessment
│   ├── a2.json           A2 lessons, word topics and mock test
│   ├── a2-course.json    A2 extension lessons, modules, support and checkpoints
│   ├── b1.json           B1 lessons, word topics and mock test
│   ├── b1-course.json    expanded B1 sequence, lessons, support and checkpoints
│   └── faq.json          home page questions
├── docs/A1-CURRICULUM.md complete curriculum, weekly plan, skill standards and source references
└── tools/
    ├── build_a1_course.mjs generates A1 course JSON and curriculum document
    ├── a1_*_content.mjs  original A1 assessment and workshop authoring sources
    └── make_audio.py     records new or changed German lines into audio/
```

Each view module exports `render()` (returns the page HTML) and, where needed, `mount()` (runs after the HTML is on the page), `onClick()`, `onKeydown()`, `onChange()` and `unmount()`. `main.js` sends document events to the view on screen.

## Motion

- Every animation lives in a view's `mount()` or in the helpers in `js/ui/motion.js`: `enter()` (fade and rise in), `revealOnScroll()`, `splitReveal()` (headings rise line by line from behind a mask), `countUp()` and `drawIn()`
- One motion language: an expo ease-out (quick start, long soft landing), short staggers, and only `transform` and `opacity` animate. In CSS the same curve is `--ease-out` in `css/base.css`
- Moving to another page fades the old one out first. Pages that export `updatesInPlace` (home, test, flashcards) animate a level or deck change themselves instead, so only what changed moves
- Anything a page starts (tweens, scroll triggers, listeners) is registered with `onLeave()` and cleaned up when you leave the page
- Content waiting to be revealed on scroll is only transparent, never hidden, so keyboard and screen reader users can always reach it, and focusing it shows it at once
- With reduced motion, or if GSAP can't load, nothing is hidden or animated. Smooth scrolling is only used with a mouse or trackpad

## Editing content

The A1 extension is authored in `tools/build_a1_course.mjs`, `tools/a1_workshop_content.mjs`, `tools/a1_exam_content.mjs`, `tools/a1_lesson_support.mjs`, `tools/a1_review_corrections.mjs`, `tools/a1_vocabulary_support.mjs` and `tools/a1_curriculum_document.mjs`. The builder also applies the shared editorial corrections and vocabulary enrichment to the original A1 JSON. Run `node tools/build_a1_course.mjs` after editing these sources. Commit the generated JSON and Markdown; deployment still needs no build step. `levels.json` declares the optional `courseFile`. Its `lessonOrder` controls the visible sequence while original lesson IDs and saved keys remain stable. A1 course checkpoints live at `#/a1/checkpoint/<module>` and the roadmap at `#/a1/roadmap`.

Roadmap completion requires at least 80% in both lessons, 5/6 in the module’s workshop comprehension questions, and learner records of all four skills practised with feedback for writing and speaking. These are course targets, not official exam grading rules. Old A1 assessment results are versioned separately from the expanded assessment.

The level-wide practice page still selects authored material. Automatic daily question generation is future work; the new curriculum defines the level boundaries and content that a later generator can use.

Lessons live in `data/<level>.json` under `lessons`, in order. A lesson has:

- `id` (1, 2, 3 … within the level), `title` (English), `germanTitle` (19 characters at most, so it fits the departure board), `intro`
- `table` with `head` and `rows`, `rules` (list of strings), `examples` (`{ "de", "en" }`), `vocab` (`{ "de", "en", "pl" }`, see below)
- `tasks`, each with a `type`, a `question` and:

| Type | Fields |
| --- | --- |
| `choice` | `options`, `answer` (index of the right option), `hint`, optional `englishOptions: true` |
| `listen` | `audioText` (read aloud), `options`, `answer`, `hint`, optional `englishOptions: true` |
| `fill` | `answers` (every accepted spelling; the first is shown as the correction), `hint`; put `___` in the question |
| `order` | `words` (the chips), `answers` (every correct sentence; the first is shown), `hint` |
| `write` | `modelAnswer` (not scored) |

Set `englishOptions: true` when a question's options are in English, so screen readers don't read them as German.

Word topics live under `topics` (A1 new-word practice uses the active module order): `{ "id", "title", "vocab" }`, where `id` is lowercase letters (used in links like `#/karten?l=a1-food`) and each word is `{ "de", "en", "pl", "ex": { "de", "en" } }`. `ex` is the example sentence. Optional `forms` contains the verb reference forms displayed on the flashcard back.

Nouns (words that start with der, die or das) need `pl`, in lessons and topics alike: the plural without its article (`"Tische"`), `"-"` when there's usually no plural (das Wetter) or `"pl"` for plural-only nouns (die Eltern). Other words have no `pl`.

A word can be in a lesson and in a topic: it counts once, at the lowest level that teaches it (within a level, lessons come before topics), so keep its English and plural the same in both. Deliberate repetition across lessons and topics is useful; a word keeps one saved review entry. Keep its meaning and grammatical information consistent.

The mock test sits under `test`: `passMark`, `reviewTip` (shown when you don't pass), `listening` (`audioText`, `question`, `options`, `answer`), `reading` (`text` and `statements` with `isTrue`), `writing` (`task`, `placeholder`, `checklist`, `modelAnswer`) and `speaking` (`task`, `modelAnswer`). Listening and reading are scored.

To add a level, create `data/<id>.json` with `lessons` and `test`, then add `{ "id", "name", "summary" }` to `data/levels.json`.

### Recording new German lines

After adding or changing German text that is read aloud (vocab, examples, `audioText`, model answers), record it:

```
pip install sherpa-onnx lameenc numpy
python tools/make_audio.py
```

It records only the lines that don't have a file yet and updates `audio/index.json`. The letters of the alphabet topic are read by their German names (`LETTER_NAMES`), and `SAY_AS` fixes the few words the voice says more clearly another way. The first run downloads the Thorsten voice model (about 115 MB) and the smaller Kerstin model for authored dialogue turns into `tools/.models/`, which git ignores. `--prune` deletes recordings that nothing uses any more, `--speed 1.0` records at normal pace (the default is 0.92, slightly slower for learners; add `--force` to record everything again). Until a line is recorded, the site reads it with the browser's best German voice.

## Tech

- Profile lives at `#/profile`; it reads the active account's progress, or the separate guest save. Sign-in lives at `#/login`. The setup guide explains the one-editable-tab limit and cross-device conflict choices
- Hash routing: `#/` (home, last level used), `#/a2` (a level), `#/a2/lektion/1` (add `?part=exercises` to open at the exercises), `#/a2/test`, `#/a2/zertifikat`, `#/karten?l=due` (flashcards; `l` is `due`, `new` (today's new words), `all`, a level, a lesson (`a2-3`) or a topic (`a1-food`); without it, the due words if there are any). Links from the A1-only version (`#/lektion/1`, `#/test`, `#/zertifikat`) still work
- [GSAP](https://gsap.com) 3.15 from the jsDelivr CDN (free standard license): core, ScrollTrigger, SplitText, Flip and Draggable. [Lenis](https://github.com/darkroomengineering/lenis) 1.3 (MIT) for smooth wheel scrolling. Without them (offline), the site works without animation
- Audio: generated with the [Thorsten-Voice](https://github.com/thorstenMueller/Thorsten-Voice) and Kerstin German voices, run locally with [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx). See [voice credits](audio/VOICE-CREDITS.md) for models and licences. Lines without a recording use the Web Speech API with the most natural German voice the browser has (Edge's natural voices, then Google's, then any other German voice), never an English one
- Colours are CSS variables at the top of `css/base.css`
- Guest progress is stored under `sprachpfad-v1` in localStorage and belongs to the website address. Account caches use `sprachpfad-account-v1:<user-id>` and sync with the private `learner_progress` table. Progress includes lessons, tests, the review queue, practice days and the course plan. Older saves get a review queue on first load, with at most 20 words due per day

## Roadmap

- [x] A2 level (Perfekt, modal verbs, dative, weil/dass)
- [x] B1 level
- [x] Move content into JSON files
- [x] Motion and visual polish
- [x] Spaced repetition for flashcards, and Today's session
- [x] Word topics with plurals and example sentences
- [ ] A2 topics for the first half of A2 (lessons 1–6 of the course word lists)
- [ ] Mock tests: word count for writing, self-check for speaking

## Note

All lesson content and exercises are original. The mock tests follow the general shape of A1, A2 and B1 exams but are not official Goethe or telc material.
