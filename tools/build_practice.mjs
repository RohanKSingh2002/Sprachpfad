// Independently authored practice. Private reference books informed task formats only.
import { writeFile } from 'node:fs/promises';
import { upperLevels } from './practice_upper_levels.mjs';
const bank = { version: 1, levels: {} };
const f = (prompt, answers, explanation, hint = '') => ({ type: 'fill', prompt, answers: Array.isArray(answers) ? answers : [answers], explanation, hint });
const c = (prompt, options, answer, explanation) => ({ type: 'choice', prompt, options, answer, explanation });
const o = (prompt, chunks, answer, explanation) => ({ type: 'order', prompt, tokens: chunks.split('|'), answers: [answer], explanation });
const m = (prompt, pairs, explanation) => ({ type: 'match', prompt, pairs: pairs.map(([left, right]) => ({ left, right })), explanation });
const w = (prompt, checklist, model, target) => ({ type: 'write', prompt, checklist, model, target, explanation: 'This is one possible response. Use the checklist to review your own meaning and language; different correct responses are possible.' });
const set = (id, title, skill, focus, description, items, extra = {}) => ({ id, title, skill, focus, description, items, minutes: skill === 'writing' ? '15–20' : '6–10', ...extra });

bank.levels.a1 = [
  set('a1-start', 'A first day at the workshop', 'grammar', 'Present tense · sein · haben', 'Complete a connected text about a new ceramics class.', [
    f('1. Ich ___ Nora. (heißen)', 'heiße', 'With ich, heißen becomes heiße. You can also type heisse.', 'Use the ich form.'),
    f('2. Ich ___ heute im Keramikkurs. (sein)', 'bin', 'The present form of sein with ich is bin.'),
    f('3. Unser Lehrer ___ aus Bremen. (kommen)', 'kommt', 'Unser Lehrer is singular: er kommt.'),
    f('4. Wir ___ kleine Tassen. (machen)', 'machen', 'Wir takes the infinitive-shaped form machen.'),
    f('5. Meine Nachbarin ___ eine Frage. (haben)', 'hat', 'With a singular person, haben becomes hat.'),
    f('6. Du ___ sehr sorgfältig. (arbeiten)', 'arbeitest', 'Arbeiten adds -est with du because the stem ends in -t.')
  ], { passageTitle: 'Im Keramikkurs', passage: 'Ich (1) ___ Nora. Ich (2) ___ heute im Keramikkurs. Unser Lehrer (3) ___ aus Bremen. Wir (4) ___ kleine Tassen. Meine Nachbarin (5) ___ eine Frage. Du (6) ___ sehr sorgfältig.', instruction: 'Ergänzen Sie die Verben. Complete each numbered gap using the verb in brackets.' }),
  set('a1-bag', 'What is in the bag?', 'grammar', 'Articles · accusative · negation', 'Choose or supply the article that fits the meaning and case.', [
    f('Ich kaufe ___ Apfel. (ein; der Apfel)', 'einen', 'The masculine direct object takes einen.'),
    f('Hier ist ___ Flasche Wasser. (ein; die Flasche)', 'eine', 'Eine Flasche is feminine singular.'),
    f('Wir brauchen ___ Brot. (ein; das Brot)', 'ein', 'Neuter ein does not change in the accusative.'),
    f('Ich habe ___ Schlüssel. (kein; der Schlüssel, singular)', 'keinen', 'The masculine accusative of kein is keinen.'),
    c('Choose the sentence meaning “The tea is not hot.”', ['Der Tee ist kein heiß.', 'Der Tee ist nicht heiß.', 'Der Tee nicht ist heiß.'], 1, 'Nicht negates the adjective heiß. Kein is used with nouns.'),
    f('Das sind ___ Bücher. (kein; plural)', 'keine', 'The plural form here is keine: keine Bücher.')
  ]),
  set('a1-time', 'A day with a plan', 'grammar', 'Time · separable verbs · modal verbs', 'Practise the small words that organise a day.', [
    f('Der Kurs beginnt ___ Montag. (on)', 'am', 'Days take am: am Montag.'),
    f('Wir treffen uns ___ 17 Uhr. (at)', 'um', 'An exact clock time takes um.'),
    f('Ich stehe jeden Tag um sieben Uhr ___. (aufstehen)', 'auf', 'In a main clause, the separable prefix moves to the end.'),
    f('Du ___ hier leise sprechen. (müssen)', 'musst', 'Du musst is the present form. Sprechen stays in the infinitive.'),
    f('Mila ___ gut schwimmen. (können)', 'kann', 'Mila is third-person singular: sie kann.'),
    c('Which question asks WHEN the shop closes?', ['Wo schließt der Laden?', 'Wann schließt der Laden?', 'Wie viel schließt der Laden?'], 1, 'Wann asks about time; wo asks about place.')
  ]),
  set('a1-order', 'Put the sentence together', 'grammar', 'Verb position · questions · sentence brackets', 'Tap the chunks in order. The requested opening makes the answer clear.', [
    o('Emil visits his sister today. Start with Heute.', 'Heute|besucht|Emil|seine Schwester.', 'Heute besucht Emil seine Schwester.', 'Heute occupies position one; besucht is the second element. Emil is the person doing the visiting.'),
    o('Make a yes/no question. Start with Kommst.', 'Kommst|du|morgen|mit?', 'Kommst du morgen mit?', 'In a yes/no question the conjugated verb comes first; mit closes the sentence.'),
    o('Start with Wir.', 'Wir|möchten|am Samstag|wandern.', 'Wir möchten am Samstag wandern.', 'The modal verb möchten is conjugated; wandern goes at the end.'),
    o('Ask where the bus stops. Start with Wo.', 'Wo|hält|der Bus?', 'Wo hält der Bus?', 'The question word comes first, followed by the conjugated verb.')
  ]),
  set('a1-phrases', 'Words that belong together', 'vocabulary', 'Everyday combinations · question words', 'Match useful German phrases instead of memorising isolated translations.', [
    m('Match each beginning with its natural ending. Use each ending once.', [['eine Fahrkarte', 'kaufen'], ['einen Film', 'ansehen'], ['eine E-Mail', 'schreiben'], ['das Fenster', 'öffnen'], ['den Tisch', 'decken']], 'These combinations mean buy a ticket, watch a film, write an email, open the window and set the table.'),
    m('Match each question with the answer that gives the requested information.', [['Wo wohnen Sie?', 'In Erfurt.'], ['Wann beginnt der Film?', 'Um acht Uhr.'], ['Wie heißen Sie?', 'Tarek Sommer.'], ['Wie viel kostet das Heft?', 'Zwei Euro.'], ['Woher kommen Sie?', 'Aus Tunesien.']], 'Wo asks for a place, wann for time, wie heißen for a name, wie viel for a price and woher for origin.')
  ]),
  set('a1-dialogue', 'What would you say?', 'vocabulary', 'Requests · greetings · everyday replies', 'Choose the reply that fits the situation and the person.', [
    c('At a bakery: „Was möchten Sie?“', ['Zwei Brötchen, bitte.', 'Ich bin zwei Jahre alt.', 'Am Dienstag.'], 0, 'Name the item and quantity when ordering.'),
    c('You did not understand a stranger. Ask politely.', ['Wie alt bist du?', 'Können Sie das bitte wiederholen?', 'Ich wiederhole morgen.'], 1, 'Können Sie … bitte …? is a polite request using Sie.'),
    c('A friend asks: „Hast du am Freitag Zeit?“ You are free.', ['Ja, das kostet zehn Euro.', 'Nein, ich heiße nicht Freitag.', 'Ja, am Nachmittag.'], 2, 'A time answers the invitation question directly.'),
    c('You want to pay in a café. What do you say?', ['Die Rechnung, bitte.', 'Guten Morgen, morgen.', 'Ich suche die Haltestelle.'], 0, 'Die Rechnung, bitte asks for the bill.')
  ]),
  set('a1-message', 'Read a change of plan', 'reading', 'Short messages · exact details', 'Read the whole message, then check each statement against the text.', [
    c('Lea und Karim treffen sich am Sonntag.', ['Richtig', 'Falsch'], 0, 'The message begins with the plan for Sonntag.'),
    c('Lea wartet direkt vor dem Museum.', ['Richtig', 'Falsch'], 1, 'She will wait at the bookshop beside the museum, not directly outside the museum.'),
    c('Wann treffen sie sich?', ['Um 11 Uhr.', 'Um 12 Uhr.', 'Um 13 Uhr.'], 2, '13 Uhr is the new meeting time. 12 Uhr is when the bookshop opens.'),
    c('Was soll Karim mitbringen?', ['Ein Buch.', 'Zwei Eintrittskarten.', 'Eine Wasserflasche.'], 2, 'Lea asks Karim to bring water. She already has the tickets.')
  ], { passageTitle: 'Eine Nachricht von Lea', passage: 'Hallo Karim, unser Museumsbesuch am Sonntag klappt! Wir treffen uns um 13 Uhr am Buchladen neben dem Museum. Der Buchladen öffnet um 12 Uhr. Ich habe schon zwei Eintrittskarten. Bring bitte eine Wasserflasche mit. Danach können wir im Park sitzen. Bis Sonntag! Lea' }),
  set('a1-notices', 'Find the right place', 'reading', 'Notices · opening times · practical choices', 'Choose the notice that meets every detail of the request.', [
    c('Sie möchten am Samstag ein Fahrrad reparieren lassen.', ['A', 'B', 'C'], 0, 'A offers bicycle repairs on Saturdays from 9 to 13.'),
    c('Sie möchten am Sonntag Brot kaufen.', ['A', 'B', 'C'], 2, 'C is the bakery, open Sunday morning.'),
    c('Kann man bei B am Montag ein Paket abholen?', ['Ja', 'Nein'], 0, 'Monday is included in Montag–Freitag.'),
    c('Sie kommen am Samstag um 14 Uhr zu A. Ist geöffnet?', ['Ja', 'Nein'], 1, 'A closes at 13 Uhr on Saturdays.')
  ], { passageTitle: 'Drei Aushänge', passage: 'A · RADPUNKT\nReparaturen und Zubehör. Montag–Freitag 9–18 Uhr, Samstag 9–13 Uhr.\n\nB · PAKET-ECKE\nPakete abholen: Montag–Freitag 10–19 Uhr. Am Wochenende geschlossen.\n\nC · BÄCKEREI KORN\nFrisches Brot auch am Sonntag! Sonntag 7–11 Uhr. Montag Ruhetag.' }),
  set('a1-listening', 'A message from the sports centre', 'listening', 'Times · rooms · what to bring', 'Listen for the changed time and the practical details.', [
    c('Wann beginnt der Kurs heute?', ['Um 17 Uhr.', 'Um 17:30 Uhr.', 'Um 18:30 Uhr.'], 1, 'The speaker corrects the start from fünf to halb sechs: 17:30.'),
    c('In welchem Raum ist der Kurs?', ['Raum drei.', 'Raum vier.', 'Raum fünf.'], 0, 'The message specifies Raum drei.'),
    c('Was sollen die Teilnehmenden mitbringen?', ['Eine Tasse.', 'Ein Buch.', 'Ein Handtuch.'], 2, 'The requested item is ein Handtuch.'),
    c('Wo wartet die Lehrerin?', ['Vor dem Eingang.', 'Im Café.', 'An der Bushaltestelle.'], 0, 'She waits vor dem Eingang.')
  ], { passageTitle: 'Nachricht zum Sportkurs', audioText: 'Guten Tag! Hier ist das Sportzentrum. Ihr Kurs beginnt heute nicht um fünf Uhr, sondern um halb sechs. Wir treffen uns in Raum drei. Bringen Sie bitte ein Handtuch mit. Ihre Lehrerin wartet vor dem Eingang auf Sie. Bis später!', instruction: 'Hören Sie die Nachricht. Listen once for the situation, then again for the details. You can replay it or open the transcript for support.' }),
  set('a1-writing', 'Write a useful little message', 'writing', 'Invitations · appointments · self-review', 'Write your own message, compare a model, then revise against the checklist.', [
    w('Invite your friend Ben to a picnic on Saturday. Say where and when you will meet, ask him to bring fruit, and include a greeting and ending.', ['I greeted Ben and ended the message.', 'I included Saturday, a place and a time.', 'I asked Ben to bring fruit.', 'I checked the verb positions and capital letters for nouns.'], 'Hallo Ben, hast du am Samstag Zeit? Wir machen ein Picknick im Stadtpark. Wir treffen uns um 14 Uhr am Eingang. Kannst du bitte Obst mitbringen? Ich bringe Wasser und Brot mit. Liebe Grüße, Mia', [30, 45]),
    w('Write to your German teacher, Frau Adler. You cannot attend class tomorrow. Give a reason and ask for the homework. Use a polite greeting and ending.', ['I used a polite greeting and ending.', 'I said I cannot attend tomorrow.', 'I gave a reason.', 'I asked for the homework.'], 'Guten Tag Frau Adler, ich kann morgen leider nicht zum Deutschkurs kommen. Ich habe einen Arzttermin. Können Sie mir bitte die Hausaufgaben schicken? Vielen Dank für Ihre Hilfe. Mit freundlichen Grüßen, Sami', [30, 45])
  ])
];

Object.assign(bank.levels, upperLevels({ f, c, o, m, w, set }));

await writeFile(new URL('../data/practice.json', import.meta.url), JSON.stringify(bank, null, 2) + '\n');
console.log(Object.fromEntries(Object.entries(bank.levels).map(([level, sets]) => [level, { sets: sets.length, tasks: sets.reduce((n, s) => n + s.items.length, 0) }])));
