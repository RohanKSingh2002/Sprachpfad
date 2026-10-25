// Original learning activities informed by private reference materials.
// Do not import scans, handwriting, personal details or book exercise text here.
export const skillStrategies = [
  { title: 'Read with a purpose', steps: ['Identify the text type and its purpose first: notice, message, advertisement or opinion.', 'Read the question, then locate the sentence that answers it. Check who, when, where and any restriction.', 'Explain why the other option is wrong. A repeated word alone is not enough evidence.'] },
  { title: 'Listen in two passes', steps: ['Before playing, predict the situation and the kind of detail you need.', 'First listen for the situation and intention. On a second practice listen, note the requested details and corrections.', 'Check the transcript after answering. Repeat the difficult phrase, then try again without reading. Follow the stated playback limits in exam practice.'] },
  { title: 'Write, check, rewrite', steps: ['Identify the recipient, purpose and all requested content points. Use fictional details for personal-data tasks.', 'Draft before opening a model. Use short sentences you can control and a suitable greeting and ending.', 'Check task coverage first, then verbs, word order and noun capitals. Get feedback and write a corrected version.'] },
  { title: 'Speak and respond', steps: ['Prepare keywords instead of a complete script. Give an answer, a reason or example, then invite a response.', 'Ask a follow-up question and respond to your partner’s idea. Ask for clarification when needed.', 'Repeat with a changed situation and switch roles. Check whether the other person understood your intended meaning.'] },
];

export const reviewRoutine = [
  'Next study day: recall three useful phrases without looking, then correct them.',
  'About one week later: repeat the task with different details and no model.',
  'About three weeks later: mix this topic with an earlier one and ask for feedback.',
];

const a1Transfer = [
  [[], 'Meet a new course partner. Use a fictional name, greet formally, spell the name and ask one question. Repeat the exchange using du.', ['I used an appropriate greeting.', 'My partner could write the name I spelled.', 'I asked and answered a question.'], 'Review German letter names and the difference between du and Sie.'],
  [[9, 1], 'Create a fictional course registration card with a town, house number and preferred course time. Read it to a partner, deliberately correct one number, and ask them to fill the fields.', ['The fields belong to the fictional participant.', 'The final corrected number is recorded.', 'Dates and times are not confused.'], 'Practise pairs such as vierzehn/vierzig before trying new numbers.'],
  [[1, 10], 'Interview a fictional new classmate about their town, language and work. Ask three different W-questions and one yes/no question.', ['The verb agrees with the subject.', 'Question word and verb have the correct positions.', 'I respond with a complete short sentence.'], 'Separate W-questions from yes/no questions and rebuild one of each.'],
  [[2, 13], 'Describe a fictional household using two people and three objects. Say who owns each object and ask your partner whose object one is.', ['I learned each noun with its article.', 'Possessives match the noun being described.', 'I distinguish a person from their possessions.'], 'Use der Tisch, die Tasche and das Buch to recall three article patterns.'],
  [[10, 13], 'Agree on a library meeting. One person can come at 14:15; the other can only come at 14:45. Agree on a final time and write a short confirmation.', ['We agree on one time.', 'I use um for clock times and am for a weekday.', 'My confirmation matches the agreement.'], 'Compare official clock times with Viertel nach and Viertel vor.'],
  [[4, 7], 'Explain a fictional Saturday in four sentences. Change one activity into a question and put a time phrase first in another sentence.', ['The finite verb stays in second position in statements.', 'A separable prefix finishes the main clause.', 'The routine can be understood in order.'], 'Underline the conjugated verb and circle the separable prefix.'],
  [[3, 12], 'Order lunch for two people from an invented menu. Ask about a drink, change one item and ask for the bill.', ['The final order is clear.', 'I use einen with a masculine direct object where needed.', 'I can respond to a clarification.'], 'Practise a noun with its nominative and accusative article in a short order.'],
  [[5, 15], 'Ask for a blue jacket in a different size. The shop has no blue jackets. Politely decline and explain that the red one is too expensive.', ['I distinguish kein with a noun from nicht in the relevant phrase.', 'I state a size or price clearly.', 'My partner understands my final decision.'], 'Contrast Ich brauche keine Jacke with Die Jacke ist nicht billig.'],
  [[4, 8], 'Ask a partner for help carrying a box. They cannot help now. Agree on a later time and check whether you are allowed to leave it near the door.', ['A request receives a suitable response.', 'The main verb follows the modal at the end.', 'Not having to do something is different from not being allowed to.'], 'Compare nicht müssen and nicht dürfen with two clearly different situations.'],
  [[7, 18], 'Give simple directions from a station to a flat. Describe one room and explain where a bag is. Ask your partner to repeat the route.', ['Directions have a clear order.', 'I distinguish location from destination in familiar phrases.', 'I can repair a misunderstanding.'], 'Revisit in der Küche versus in die Küche; do not choose a case just because a verb involves movement.'],
  [[10, 17], 'Use an invented situation to change an appointment: give the original day, say you cannot come and suggest another time. Respond to one follow-up question.', ['The old and new times are distinct.', 'I ask politely rather than only stating a problem.', 'The recipient knows what to do next.'], 'Reduce the message to reason, new proposal and request for confirmation.'],
  [[7, 19], 'Plan a short trip using an invented forecast and timetable. Choose a departure, say what clothes to bring and tell your partner about one change.', ['I select the final departure rather than a cancelled one.', 'Clothes match the stated weather.', 'I confirm the arrival or meeting place.'], 'Listen specifically for nicht, aber and a corrected time.'],
  [[7, 18], 'Invite a classmate to a picnic. They were busy last weekend and cannot come on your first suggested day. Agree on another day and ask them to bring something.', ['I understand war and hatte in context.', 'I answer the invitation and offer an alternative.', 'I include what, where and when.'], 'Use a short invitation with three explicit details before expanding it.'],
  [[8, 14], 'Describe a fictional day out in four linked sentences: travel, one activity, food and the return. Your partner asks what happened first.', ['I choose haben or sein for the verbs used.', 'The participle closes the main clause.', 'Events follow a clear order.'], 'Practise fahren/sein and machen/haben in separate examples.'],
  [[10, 23], 'Read a new notice and listen to an unfamiliar short announcement. Identify the situation first, then find a time, a place and a restriction. Explain the evidence for each answer.', ['I distinguish the main idea from a requested detail.', 'I notice changes, negatives and restrictions.', 'I can point to evidence after my independent attempt.'], 'Review one missed detail without the timer before attempting a different text.'],
  [[11, 25, 29, 30], 'Write a new three-point message, then introduce a fictional participant, ask a question and make a request without reading a script. Ask a partner for feedback and repeat with changed details.', ['Every message point is understandable.', 'The greeting and ending fit the recipient.', 'I respond to a question or request from another person.'], 'Review the skill that broke down instead of repeating a memorised full paper.'],
];

export function strengthenA1(course) {
  course.skillStrategies = skillStrategies;
  course.reviewRoutine = reviewRoutine;
  course.learningUpdate = '2026-10-25';
  course.modules.forEach((module, i) => {
    const [lessonIds, task, checklist, retry] = a1Transfer[i];
    module.transfer = { lessonIds, task, checklist, retry };
  });
  return course;
}
