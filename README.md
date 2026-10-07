# Sprachpfad

A personal German practice site from A1 to B1, themed as a train line: every lesson is a stop, and each level is a stretch of the line that ends in a mock exam. Plain HTML, CSS and JavaScript modules, no build step.

## Features

- **Three levels, all open**: A1 (32 sequenced lessons), A2 (8 lessons) and B1 (9 lessons). Switch levels next to the line on the home page; the site remembers the one you last worked on
- **A1 curriculum and roadmap**: 16 modules with an 8-, 16- or 24-week study plan, daily routine, pronunciation, vocabulary, four-skill checkpoints and exam-readiness guidance. Each module has an original listening/reading workshop plus writing and partner-speaking tasks. [Read the complete curriculum](docs/A1-CURRICULUM.md)
- **Split-flap departure board** that flips from the last stop to your next lesson, with a live station clock
- **Today's session** at the top of the home page: about fifteen minutes. Review the words that are due, learn ten new words, read the next lesson's grammar, then answer its exercises. Each step has a time estimate, links straight there and ticks off when it's done
- **Word topics**: 42 sets of everyday vocabulary (25 for A1, 6 for A2, 11 for B1), from the alphabet, numbers and dates to housing, work, health and exam instructions. Entries include an English meaning, noun plurals and example sentences
- **Review queue (spaced repetition)**: new words join the queue when you first answer them, and a finished lesson adds all its words. A word you know comes back after 1, 3, 7, 14 and then 30 days; a word you miss comes back the same day. The **Due today** deck shows what's due, each card says why it's back ("Missed last time", "Last seen 3 days ago"), and the Flashcards link shows how many are waiting
- **Route map**: one line showing your progress through A1, A2 and B1, with links to each level and any certificates
- **Word ticker** further down the home page: words from your level glide past like a platform display; tap one to hear it
- **Grammar lessons** with tables, rules and example sentences read aloud in German
- **German audio**: existing recordings use a native German voice. Newly authored A1 lines use the browser’s German voice until recordings are generated; official exam recordings are linked for realistic rehearsals
- **Exercises**: multiple choice, fill the gap, word order (chips glide into place), listening and writing with model answers
- **Level-wide practice**: extra fill-in questions, English-to-German sentence translation and vocabulary matching for A1, A2 and B1
- **Instant answer checking**, including umlaut spellings like ae/oe/ue/ss
- **Swipeable flashcards** for what's due, today's new words, a topic, a lesson, a level or everything: swipe right if you knew it, left to see it again. With the card selected, the arrow keys work too (they leave buttons, menus and the browser's Alt+← alone). The back of a card shows the meaning, the plural and an example sentence; under a topic deck, a word list lets you hear every word and example
- **Practice calendar**: a 17-week heatmap, day streak, lessons done and words known
- **A mock test for each level**: A1 has 15 listening items, 15 reading items, five form fields, a short-message task, speaking rounds and a written-practice timer. Reviewed writing/speaking scores can produce a practice estimate; automatic scores and certificates describe objective practice only
- **Motion**: the home page opens with a short sequence (the headline rises, the board flips, the line draws itself stop by stop), pages fade into each other, sections reveal as you scroll, and desktop wheel scrolling is smoothed. Lessons and tests move calmly so studying stays easy
- Mobile bottom navigation, German text tagged for screen readers. With reduced motion turned on in your system settings, everything appears without animation
- Progress saved in the browser (localStorage). Saves from earlier versions are converted automatically

## What each level covers

| Level | Lessons |
| --- | --- |
| A1 | Sounds and spelling, personal details, present verbs and questions, articles and possession, time, routines, food, shopping, modals and requests, common object pronouns and dative phrases, directions, housing, work, health, travel, weather, invitations, selected past forms, reading/listening strategies, forms, short messages and spoken interaction |
| A2 | modal verbs, Perfekt with haben, Perfekt with sein (and war, hatte), dative, two-way prepositions, weil/dass/wenn, reflexive verbs, comparisons |
| B1 | Präteritum, Konjunktiv II, passive, relative clauses, verbs with prepositions, als/wenn/nachdem, zu and um … zu, adjective endings, obwohl/trotzdem/deshalb |

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

It works as-is on GitHub Pages or any static host.

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
│   ├── home.css          hero, line of stops, practice calendar, route, questions, not-found page
│   ├── lesson.css        lesson page
│   ├── cards.css         flashcards
│   ├── test.css          mock test and certificate
│   ├── practice.css      level-wide practice page
│   └── course.css        A1 roadmap and course sections
├── js/
│   ├── main.js           entry point: loads the content, restores progress, starts the router
│   ├── content.js        loads data/*.json and builds the lookups (levels, lessons, topics, words)
│   ├── state.js          saved progress in localStorage, including converting older saves
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
│   └── views/            home, lesson, cards, practice, roadmap, workshop, test, cert, notfound (+ shared.js)
├── data/
│   ├── levels.json       level order, names and the short summaries on the home page
│   ├── a1.json           A1 lessons, word topics and mock test
│   ├── a1-course.json    generated A1 extension, sequence, workshops and assessment
│   ├── a2.json           A2 lessons, word topics and mock test
│   ├── b1.json           B1 lessons, word topics and mock test
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

The A1 extension is authored in `tools/build_a1_course.mjs`, `tools/a1_workshop_content.mjs`, `tools/a1_exam_content.mjs` and `tools/a1_curriculum_document.mjs`. Run `node tools/build_a1_course.mjs` after editing these sources. Commit the generated JSON and Markdown; deployment still needs no build step. `levels.json` declares the optional `courseFile`. Its `lessonOrder` controls the visible sequence while original lesson IDs and saved keys remain stable. A1 course checkpoints live at `#/a1/checkpoint/<module>` and the roadmap at `#/a1/roadmap`.

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

Word topics live under `topics`, in the order Today's session teaches them: `{ "id", "title", "vocab" }`, where `id` is lowercase letters (used in links like `#/karten?l=a1-food`) and each word is `{ "de", "en", "pl", "ex": { "de", "en" } }`. `ex` is the example sentence.

Nouns (words that start with der, die or das) need `pl`, in lessons and topics alike: the plural without its article (`"Tische"`), `"-"` when there's usually no plural (das Wetter) or `"pl"` for plural-only nouns (die Eltern). Other words have no `pl`.

A word can be in a lesson and in a topic: it counts once, at the lowest level that teaches it (within a level, lessons come before topics), so keep its English and plural the same in both. A word can't be in two topics, and shouldn't be in two lessons.

The mock test sits under `test`: `passMark`, `reviewTip` (shown when you don't pass), `listening` (`audioText`, `question`, `options`, `answer`), `reading` (`text` and `statements` with `isTrue`), `writing` (`task`, `placeholder`, `checklist`, `modelAnswer`) and `speaking` (`task`, `modelAnswer`). Listening and reading are scored.

To add a level, create `data/<id>.json` with `lessons` and `test`, then add `{ "id", "name", "summary" }` to `data/levels.json`.

### Recording new German lines

After adding or changing German text that is read aloud (vocab, examples, `audioText`, model answers), record it:

```
pip install sherpa-onnx lameenc numpy
python tools/make_audio.py
```

It records only the lines that don't have a file yet (about a second each) and updates `audio/index.json`. The letters of the alphabet topic are read by their German names (`LETTER_NAMES`), and `SAY_AS` fixes the few words the voice says more clearly another way. The first run downloads the voice model (about 115 MB) into `tools/.models/`, which git ignores. `--prune` deletes recordings that nothing uses any more, `--speed 1.0` records at normal pace (the default is 0.92, slightly slower for learners; add `--force` to record everything again). Until a line is recorded, the site reads it with the browser's best German voice.

## Tech

- Hash routing: `#/` (home, last level used), `#/a2` (a level), `#/a2/lektion/1` (add `?part=exercises` to open at the exercises), `#/a2/test`, `#/a2/zertifikat`, `#/karten?l=due` (flashcards; `l` is `due`, `new` (today's new words), `all`, a level, a lesson (`a2-3`) or a topic (`a1-food`); without it, the due words if there are any). Links from the A1-only version (`#/lektion/1`, `#/test`, `#/zertifikat`) still work
- [GSAP](https://gsap.com) 3.15 from the jsDelivr CDN (free standard license): core, ScrollTrigger, SplitText, Flip and Draggable. [Lenis](https://github.com/darkroomengineering/lenis) 1.3 (MIT) for smooth wheel scrolling. Without them (offline), the site works without animation
- Audio: recordings made with the [Thorsten-Voice](https://github.com/thorstenMueller/Thorsten-Voice) German voice (Piper model `de_DE-thorsten-high`; voice data CC0, model MIT), run locally with [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx). Lines without a recording use the Web Speech API with the most natural German voice the browser has (Edge's natural voices, then Google's, then any other German voice), never an English one
- Colours are CSS variables at the top of `css/base.css`
- Progress is stored under the `sprachpfad-v1` key in localStorage: finished lessons, test results, the review queue (each word's box and next review day), the practice calendar and what was done today (including how many new words you met). It belongs to the address you open the site from, so `http://localhost:8000` and your GitHub Pages address each keep their own progress. Saves from before the review queue get one on their first load: the words met so far are queued, at most 20 a day

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
