# A simpler study home

3 November 2026

The home page should help a learner begin, without first interpreting a dashboard or deciding among course maps. It now presents one recommended activity, followed by direct Lesson, Flashcards and Practice shortcuts. Activity statistics remain in Profile, and course maps remain on Lessons. The moving ticker and duplicate progress summaries have been removed from Home.

## Research and design decisions

- [Nielsen Norman Group: Aesthetic and Minimalist Design](https://www.nngroup.com/articles/aesthetic-minimalist-design/) explains how unnecessary information competes with useful information. Home therefore shows only the current next step and a few alternative actions.
- [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) supports deferring secondary detail. Today's plan and study questions remain available in closed disclosure controls.
- [Duolingo: the redesigned home screen](https://blog.duolingo.com/new-duolingo-home-screen-design/) describes a guided learning path that reduces the need to choose the next activity. Sprachpfad uses its existing daily course plan and review queue to recommend a start; it does not copy Duolingo's appearance or course content.

These are design principles and relevant product examples, not a measured claim about Sprachpfad learning outcomes. Learner feedback should guide further iteration.

## Behaviour

Due vocabulary review takes priority. Otherwise, the prominent button opens the next unfinished activity in the current course session, then remaining vocabulary, with optional practice when today's suggestions are complete. Home uses the learner's saved level; its level selector was removed at the owner's request. Practice shortcuts use the selected level's existing exercise sets, choosing a stable set by lesson position; they are not a new performance-adaptive recommendation system.

Flashcards open due words, remaining new words, or the current lesson's vocabulary when the daily new-word target is complete. The practice page accepts a validated `?set=` identifier to open an exercise immediately; unknown identifiers retain the practice library.

## Validation

- The course-plan checks cover A1, A2 and B1, due-review priority, study and exercise days, flexible days, checkpoints, course completion and daily word limits.
- Existing practice content and scoring checks pass.
- Local browser checks confirm direct lesson, flashcard and practice starts, returning to the practice library, changing level, and opening the optional plan with Enter.
- Phone layouts checked at 390 and 320 CSS pixels: the main Start action is in the first viewport and there is no horizontal overflow.

No progress schema or account-storage changes are part of this redesign.
