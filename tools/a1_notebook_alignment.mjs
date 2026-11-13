// Apply the A1 notebook's topic order and add independently written notebook-style
// grammar / sentence drills without importing its personal examples or answers.
const notebookTasks = {
  1: { type: 'fill', question: 'Complete the introduction: Ich ___ aus Spanien. (kommen)', answers: ['komme'], hint: 'Conjugate kommen for ich.' },
  2: { type: 'fill', question: 'Complete the sentence: Meine Freunde ___ heute Deutsch. (lernen)', answers: ['lernen'], hint: 'Freunde is plural.' },
  3: { type: 'choice', question: 'Choose the correct article and noun: ___ Bücher (plural)', options: ['der', 'die', 'das'], answer: 1, hint: 'German plural nouns use die.' },
  4: { type: 'order', question: 'Put the time-first sentence in order.', words: ['heute', 'Deutsch', 'Ich', 'lerne'], answers: ['Heute lerne ich Deutsch'], hint: 'When a time phrase comes first, the verb stays in position two.' },
  5: { type: 'fill', question: 'Complete the object: Ich kaufe ___ Apfel. (a)', answers: ['einen'], hint: 'Apfel is masculine and the direct object.' },
  6: { type: 'fill', question: 'Complete the negation: Ich habe ___ Zeit. (no)', answers: ['keine'], hint: 'Negate the noun Zeit with kein; Zeit is feminine.' },
  7: { type: 'order', question: 'Put the appointment sentence in order.', words: ['beginnt', 'Der', 'um', 'Kurs', 'neun', 'Uhr'], answers: ['Der Kurs beginnt um neun Uhr'], hint: 'Keep the conjugated verb in position two.' },
  8: { type: 'fill', question: 'Complete the separable verb: Ich ___ um sieben Uhr ___. (aufstehen)', answers: ['stehe auf'], hint: 'Conjugate the first part; place auf at the end.' },
  9: { type: 'choice', question: 'Which pair shows the long /i:/ sound in German spelling?', options: ['ie, as in sieben', 'ei, as in mein', 'eu, as in heute'], answer: 0, hint: 'ie commonly represents a long ee sound.' },
  10: { type: 'fill', question: 'Write 24 in German.', answers: ['vierundzwanzig'], hint: 'Say the units before the tens.' },
  11: { type: 'fill', question: 'Complete the origin phrase: Ich komme ___ Italien.', answers: ['aus'], hint: 'Use aus with this country name.' },
  12: { type: 'fill', question: 'Complete the possessive: Das ist ___ Bruder. (my)', answers: ['mein'], hint: 'Bruder is masculine; here it is the subject complement.' },
  13: { type: 'fill', question: 'Complete the irregular verb: Du ___ gern Tee. (trinken)', answers: ['trinkst'], hint: 'The du ending is -st.' },
  14: { type: 'order', question: 'Put the routine sentence in order.', words: ['jeden', 'Ich', 'morgen', 'frühstücke'], answers: ['Ich frühstücke jeden Morgen'], hint: 'Use a capital for the first word; the verb stays second.' },
  15: { type: 'fill', question: 'Complete the order: Ich hätte gern ___ Suppe. (a)', answers: ['eine'], hint: 'Suppe is feminine.' },
  16: { type: 'fill', question: 'Add the correct adjective ending: Ich suche einen ___ Mantel. (warm)', answers: ['warmen'], hint: 'After einen, a masculine accusative adjective takes -en.' },
  17: { type: 'fill', question: 'Complete the modal sentence: Wir müssen heute ___ (arbeiten).', answers: ['arbeiten'], hint: 'The infinitive goes at the end.' },
  18: { type: 'fill', question: 'Replace the object with a pronoun: Ich sehe den Bus. Ich sehe ___.', answers: ['ihn'], hint: 'Bus is masculine; use the accusative pronoun.' },
  19: { type: 'fill', question: 'Complete the location: Das Buch liegt auf ___ Tisch.', answers: ['dem'], hint: 'Wo? describes a location and takes dative here.' },
  20: { type: 'fill', question: 'Complete the destination: Ich stelle die Lampe auf ___ Tisch.', answers: ['den'], hint: 'Wohin? describes movement to a place; Tisch is masculine.' },
  21: { type: 'order', question: 'Connect the ideas with aber.', words: ['Zeit', 'habe', 'ich', 'aber', 'Heute', 'arbeite', 'ich'], answers: ['Heute arbeite ich, aber ich habe Zeit'], hint: 'The verb remains in position two in both clauses.' },
  22: { type: 'fill', question: 'Complete the dative phrase: Kannst du ___ bitte helfen? (to me)', answers: ['mir'], hint: 'helfen takes a dative person.' },
  23: { type: 'fill', question: 'Complete the past sentence: Gestern ___ ich nach Bonn gefahren. (sein)', answers: ['bin'], hint: 'A journey takes sein in the Perfekt.' },
  24: { type: 'fill', question: 'Complete the weather phrase: Im Herbst ___ es oft. (regnen)', answers: ['regnet'], hint: 'Use the third-person singular form with es.' },
  25: { type: 'fill', question: 'Complete the preference: Ich ___ gern Musik. (listen to)', answers: ['höre'], hint: 'Conjugate hören for ich.' },
  26: { type: 'fill', question: 'Complete the Perfekt sentence: Wir haben gestern ___ (lernen).', answers: ['gelernt'], hint: 'Regular participles commonly end in -t.' },
  27: { type: 'fill', question: 'Complete the Perfekt sentence: Sie ist spät ___. (kommen)', answers: ['gekommen'], hint: 'kommen forms its participle with ge- and -en.' },
  28: { type: 'fill', question: 'Complete the past description: Letzte Woche ___ ich krank. (sein)', answers: ['war'], hint: 'Use war for ich in the simple past.' },
  29: { type: 'choice', question: 'A sign says: Eintritt frei. What does it tell you?', options: ['Entry is free', 'The entrance is closed', 'Tickets are only online'], answer: 0, englishOptions: true, hint: 'frei means free of charge here.' },
  30: { type: 'choice', question: 'A timetable notice says: Der Zug fährt nicht um acht, sondern um neun Uhr. When does it leave?', options: ['At eight', 'At nine', 'At ten'], answer: 1, englishOptions: true, hint: 'Read for the correction after sondern.' },
  31: { type: 'order', question: 'Put the short message opening in order.', words: ['Guten', 'Frau', 'Tag,', 'Klein,'], answers: ['Guten Tag, Frau Klein'], hint: 'Use a suitable formal greeting and the recipient’s name.' },
  32: { type: 'order', question: 'Put the polite request in order.', words: ['Sie', 'mir', 'Können', 'bitte', 'helfen'], answers: ['Können Sie mir bitte helfen'], hint: 'Start the yes/no question with the conjugated verb.' },
};

const notebookModules = [1, 2, 3, 4, 7, 8, 5, 6, 10, 9, 11, 13, 14, 12, 15, 16];

export function alignA1Notebook(course, original) {
  const moduleById = new Map(course.modules.map((item) => [item.id, item]));
  course.modules = notebookModules.map((id) => moduleById.get(id));
  course.lessonOrder = course.modules.flatMap((item) => item.lessonIds);
  course.updated = '2026-11-12';

  const lessons = new Map([...original.lessons, ...course.lessons].map((item) => [item.id, item]));
  course.modules.forEach((item, index) => item.lessonIds.forEach((id) => {
    const lesson = lessons.get(id);
    if (lesson) lesson.module = index + 1;
    if (course.support[id]) course.support[id].module = index + 1;
  }));
  for (const [idText, task] of Object.entries(notebookTasks)) {
    const lesson = lessons.get(Number(idText));
    if (!lesson) throw new Error(`A1 notebook alignment references missing lesson ${idText}`);
    if (!lesson.tasks.some((item) => item.notebookPractice)) {
      lesson.tasks.push({ ...task, notebookPractice: true });
    }
  }

  // The notebook introduces contrastive location and direction phrases.
  const prepositions = lessons.get(19);
  prepositions.tables = [{
    title: 'Two-way prepositions: location or destination?',
    head: ['Question', 'Case', 'Example'],
    rows: [
      ['Wo? (where?)', 'Dative: position', 'Das Buch liegt auf dem Tisch.'],
      ['Wohin? (where to?)', 'Accusative: destination', 'Ich lege das Buch auf den Tisch.'],
      ['Wo? (where?)', 'Dative: position', 'Die Tasche ist in der Küche.'],
      ['Wohin? (where to?)', 'Accusative: destination', 'Ich stelle die Tasche in die Küche.'],
    ],
  }, {
    title: 'Prepositions that take a fixed case',
    head: ['Accusative', 'Dative'],
    rows: [
      ['durch den Park', 'aus dem Haus'],
      ['für den Kurs', 'bei einer Freundin'],
      ['gegen die Wand', 'mit dem Bus'],
      ['ohne einen Termin', 'nach der Arbeit'],
      ['um den Tisch', 'seit einem Monat'],
      ['', 'von der Schule / zum Arzt'],
    ],
  }];
  prepositions.rules = [
    'Learn fixed preposition phrases with their case: mit dem Bus, zu der Schule → zur Schule.',
    'With an, auf, hinter, in, neben, über, unter, vor and zwischen, Wo? describes a position (dative); Wohin? describes a destination (accusative).',
    'A change of place is not required for accusative: ask whether the phrase answers Wo? or Wohin? and learn the common verbs liegen/stehen versus legen/stellen.',
    'nach is used with many city and country names without articles: nach Bonn, nach Spanien.',
    'Ask for directions with Wie komme ich …? and confirm a detail if needed.',
  ];

  // Make the notebook's clothing drills teach a useful, bounded adjective pattern.
  const shopping = lessons.get(16);
  shopping.tables = [{
    title: 'Adjective endings for a simple clothing description',
    head: ['Noun phrase', 'Example'],
    rows: [
      ['der + masculine nominative', 'der warme Mantel'],
      ['die + feminine nominative', 'die warme Jacke'],
      ['das + neuter nominative', 'das warme Hemd'],
      ['einen + masculine accusative', 'einen warmen Mantel'],
      ['eine / ein + feminine / neuter accusative', 'eine warme Jacke / ein warmes Hemd'],
    ],
  }];
  shopping.rules = [
    'Ask a shop assistant about size, colour, price and payment.',
    'After a definite article in the nominative, use -e for these common forms: der warme Mantel, die warme Jacke, das warme Hemd.',
    'In the masculine accusative after einen, use -en: Ich suche einen warmen Mantel. Feminine eine warme Jacke; neuter ein warmes Hemd.',
    'Predicate colours stay unchanged: Die Jacke ist blau.',
    'Use dieser/diese/dieses to point to a known item and answer politely when a size is unavailable.',
  ];
  const addVocab = (lesson, rows) => {
    const known = new Set(lesson.vocab.map((item) => item.de.toLowerCase()));
    rows.forEach((item) => { if (!known.has(item.de.toLowerCase())) lesson.vocab.push(item); });
  };
  addVocab(shopping, [
    { de: 'rot', en: 'red' }, { de: 'blau', en: 'blue' }, { de: 'grün', en: 'green' },
    { de: 'schwarz', en: 'black' }, { de: 'weiß', en: 'white' }, { de: 'warm', en: 'warm' },
  ]);

  const requests = lessons.get(18);
  requests.tables = [{
    title: 'Object pronouns: accusative and dative',
    head: ['Subject', 'Accusative (who/what?)', 'Dative (to/for whom?)'],
    rows: [
      ['ich', 'mich', 'mir'], ['du', 'dich', 'dir'], ['er', 'ihn', 'ihm'],
      ['sie (singular)', 'sie', 'ihr'], ['es', 'es', 'ihm'], ['wir', 'uns', 'uns'],
      ['ihr', 'euch', 'euch'], ['Sie', 'Sie', 'Ihnen'],
      ['sie (plural)', 'sie', 'ihnen'],
    ],
  }];
  requests.rules = [
    'Use the imperative for instructions: Öffnen Sie bitte das Fenster; Mach bitte die Tür zu; Kommt bitte herein.',
    'Formal instructions use the infinitive stem + Sie. Learn common informal forms as chunks: komm, nimm, gib.',
    'A separable prefix stays at the end: Mach die Tür bitte zu.',
    'An accusative pronoun replaces the direct object: Ich sehe den Bus → Ich sehe ihn.',
    'A dative pronoun marks the person receiving help or an item: Hilfst du mir? Gibst du mir den Schlüssel?',
  ];

  const home = lessons.get(20);
  home.examples = [
    { de: 'Der Schlüssel liegt auf dem Tisch.', en: 'The key is lying on the table.' },
    { de: 'Ich lege den Schlüssel auf den Tisch.', en: 'I put the key onto the table.' },
    { de: 'Die Lampe steht neben dem Bett.', en: 'The lamp is next to the bed.' },
    { de: 'Ich stelle die Lampe neben das Bett.', en: 'I put the lamp next to the bed.' },
  ];
  home.rules = [
    'es gibt takes an accusative object: Es gibt einen Tisch.',
    'Use Wo? + dative to say where something is: Der Schlüssel liegt auf dem Tisch.',
    'Use Wohin? + accusative to say where something is being put: Ich lege den Schlüssel auf den Tisch.',
    'zu Hause describes being at home; nach Hause describes going home.',
    'Predicate adjectives stay unchanged: Das Zimmer ist klein.',
  ];

  addVocab(lessons.get(24), [
    { de: 'der Frühling', en: 'spring' }, { de: 'der Sommer', en: 'summer' },
    { de: 'der Herbst', en: 'autumn' }, { de: 'der Winter', en: 'winter' },
    { de: 'die Jacke', en: 'jacket', pl: 'Jacken' }, { de: 'der Mantel', en: 'coat', pl: 'Mäntel' },
    { de: 'das Hemd', en: 'shirt', pl: 'Hemden' }, { de: 'die Schuhe', en: 'shoes' },
  ]);

  course.title = 'A1 German: a notebook-aligned learning path';
}
