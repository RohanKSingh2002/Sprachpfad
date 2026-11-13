# Course improvements from the reference review

Updated: 25 October 2026.

## What changed

| Level | Structure | Added learning support |
| --- | --- | --- |
| A1 | Existing 32 lessons and 16 modules retained; roadmap order aligned to the A1 notebook | 16 original transfer activities, success criteria, targeted recovery advice, links to earlier lessons, four-skill strategies, notebook-style drills in every lesson, and clearer coverage of case patterns |
| A2 | 18 lessons in 9 modules, including the original 8 lessons | 10 new lessons, 9 original four-skill checkpoints, lesson outcomes, pronunciation practice, spoken interaction, review links and a weekly plan |
| B1 | 18 lessons in 9 modules, including the original 9 lessons | 9 new lessons, 9 original four-skill checkpoints, outcomes, pronunciation practice, spoken interaction, review links and a weekly plan |

Each new checkpoint has three listening and three reading questions with evidence-based feedback, a writing brief with a model, and a partner speaking task. Across A2 and B1, the 18 checkpoints add 108 comprehension questions. The ten new A2 lessons and nine new B1 lessons each have five objective exercises and one writing task. Writing and speaking remain reviewed practice, not automatically graded language proficiency.

The homepage’s daily plan and vocabulary suggestions now use the active module in all three levels. The Lessons navigation opens the active level and offers a level switch. Roadmap totals, lesson links and checkpoint return links adapt to the selected level. Day ranges that span weeks display both weeks.

## A2 everyday communication sequence

1. Plans, obligations and recent activities: modal verbs and Perfekt with haben.
2. Journeys and asking for help: Perfekt with sein and dative recipients.
3. Housing, locations and reasons: two-way prepositions and weil/dass/wenn.
4. Wellbeing, preferences and choices: reflexive verbs and comparisons.

5. Past experiences and changed plans: familiar Präteritum forms, als/wenn and event order.
6. Information, appointments and polite alternatives: indirect questions, könnte/hätte/wäre and negotiation.
7. Clothing, descriptions and practical choices: adjective endings, selecting a known item and asking about a type.
8. Interests, small goals and everyday habits: zu-infinitives, verbs with prepositions and wo(r)-/da(r)- forms.
9. Daily routines, messages and shared plans: accusative/dative reflexive patterns and integrated communication.

The later A2 review used the newly supplied 72-page notebook. It expands the initial eight-lesson foundation into an 18-lesson everyday communication path. The original four modules and their checkpoint IDs remain first, followed by five new modules. The default plan is 16 weeks, with 8- and 24-week options still available. The 72 core hours plus 18 review hours are planning estimates including repetition, conversation and feedback, not 90 hours of unique recorded material.

The A2 notebook is a grammar and practice reference, not evidence that every CEFR A2 outcome is covered. Fuller genitive work and longer argumentative communication remain in B1. Some structures recur there deliberately: A2 introduces familiar patterns, while B1 asks learners to use them in longer and less supported tasks. Natural listening, unfamiliar texts and independent feedback remain necessary. See [the A2 review map](A2-REFERENCE-REVIEW.md) for topic coverage and teaching decisions.

## B1 sequence

1. Experiences, stories and change: Präteritum, time clauses and event order.
2. Media, sources and useful questions: prepositional verbs and indirect questions.
3. Consumption, repair and the environment: passive and common genitive phrases.
4. Learning, work and purposeful action: infinitives and purpose clauses.
5. Relationships, requests and boundaries: Konjunktiv II and relative clauses.
6. Digital life and reasoned opinions: results, paired connectors and responding to arguments.
7. Future plans and realistic priorities: concession, future reference and uncertainty.
8. Community, places and participation: adjective phrases, reflexives and voluntary roles.
9. Travel, formal messages and joint planning: enquiries, complaints, negotiation and presentations.

The supplied B1 material covers units 21–30 of its series and combines course pages, exercises and assessment material. Its later-unit structure was used to identify themes and communicative gaps; it was not treated as a full beginner-to-B1 syllabus. Some book structures, including a fuller treatment of passive tenses, nominalisation and participial adjectives, remain outside this update. The app explicitly presents the result as a communication path rather than proof of complete B1 coverage.

## How the references were used

- The 123-page A1 notebook was surveyed visually for topic order and exercise patterns. Its spelling, personal details, present-tense forms, articles and possession, food, time and routines, housing, modal verbs, instructions, case patterns, past forms, two-way prepositions, colours and clothing informed the reordered curriculum. One additional original grammar or sentence drill now appears after each lesson. The notebook's personal examples and handwritten answers were not used.
- The A1 exam-preparation book’s contents and selected strategy pages informed the progression from identifying a situation, to locating details, to completing a communicative task. This is a targeted curriculum review, not a page-by-page transcription or exercise import.
- The A2 notebook's 72 pages were surveyed visually for grammar headings and general themes. It informed the ten new lessons and five additional checkpoints. Personal examples, biographical material and handwritten answers were excluded; simplified rules were rewritten with appropriate limits rather than imported.
- The two B1 parts were reviewed through their contents, printed headings and topic structure. Themes such as media, consumption, work, relationships, digital life, community participation and travel informed the new path.
- All added explanations, passages, questions, answer options and models were written independently. No book pages, illustrations, answer keys, source audio or handwritten examples are embedded in the app.
- New examples use invented situations. Personal names, contact details and other personal information from the notebook were excluded from course data, documentation and recordings.

The reference files remain unchanged in the local `Refrence Materials` folder. That folder and temporary PDF renders are excluded from Git. Git exclusion does not prevent a manual whole-folder upload: publish only the website assets, not the project root containing the references. A future hosting setup must keep the reference folder, temporary files, tools and internal documents outside its published directory.

## Progress and authoring

- Existing A1 lesson and checkpoint IDs remain stable. The 16 A1 modules and their checkpoint IDs remain the same; their visible order now follows the notebook sequence. The original objective tasks are retained, with one independently written notebook-style drill added to every lesson. Existing saved progress and checkpoint records therefore retain their identifiers.
- New B1 lessons use IDs 10–18. The displayed B1 order is thematic; old links still resolve by their stable IDs. A lower percentage after adding lessons means there is new material to study, not that completed lessons were deleted.
- New A2 lessons use IDs 9–18 and new modules use IDs 5–9. A2 course version 1 and modules 1–4 are unchanged, preserving their checkpoint keys. Existing A2 lesson tasks and checkpoint questions were not rewritten. A2 progress percentages now use 18 lessons and nine modules; the extra unfinished content can reduce the percentage without removing saved work.
- The new A2 and B1 course data is loaded through the existing `courseFile` mechanism. Checkpoints use separate per-level progress keys.
- Suggested later review intervals are instructions, not scheduled reminders or a new progress tracker.
- Existing mock assessments were retained. The A2/B1 roadmap links to official practice materials for full rehearsals and identifies the in-app assessment as short practice.

Authoring sources:

- `tools/reference_learning_support.mjs`: shared strategies and A1 transfer activities.
- `tools/b1_extension_lessons.mjs`: the nine new B1 lessons.
- `tools/a2_extension_lessons.mjs`: the ten new A2 lessons.
- `tools/learning_path_workshops.mjs`: the original four A2 and nine B1 checkpoints.
- `tools/a2_extension_workshops.mjs`: the five additional A2 checkpoints.
- `tools/build_learning_paths.mjs`: generates `data/a2-course.json`, `data/b1-course.json`, updates level metadata, and adds A1 support without rebuilding its existing content.
- `tools/build_a1_course.mjs`: also applies the A1 support, so a later A1 rebuild retains it.

After content edits, run `node tools/build_learning_paths.mjs`, then the existing local audio generator for new German lines. It reads only authored course JSON, never private PDFs. Existing recordings are reused; new lines use the existing voice and generation settings.

The first reference pass produced 140 new recordings and brought the manifest to 2,865 recordings. The A2 extension produced another 103 recordings using the same local voice and speed; the manifest now lists 2,968 recordings. The nine temporary A2 contact sheets were removed after the review. The original PDFs remain unchanged.

## Limits and review status

No automated tests or browser interaction tests were run for this update. The content generation command was run to produce the course data. Language and educational quality should still receive an independent German-teacher review, particularly naturalness, distractor difficulty, workload and listening clarity. The time estimates include repetition and external conversation/feedback; they are not the duration of unique app content.

Official supplementary resources:

- [Goethe A2 practice materials](https://www.goethe.de/ins/de/en/prf/gzsd2/ub2.html)
- [Goethe B1 practice materials](https://www.goethe.de/ins/de/en/prf/gzb1/ueb.html)
