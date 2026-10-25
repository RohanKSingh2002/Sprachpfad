// Original module practice. These supported workshops precede unfamiliar exam rehearsals.
import { formatMessage } from './a1_review_corrections.mjs';
const q = ([question, options, answer, evidence]) => ({ question, options, answer, evidence });
const pack = (id, audioText, listening, text, reading, task, modelAnswer, speakingTask, speakingModel, wordGoal = 30) => ({
  id, listening: { audioText, questions: listening.map(q) }, reading: { text, questions: reading.map(q) },
  writing: { task, modelAnswer, wordGoal }, speaking: { task: speakingTask, modelAnswer: speakingModel },
});
export const workshops = [
  pack(1,
    'Guten Tag. Ich heiße Eva Berg. Ich komme aus Österreich. Jetzt wohne ich in Bonn. Mein Name ist Berg: B, E, R, G.',
    [['What is the surname?', ['Berg','Berger','Eva'],0,'Mein Name ist Berg.'], ['Where is Eva from?', ['Germany','Austria','Switzerland'],1,'Ich komme aus Österreich.'], ['Where does she live now?', ['Vienna','Berlin','Bonn'],2,'Jetzt wohne ich in Bonn.']],
    'Hallo! Ich bin Luis. Ich komme aus Spanien und wohne in Hamburg. Ich spreche Spanisch und Englisch. Ich lerne Deutsch. Meine Freundin heißt Anna. Sie kommt aus Deutschland.',
    [['Who is learning German?', ['Anna','Luis','Both are stated'],1,'Ich bin Luis. … Ich lerne Deutsch.'],['Where does Luis live?', ['Spain','Hamburg','Bonn'],1,'… wohne in Hamburg.'],['Where is Anna from?', ['Germany','Spain','Austria'],0,'Sie kommt aus Deutschland.']],
    'Introduce an invented student. Include their name, country and current town. Use three or four short sentences.',
    'Hallo! Ich heiße Lina. Ich komme aus Italien. Ich wohne in Bonn und lerne Deutsch.',
    'Introduce yourself without reading. Your partner asks your name and country. Spell a surname, then ask your partner to repeat their name.',
    'Wie heißen Sie? Ich heiße Lina Rossi. Können Sie Rossi bitte buchstabieren? R, O, S, S, I. Woher kommen Sie? Ich komme aus Italien. Können Sie Ihren Namen bitte wiederholen?',20),
  pack(2,
    'Mein Name ist Amir Khan. Ich bin 23 Jahre alt. Meine Adresse ist Parkstraße 18 in Bonn. Die Postleitzahl ist 53111. Meine Telefonnummer ist 0176 2048 3159.',
    [['How old is Amir?', ['32','23','18'],1,'Ich bin 23 Jahre alt.'],['What is the house number?', ['18','23','53'],0,'Parkstraße 18.'],['What is the postcode?', ['53110','51311','53111'],2,'Die Postleitzahl ist 53111.']],
    'Anmeldung: Sara Pinto ist am 12. Mai 2000 in Porto geboren. Sie kommt aus Portugal und wohnt jetzt in Köln, Marktstraße 7. Sie ist ledig. Sie möchte einen Deutschkurs am Abend besuchen.',
    [['Which is the birthplace?', ['Köln','Porto','Marktstraße'],1,'… in Porto geboren.'],['Which surname belongs in the form?', ['Sara','Pinto','Portugal'],1,'Sara Pinto.'],['When does Sara want a course?', ['Morning','Afternoon','Evening'],2,'… am Abend.']],
    'Write a sample registration message with your name, current town and preferred course time. Use invented contact information.',
    'Guten Tag, ich heiße Sara Pinto und wohne in Köln. Ich möchte einen Deutschkurs am Abend besuchen. Haben Sie einen Kurs am Montag? Vielen Dank. Viele Grüße, Sara Pinto',
    'Give your age, a house number and a telephone number clearly. Ask your partner for their town and surname; spell the surname back to confirm it.',
    'Wie alt sind Sie? Ich bin 23 Jahre alt. Wie ist Ihre Hausnummer? 18. Wie ist Ihre Telefonnummer? Null eins sieben sechs … Wie ist Ihr Familienname? Khan. K, H, A, N? Ja, genau.'),
  pack(3,
    'Ich arbeite am Montag und Dienstag. Am Mittwoch lerne ich Deutsch. Meine Freundin liest gern. Wir sprechen Englisch und ein bisschen Deutsch. Am Freitag besuchen wir unsere Freunde.',
    [['When does the speaker learn German?', ['Monday','Wednesday','Friday'],1,'Am Mittwoch lerne ich Deutsch.'],['What does the friend enjoy?', ['Reading','Driving','Cooking'],0,'Meine Freundin liest gern.'],['What do they do on Friday?', ['Work','Study alone','Visit friends'],2,'Am Freitag besuchen wir unsere Freunde.']],
    'Sprachgruppe im Stadtzentrum: Wir treffen uns am Dienstag um 18 Uhr. Wir lesen kurze Texte und sprechen Deutsch. Bitte bringen Sie ein Heft und einen Stift mit. Neue Teilnehmer sind willkommen.',
    [['What does the group practise?', ['Only maths','Reading and speaking','Shopping'],1,'… lesen kurze Texte und sprechen Deutsch.'],['What should participants bring?', ['Notebook and pen','Passport and ticket','Food and drinks'],0,'… ein Heft und einen Stift.'],['May new participants join?', ['Yes','No','Only teachers'],0,'Neue Teilnehmer sind willkommen.']],
    'Ask a new classmate three questions: their languages, where they live, and what they do on Monday. Add a short introduction.',
    'Hallo, ich heiße Amir und lerne Deutsch. Welche Sprachen sprichst du? Wo wohnst du? Was machst du am Montag? Ich möchte dich gern kennenlernen. Viele Grüße, Amir',
    'Ask and answer four new questions using wo, wann, was and which languages. Add one yes/no question; respond with useful information.',
    'Wo wohnst du? Ich wohne in Bonn. Wann lernst du Deutsch? Am Abend. Was machst du am Samstag? Ich arbeite. Welche Sprachen sprichst du? Englisch und Deutsch. Liest du gern? Ja, sehr gern.'),
  pack(4,
    'Meine Schwester heißt Mia. Sie ist 19 Jahre alt. Mein Bruder heißt Ben und ist 16. Unsere Eltern wohnen in Berlin. Mia wohnt jetzt in Bonn. Ihr Zimmer ist klein.',
    [['How old is Mia?', ['16','19','29'],1,'Sie ist 19 Jahre alt.'],['Where do the parents live?', ['Bonn','Hamburg','Berlin'],2,'Unsere Eltern wohnen in Berlin.'],['Whose room is described?', ['Mia’s','Ben’s','The parents’'],0,'Mia … Ihr Zimmer ist klein.']],
    'Das ist unsere Familie: Meine Frau heißt Eva. Unser Sohn heißt Paul. Er ist acht Jahre alt. Unsere Tochter heißt Nora und ist fünf. Wir wohnen in Köln. Meine Eltern wohnen in Hamburg.',
    [['Who is Paul?', ['The daughter','The son','The grandfather'],1,'Unser Sohn heißt Paul.'],['How old is Nora?', ['Five','Eight','Nine'],0,'… Nora und ist fünf.'],['Where do the grandparents live?', ['Köln','Bonn','Hamburg'],2,'Meine Eltern wohnen in Hamburg.']],
    'Describe two invented family members. Include their relationships, ages and where they live. Use possessive words.',
    'Meine Schwester heißt Mia. Sie ist 19 Jahre alt und wohnt in Bonn. Mein Bruder heißt Ben. Er ist 16 Jahre alt und wohnt bei unseren Eltern in Berlin.',
    'Tell your partner about two family members. Ask where their family lives. Choose three classroom objects and ask what they are and whose they are.',
    'Das ist meine Schwester. Sie wohnt in Bonn. Wo wohnen deine Eltern? In Berlin. Was ist das? Das ist ein Heft. Ist das dein Heft? Ja, das ist mein Heft.'),
  pack(5,
    'Unser Termin ist am Donnerstag, dem dritten Mai, um zehn Uhr dreißig. Bitte kommen Sie zehn Minuten früher. Am Freitag ist unser Büro geschlossen.',
    [['Which day is the appointment?', ['Tuesday','Thursday','Friday'],1,'… am Donnerstag.'],['What is the appointment time?', ['10:20','10:30','10:40'],1,'… zehn Uhr dreißig.'],['When is the office closed?', ['Thursday','Wednesday','Friday'],2,'Am Freitag ist unser Büro geschlossen.']],
    'Bibliothek: Montag bis Freitag 9–18 Uhr, Samstag 10–13 Uhr. Am Sonntag geschlossen. Am 1. Mai bleibt die Bibliothek geschlossen. Bücher können Sie am Montag wieder abgeben.',
    [['When does the library open on Saturday?', ['9','10','13'],1,'Samstag 10–13 Uhr.'],['Is it open on Sunday?', ['Yes','Only in the morning','No'],2,'Am Sonntag geschlossen.'],['When may books be returned after the holiday?', ['Monday','Sunday','1 May'],0,'… am Montag wieder abgeben.']],
    'Write an appointment request. Say which day you can come, give a time and ask for confirmation.',
    'Guten Tag, ich möchte gern einen Termin am Donnerstag. Ich kann um halb elf kommen. Haben Sie dann Zeit? Bitte schreiben Sie mir kurz. Vielen Dank. Viele Grüße, Lina',
    'Arrange an appointment with a partner. Say a day and a time, repeat the arrangement to confirm, and ask about opening hours.',
    'Haben Sie am Donnerstag Zeit? Ja, um halb elf. Also am Donnerstag um zehn Uhr dreißig? Ja. Wann öffnet Ihr Büro? Um neun Uhr.'),
  pack(6,
    'Ich stehe jeden Tag um sieben Uhr auf. Um acht fahre ich zur Arbeit. Ich arbeite bis fünf. Am Abend kaufe ich oft ein. Am Sonntag stehe ich später auf.',
    [['When does the speaker get up on working days?', ['7','8','5'],0,'… um sieben Uhr auf.'],['When does work finish?', ['8','12','5'],2,'Ich arbeite bis fünf.'],['What often happens in the evening?', ['Shopping','Going to work','Getting up'],0,'Am Abend kaufe ich oft ein.']],
    'Hallo Tim, ich arbeite morgen bis 16 Uhr. Danach kaufe ich ein. Um 18 Uhr rufe ich meine Mutter an. Kannst du um 19 Uhr vorbeikommen? Wir können zusammen kochen. Grüße, Lea',
    [['What does Lea do after work?', ['Phones Tim','Shops','Sleeps'],1,'Danach kaufe ich ein.'],['Who receives a phone call?', ['Lea’s mother','Tim’s father','A teacher'],0,'… meine Mutter.'],['When is Tim invited?', ['16:00','18:00','19:00'],2,'… um 19 Uhr vorbeikommen?']],
    'Tell a friend about tomorrow. Include when you get up, one activity after work or class, and a time when they can visit.',
    'Hallo Tim, morgen stehe ich um sieben Uhr auf. Nach dem Kurs kaufe ich ein. Du kannst um 19 Uhr kommen. Dann kochen wir zusammen. Hast du Zeit? Grüße, Lea',
    'Describe a usual weekday with three separable verbs. Ask your partner when they get up and what they do in the evening.',
    'Ich stehe um sieben Uhr auf. Nach der Arbeit kaufe ich ein. Am Abend rufe ich meine Mutter an. Wann stehst du auf? Um acht. Was machst du am Abend? Ich lese.'),
  pack(7,
    'Guten Tag. Ich hätte gern eine Suppe und einen Tee. Mein Freund nimmt einen Salat und ein Glas Wasser. Wir brauchen auch zwei Löffel. Können wir mit Karte bezahlen?',
    [['What does the first speaker eat?', ['Soup','Salad','Bread'],0,'Ich hätte gern eine Suppe.'],['What does the friend drink?', ['Tea','Coffee','Water'],2,'… ein Glas Wasser.'],['How do they want to pay?', ['Cash only','By card','By bank transfer'],1,'… mit Karte bezahlen?']],
    'Café Linden: Frühstück von 8 bis 11 Uhr. Ein Frühstück kostet 7 Euro und enthält Brot, Käse und einen Kaffee. Tee kostet 2 Euro extra. Ab 12 Uhr gibt es Suppe und Salat.',
    [['When is breakfast available?', ['8–11','11–12','12–18'],0,'Frühstück von 8 bis 11 Uhr.'],['Which drink is included?', ['Tea','Coffee','Juice'],1,'… einen Kaffee.'],['When is soup available?', ['8','11','From 12'],2,'Ab 12 Uhr gibt es Suppe.']],
    'Write a café enquiry for two people. Say when you want breakfast, ask whether tea is included and ask about card payment.',
    'Guten Tag, wir möchten am Samstag um neun Uhr bei Ihnen frühstücken. Ist Tee im Frühstück dabei? Können wir mit Karte bezahlen? Vielen Dank für Ihre Antwort. Viele Grüße, Amir',
    'Play customer and server. Order food and a drink, answer an alternative offer, ask the price, and request the bill. Change roles.',
    'Ich hätte gern eine Suppe und einen Tee. Möchten Sie auch Brot? Ja, bitte. Was kostet das? Acht Euro. Können wir bitte bezahlen? Ja, natürlich.'),
  pack(8,
    'Diese Jacke kostet 35 Euro. Wir haben sie in Blau und Schwarz, aber nicht in Rot. Größe 40 ist da. Größe 42 haben wir leider nicht. Sie können mit Karte bezahlen.',
    [['What does the jacket cost?', ['30 euros','35 euros','42 euros'],1,'… kostet 35 Euro.'],['Which colour is unavailable?', ['Blue','Black','Red'],2,'… nicht in Rot.'],['Which size is available?', ['40','42','44'],0,'Größe 40 ist da.']],
    'Schuhgeschäft am Markt: Heute 20 Prozent Rabatt auf schwarze Schuhe. Das Geschäft ist bis 18 Uhr geöffnet. Rote Schuhe sind nicht im Angebot. Kartenzahlung ist ab 10 Euro möglich.',
    [['Which shoes have a discount?', ['Red','Black','All colours'],1,'… auf schwarze Schuhe.'],['When does the shop close?', ['10','16','18'],2,'… bis 18 Uhr geöffnet.'],['Can a 7-euro purchase be paid by card?', ['Yes','No','Only on Saturday'],1,'Kartenzahlung … ab 10 Euro.']],
    'Write to a shop. Say which item and size you need, ask about one colour, and ask its price.',
    'Guten Tag, ich suche eine Jacke in Größe 40. Haben Sie diese Jacke auch in Blau? Was kostet sie? Bitte schreiben Sie mir kurz. Vielen Dank. Viele Grüße, Nora',
    'Ask about a colour and size. The shop assistant says one item is unavailable. Ask for an alternative, then accept or decline and explain simply.',
    'Haben Sie die Jacke in Rot? Leider nicht. Haben Sie sie in Blau? Ja, in Größe 40. Sie ist zu klein. Ich brauche Größe 42. Dann nehme ich sie nicht.'),
  pack(9,
    'Im Kurs dürfen Sie Wasser trinken. Sie dürfen aber nicht telefonieren. Morgen müssen Sie ein Buch mitbringen. Wenn Sie eine Frage haben, können Sie den Lehrer fragen.',
    [['What is permitted?', ['Drinking water','Phone calls','Smoking'],0,'… dürfen Sie Wasser trinken.'],['What must students bring tomorrow?', ['A phone','A book','A ticket'],1,'… ein Buch mitbringen.'],['Who can students ask?', ['The driver','The shop assistant','The teacher'],2,'… den Lehrer fragen.']],
    'Kursraum: Bitte schließen Sie nach dem Unterricht die Fenster. Lassen Sie die Tür offen. Essen ist hier nicht erlaubt. Getränke dürfen Sie mitbringen. Der Raum muss um 18 Uhr frei sein.',
    [['What should be closed?', ['The windows','The door','The books'],0,'… die Fenster.'],['Is eating allowed?', ['Yes','No','Only at 18:00'],1,'Essen ist hier nicht erlaubt.'],['When must the room be free?', ['8:00','16:00','18:00'],2,'… um 18 Uhr frei.']],
    'Ask your teacher for help. Say which exercise you cannot do, ask them to explain it, and ask when you can speak to them.',
    'Guten Tag, ich kann Aufgabe drei nicht machen. Können Sie mir die Aufgabe bitte erklären? Haben Sie morgen nach dem Kurs Zeit? Vielen Dank für Ihre Hilfe. Viele Grüße, Ben',
    'Make three requests using different objects. Respond to your partner’s requests. Include one permission question and a suitable refusal or alternative.',
    'Können Sie mir bitte einen Stift geben? Ja, gern. Können Sie bitte die Tür öffnen? Natürlich. Darf ich hier telefonieren? Leider nicht. Bitte telefonieren Sie draußen.'),
  pack(10,
    'Zum Bahnhof gehen Sie geradeaus. An der Apotheke gehen Sie links. Der Bahnhof ist neben dem Hotel. Zu Fuß brauchen Sie zehn Minuten. Mit dem Bus sind es fünf Minuten.',
    [['Where should you turn left?', ['At the pharmacy','At the station','At the school'],0,'An der Apotheke … links.'],['What is next to the station?', ['The school','The hotel','The café'],1,'… neben dem Hotel.'],['How long is the walk?', ['Five minutes','Twenty minutes','Ten minutes'],2,'Zu Fuß … zehn Minuten.']],
    'Wohnungsanzeige: Zwei Zimmer, Küche und Bad, 650 Euro im Monat. Die Wohnung liegt im ersten Stock. Sie ist ab Juni frei. Der Bus hält vor dem Haus. Ein Balkon ist nicht vorhanden.',
    [['How many rooms are listed?', ['One','Two','Three'],1,'Zwei Zimmer.'],['When is it available?', ['May','July','June'],2,'… ab Juni frei.'],['Is there a balcony?', ['No','Yes','The text does not say'],0,'Ein Balkon ist nicht vorhanden.']],
    'Write about an advertised flat. Ask whether it is still available, give a viewing day, and ask about the monthly price.',
    'Guten Tag, ist Ihre Wohnung noch frei? Ich möchte sie gern am Freitag sehen. Haben Sie um 16 Uhr Zeit? Was kostet die Wohnung im Monat? Viele Grüße, Sara',
    'Give short directions to a place. Your partner asks one clarification question. Then describe two rooms and say where one object is.',
    'Wie komme ich zum Bahnhof? Gehen Sie geradeaus und dann links. Ist es weit? Nein, zehn Minuten. Meine Wohnung hat zwei Zimmer. Der Tisch steht in der Küche. Der Schlüssel liegt auf dem Tisch.'),
  pack(11,
    'Guten Tag, hier ist die Praxis Wolf. Ihr Termin ist morgen um neun Uhr. Frau Dr. Wolf ist heute nicht da. Bitte bringen Sie Ihre Karte mit. Wenn Sie nicht kommen können, rufen Sie uns bitte an.',
    [['When is the appointment?', ['Today at nine','Tomorrow at nine','Tomorrow at ten'],1,'… morgen um neun Uhr.'],['What should the patient bring?', ['A map','A book','Their card'],2,'… Ihre Karte.'],['What should they do if unable to attend?', ['Call','Visit today','Do nothing'],0,'… rufen Sie uns bitte an.']],
    'Hallo Amir, ich kann am Montag nicht zur Arbeit kommen. Ich bin krank und habe einen Termin beim Arzt. Ich komme am Mittwoch wieder. Kannst du bitte Frau Klein informieren? Danke. Grüße, Nora',
    [['Why is Nora absent?', ['Holiday','Illness','A train delay'],1,'Ich bin krank.'],['When does she expect to return?', ['Monday','Tuesday','Wednesday'],2,'… am Mittwoch wieder.'],['Who should be informed?', ['Frau Klein','The doctor','A driver'],0,'… Frau Klein informieren.']],
    'Cancel a work appointment. Say that you are ill, explain that you cannot attend, and suggest a new day.',
    'Guten Tag, ich bin heute krank und kann nicht zu unserem Termin kommen. Können wir uns am Freitag treffen? Bitte schreiben Sie mir. Vielen Dank. Viele Grüße, Nora',
    'Arrange a doctor’s appointment and describe one simple symptom. Then change a work appointment, giving a reason and a new proposed time.',
    'Mir geht es nicht gut. Mein Hals tut weh. Ich brauche einen Termin. Können Sie morgen kommen? Ja. Können wir unseren Termin ändern? Ich muss arbeiten. Haben Sie am Freitag Zeit?'),
  pack(12,
    'Der Zug nach Bonn fährt heute von Gleis vier. Er fährt um vierzehn Uhr zehn ab. Sie müssen nicht umsteigen. In Bonn ist es kalt und es regnet. Bitte nehmen Sie eine Jacke mit.',
    [['Which platform is used?', ['Four','Five','Ten'],0,'… Gleis vier.'],['Must travellers change trains?', ['Yes','No','Only in Cologne'],1,'Sie müssen nicht umsteigen.'],['What is the weather in Bonn?', ['Warm and sunny','Snowy','Cold and rainy'],2,'… kalt und es regnet.']],
    'Hotel Linden: Doppelzimmer 80 Euro pro Nacht. Frühstück kostet 9 Euro pro Person. Das Hotel liegt neben dem Bahnhof. Anreise ab 14 Uhr, Abreise bis 11 Uhr. Hunde sind nicht erlaubt.',
    [['What does the double room cost per night?', ['80 euros','89 euros','98 euros'],0,'Doppelzimmer 80 Euro pro Nacht.'],['Is breakfast included?', ['Yes','No','Only for one person'],1,'Frühstück kostet 9 Euro pro Person.'],['By when must guests leave?', ['9:00','14:00','11:00'],2,'Abreise bis 11 Uhr.']],
    'Ask a hotel about a stay. Give your arrival and departure dates, request a room for two people, and ask the price including breakfast.',
    'Guten Tag, wir kommen am Freitag und fahren am Sonntag wieder. Haben Sie ein Doppelzimmer für uns? Was kostet das Zimmer mit Frühstück für zwei Personen? Vielen Dank. Grüße, Lea',
    'Buy a return ticket. Ask about departure time and changing trains. Your partner gives a corrected detail; repeat it to confirm. Then ask about the weather.',
    'Eine Fahrkarte nach Bonn hin und zurück, bitte. Wann fährt der Zug? Um vierzehn Uhr zehn. Muss ich umsteigen? Nein. Von Gleis fünf? Nein, Gleis vier. Also Gleis vier. Wie ist das Wetter? Es regnet.'),
  pack(13,
    'Hallo Mia, gestern war ich krank. Heute geht es mir besser. Möchtest du am Samstag ins Kino gehen? Der Film beginnt um acht. Wir können uns um halb acht vor dem Kino treffen.',
    [['Why was the speaker unavailable yesterday?', ['Work','Illness','Travel'],1,'… war ich krank.'],['When does the film begin?', ['19:30','20:00','20:30'],1,'… um acht.'],['When is the proposed meeting?', ['19:30','20:00','20:30'],0,'… um halb acht.']],
    'Hallo Ben, vielen Dank für die Einladung. Leider hatte ich gestern keine Zeit. Ich war bei meinen Eltern. Am Sonntag habe ich frei. Möchtest du mit mir schwimmen gehen? Grüße, Sara',
    [['What prevented Sara from attending?', ['No ticket','No time','A closed pool'],1,'… hatte ich … keine Zeit.'],['Where was she?', ['At work','At a cinema','With her parents'],2,'Ich war bei meinen Eltern.'],['What does she suggest?', ['Swimming on Sunday','Cinema yesterday','Work on Sunday'],0,'Am Sonntag … schwimmen gehen?']],
    'Reply to a friend’s invitation. Say you could not attend, give a simple past reason, and suggest a new activity and day.',
    'Hallo Ben, leider war ich gestern nicht da. Ich war krank und hatte keine Zeit. Am Sonntag möchte ich schwimmen gehen. Hast du dann Zeit? Schreib mir bitte. Viele Grüße, Sara',
    'Invite your partner to an activity with a clear time and place. Accept or decline, give a short reason, then agree on an alternative. Mention one past situation.',
    'Möchtest du am Samstag ins Kino gehen? Leider muss ich arbeiten. Hast du am Sonntag Zeit? Ja, gern. Treffen wir uns um sieben vor dem Kino? Gut. Gestern war ich krank, aber heute geht es mir besser.'),
  pack(14,
    'Gestern bin ich nach Bonn gefahren. Ich habe dort meine Schwester besucht. Wir haben zusammen gekocht. Am Abend bin ich nach Hause zurückgekommen. Meine Schwester ist in Bonn geblieben.',
    [['Where did the speaker travel?', ['Berlin','Bonn','Hamburg'],1,'… nach Bonn gefahren.'],['What did they do together?', ['Cooked','Bought tickets','Watched a film'],0,'… zusammen gekocht.'],['Who stayed in Bonn?', ['The speaker','Both','The sister'],2,'Meine Schwester ist in Bonn geblieben.']],
    'Liebe Eva, wir sind am Freitag in Hamburg angekommen. Am Samstag haben wir ein Museum besucht. Gestern haben wir Fahrkarten gekauft. Morgen fahren wir nach Hause. Das Hotel war sehr gut. Grüße, Tim',
    [['When did they arrive?', ['Friday','Saturday','Tomorrow'],0,'… am Freitag … angekommen.'],['What have they already bought?', ['Food','Tickets','A car'],1,'… Fahrkarten gekauft.'],['When will they go home?', ['Yesterday','Today','Tomorrow'],2,'Morgen fahren wir nach Hause.']],
    'Write a short account of an invented visit. Say where you went, describe one completed activity, and say when you returned.',
    'Hallo Eva, ich bin am Freitag nach Bonn gefahren. Dort habe ich meine Schwester besucht. Wir haben zusammen gekocht. Am Sonntag bin ich nach Hause zurückgekommen. Viele Grüße, Tim',
    'Ask your partner about yesterday and a recent short journey. Use haben and sein past forms for familiar verbs; ask a follow-up question about time or place.',
    'Was hast du gestern gemacht? Ich habe gearbeitet und gekocht. Wohin bist du am Freitag gefahren? Nach Bonn. Wen hast du besucht? Meine Schwester. Wann bist du zurückgekommen? Am Sonntag.'),
  pack(15,
    'Achtung, der Kurs beginnt morgen nicht um neun Uhr. Wir beginnen um halb zehn. Bitte kommen Sie in Raum zwölf. Der alte Raum elf ist geschlossen. Bringen Sie Ihr Buch mit.',
    [['What is the new start time?', ['9:00','9:30','10:30'],1,'… um halb zehn.'],['Which room is now used?', ['Eleven','Ten','Twelve'],2,'… Raum zwölf.'],['What should participants bring?', ['Their book','A suitcase','A ticket'],0,'Bringen Sie Ihr Buch mit.']],
    'Sie brauchen einen Abendkurs ab Mai. Angebot A: Deutschkurs Montag und Mittwoch 18–20 Uhr, Beginn 6. Mai. Angebot B: Deutschkurs Dienstag 9–12 Uhr, Beginn 7. Mai. Anmeldung: Montag bis Freitag. Am Wochenende ist das Büro geschlossen.',
    [['Which course fits the stated need?', ['A','B','Both'],0,'A: 18–20 Uhr; B: 9–12 Uhr.'],['When does offer A start?', ['6 May','7 May','Every Saturday'],0,'Beginn 6. Mai.'],['Can you register at the office on Sunday?', ['Yes','Only in May','No'],2,'Am Wochenende … geschlossen.']],
    'Write to the course office. Say you want an evening course, ask its start date, and ask how to register.',
    'Guten Tag, ich möchte einen Deutschkurs am Abend besuchen. Wann beginnt Ihr nächster Kurs? Wie kann ich mich anmelden? Bitte schicken Sie mir Informationen. Vielen Dank. Viele Grüße, Ben',
    'Confirm a changed time and room. Ask for repetition when needed. Then use unfamiliar word cards from three A1 vocabulary topics to ask and answer new questions.',
    'Der Kurs beginnt um halb zehn. Um neun Uhr? Nein, um halb zehn. Also um neun Uhr dreißig. In welchem Raum? In Raum zwölf. Können Sie das bitte wiederholen? Raum zwölf.'),
  pack(16,
    'Hallo Nora, wir treffen uns am Samstag um elf im Café am Bahnhof. Nicht im Café am Markt. Bitte bring das Buch mit. Wenn du keine Zeit hast, ruf mich heute Abend an.',
    [['When is the meeting?', ['Saturday at eleven','Saturday at twelve','This evening'],0,'… am Samstag um elf.'],['Where is it?', ['At the market café','At the station café','In a bookshop'],1,'… im Café am Bahnhof.'],['What should Nora bring?', ['A ticket','A jacket','The book'],2,'Bitte bring das Buch mit.']],
    'Anmeldung: Alex Brown kommt aus Kanada. Alex ist am 3. Februar 1999 in Toronto geboren und wohnt jetzt in Bonn, Parkstraße 14. Alex möchte einen Abendkurs besuchen. Bitte tragen Sie Familienname, Geburtsdatum, Geburtsort, Wohnort und Kurszeit in das Formular ein.',
    [['What is the family name?', ['Alex','Brown','Kanada'],1,'Alex Brown.'],['Which town belongs in Wohnort?', ['Toronto','Bonn','Kanada'],1,'… wohnt jetzt in Bonn.'],['Which course time is requested?', ['Morning','Afternoon','Evening'],2,'… einen Abendkurs.']],
    'You cannot attend a friend’s Saturday meeting. Write about 30 words: apologise, give a simple reason, and propose a new day and time. Include greeting and ending.',
    'Hallo Nora, leider kann ich am Samstag nicht kommen. Ich muss arbeiten. Können wir uns am Sonntag um elf Uhr im Café treffen? Schreib mir bitte. Viele Grüße, Alex',
    'With a partner, do all speaking parts: introduction with spelling and a number; two information questions with answers; two different requests with suitable responses. Use new cards and avoid reading a full script.',
    'Ich heiße Alex Brown. B, R, O, W, N. Ich wohne in Bonn. Meine Hausnummer ist 14. Was isst du zum Frühstück? Brot. Wann lernst du Deutsch? Am Abend. Können Sie mir bitte einen Stift geben? Ja, gern. Können Sie bitte das Fenster öffnen? Natürlich.'),
];

// Keep every model aligned with the complete task and give supported practice a vocabulary bridge.
workshops[0].writing.modelAnswer = 'Hallo! Ich heiße Lina. Ich komme aus Italien. Jetzt wohne ich in Bonn. Ich lerne Deutsch und spreche auch Italienisch.';
workshops[1].speaking.modelAnswer = workshops[1].speaking.modelAnswer.replace('Null eins sieben sechs …', 'Null eins sieben sechs, zwei null vier acht, drei eins fünf neun.') + ' Wo wohnen Sie? Ich wohne in Bonn.';
workshops[3].speaking.modelAnswer = 'Meine Schwester heißt Mia. Sie ist 19 und wohnt in Bonn. Mein Bruder heißt Ben. Er ist 16 und wohnt in Berlin. Wo wohnen deine Eltern? In Köln. Was ist das? Das ist ein Heft. Ist das dein Heft? Ja. Und das? Das ist ein Stift. Ist das dein Stift? Nein, das ist Pauls Stift. Und das? Das ist ein Buch. Ist das dein Buch? Ja, das ist mein Buch.';
workshops[5].listening.audioText = workshops[5].listening.audioText.replace('jeden Tag', 'von Montag bis Freitag');
workshops[6].writing.modelAnswer = workshops[6].writing.modelAnswer.replace('Ist Tee im Frühstück dabei?', 'Ist beim Frühstück Tee dabei?');
workshops[9].reading.text = workshops[9].reading.text.replace('Ein Balkon ist nicht vorhanden.', 'Die Wohnung hat keinen Balkon.');
workshops[9].reading.questions[2].evidence = 'Die Wohnung hat keinen Balkon.';
workshops[8].speaking.modelAnswer = 'Können Sie mir bitte einen Stift geben? Ja, gern. Können Sie bitte die Tür öffnen? Natürlich. Können Sie bitte das Fenster schließen? Ja, gern. Darf ich hier telefonieren? Leider nicht. Bitte telefonieren Sie draußen.';
workshops[9].speaking.modelAnswer = 'Wie komme ich zum Bahnhof? Gehen Sie geradeaus und dann links. Ist es weit? Nein, zehn Minuten. Meine Wohnung hat zwei Zimmer. Das Wohnzimmer ist groß. Die Küche ist klein. Der Tisch steht in der Küche. Der Schlüssel liegt auf dem Tisch.';
workshops[10].speaking.modelAnswer += ' Können wir uns am Freitag um elf Uhr treffen? Ja, das geht.';
workshops[11].listening.audioText = 'Guten Tag, hier ist das Hotel Linden in Bonn. Ihr Zug kommt heute um vierzehn Uhr zehn an Gleis vier an. Sie müssen nicht umsteigen. In Bonn ist es kalt und es regnet. Bitte nehmen Sie eine Jacke mit.';
workshops[11].listening.questions[0].evidence = '… an Gleis vier an.';
workshops[11].writing.modelAnswer = workshops[11].writing.modelAnswer.replace('Grüße, Lea', 'Mit freundlichen Grüßen, Lea');
workshops[15].writing.modelAnswer = workshops[15].writing.modelAnswer.replace('leider kann', 'es tut mir leid, ich kann');
workshops[14].speaking.modelAnswer += ' Thema Reisen: Wohin fährst du morgen? Nach Bonn. Thema Essen: Was isst du zum Frühstück? Brot und Käse. Thema Familie: Wo wohnt deine Schwester? In Berlin.';
workshops[15].speaking.modelAnswer = 'Ich heiße Alex Brown und bin 27 Jahre alt. Ich komme aus Kanada und wohne in Bonn. Ich spreche Englisch und Deutsch. Ich bin Student. Ich spiele gern Fußball. Brown: B, R, O, W, N. Meine Hausnummer ist 14. Was isst du zum Frühstück? Brot. Wann lernst du Deutsch? Am Abend. Können Sie mir bitte einen Stift geben? Ja, gern. Können Sie bitte das Fenster öffnen? Natürlich.';
workshops[2].reading.questions[0].options = ['Writing and listening','Reading and speaking','Reading and writing'];
workshops[2].reading.questions[2].options = ['Yes, new learners are welcome','No, the group is full','Only with a teacher'];
workshops[8].listening.questions[2].options = ['The course office','Other students only','The teacher'];
workshops[10].listening.questions[1].options = ['Their identity document','Their appointment letter','Their card'];
workshops[10].reading.questions[2].options = ['Frau Klein','The doctor','Amir’s colleague'];

const germanQuestions = {
  13: [
    ['Warum hatte die Person gestern keine Zeit?',['Sie musste arbeiten.','Sie war krank.','Sie war auf einer Reise.']],
    ['Wann beginnt der Film?',['Um 19.30 Uhr','Um 20 Uhr','Um 20.30 Uhr']],
    ['Wann möchten sie sich treffen?',['Um 19.30 Uhr','Um 20 Uhr','Um 20.30 Uhr']],
    ['Warum konnte Sara nicht kommen?',['Sie hatte keine Fahrkarte.','Sie hatte keine Zeit.','Das Schwimmbad war geschlossen.']],
    ['Wo war Sara?',['Bei der Arbeit','Im Kino','Bei ihren Eltern']],
    ['Was schlägt Sara vor?',['Am Sonntag schwimmen gehen','Heute ins Kino gehen','Am Sonntag arbeiten']],
  ],
  14: [
    ['Wohin ist die Person gefahren?',['Nach Berlin','Nach Bonn','Nach Hamburg']],
    ['Was haben sie zusammen gemacht?',['Gekocht','Fahrkarten gekauft','Einen Film gesehen']],
    ['Wer ist in Bonn geblieben?',['Die Person, die erzählt','Beide','Die Schwester']],
    ['Wann sind sie in Hamburg angekommen?',['Am Freitag','Am Samstag','Gestern']],
    ['Was haben sie schon gekauft?',['Essen','Fahrkarten','Ein Auto']],
    ['Wann fahren sie nach Hause?',['Gestern','Heute','Morgen']],
  ],
  15: [
    ['Wann beginnt der Kurs morgen?',['Um neun Uhr','Um halb zehn','Um halb elf']],
    ['In welchem Raum ist der Kurs jetzt?',['In Raum elf','In Raum zehn','In Raum zwölf']],
    ['Was sollen die Teilnehmer mitbringen?',['Ihr Buch','Ihr Heft','Einen Stift']],
    ['Welcher Kurs passt?',['Kurs A','Kurs B','Beide Kurse']],
    ['Wann beginnt Kurs A?',['Am 6. Mai','Am 7. Mai','Am 8. Mai']],
    ['Kann man sich am Sonntag im Büro anmelden?',['Ja','Nur im Mai','Nein']],
  ],
  16: [
    ['Wann treffen sie sich?',['Am Samstag um elf Uhr','Am Samstag um zwölf Uhr','Heute Abend']],
    ['Wo treffen sie sich?',['Im Café am Markt','Im Café am Bahnhof','In der Buchhandlung']],
    ['Was soll Nora mitbringen?',['Die Fahrkarte','Die Jacke','Das Buch']],
    ['Wie ist der Familienname?',['Alex','Brown','Kanada']],
    ['Was gehört in das Feld Wohnort?',['Toronto','Bonn','Kanada']],
    ['Wann möchte Alex einen Kurs besuchen?',['Am Morgen','Am Nachmittag','Am Abend']],
  ],
};
const glosses = {
  1:[['deutlich','clearly']], 2:[['geboren','born']], 3:[['Teilnehmer','participants'],['willkommen','welcome']],
  4:[['bei uns','with us']], 5:[['abgeben','return; hand in']], 6:[['vorbeikommen','come over']],
  7:[['enthält','includes']], 8:[['Rabatt','discount']], 9:[['ausleihen','borrow']],
  10:[['Stock','floor of a building']], 11:[['informieren','inform']],
  12:[['Anreise','arrival / check-in'],['Abreise','departure / check-out']],
  13:[['Einladung','invitation']], 14:[['angekommen','arrived']],
  15:[['Anmeldung','registration']], 16:[['eintragen','enter information in a field']],
};
for (const workshop of workshops) {
  workshop.writing.modelAnswer = formatMessage(workshop.writing.modelAnswer);
  workshop.glossary = glosses[workshop.id].map(([de,en])=>({de,en}));
  if (germanQuestions[workshop.id]) {
    workshop.questionLanguage = 'de';
    [...workshop.listening.questions,...workshop.reading.questions].forEach((question,i) => {
      [question.question,question.options] = germanQuestions[workshop.id][i];
    });
  }
}
