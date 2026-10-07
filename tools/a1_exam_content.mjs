// Original practice material. This is a preparation assessment, not an official Goethe paper.
const hear = (part, audioText, question, options, answer, plays) => ({ part, audioText, question, options, answer, plays });
const item = (question, options, answer, text = '') => ({ question, options, answer, text });
export const a1Test = {
  version: 2, passMark: 28, objectiveLabel: 'listening, reading and form completion',
  reviewTip: 'Use modules 15 and 16 to review the missed task types, then use an unfamiliar official practice set. Obtain feedback on writing and speaking.',
  listening: [
    hear(1, 'Guten Tag, was möchten Sie? Ich hätte gern einen Kaffee. Möchten Sie auch Kuchen? Nein, danke. Nur einen Kaffee mit Milch, bitte.', 'Was bestellt der Gast?', ['Kaffee mit Milch', 'Kaffee und Kuchen', 'Tee mit Milch'], 0, 2),
    hear(1, 'Wann beginnt der Film? Um acht Uhr. Gut, treffen wir uns um halb acht vor dem Kino? Ja, das machen wir.', 'Wann treffen sie sich?', ['Um 19 Uhr', 'Um 19.30 Uhr', 'Um 20 Uhr'], 1, 2),
    hear(1, 'Was kostet die Jacke? Sie kostet vierzig Euro. Und das Hemd? Das Hemd kostet dreißig Euro. Dann nehme ich nur das Hemd.', 'Was kauft der Kunde?', ['Eine Jacke', 'Ein Hemd', 'Eine Jacke und ein Hemd'], 1, 2),
    hear(1, 'Entschuldigung, wo ist die Post? Die Post ist neben dem Bahnhof. Muss ich hier links gehen? Nein, gehen Sie geradeaus und dann rechts.', 'Wo ist die Post?', ['Neben dem Bahnhof', 'Links im Supermarkt', 'Im Kino'], 0, 2),
    hear(1, 'Können Sie morgen arbeiten? Morgen habe ich einen Termin beim Arzt. Am Freitag kann ich kommen. Gut, dann kommen Sie am Freitag.', 'Wann kann die Person arbeiten?', ['Heute', 'Morgen', 'Am Freitag'], 2, 2),
    hear(1, 'Wie viele Personen kommen zum Essen? Wir sind drei Erwachsene und zwei Kinder. Gut, ich reserviere einen Tisch für fünf Personen.', 'Für wie viele Personen wird reserviert?', ['Drei', 'Vier', 'Fünf'], 2, 2),
    hear(2, 'Liebe Kunden, unser Geschäft schließt heute schon um achtzehn Uhr. Morgen sind wir wieder ab neun Uhr für Sie da.', 'Das Geschäft schließt heute um 18 Uhr.', ['Richtig', 'Falsch'], 0, 1),
    hear(2, 'Achtung: Der Zug nach Kassel fährt heute von Gleis sechs. Bitte gehen Sie nicht zu Gleis drei.', 'Der Zug fährt von Gleis drei.', ['Richtig', 'Falsch'], 1, 1),
    hear(2, 'Herzlich willkommen. Bitte lassen Sie Ihre Taschen am Eingang. In der Ausstellung dürfen Sie keine Fotos machen.', 'In der Ausstellung sind Fotos erlaubt.', ['Richtig', 'Falsch'], 1, 1),
    hear(2, 'Der Bus zum Flughafen hat zehn Minuten Verspätung. Bitte warten Sie an der Haltestelle vor dem Bahnhof.', 'Die Fahrgäste sollen vor dem Bahnhof warten.', ['Richtig', 'Falsch'], 0, 1),
    hear(3, 'Hallo Mia, hier ist Ben. Ich kann heute nicht zum Sport kommen. Ich muss bis sieben Uhr arbeiten. Können wir uns morgen treffen? Ruf mich bitte zurück.', 'Warum kann Ben heute nicht kommen?', ['Er ist krank.', 'Er muss arbeiten.', 'Er fährt in den Urlaub.'], 1, 2),
    hear(3, 'Guten Tag, Frau Wolf. Ihr Termin ist am Donnerstag um zehn Uhr. Bitte bringen Sie Ihren Ausweis mit. Vielen Dank.', 'Was soll Frau Wolf mitbringen?', ['Einen Ausweis', 'Eine Fahrkarte', 'Einen Computer'], 0, 2),
    hear(3, 'Hallo Sara. Ich habe Brot und Milch gekauft. Kannst du bitte noch Obst kaufen? Wir brauchen keine Eier. Bis später.', 'Was soll Sara kaufen?', ['Eier', 'Milch', 'Obst'], 2, 2),
    hear(3, 'Guten Tag. Das Zimmer ist vom dritten bis zum fünften Juni frei. Es kostet sechzig Euro pro Nacht. Frühstück kostet extra acht Euro.', 'Was kostet das Zimmer pro Nacht ohne Frühstück?', ['8 Euro', '60 Euro', '68 Euro'], 1, 2),
    hear(3, 'Hallo Paul, hier ist Nora. Die Party ist nicht bei mir zu Hause. Wir feiern im Garten bei meiner Schwester. Komm bitte um sechs Uhr.', 'Wo ist die Party?', ['Bei Nora zu Hause', 'Im Garten bei Noras Schwester', 'Im Restaurant'], 1, 2),
  ],
  reading: { groups: [
    { title: 'Part 1 · Short messages', text: 'Hallo Lina, ich bin jetzt in Bremen. Meine Wohnung ist klein, aber sie hat einen Balkon. Ich arbeite montags bis freitags im Café. Am Wochenende habe ich frei. Kommst du am Samstag zu Besuch? Viele Grüße, Nora', items: [
      item('Nora wohnt jetzt in Bremen.', ['Richtig','Falsch'], 0), item('Die Wohnung hat keinen Balkon.', ['Richtig','Falsch'], 1), item('Nora arbeitet am Samstag im Café.', ['Richtig','Falsch'], 1),
      item('Der Kurs findet am Abend statt.', ['Richtig','Falsch'], 0, 'Liebe Teilnehmer, unser Kurs findet ab Montag von 18 bis 20 Uhr statt. Der Raum ist jetzt im zweiten Stock. Bitte bringen Sie Ihr Buch mit.'),
      item('Die Teilnehmer müssen ein Buch mitbringen.', ['Richtig','Falsch'], 0, 'Liebe Teilnehmer, unser Kurs findet ab Montag von 18 bis 20 Uhr statt. Der Raum ist jetzt im zweiten Stock. Bitte bringen Sie Ihr Buch mit.'),
    ] },
    { title: 'Part 2 · Choose an advertisement', text: '', items: [
      item('Sie suchen ein Zimmer ab April. Sie können höchstens 400 Euro bezahlen. Welche Anzeige passt?', ['A','B'], 1, 'A: Zimmer frei ab Juni, 350 Euro. B: Zimmer frei ab April, 390 Euro.'),
      item('Sie möchten am Sonntag ein Fahrrad kaufen. Welche Anzeige passt?', ['A','B'], 0, 'A: Fahrrad 60 Euro. Abholung am Wochenende möglich. B: Fahrrad 50 Euro. Abholung nur Montag bis Freitag.'),
      item('Sie suchen einen Deutschkurs am Abend. Welche Anzeige passt?', ['A','B'], 1, 'A: Deutsch für Anfänger, Dienstag und Donnerstag, 9–11 Uhr. B: Deutsch für Anfänger, Montag und Mittwoch, 18–20 Uhr.'),
      item('Sie reisen allein und suchen ein Zimmer mit Frühstück. Welche Anzeige passt?', ['A','B'], 0, 'A: Einzelzimmer mit Frühstück ab 65 Euro. B: Nur Doppelzimmer, Frühstück nicht möglich.'),
      item('Sie möchten heute nach 18 Uhr einkaufen. Welches Geschäft passt?', ['A','B'], 1, 'A: Marktstraße, geöffnet bis 17 Uhr. B: Bahnhofsplatz, geöffnet bis 20 Uhr.'),
    ] },
    { title: 'Part 3 · Signs and notices', text: '', items: [
      item('Sie können hier am Mittwoch um 10 Uhr einkaufen.', ['Richtig','Falsch'], 0, 'Öffnungszeiten: Montag bis Freitag 9–18 Uhr. Samstag 9–13 Uhr. Sonntag geschlossen.'),
      item('Sie dürfen hier rauchen.', ['Richtig','Falsch'], 1, 'Rauchen verboten.'),
      item('Besucher können diesen Eingang benutzen.', ['Richtig','Falsch'], 1, 'Eingang nur für Mitarbeiter. Besucher bitte zum Haupteingang.'),
      item('Sie können in der Bibliothek heute keine Bücher ausleihen.', ['Richtig','Falsch'], 0, 'Bibliothek heute geschlossen. Morgen ab 9 Uhr wieder geöffnet.'),
      item('Sie müssen hier bar bezahlen.', ['Richtig','Falsch'], 1, 'Kartenzahlung möglich.'),
    ] },
  ] },
  form: {
    profile: 'Nora Becker ist am 14. März 1998 in Toronto geboren. Sie kommt aus Kanada und wohnt jetzt in Bonn. Sie möchte einen Deutschkurs am Abend besuchen.',
    fields: [
      { label: 'Familienname', answers: ['Becker'] }, { label: 'Geburtsdatum (TT.MM.JJJJ)', answers: ['14.03.1998','14.3.1998','14 März 1998','14. März 1998'] },
      { label: 'Geburtsort', answers: ['Toronto'] }, { label: 'Wohnort', answers: ['Bonn'] }, { label: 'Kurszeit: morgens oder abends?', answers: ['abends','am Abend','Abend'] },
    ],
  },
  writing: {
    task: 'Sie haben am Freitag einen Termin bei Frau Klein. Schreiben Sie eine kurze Nachricht (circa 30 Wörter). Schreiben Sie zu allen drei Punkten: 1. Sie können nicht kommen. 2. Sagen Sie warum. 3. Bitten Sie um einen neuen Termin am Montag.',
    placeholder: 'Guten Tag Frau Klein, …',
    checklist: ['I clearly said I cannot come on Friday.', 'I gave an understandable reason.', 'I asked for a new appointment on Monday.', 'I used a suitable greeting and ending.', 'I checked the verbs, capitals and recipient register.'],
    modelAnswer: 'Guten Tag Frau Klein, leider kann ich am Freitag nicht kommen. Ich muss arbeiten. Können wir uns am Montag treffen? Vielen Dank für Ihre Hilfe. Mit freundlichen Grüßen, Nora Becker',
  },
  speaking: [
    { task: 'Teil 1: Stellen Sie sich vor. Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby. Buchstabieren Sie danach Ihren Familiennamen und nennen Sie eine Telefonnummer.', modelAnswer: 'Ich heiße Nora Becker und bin 28 Jahre alt. Ich komme aus Kanada und wohne in Bonn. Ich spreche Englisch und Deutsch. Ich bin Verkäuferin. Ich lese gern. Becker: B, E, C, K, E, R. Meine Telefonnummer ist null eins sieben sechs, zwei null vier acht, drei eins fünf neun.' },
    { task: 'Teil 2: Thema Essen und Trinken, Karte Frühstück. Fragen Sie Ihren Partner. Der Partner antwortet und fragt dann Sie nach Getränken.', modelAnswer: 'Was isst du zum Frühstück? Ich esse Brot und Obst. Was trinkst du gern? Ich trinke gern Tee.' },
    { task: 'Teil 2: Thema Wochenende, Karte Samstag. Stellen und beantworten Sie Fragen zu Plänen.', modelAnswer: 'Was machst du am Samstag? Ich besuche meine Schwester. Hast du am Abend Zeit? Ja, am Abend habe ich Zeit.' },
    { task: 'Teil 3: Karte Stift. Bitten Sie um einen Stift. Der Partner reagiert. Tauschen Sie danach die Rollen.', modelAnswer: 'Können Sie mir bitte einen Stift geben? Ja, gern. Hier, bitte. Vielen Dank.' },
    { task: 'Teil 3: Karte Fenster. Bitten Sie Ihren Partner, das Fenster zu schließen. Der Partner reagiert.', modelAnswer: 'Können Sie bitte das Fenster schließen? Ja, natürlich. Vielen Dank.' },
  ],
};
