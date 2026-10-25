// Verb reference forms, shown alongside phrases rather than treated as new scored grammar.
const special = {
  anfangen:['fängst an','fängt an','hat angefangen'], beginnen:['beginnst','beginnt','hat begonnen'],
  bekommen:['bekommst','bekommt','hat bekommen'], bitten:['bittest','bittet','hat gebeten'],
  bleiben:['bleibst','bleibt','ist geblieben'], bringen:['bringst','bringt','hat gebracht'],
  denken:['denkst','denkt','hat gedacht'], dürfen:['darfst','darf'], essen:['isst','isst','hat gegessen'],
  fahren:['fährst','fährt','ist gefahren'], fernsehen:['siehst fern','sieht fern','hat ferngesehen'],
  finden:['findest','findet','hat gefunden'], fliegen:['fliegst','fliegt','ist geflogen'],
  geben:['gibst','gibt','hat gegeben'], gefallen:['gefällst','gefällt','hat gefallen'],
  gehen:['gehst','geht','ist gegangen'], haben:['hast','hat','hat gehabt'],
  halten:['hältst','hält','hat gehalten'], heißen:['heißt','heißt','hat geheißen'],
  helfen:['hilfst','hilft','hat geholfen'], kennen:['kennst','kennt','hat gekannt'],
  kommen:['kommst','kommt','ist gekommen'], können:['kannst','kann'],
  laufen:['läufst','läuft','ist gelaufen'], lesen:['liest','liest','hat gelesen'],
  liegen:['liegst','liegt','hat gelegen'], möchten:['möchtest','möchte'], mögen:['magst','mag'],
  müssen:['musst','muss'], nehmen:['nimmst','nimmt','hat genommen'],
  riechen:['riechst','riecht','hat gerochen'], schlafen:['schläfst','schläft','hat geschlafen'],
  schließen:['schließt','schließt','hat geschlossen'], schneiden:['schneidest','schneidet','hat geschnitten'],
  schreiben:['schreibst','schreibt','hat geschrieben'], schwimmen:['schwimmst','schwimmt','ist geschwommen'],
  sein:['bist','ist','ist gewesen'], singen:['singst','singt','hat gesungen'],
  sitzen:['sitzt','sitzt','hat gesessen'], sollen:['sollst','soll'],
  sprechen:['sprichst','spricht','hat gesprochen'], stehen:['stehst','steht','hat gestanden'],
  tragen:['trägst','trägt','hat getragen'], treffen:['triffst','trifft','hat getroffen'],
  trinken:['trinkst','trinkt','hat getrunken'], tun:['tust','tut','hat getan'],
  unterschreiben:['unterschreibst','unterschreibt','hat unterschrieben'],
  vergessen:['vergisst','vergisst','hat vergessen'], verstehen:['verstehst','versteht','hat verstanden'],
  wissen:['weißt','weiß','hat gewusst'], wollen:['willst','will'],
  ziehen:['ziehst','zieht','hat gezogen (pull); ist gezogen (move)'],
  empfehlen:['empfiehlst','empfiehlt','hat empfohlen'],
  aufstehen:['stehst auf','steht auf','ist aufgestanden'],
  reisen:['reist','reist','ist gereist'], wandern:['wanderst','wandert','ist gewandert'],
  joggen:['joggst','joggt','ist gejoggt'],
  unterrichten:['unterrichtest','unterrichtet','hat unterrichtet'],
  übernachten:['übernachtest','übernachtet','hat übernachtet'],
  gehören:['gehörst','gehört','hat gehört'], ordnen:['ordnest','ordnet','hat geordnet'],
  wiederholen:['wiederholst','wiederholt','hat wiederholt'],
  'Rad fahren':['fährst Rad','fährt Rad','ist Rad gefahren'],
  'Spaß machen':['machst Spaß','macht Spaß','hat Spaß gemacht'],
  'frei haben':['hast frei','hat frei','hat frei gehabt'],
  'kommen aus':['kommst aus','kommt aus','ist aus … gekommen'],
  'sich treffen':['triffst dich','trifft sich','hat sich getroffen'],
  'sich vorstellen':['stellst dich vor','stellt sich vor','hat sich vorgestellt'],
  'spazieren gehen':['gehst spazieren','geht spazieren','ist spazieren gegangen'],
  wehtun:['tust weh','tut weh','hat wehgetan'],
};
const separable = {
  abfahren:'fahren', abholen:'holen', ankommen:'kommen', ankreuzen:'kreuzen', anrufen:'rufen',
  aufhören:'hören', aufräumen:'räumen', aufstehen:'stehen', ausfüllen:'füllen', ausgehen:'gehen',
  aussehen:'sehen', aussteigen:'steigen', einkaufen:'kaufen', einladen:'laden', einsteigen:'steigen',
  mitbringen:'bringen', mitkommen:'kommen', mitnehmen:'nehmen', umsteigen:'steigen',
  zurückkommen:'kommen', zurückrufen:'rufen', zuordnen:'ordnen',
};
Object.assign(special, {
  rufen:['rufst','ruft','hat gerufen'], sehen:['siehst','sieht','hat gesehen'],
  steigen:['steigst','steigt','ist gestiegen'], laden:['lädst','lädt','hat geladen'],
});
function formsFor(de, en) {
  if (special[de]) return special[de];
  if (separable[de]) {
    const base = separable[de], prefix = de.slice(0, -base.length);
    const f = formsFor(base,'to ');
    if (!f) return null;
    const past = f[2]?.replace(/^(hat|ist) /, `$1 ${prefix}`);
    return [`${f[0]} ${prefix}`,`${f[1]} ${prefix}`,past];
  }
  if (!en.startsWith('to ') || !/^[a-zäöüß]+(en|ern|eln)$/.test(de)) return null;
  const stem = de.endsWith('en') ? de.slice(0,-2) : de.slice(0,-1);
  const extraE = /(t|d|chn|fn|gn)$/.test(stem);
  const du = stem + (extraE ? 'est' : /[sßzx]$/.test(stem) ? 't' : 'st');
  const er = stem + (extraE ? 'et' : 't');
  const ge = /^(be|emp|ent|er|ver|zer)/.test(de) || de.endsWith('ieren') ? '' : 'ge';
  return [du,er,`hat ${ge}${er}`];
}
export function enrichVocabulary(words) {
  for (const w of words) {
    const f = formsFor(w.de,w.en);
    if (f) w.forms = `du ${f[0]} · er/sie/es ${f[1]}${f[2] ? ` · ${f[2]}` : ''}`;
    if (['regnen','schneien','kosten','dauern'].includes(w.de) && f) w.forms = `es ${f[1]} · ${f[2]}`;
    if (w.de === 'das Gleis') w.en = 'track; platform in station announcements';
    if (w.de === 'die Öffnungszeit') w.en = 'opening time; opening hours (plural)';
  }
}
export function addEssentialVocabulary(topics) {
  const rows = [
    ['food','der Preis','price','Preise','Der Preis ist fünf Euro.','The price is five euros.'],
    ['time','das Datum','date','Daten','Welches Datum ist heute?','What is today’s date?'],
    ['freetime','das Geschenk','present; gift','Geschenke','Das Geschenk ist für dich.','The present is for you.'],
    ['describe','gefallen','to please; to be liked',null,'Die Jacke gefällt mir.','I like the jacket.'],
    ['home','die Möbel','furniture','pl','Die Möbel sind neu.','The furniture is new.'],
    ['town','die Polizei','police','-','Die Polizei ist am Bahnhof.','The police are at the station.'],
    ['travel','das Taxi','taxi','Taxis','Ich nehme ein Taxi.','I will take a taxi.'],
    ['town','der Norden','north','-','Hamburg liegt im Norden.','Hamburg is in the north.'],
    ['town','der Süden','south','-','München liegt im Süden.','Munich is in the south.'],
    ['town','der Osten','east','-','Der Osten ist rechts auf der Karte.','East is on the right of the map.'],
    ['town','der Westen','west','-','Der Westen ist links auf der Karte.','West is on the left of the map.'],
    ['food','empfehlen','to recommend',null,'Was empfehlen Sie?','What do you recommend?'],
    ['kitchen','das Getränk','drink','Getränke','Welches Getränk möchten Sie?','Which drink would you like?'],
  ];
  const existing = new Set(topics.flatMap(t=>t.vocab.map(w=>w.de)));
  for (const [id,de,en,pl,exDe,exEn] of rows) {
    if (existing.has(de)) continue;
    topics.find(t=>t.id===id).vocab.push({de,en,...(pl ? {pl}:{}),ex:{de:exDe,en:exEn}});
    existing.add(de);
  }
}
