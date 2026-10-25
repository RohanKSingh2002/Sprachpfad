// Editorial corrections shared by the original lessons and the course extension.
const alternatives = {
  'Ich lerne jeden Tag Deutsch': ['Jeden Tag lerne ich Deutsch'],
  'Morgen fahre ich nach Berlin': ['Ich fahre morgen nach Berlin'],
  'Am Abend koche ich': ['Ich koche am Abend'],
  'Ich stehe um sieben Uhr auf': ['Um sieben Uhr stehe ich auf'],
  'Er sieht am Abend fern': ['Am Abend sieht er fern'],
  'Ich komme heute nicht': ['Heute komme ich nicht'],
  'Wir müssen morgen arbeiten': ['Morgen müssen wir arbeiten'],
  'Geben Sie mir bitte den Schlüssel': ['Bitte geben Sie mir den Schlüssel', 'Geben Sie mir den Schlüssel bitte'],
  'Der Schlüssel liegt auf dem Tisch': ['Auf dem Tisch liegt der Schlüssel'],
  'Ich habe gestern Brot gekauft': ['Gestern habe ich Brot gekauft'],
  'Ich bin um sieben Uhr aufgestanden': ['Um sieben Uhr bin ich aufgestanden'],
  'Bitte benutzen Sie den Eingang links': ['Benutzen Sie bitte den Eingang links', 'Benutzen Sie den Eingang links bitte'],
  'Rufen Sie bitte zurück': ['Bitte rufen Sie zurück'],
  'Können Sie das bitte wiederholen': ['Können Sie bitte das wiederholen'],
};

export function formatMessage(text) {
  return text.replace(/^(Hallo|Liebe|Lieber|Guten Tag)([^,]*), /, '$1$2,\n')
    .replace(/(Viele Grüße|Liebe Grüße|Mit freundlichen Grüßen|Grüße),? ([^.]+)$/, '\n$1\n$2');
}

export function correctLessons(lessons) {
  const byId = Object.fromEntries(lessons.map(l => [l.id, l]));
  const rule = (id, index, text) => { if (byId[id]) byId[id].rules[index] = text; };
  const task = (id, index, fields) => { if (byId[id]) Object.assign(byId[id].tasks[index], fields); };
  rule(1, 1, 'Where you are from: Ich komme aus Kanada. Learn ich komme / er kommt as useful introduction phrases; the regular verb pattern follows in the present-tense lesson.');
  rule(2, 3, 'For most verbs, wir, sie and Sie use the infinitive form. Remember the important exception sein: wir sind, sie sind, Sie sind.');
  if (byId[2] && !byId[2].vocab.some(w => w.de === 'der Mittwoch')) byId[2].vocab.push({de:'der Mittwoch',en:'Wednesday',pl:'Mittwoche'});
  if (byId[3]) byId[3].intro = byId[3].intro.replace('or neutral', 'or neuter');
  rule(3, 2, 'The diminutive ending -chen makes a noun neuter: das Mädchen, das Brötchen. A word that merely ends in these letters need not be a diminutive: der Kuchen.');
  task(3, 2, {question:'___ Mädchen spielt. (singular)',hint:'The singular diminutive Mädchen is neuter: das Mädchen.'});
  if (byId[5]) byId[5].intro = 'The accusative marks many objects: the person or thing you have, want or buy. Among the definite and indefinite articles, only the masculine forms change from nominative to accusative.';
  rule(5, 2, 'möchten (would like): ich möchte, du möchtest, er/sie/es möchte, wir möchten, ihr möchtet, sie/Sie möchten.');
  rule(5, 4, 'A few masculine nouns also change: der Herr → den Herrn, ein Kollege → einen Kollegen. Learn these frequent forms together with their articles.');
  if (byId[6]) byId[6].intro = 'Use kein to negate an indefinite noun or an ordinary noun without an article. Use nicht for an action, an adjective or a specific person or place.';
  rule(6, 1, 'Ordinary nouns without an article usually take kein: Ich habe Zeit → Ich habe keine Zeit. Names are different: Das ist nicht Anna. Ich wohne nicht in Berlin.');
  rule(6, 4, 'nicht comes before what it specifically negates: nicht teuer, nicht heute, nicht in Berlin. When negating the whole action it is often near the end: Ich komme heute nicht; Ich rufe heute nicht an.');
  task(6, 2, {question:'Ich habe ___ Bruder. (no brother)'});
  task(6, 3, {question:'Er trinkt ___ Kaffee. (no coffee)'});
  task(6, 5, {question:'Wir haben ___ Auto. (no car)'});
  if (byId[8]) byId[8].intro = 'Some verbs split in two. In a main-clause statement, the conjugated part is second and the separable prefix comes at the end. In a yes/no question or instruction, the conjugated verb comes first.';
  rule(8, 1, 'Statement: Ich rufe heute an. Yes/no question: Rufst du heute an? Instruction (a useful phrase to learn now): Ruf bitte an. The prefix ends the main clause in each case.');
  rule(8, 4, 'Rufst du mich morgen an? means Will you call me tomorrow? Learn mich (me) as part of this phrase; object pronouns are taught in the requests lesson.');
  rule(9, 3, 'In standard German, b, d and g at the end of a word or syllable are usually pronounced p, t and k: ab, Rad, Tag. The ending -ig often has an ich sound, as in zwanzig; regional pronunciations vary.');
  rule(9, 4, 'Ask for help: Langsamer, bitte. Noch einmal, bitte. Können Sie das bitte buchstabieren?');
  if (byId[9]) byId[9].vocab.find(w => w.de === 'der Buchstabe').en = 'letter of the alphabet';
  if (byId[10]) byId[10].table.rows[3][0] = '100 / 1000';
  if (byId[12]) {
    byId[12].table.rows = [['ich','mein','meine'],['du','dein','deine'],['er / es','sein','seine'],['sie (she)','ihr','ihre'],['wir','unser','unsere'],['ihr','euer','eure'],['sie (they)','ihr','ihre'],['Sie','Ihr','Ihre']];
    byId[12].examples[2] = {de:'Mein Vater wohnt in Bonn.',en:'My father lives in Bonn.'};
  }
  rule(12, 1, 'For this lesson, practise the nominative forms: mein Bruder, meine Schwester. Object endings such as meinen Bruder follow in the accusative lesson.');
  task(12, 1, {question:'Das ist ___ Bruder. (my)',answer:0,hint:'Bruder is masculine; this naming sentence uses the nominative: mein Bruder.'});
  rule(13, 2, 'For the e→i/ie and a→ä verbs shown here, the stem change affects du and er/sie/es. It does not affect ich, wir, ihr or sie/Sie: ich lese, ihr lest, wir lesen. Other irregular verbs have their own patterns.');
  rule(13, 5, 'Use doch to contradict a negative question: Sprichst du kein Deutsch? — Doch, ich spreche Deutsch. Nein confirms the negative: Nein, ich spreche kein Deutsch.');
  if (byId[13] && !byId[13].vocab.some(w => w.de === 'doch')) byId[13].vocab.push({de:'doch',en:'yes (contradicting a negative question)'});
  rule(14, 2, 'Dates use ordinal endings: am ersten, zweiten, dritten, siebten Mai. From 20 use -sten: am zwanzigsten Mai. Written: am 3. Mai; spoken: am dritten Mai.');
  task(14, 5, {readingText:'Sprachkurs: Montag und Mittwoch, 18–20 Uhr. Im August ist die Schule geschlossen. Der nächste Kurs beginnt am 2. September.',hint:'Im August ist die Schule geschlossen: the school is closed in August.'});
  task(15, 0, {question:'Ich nehme ___ Kaffee. (a coffee)'});
  rule(16, 0, 'Use dieser/diese/dieses with a subject: dieser Mantel, diese Jacke, dieses Hemd. A masculine object uses diesen: Ich nehme diesen Mantel. Feminine and neuter stay diese/dieses.');
  rule(16, 1, 'After sein, colours stay unchanged and lowercase: Die Jacke ist blau. A colour used as a noun after in has a capital: die Jacke in Blau, das Hemd in Weiß.');
  if (byId[17]) {
    byId[17].table.head = ['Verb','ich','du','er / sie / es','wir / sie / Sie','ihr'];
    const forms = ['könnt','müsst','wollt','dürft','sollt','möchtet'];
    byId[17].table.rows.forEach((row,i) => {row[5] = forms[i];});
  }
  rule(17, 0, 'In a statement the conjugated modal is second and the infinitive is last. In the plural, retain the umlauts in können, müssen, dürfen and in ihr könnt, müsst, dürft.');
  rule(18, 0, 'Formal instruction: verb + Sie (Kommen Sie!). Informal du instructions usually use the stem without du: komm, mach. Learn irregular gib, nimm, lies and sei. fahren gives fahr (without ä); arbeiten gives arbeite. The ihr form stays as in the present tense: kommt, arbeitet.');
  rule(19, 2, 'Where (Wo?): im Park, im Kino, in der Stadt, beim Arzt. Where to (Wohin?): in den Park, ins Kino, in die Stadt, zum Arzt. Contractions: im = in dem, ins = in das, beim = bei dem, zum = zu dem, zur = zu der. Learn each place phrase with its meaning.');
  task(20, 0, {question:'Es gibt ___ Balkon. (a balcony)'});
  if (byId[21] && !byId[21].vocab.some(w => w.de === 'die Besprechung')) byId[21].vocab.push({de:'die Besprechung',en:'meeting',pl:'Besprechungen'});
  if (byId[23]) byId[23].vocab.filter(w => w.de === 'das Gleis').forEach(w => { w.en = 'track; platform in station announcements'; });
  task(25, 0, {question:'Ich spiele ___ Fußball. (like to)',answers:['gern','gerne'],hint:'gern and gerne both mean you enjoy the activity.'});
  rule(26, 5, 'Verbs with inseparable be-, ver-, er- or ent- do not add ge-: besuchen → besucht, bezahlen → bezahlt, verstehen → verstanden. Verbs ending in -ieren also omit ge-: studieren → studiert.');
  rule(27, 5, 'sein itself has the perfect form ist gewesen (ich bin gewesen). For a simple past state, A1 speakers usually use war: Ich war gestern in Bonn. Learn gewesen as a recognition form.');
  if (byId[28] && !byId[28].vocab.some(w => w.de === 'gestern')) byId[28].vocab.push({de:'gestern',en:'yesterday'});
  task(30, 2, {question:'halb neun am Morgen = ___ Uhr dreißig. (write the number as a word)',hint:'In the morning, halb neun means acht Uhr dreißig (08:30).'});
  rule(31, 5, 'Greeting examples: "Liebe Anna," / "Lieber Tom," / "Sehr geehrte Frau Berg," / "Sehr geehrter Herr Berg,". Put the message on the next line. End with "Viele Grüße" or "Mit freundlichen Grüßen" (no comma), then your name on a new line.');
  for (const l of lessons) {
    l.rules = l.rules.filter(Boolean);
    for (const t of l.tasks) {
      if (t.type === 'order') {
        const sentence = t.answers[0];
        t.answers = [...new Set([...t.answers,...(alternatives[sentence] || [])])];
        // Only remove capitalisation that comes from sentence position; preserve nouns and formal Sie.
        const first = sentence.split(' ')[0];
        if (/^(Ich|Du|Er|Wir|Morgen|Heute|Am|Um|Der|Unsere|Wie|Wann|Wo|Was|Liest|Trinkst|Können|Kann|Geben|Rufen|Bitte)$/.test(first)) t.neutralStart = first;
        if (t.answers.length > 1) t.hint = 'Keep the conjugated verb in the correct position. More than one natural order is accepted.';
      }
      if (t.type === 'write') t.modelAnswer = formatMessage(t.modelAnswer);
    }
  }
}
