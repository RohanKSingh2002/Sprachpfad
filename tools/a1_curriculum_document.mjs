export function curriculumDocument(course, original) {
  const lessons = new Map([...original.lessons, ...course.lessons].map(l => [l.id, l]));
  const positions = new Map(course.lessonOrder.map((id, i) => [id, i + 1]));
  const roadmap = course.modules.map(m => `### Module ${m.id}: ${m.title}

**Regular pace:** week ${m.id}; ${m.hours} hours plus one hour of cumulative review.

${m.lessonIds.map(id => `- Lesson ${positions.get(id)}: **${lessons.get(id).title}** — ${lessons.get(id).intro}`).join('\n')}

**Outcomes:** ${m.goals.join(' ')}

| Practice area | Work to complete |
| --- | --- |
| Vocabulary | ${m.topics.map(id => [...original.topics, ...course.topics].find(t => t.id === id)?.title || id).join('; ')} |
| Pronunciation | ${m.pronunciation} |
| Listening | ${m.listening} |
| Reading | ${m.reading} |
| Writing | ${m.writing} |
| Speaking and interaction | ${m.speaking} |

**Checkpoint:** ${m.checkpoint}

Open the module’s four-skill workshop at \`#/a1/checkpoint/${m.id}\`: three listening questions, three reading questions, one practical writing brief and a partner speaking task. Aim for at least 5/6 in comprehension. Writing prompt: ${m.workshop.writing.task} Speaking prompt: ${m.workshop.speaking.task}

Do the unfamiliar transfer task before calling the module complete. Keep a sample of your writing and obtain feedback on the spoken exchange.
`).join('\n');
  return `# Sprachpfad: complete A1 curriculum and learning roadmap

Prepared: ${course.updated}. Target: ${course.targetExam}. Audience: adult beginners studying with English explanations. This is an independently written preparation course, not an official Goethe course or an exam-pass guarantee.

## Purpose and course boundaries

The learner should be able to handle simple everyday situations, understand practical information, give personal details, ask and answer basic questions, make requests, complete forms and write short messages. A correct grammar exercise is one part of that outcome. The learner must also use the language with an unfamiliar prompt, recording or conversation partner.

The course contains 32 sequenced lessons in 16 modules, with vocabulary, pronunciation, listening, reading, writing, interaction and a checkpoint in every module. Existing lesson identifiers remain stable so that older links and saved lesson results continue to refer to the same material. The visible course sequence starts with sound and spelling foundations and then develops communication progressively.

The course contains original lessons, 16 supported workshops and one preparation assessment. The October 2026 tutor review led to revised grammar, clearer exercise prompts, accepted word-order alternatives, separate goals and speaking models for every lesson, and fuller vocabulary support. Locally generated German recordings cover the spoken course lines; the mock dialogues use two distinct voices. These are synthetic recordings. Independent listening review and assessment with real learners remain further quality work.

## Official exam reference

The adult Goethe A1 exam assesses listening, reading, writing and speaking. The written sections take about 20, 25 and 20 minutes respectively; the speaking group takes about 15 minutes. Typical tasks involve everyday recordings, practical short texts, simple forms, short messages and spoken interaction. [Goethe exam overview](https://www.goethe.de/ins/de/en/prf/prf/gzsd1/inf.html)

All four sections must be completed. The official overall passing threshold is 60/100. This course recommends a preparation target of 80/100 on two different unfamiliar full rehearsals, with reviewed writing and speaking; that margin is our recommendation. [Goethe administration terms, September 2025](https://www.goethe.de/pro/relaunch/prf/id/Durchfuehrungsbestimmungen_A1_Start_Deutsch_1.pdf)

Goethe’s vocabulary reference describes roughly 650 entries for recognition and about half for active use. A topic-card count is not an audit against that list: spelling, meanings, word groups and overlap must be checked. Use the official list as a separate coverage checklist. [Official A1 vocabulary reference](https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf)

The official model paper shows a listening sequence of 6 dialogue items, 4 announcement items and 5 message items; reading has 15 items, and writing combines form completion with a message of about 30 words covering three points. Speaking includes an introduction with follow-ups, information exchange, and requests with responses. Use the official paper and recordings to rehearse the actual instructions and playback limits. [Official model paper](https://www.goethe.de/pro/relaunch/prf/materialien/A1_sd1/sd_1_modellsatz.pdf)

## Study schedule and workload

Plan 128 hours of module work and 16 hours of cumulative review: 144 hours overall. These are self-study planning estimates, not mandatory Goethe course hours or a promise that every learner will be ready at that point.

The estimate includes repeated retrieval, partner conversation, reviewed writing, independent practice and different official papers. It is not a measurement of unique content or audio contained in the app.

| Pace | Suggested duration | Weekly study | Suitable conditions |
| --- | --- | --- | --- |
| Intensive | 8 weeks | about 18 hours | Daily availability, frequent partner practice, quick access to feedback |
| Regular | 16 weeks | about 9 hours | Six daily sessions and a weekly practice/review block |
| Gentle | 24 weeks | about 6 hours | A slower routine with extra spaced review |

At the regular pace, use the following 60-minute routine on six days each week. Add about three hours across the week for extended reading/listening, conversation, reviewed writing and a module checkpoint.

| Time | Daily work |
| --- | --- |
${course.dailyPlan.map(s => `| ${s.minutes} minutes | **${s.title}:** ${s.description} |`).join('\n')}

Use the seventh day for light recall or rest. If a checkpoint reveals a gap, extend the module rather than increasing the amount of unfamiliar material. Keep one small error log: the failed task, the intended meaning, a corrected phrase and a date to try again.

## The roadmap

${roadmap}

## Grammar coverage and expected depth

Teach structures through the communication they enable. The official learning-objective inventory can guide coverage, but a beginner’s ability to communicate understandably is central. Selected polite expressions may be learned as whole phrases before their full grammatical system is introduced. [Goethe objectives and test description](https://www.goethe.de/pro/relaunch/prf/en/Pruefungsziele_Testbeschreibung_A1_SD1.pdf)

| Area | Course coverage | Expected learner performance |
| --- | --- | --- |
| Present tense | Modules 1–4, 6 | Use sein, haben, heißen and frequent regular/irregular verbs with familiar subjects |
| Questions | Modules 1–3 and throughout | Ask W-questions and yes/no questions; distinguish who, where, when, how and how much |
| Nouns | Modules 4, 7, 8 | Recall common genders and plurals; recognise compounds in context |
| Articles and possession | Modules 4, 7, 8 | Use definite, indefinite, possessive, negative and common demonstrative forms |
| Sentence structure | Modules 3, 5, 6, 9, 14 | Maintain verb-second order, question order and simple sentence brackets |
| Negation | Modules 8, 9 | Use nicht and kein in familiar contexts and understand negative permissions |
| Accusative | Modules 7–9 | Produce common noun and pronoun objects: einen, meinen, mich, dich, ihn, sie, es |
| Useful dative | Modules 9–12 | Understand common article forms and use familiar helping, thanking, travel and location phrases |
| Pronouns | Modules 3, 4, 9 | Use subject and common object pronouns; recognise mir, dir and Ihnen in fixed everyday constructions |
| Time | Modules 2, 5, 6 | Understand clock times, dates, days, months, seasons, durations and opening hours |
| Local/directional phrases | Modules 10, 12 | Distinguish location and destination in familiar phrases; use nach, zu, in, aus, bei and mit appropriately in learned examples |
| Modal verbs | Modules 9, 11, 12 | Use können, müssen, dürfen, wollen, sollen and möchten with an infinitive |
| Instructions and politeness | Modules 7, 9, 11 | Use formal and familiar requests, common imperatives, Ich hätte gern and Könnten Sie … as appropriate |
| Connectors | Modules 11, 13, 14 | Link clear short statements using und, aber, oder, denn and dann |
| Adjectives and comparison | Modules 4, 8, 12 | Use predicate adjectives, understand useful colours and compare with familiar forms such as besser or größer |
| Simple past | Modules 13, 14 | Use war/hatte and a limited set of common Perfekt forms; recognise frequent past forms in practical messages |
| Recognition beyond core production | Throughout | Recognise fixed expressions, names with -s and unfamiliar forms from context without requiring a full advanced declension system |

## Vocabulary programme

Build vocabulary by communicative domain: people and personal data; family; classroom; numbers and time; daily actions; food and meals; shopping and clothing; home; town and services; work; health; travel; weather; leisure; messages and exam instructions. Every original A1 topic is connected to a module, and an additional set covers essential instructions and form labels.

For each entry, store the meaning needed in this course, a usable example and the grammatical information needed to use it. A noun needs its article and plural; a frequent irregular verb needs its changed present forms and, when introduced, auxiliary plus participle. Prepositions should be learned in usable phrases. A collection of words without these relationships is insufficient for a sentence generator.

Flashcard backs display available du and er/sie/es verb forms, plus a past reference form for ordinary verbs. Modal and polite möchten cards concentrate on their present forms. Learn the past forms when the course reaches them. The new-word queue prioritises the active module, then missing vocabulary from earlier modules. The vocabulary bank is still not a verified audit of all meanings in the official list.

Use four recall directions: hear German and understand; read German and understand; see a meaning or situation and say German; use German in a short sentence. A flashcard marked known once is an early encounter, not demonstrated mastery. Revisit missed items sooner and successful items at longer intervals.

At the end of every module, take ten relevant words out of their original examples. Ask the learner to understand them in a new sentence, then use five in a practical response. Once a week, audit part of the official vocabulary reference for recognition and active use. Add missing entries and meanings to the appropriate domain, rather than assuming the existing bank equals the official reference.

## Pronunciation and speaking programme

Start speaking in the first session. Practise intelligibility: distinguish sounds that change meaning, keep useful endings audible, use word stress and make requests and questions understandable. An accent by itself is not a failure.

Cover vowel length; ei/ie/eu; ä/ö/ü; sch and initial sp/st; the two common ch sounds; z as a ts sound; w and v in frequent words; final devoicing; stress in compounds and separable verbs; syllable grouping; sentence stress; and natural pauses. Explanations should accompany a sound model. English approximations alone are inadequate for unfamiliar vowels.

Use a short practice cycle: listen to a phrase, repeat after a pause, shadow it while listening, record or say it independently, then ask whether a listener understood the intended information. Work with contrast pairs when a sound confuses words or numbers. Practise letter names separately from ordinary word pronunciation.

| Stage | Spoken work |
| --- | --- |
| Modules 1–2 | Greetings, introduction, spelling, age, contact numbers and asking for repetition |
| Modules 3–6 | New questions and answers about family, everyday actions, times and routines |
| Modules 7–10 | Orders, shopping, permission, requests, suitable responses and directions |
| Modules 11–14 | Appointments, practical needs, travel, invitations, reasons and short past accounts |
| Modules 15–16 | Unfamiliar cards and partners; all three exam speaking rounds without a written script |

A weekly partner session should contain at least one introduction, several question-answer turns, two requests and two responses. Change personal details and cards so the learner has to listen and respond. Ask a tutor or proficient speaker to give feedback on understandable meaning, task relevance and interaction. Speech recognition can assist practice later, but it does not substitute for a qualified assessment.

## Reading and listening programme

Progress from supported short texts to unfamiliar practical tasks. Use names, numbers, time, price, place, availability and reason as listening targets. Include negation and corrections: a speaker may mention a time and replace it later. For reading, train short notes, messages, schedules, advertisements and signs.

An independent attempt comes before transcript access or translation. After checking, locate the evidence and explain why the other choices are wrong. Listen again with the transcript, then once without it. For reading, replace one practical detail and ask the learner to detect what changed.

Use different voices and official recordings before final rehearsals. The app includes generated German recordings and two voices in the six mock dialogues. Browser speech remains a fallback if a recording cannot play. The optional rehearsal setting applies the 2/1/2 listening playback limits and hides transcripts and models until the objective section is complete. Generated speech is a training aid; use official recordings and unfamiliar papers for further exam rehearsals.

## Writing programme and feedback

Begin with personal details and short sentences. Move to form fields, invitations, cancellations, appointment changes and information requests. For each message, give a recipient, a clear purpose and three explicit content points. The learner drafts independently, checks coverage, and then receives feedback.

Check whether all points are understandable, whether the recipient can act on the message, whether the greeting and ending suit the relationship, and whether the chosen verbs and word order obscure meaning. Ask for a corrected second draft after feedback. Accept more than one natural answer. An exact match to a single model text cannot fairly assess open writing.

For forms, transfer information from the supplied person. Include a case where the person registering differs from the participant, so the learner must identify whose details belong in the form. Distinguish birthplace from current home, surname from first name, and the requested time from a date mentioned elsewhere.

## Assessment and readiness

Each module has two objective lesson scores and a practical checkpoint. Aim for at least 80% in each lesson and at least 5/6 on the workshop comprehension questions, then complete writing and speaking with feedback. The roadmap checkboxes record the learner’s practice and feedback; they are not externally verified exam marks.

The original A1 preparation assessment contains 35 automatically checked items: 15 listening, 15 reading and five form fields. It also contains a three-point message and complete speaking exchanges. The app can combine those objective results with reviewer-entered writing and speaking totals to display a practice estimate. A result from one familiar paper is not proof of readiness.

Use the official model paper early to learn the format, then a different official practice paper for the first final rehearsal and another for the second. Follow the supplied audio, time limits and instructions, without a dictionary, transcript or translation tool. Review writing and speaking with an appropriate assessor before interpreting the overall preparation score.

Readiness indicators:

${course.readiness.map(item => `- ${item}`).join('\n')}

When a learner misses a checkpoint, assign focused review. Weak spoken questions require new question-answer turns; weak numbers require listening contrasts; missing message points require shorter complete messages. Simply repeating a memorised mock paper can hide the gap.

## Foundation for generated daily practice

The curriculum supplies learning objectives, grammatical contexts, vocabulary domains, model language and task types. The next generation layer should store sentence frames, permitted slot choices, grammatical constraints, accepted answer variants, explanations and stable identifiers. Generate combinations only from compatible data; vary the communicative situation as well as the words.

A daily set should remain stable during the day, save the attempt, avoid recent exact duplicates and include deliberate review of previous mistakes. Different exercise types assess different things: matching checks recognition, fill-in checks a constrained form, short translation checks controlled production, and a partner exchange checks interaction. Daily practice should not replace natural listening, open writing or spoken conversation.

The current practice page still samples stored tasks and example sentences. This curriculum expansion does not claim to implement an unlimited daily generator. A finite template collection can offer broad variation, but its combination space is finite.

Lesson multiple-choice options are shuffled without changing their answer keys. Word-order tasks accept authored natural alternatives. Free translation practice compares the learner’s text with one model and does not assign an automatic correctness score to unrestricted German.

## Maintenance and release review

### Learning-support update, 25 October 2026

Each module now includes an original transfer task with a short success checklist, targeted review advice and links to earlier lessons where useful. These activities are ungraded, so the original scored tasks, lesson IDs and module-check version stay stable. The roadmap also includes guidance for finding the main idea and evidence, drafting and revising messages, and responding to a conversation partner. Suggested later review intervals are guidance rather than an additional automatic reminder system.

Private reference material informed the topic and skill review. No scans, notebook examples, names or personal details were copied into the course. See docs/COURSE-REFERENCE-UPDATE.md for the scope of the review and the related A2/B1 changes.

Before public claims of comprehensive A1 preparation, have a German educator review the syllabus, new lessons, translations, distractors and models; audit vocabulary and meanings against the official reference; review natural audio; and have beginners complete the path and unfamiliar assessment tasks. Correct ambiguous prompts and false rejections of acceptable answers.

The site can initially save progress in the browser. Learners should understand that this belongs to that browser. Add accounts and a backend when the product needs progress across devices. Keep the content model separate from the views so a later A2/B1 curriculum can use the same lesson, roadmap and assessment structure.

Official sources checked on ${course.updated}:

${course.sources.map(source => `- [${source.title}](${source.url})`).join('\n')}
`;
}
