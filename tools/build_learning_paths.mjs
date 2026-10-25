// Generate public learning data from original authoring sources only.
// Private PDFs are never opened, copied or bundled by this command.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { b1Lessons } from './b1_extension_lessons.mjs';
import { a2Workshops, b1Workshops } from './learning_path_workshops.mjs';
import { reviewRoutine, skillStrategies, strengthenA1 } from './reference_learning_support.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));
const save = (name, data) => fs.writeFileSync(path.join(root, 'data', name), JSON.stringify(data, null, 2) + '\n');
// Preserve the current generated A1 content, original scores, ordering and module-check version.
save('a1-course.json', strengthenA1(read('a1-course.json')));

const a2Units = [
  ['Plans, obligations and recent activities', [1,2], ['media','money'], ['Explain what you can, must or want to do.', 'Describe completed activities and arrange a meeting.'], 'Listen for the modal verb and stress the final infinitive or participle.', 'Ich muss heute arbeiten. Gestern habe ich lange gearbeitet.', 'Identify a change of plan and distinguish an obligation from an optional action.', 'Find the required action in a group message.', 'Write a message explaining an absence and proposing another time.', 'Negotiate a study meeting and respond to a scheduling problem.', 'Agree on a meeting and explain a recent change of plan.', 'Review present-tense verb position and common A1 time phrases.'],
  ['Journeys and asking for help', [3,4], ['traffic','holiday'], ['Tell someone how a journey went using haben and sein.', 'Ask for help and identify the recipient of an action.'], 'Keep the auxiliary audible and stress the important place or problem.', 'Ich bin angekommen. Eine Mitarbeiterin hat mir geholfen.', 'Follow a short journey account and identify who helped whom.', 'Read practical instructions and identify times and included services.', 'Describe a journey, a problem and the help received.', 'Ask for help at a station and confirm directions.', 'Explain a travel problem and relay the instructions accurately.', 'Recall common participles; distinguish the person receiving help from the object involved.'],
  ['Housing, locations and reasons', [5,6], ['flat','money'], ['Distinguish a location from a destination with two-way prepositions.', 'Give a reason, report an idea and discuss a condition.'], 'Pause before subordinate clauses and keep their final verb clear.', 'Der Tisch steht im Zimmer. Wir stellen ihn ins Zimmer.', 'Follow an explanation of where objects go and why.', 'Identify permitted locations and a delivery condition in a notice.', 'Make a practical proposal with a reason and a request.', 'Discuss two arrangements and respond to an objection.', 'Agree on a room arrangement and explain it clearly.', 'Movement alone does not determine the case: contrast movement within a place with movement to a destination.'],
  ['Wellbeing, preferences and choices', [7,8], ['sport','holiday','media'], ['Describe habits and feelings using common reflexive phrases.', 'Compare options and make a joint decision.'], 'Stress the contrast: günstiger, besser, am liebsten.', 'Ich fühle mich besser. Am liebsten bewege ich mich draußen.', 'Understand a change of routine and the reason for a preference.', 'Compare price, time and conditions in course descriptions.', 'Recommend an activity with reasons and an invitation.', 'Compare alternatives and ask about a partner’s preference.', 'Choose an activity using at least two relevant comparisons.', 'Recall personal pronouns and use als for differences, so ... wie for equality.'],
];
const b1Units = [
  ['Experiences, stories and change', [1,6], ['past','job'], ['Tell a connected story and describe its background.', 'Explain which event happened before another.'], 'Group a longer sentence into meaningful phrases; stress time markers.', 'Als ich ankam, hatte der Kurs schon begonnen.', 'Follow a personal account and identify an earlier event.', 'Recognise a problem, response and outcome in an experience report.', 'Write a coherent short experience report.', 'Tell a story, answer questions and summarise a partner’s experience.', 'Tell a new story in order and explain what led to a change.', 'Recall Perfekt, war/hatte and verb-final clauses.'],
  ['Media, sources and useful questions', [5,10], ['tv'], ['Ask about information using prepositional and indirect questions.', 'Summarise useful information and identify what remains uncertain.'], 'Pronounce the r-link in worauf/darauf clearly; keep an indirect question together.', 'Worauf achtest du? Weißt du, woher die Information kommt?', 'Identify the purpose and limitations of an information source.', 'Distinguish evidence, opinion and an unanswered question.', 'Write a focused information request.', 'Recommend a source and respond to a reliability concern.', 'Relay a short piece of information while making uncertainty explicit.', 'Recall verb + preposition combinations and the difference between ob and wenn.'],
  ['Consumption, repair and the environment', [3,11], ['environment','shopping'], ['Describe a process without making the person the focus.', 'Understand relationships and reasons in more formal noun phrases.'], 'Keep wird/werden and the final participle audible.', 'Das Gerät wird geprüft. Die Reparatur des Geräts beginnt morgen.', 'Understand a service procedure and its restrictions.', 'Read rules for a reuse project and identify conditions.', 'Propose a small reuse project with practical rules.', 'Compare repairing, sharing and replacing an item.', 'Explain a process and justify one practical restriction.', 'Recall participles and noun gender before passive and genitive practice.'],
  ['Learning, work and purposeful action', [7,12], ['job','office'], ['Use infinitive clauses to describe plans and intentions.', 'Distinguish the people involved in a purpose clause.'], 'Speak the whole infinitive group together, including zu.', 'Ich übe, um sicherer zu sprechen. Wir helfen, damit alle mitkommen.', 'Identify a learning opportunity and who benefits from an arrangement.', 'Read a training proposal and distinguish its purpose from assessment.', 'Make a reasoned request for training or support.', 'Negotiate a practical learning plan.', 'Explain a goal, the action it requires and the support needed.', 'Recall sentence brackets, separable verbs and weil-clauses.'],
  ['Relationships, requests and boundaries', [2,4], ['neighbours','insurance'], ['Make polite or hypothetical proposals.', 'Identify people and things precisely using relative clauses.'], 'Use a polite falling tone and a short pause around a relative clause.', 'Könntest du der Person helfen, die neu eingezogen ist?', 'Understand a proposal, a reason and a limit.', 'Read how a voluntary support arrangement works.', 'Write an invitation with an alternative.', 'Negotiate a favour and respond respectfully to a limit.', 'Reach an agreement without ignoring the other person’s constraint.', 'Recall dative and accusative before choosing relative pronouns.'],
  ['Digital life and reasoned opinions', [13,14], ['tv','office'], ['Connect causes, consequences and alternatives.', 'Give an opinion with evidence and respond to a counterargument.'], 'Stress the contrasted words in sowohl ... als auch and weder ... noch.', 'Die App ist sowohl praktisch als auch leicht zu bedienen.', 'Understand a speaker’s benefit, limitation and conclusion.', 'Separate a recommendation from an unsupported claim.', 'Write a balanced forum contribution.', 'Discuss a digital habit and negotiate a shared rule.', 'Give a reason and example, respond to another view and state a conclusion.', 'Recall weil, dass and deshalb; identify what each connector does.'],
  ['Future plans and realistic priorities', [9,15], ['environment','paperwork'], ['Acknowledge a problem while explaining a different outcome.', 'Distinguish a plan, a prediction and an uncertain possibility.'], 'Stress contrast after trotzdem and certainty words such as vielleicht.', 'Obwohl das Geld knapp ist, planen wir weiter. Vielleicht klappt es.', 'Identify a firm proposal and an unresolved condition.', 'Read a project description without turning intentions into promises.', 'Write a proposal with priorities and a limitation.', 'Compare future projects and agree on a next step.', 'Explain a realistic plan and state what still needs checking.', 'Contrast subordinate obwohl with main-clause trotzdem; recall werden + infinitive.'],
  ['Community, places and participation', [8,16], ['neighbours','paperwork','eating'], ['Describe people, places and roles with adjective phrases.', 'Explain abilities, interests and support needs in a community role.'], 'Give compound nouns a clear main stress and keep endings audible.', 'Eine erfahrene Person hilft mir. Ich traue mir diese Aufgabe zu.', 'Understand a proposed role and the support requested.', 'Read role requirements and a training process.', 'Write a volunteer enquiry with availability and questions.', 'Describe a role and handle an unanswered question honestly.', 'Choose a suitable role and explain responsibilities and boundaries.', 'Recall article/case patterns and reflexive pronouns before adding longer noun phrases.'],
  ['Travel, formal messages and joint planning', [17,18], ['journeys','shopping','insurance'], ['Write a clear formal enquiry or service complaint.', 'Negotiate a plan, present an idea and answer a follow-up question.'], 'Use pauses to mark stages of a presentation instead of reading a full script.', 'Zuerst erkläre ich den Plan. Danach vergleichen wir die Möglichkeiten.', 'Follow a decision and recognise what must happen before booking.', 'Read a practical plan with a condition and a response deadline.', 'Write a formal request covering every required point.', 'Plan together, give a short talk and respond to a question.', 'Complete a new integrated communication task with independent feedback.', 'Recall polite requests, indirect questions, reasons and alternatives.'],
];

const lessonGoals = {
  a2: {
    1: ['Explain permission, obligation and choice.', 'Respond to a practical request using a modal verb.'],
    2: ['Describe completed activities with haben.', 'Keep the auxiliary and participle in the correct positions.'],
    3: ['Describe a journey using common sein verbs.', 'Choose haben or sein for familiar past events.'],
    4: ['Identify a recipient or a person being helped.', 'Use dative articles and pronouns in everyday phrases.'],
    5: ['Describe where an object is.', 'Explain where someone is putting an object.'],
    6: ['Give a reason with weil and report an idea with dass.', 'Describe a condition using wenn.'],
    7: ['Describe a habit or feeling using a reflexive verb.', 'Ask a partner about a routine.'],
    8: ['Compare two practical options.', 'Explain a preference using a comparative or superlative.'],
  },
  b1: {
    1: ['Recognise common Präteritum forms in a narrative.', 'Describe the background to a past event.'],
    2: ['Make a polite request or suggestion.', 'Discuss an imagined situation using hätte, wäre or würde.'],
    3: ['Explain a process using the passive.', 'Distinguish the action from the person performing it.'],
    4: ['Add identifying information with a relative clause.', 'Choose a relative pronoun by its role inside the clause.'],
    5: ['Use a verb with its required preposition.', 'Ask about and refer back to a topic using wo(r)- and da(r)-.'],
    6: ['Distinguish a one-time past event from repeated occasions.', 'Explain earlier events using nachdem and the appropriate past forms.'],
    7: ['Describe a plan with a zu-infinitive.', 'Keep separable prefixes and zu in the correct positions.'],
    8: ['Describe a person or object with an adjective phrase.', 'Use article and case information to choose an ending.'],
    9: ['Express a contrast with obwohl or trotzdem.', 'Choose main-clause or subordinate-clause word order.'],
    10: ['Ask an indirect W-question politely.', 'Use ob to ask whether something is true.'],
    11: ['Recognise common genitive noun phrases.', 'Understand a reason expressed with wegen.'],
    12: ['Explain a purpose with um ... zu.', 'Use damit when the two actions have different subjects.'],
    13: ['Connect an event to its result.', 'Express two features or alternatives using paired connectors.'],
    14: ['Support an opinion with a reason and example.', 'Respond constructively to another point of view.'],
    15: ['Describe a future plan naturally.', 'Make uncertainty explicit in a prediction.'],
    16: ['Explain an interest, ability and support need.', 'Use common accusative and dative reflexive patterns.'],
    17: ['Write a formal enquiry with a clear request.', 'Explain a service problem and propose a next step.'],
    18: ['Negotiate a plan and confirm responsibilities.', 'Give a structured short presentation and answer a question.'],
  },
};

function makeCourse(id, units, workshops, extraLessons, meta) {
  const base = read(`${id}.json`);
  const all = [...base.lessons, ...extraLessons];
  const modules = units.map((row, index) => {
    const [title, lessonIds, topics, goals, pronunciation, drill, listening, reading, writing, speaking, checkpoint, retry] = row;
    return { id: index + 1, title, lessonIds, topics, goals, pronunciation, listening, reading, writing, speaking, checkpoint,
      hours: meta.coreHours / units.length, workshop: workshops[index],
      pronunciationDrills: [{ label: 'Phrase rhythm', text: drill, instruction: 'Listen, pause, repeat, then say a new sentence with the same pattern.' }],
      transfer: { lessonIds: index ? units[index - 1][1] : [], task: `${checkpoint} Change the situation and details from the workshop, and close the model before starting.`, checklist: ['I completed the task with new details.', 'I reused language from an earlier module.', 'I corrected one issue after feedback.'], retry },
    };
  });
  return {
    id, version: 1, updated: '2026-10-25', ...meta, lessonOrder: modules.flatMap(m => m.lessonIds), modules,
    lessons: extraLessons, topics: [],
    support: Object.fromEntries(modules.flatMap(m => m.lessonIds.map(lessonId => {
      const l = all.find(item => item.id === lessonId);
      return [lessonId, { module: m.id, outcomes: lessonGoals[id][lessonId], pronunciation: m.pronunciation,
        pronunciationDrills: [{ label: 'Say it in context', text: l.examples[0].de, instruction: 'Repeat the phrase, then change one detail while keeping the grammar pattern.' }],
        speaking: [{ task: m.workshop.speaking.task, modelAnswer: m.workshop.speaking.modelAnswer,
          checklist: ['I used this lesson’s language in a new sentence.', 'I asked a relevant question and responded to my partner.', 'My partner understood my intended meaning.'] }],
      }];
    }))),
    skillStrategies, reviewRoutine,
    dailyPlan: [
      { minutes: 10, title: 'Retrieve earlier language', description: 'Review due vocabulary and recall three phrases from an earlier module.' },
      { minutes: 15, title: 'Learn and apply', description: 'Study one small grammar section and use it in your own examples.' },
      { minutes: 15, title: 'Listen and read', description: 'Identify the main idea, find evidence for details, then check the transcript or explanation.' },
      { minutes: 10, title: 'Speak and respond', description: 'Use a role task with changed details, ask a follow-up question and practise clarification.' },
      { minutes: 10, title: 'Write and revise', description: 'Cover the requested points, compare with a model, seek feedback and rewrite one weak sentence.' },
    ],
    vocabulary: { recognitionGoal: 'Recognise the vocabulary in unfamiliar short texts and recordings, not only on a flashcard.', productionGoal: 'Use useful phrases in a new spoken or written task. Word counts alone do not establish a CEFR level.', method: ['Learn nouns with article, plural and a short phrase.', 'Learn verbs with their preposition, case pattern and a useful past form.', 'Retrieve before revealing a model; revisit errors on later study days.', 'Connect the current topic to an earlier one and practise in both directions.'] },
    readiness: ['I can complete a new practical task without copying a model.', 'I can identify the main idea and support detail answers with evidence.', 'I can write a coherent message that covers all requested points.', 'I can ask a follow-up question, respond and clarify a misunderstanding.', 'I have practised with unfamiliar recordings and received feedback on writing and speaking.'],
    assessmentNote: 'The lesson and checkpoint scores measure supported objective practice. Writing and speaking need separate feedback. This learning path and the short in-app assessment do not certify a CEFR level or replace a full official practice paper.',
  };
}

save('a2-course.json', makeCourse('a2', a2Units, a2Workshops, [], {
  title: 'A2 foundation path', eyebrow: 'German A2 · Build on everyday German',
  introduction: 'Connect the grammar you know to everyday tasks: describing experiences, solving small problems, explaining choices and arranging plans. Work through four modules with listening, reading, writing and speaking practice.',
  scopeNote: 'This is an eight-lesson A2 foundation path. It is not yet a complete A2 syllabus.',
  entryReview: 'Before starting, check that you can introduce a fictional person, ask simple questions, arrange a time and write a short three-point message. Revisit the relevant A1 lesson if you need support.',
  weeks: 8, coreHours: 48, reviewHours: 16,
  sources: [{ title: 'Goethe A2 official practice materials', url: 'https://www.goethe.de/ins/de/en/prf/gzsd2/ueb.html' }],
}));
save('b1-course.json', makeCourse('b1', b1Units, b1Workshops, b1Lessons, {
  title: 'B1 communication path', eyebrow: 'German B1 · Explain, discuss and act',
  introduction: 'Build longer, clearer communication around stories, media, work, relationships, community life and travel. Connect grammar to practical decisions, written messages and conversations that require a response.',
  scopeNote: 'This expanded path develops B1 communication. Use additional unfamiliar texts, natural recordings and independent feedback alongside it; completing these lessons alone does not establish full B1 coverage.',
  entryReview: 'Before starting, practise a short account in the Perfekt, a reason with weil, a comparison and a polite request for help. Revisit the A2 foundation modules wherever these are still difficult.',
  weeks: 16, coreHours: 90, reviewHours: 18,
  sources: [{ title: 'Goethe B1 official model papers and recordings', url: 'https://www.goethe.de/ins/de/en/prf/gzb1/ueb.html' }],
}));
const levels = read('levels.json');
Object.assign(levels.find(l => l.id === 'a2'), { courseFile: 'a2-course.json', summary: 'An eight-lesson foundation path with four practical checkpoints: past experiences, housing, help, habits and choices.' });
Object.assign(levels.find(l => l.id === 'b1'), { courseFile: 'b1-course.json', summary: 'An 18-lesson communication path with nine checkpoints: stories, media, work, opinions, community life and travel.' });
save('levels.json', levels);
console.log('Updated A1 learning support and generated the A2 and B1 learning paths.');
