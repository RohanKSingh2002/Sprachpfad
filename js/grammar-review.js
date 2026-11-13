// Each topic selects objective exercises from the named lessons. Indices refer to lesson.tasks.
const topics = {
  a1: [
    ['present', 'Present tense and verb endings', 'The ending of a regular present-tense verb depends on the subject: ich lerne, du lernst, wir lernen. Some verbs also change their stem.', [[2, 0, 1, 2, 3, 4, 5], [13, 0]]],
    ['articles', 'Articles and plurals', 'Learn each noun with its article and plural. In the nominative, the definite plural article is die. There is no plural of ein.', [[3, 0, 1, 2, 3, 4, 5, 6]]],
    ['possession', 'Possessive words', 'The ending of a possessive word follows the noun it describes: mein Bruder, meine Mutter, unsere Tochter.', [[12, 0, 1, 2]]],
    ['accusative', 'Accusative objects', 'For a masculine direct object, der becomes den and ein becomes einen. The feminine and neuter articles keep the same form.', [[5, 0, 1, 2, 4, 6], [15, 0, 6]]],
    ['negation', 'Negation with nicht and kein', 'Use kein to negate a noun with ein or no article. Use nicht to negate an adjective, an action or another part of the sentence.', [[6, 0, 1, 2, 3, 4, 5]]],
    ['word-order', 'Word order and questions', 'In a statement the finite verb comes second, even after a time phrase. It comes first in a yes/no question.', [[4, 0, 1, 2, 3, 4], [13, 2]]],
    ['time', 'Time expressions with um and am', 'Use um for a clock time and am for a weekday. A time expression can come first, followed by the verb.', [[7, 3, 4, 6], [14, 0, 2, 6]]],
    ['separable', 'Separable verbs', 'In a main clause the conjugated verb goes in its usual place and the separable prefix goes at the end: Ich stehe um sieben Uhr auf.', [[8, 0, 1, 2, 3, 4, 6]]],
    ['place', 'Location and destination', 'With two-way prepositions, use the dative for where something is and the accusative for its destination: auf dem Tisch, auf den Tisch.', [[19, 0, 6], [20, 1, 2, 6]]],
    ['modals', 'Modal verbs and the infinitive', 'Conjugate the modal verb and put the main verb in the infinitive at the end: Wir müssen heute arbeiten.', [[17, 0, 1, 2, 6]]],
    ['past', 'Talking about the past', 'Use war and hatte for past descriptions. Form the Perfekt with haben or sein and a participle. Many verbs of movement use sein.', [[28, 0, 2, 6], [26, 0, 1, 2], [27, 0, 6]]],
  ],
  a2: [
    ['modals', 'Modal verbs and their meanings', 'The modal verb carries the person ending and the main verb goes last. Nicht müssen means there is no obligation. Nicht dürfen means something is prohibited.', [[1, 0, 1, 2, 3, 4]]],
    ['perfect', 'Perfekt with haben or sein', 'Most verbs use haben. Many verbs of movement or change of state use sein. The participle comes last in a main clause.', [[2, 0, 1, 2, 3, 4], [3, 0, 1, 2, 3]]],
    ['dative', 'Dative articles and pronouns', 'Use the dative after prepositions such as mit, bei and zu, and with verbs such as helfen and gefallen.', [[4, 0, 1, 2, 3, 4, 5]]],
    ['place', 'Two-way prepositions', 'With prepositions such as auf and in, ask wo? for location and wohin? for destination. Use the dative for location and the accusative for destination.', [[5, 0, 1, 2, 3, 4]]],
    ['subordinate', 'Subordinate clauses and indirect questions', 'After weil, dass and wenn, the finite verb goes last. Indirect questions follow the same order. Use ob for an indirect yes/no question.', [[6, 0, 1, 2, 3, 4], [11, 0, 1, 2]]],
    ['reflexive', 'Reflexive pronouns', 'The reflexive pronoun matches the subject. In Ich wasche mir die Hände, die Hände is the direct object and mir is dative.', [[7, 0, 1, 2, 3, 4, 5], [17, 0, 1, 2]]],
    ['comparison', 'Comparatives and superlatives', 'Use als for a difference and so … wie for equality. Some forms are irregular: gut, besser, am besten.', [[8, 0, 1, 2, 3, 4]]],
    ['past-time', 'Past forms and time clauses', 'Use als for a single past situation and wenn for repeated situations. Past modal verbs such as musste still take a final infinitive.', [[9, 0, 1, 2], [10, 0, 1, 2]]],
    ['adjectives', 'Adjective endings before nouns', 'An adjective before a noun takes an ending. The article, case and gender all matter. An adjective after sein has no ending.', [[13, 0, 1, 2], [14, 0, 1, 2]]],
    ['infinitive', 'Infinitives with zu', 'Verbs such as versuchen and vergessen can introduce an infinitive with zu. With a separable verb, zu goes between prefix and stem: anzurufen.', [[15, 0, 1, 2]]],
    ['verb-prepositions', 'Verbs with fixed prepositions', 'Learn the preposition with the verb: teilnehmen an, sich freuen auf. Use worauf for a thing and auf wen for a person.', [[16, 0, 1, 2]]],
  ],
  b1: [
    ['past', 'Simple past forms', 'Weak verbs usually form the Präteritum with -te. Strong verbs often change their stem: kommen becomes kam and gehen becomes ging.', [[1, 0, 1, 2, 3]]],
    ['time-clauses', 'Time clauses', 'Als marks a single past situation. Wenn can mark repeated events. Nachdem introduces the earlier event, often in the Plusquamperfekt when both events are past.', [[6, 0, 1, 2, 3, 4]]],
    ['verb-prepositions', 'Verbs and prepositional pronouns', 'Keep the preposition that belongs with the verb. Use wo(r)- to ask about a thing and da(r)- to refer back to it: worüber, darüber.', [[5, 0, 1, 2, 3, 4]]],
    ['indirect', 'Indirect questions', 'Keep the question word for an open question. For a yes/no question, use ob. Move the finite verb to the end in both cases.', [[10, 0, 1, 2]]],
    ['passive', 'Process passive with werden', 'Use werden plus the past participle to focus on what happens. With a modal verb, the passive infinitive is participle plus werden.', [[3, 0, 1, 2, 3, 4, 5]]],
    ['genitive', 'Genitive and formal prepositions', 'The genitive can express possession or a relationship. In formal writing it also follows prepositions such as wegen and trotz.', [[11, 0, 1, 2, 4]]],
    ['purpose', 'Infinitive clauses and purpose', 'Use um … zu when the subject is shared. Use damit with a full clause when the purpose has its own subject.', [[7, 0, 1, 2, 3, 4, 5], [12, 0, 1, 2, 4]]],
    ['subjunctive', 'Konjunktiv II', 'Use forms such as wäre, hätte or könnte for wishes, unreal situations and polite requests. Many other verbs use würde plus the infinitive.', [[2, 0, 1, 2, 3, 4]]],
    ['relative', 'Relative clauses', 'The noun determines the relative pronoun’s gender and number. The pronoun’s role inside the relative clause determines its case.', [[4, 0, 1, 2, 3, 4, 5]]],
    ['connectors', 'Concession, result and alternatives', 'Obwohl introduces a verb-final clause. Trotzdem and deshalb can occupy first position in a main clause. Paired connectors link alternatives or parallel ideas.', [[9, 0, 1, 2, 3, 4], [13, 0, 1, 2]]],
    ['adjectives', 'Adjective endings by case', 'Check the case, gender, number and article together. If the article already shows the relevant ending, the adjective often takes -e or -en.', [[8, 0, 1, 2, 3, 4]]],
    ['future', 'Future plans and predictions', 'The present tense with a time phrase can express an arrangement. Werden plus an infinitive can mark a prediction or a future intention.', [[15, 0, 1, 2, 4]]],
  ],
};

export function grammarReviewSets(level) {
  const lessons = new Map(level.lessons.map(lesson => [lesson.id, lesson]));
  return (topics[level.id] || []).map(([id, title, description, sources]) => {
    const items = sources.flatMap(([lessonId, ...indices]) => indices.map(index => {
      const { question, hint, words, ...task } = lessons.get(lessonId).tasks[index];
      return { ...task, prompt: question, explanation: hint, ...(words ? { tokens: words } : {}) };
    }));
    return {
      id: `grammar-${id}`, skill: 'grammar', focus: title, title, description, items,
      grammarLessons: sources.map(([lessonId]) => lessons.get(lessonId)),
    };
  });
}
