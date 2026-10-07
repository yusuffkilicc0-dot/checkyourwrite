/* Mündlich Pratik — telc A2 / B1 / B2 sınav simülasyonu: format + konu bankası.
   Formatlar telc'in resmi Übungstest / Tipps belgelerine göre:
   - A2  telc Deutsch A2 (Start Deutsch 2): hazırlık yok; Teil 1 Sich vorstellen (~3'),
         Teil 2 Ein Alltagsgespräch führen (~4'), Teil 3 Etwas aushandeln (~4').
   - B1  telc Deutsch B1 (Zertifikat Deutsch): 20' hazırlık; Teil 1 Einander kennenlernen (~3'),
         Teil 2 Über ein Thema sprechen (~6'), Teil 3 Gemeinsam etwas planen (~6').
   - B2  telc Deutsch B2: 20' hazırlık; Einander kennenlernen (puansız), Teil 1 Über Erfahrungen
         sprechen (~5'), Teil 2 Diskussion (~5'), Teil 3 Gemeinsam etwas planen (~5').
   Tüm konu, metin ve replikler bu site için özgün olarak yazılmıştır; telc materyalinden
   alıntı yoktur (yalnızca sınavın bölüm yapısı ve görev tipleri telc formatına uyar).
   Gerçek sınav çift kişiliktir; tek kişilik sınavda partnerin rolünü bir sınav görevlisi
   üstlenir. Simülasyonda partner rolünü uygulama (sesli) oynar.

   Bir "turn" (sıra):
     who    : "Prüfer" | "Partner"           — konuşan
     say    : Almanca metin (ekranda + 🔊)    — boş olabilir
     task   : Türkçe kısa yönerge (ekranda)
     kind   : "answer"  → kullanıcı cevap verir
              "ask"     → kullanıcı soru sorar (sonra partner `reply` ile cevaplar)
              "monologue" → kullanıcı kısa sunum/anlatım yapar (`target` sn)
              "listen"  → sadece dinlenir, kayıt yok
     target : önerilen konuşma süresi (sn)
     reply  : kullanıcıdan sonra partnerin söylediği (opsiyonel)
*/
(function () {
  "use strict";

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  /* Son kullanılanları tekrar seçmeyen rastgele seçim. Geçmiş tarayıcıda saklanır,
     böylece sayfa yenilense de aynı konu art arda gelmez. Dizinin yarısı (en fazla 8)
     kadar son konu "dinlenmede" tutulur. */
  function pickFresh(key, arr) {
    const storeKey = "cyw_mdl_recent:" + key;
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem(storeKey)) || []; } catch (e) { recent = []; }
    recent = recent.filter(i => Number.isInteger(i) && i < arr.length);
    const keep = Math.min(8, Math.floor(arr.length / 2));
    recent = recent.slice(-keep);
    const allowed = arr.map((_, i) => i).filter(i => !recent.includes(i));
    const idx = allowed.length ? allowed[Math.floor(Math.random() * allowed.length)] : Math.floor(Math.random() * arr.length);
    recent.push(idx);
    try { localStorage.setItem(storeKey, JSON.stringify(recent.slice(-keep))); } catch (e) { /* gizli sekme */ }
    return arr[idx];
  }
  function pickN(arr, n) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, n);
  }

  /* ════════════════════════════════ A2 ════════════════════════════════ */
  const A2_EXTRA_QS = [
    "Seit wann wohnen Sie schon in Ihrer Stadt?",
    "Was gefällt Ihnen an Ihrem Wohnort?",
    "Warum lernen Sie Deutsch?",
    "Was machen Sie gern in Ihrer Freizeit?",
    "Haben Sie Geschwister?",
    "Wie lange lernen Sie schon Deutsch?",
    "Was essen Sie besonders gern?",
    "Wie kommen Sie normalerweise zur Arbeit oder zum Kurs?",
    "Was haben Sie letztes Wochenende gemacht?",
    "Wie sieht Ihre Wohnung aus?",
    "Was ist Ihr Lieblingsessen aus Ihrem Heimatland?",
    "Welche Sprachen sprechen Sie in Ihrer Familie?"
  ];

  // Teil 1'de kendini tanıtan partner (her sınavda farklı biri)
  const A2_PARTNERS = [
    { intro: "Hallo, ich bin Lena. Ich komme aus Österreich und wohne jetzt in Köln. Ich bin Krankenschwester.", reply: "Ich lerne Deutsch für meine Arbeit. In meiner Freizeit gehe ich gern schwimmen." },
    { intro: "Guten Tag, mein Name ist Ahmed. Ich komme aus Syrien und wohne seit einem Jahr in Leipzig. Ich bin Elektriker.", reply: "Ich habe zwei Kinder. Am Wochenende spielen wir oft Fußball im Park." },
    { intro: "Hallo, ich heiße Maria. Ich bin 29 Jahre alt und komme aus Portugal. Ich arbeite in einem Hotel.", reply: "Ich wohne mit meiner Freundin in einer kleinen Wohnung. Ich koche sehr gern." },
    { intro: "Hi, ich bin Kenji aus Japan. Ich studiere Informatik in München.", reply: "Ich lerne seit acht Monaten Deutsch. Am liebsten höre ich deutsche Musik." },
    { intro: "Hallo, ich bin Olga. Ich komme aus der Ukraine und wohne in Dresden. Ich bin Lehrerin.", reply: "Meine Familie wohnt noch in Kiew. Ich telefoniere jeden Tag mit meiner Mutter." },
    { intro: "Guten Tag, ich heiße Carlos. Ich komme aus Mexiko und arbeite als Koch in Hamburg.", reply: "In meiner Freizeit tanze ich Salsa und treffe Freunde." },
    { intro: "Hallo, mein Name ist Fatma. Ich bin 35 und komme aus der Türkei. Ich wohne in Dortmund.", reply: "Ich habe drei Kinder und arbeite halbtags in einem Supermarkt." },
    { intro: "Hallo, ich bin Pierre aus Frankreich. Ich bin 24 und mache eine Ausbildung als Mechaniker.", reply: "Ich fahre sehr gern Fahrrad, auch zur Arbeit." },
    { intro: "Hallo, ich heiße Priya. Ich komme aus Indien und arbeite als Programmiererin in Berlin.", reply: "Ich spreche Hindi, Englisch und jetzt ein bisschen Deutsch." },
    { intro: "Guten Tag, ich bin Tomasz aus Polen. Ich wohne in Frankfurt und bin Busfahrer.", reply: "Am Wochenende gehe ich gern angeln oder wandern." }
  ];

  const A2_T2 = [
    { theme: "Freizeit und Hobbys", hint: "Was machen Sie gern, wenn Sie frei haben?",
      cards: ["Was …?", "Wo …?", "Mit wem …?", "Seit wann …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Wie viel Zeit …?“ könnte man fragen: Wie viel Zeit haben Sie pro Woche für Ihr Hobby?",
      partnerQs: ["Was machst du am liebsten nach der Arbeit?", "Wo triffst du deine Freunde?", "Seit wann hast du dein Hobby?"],
      partnerReplies: ["Ich spiele Gitarre und gehe zweimal pro Woche ins Fitnessstudio.", "Meistens in einem Café in der Innenstadt.", "Ungefähr seit fünf Jahren. Ein Freund hat es mir gezeigt."] },
    { theme: "Wochenende", hint: "Was machen Sie am Samstag und am Sonntag?",
      cards: ["Was …?", "Mit wem …?", "Wohin …?", "Wann …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Wie lange …?“ könnte man fragen: Wie lange schlafen Sie am Sonntag?",
      partnerQs: ["Was machst du gern am Samstag?", "Mit wem verbringst du dein Wochenende?", "Wohin fährst du am Sonntag manchmal?"],
      partnerReplies: ["Am Samstag gehe ich meistens einkaufen und am Abend treffe ich Freunde.", "Meistens mit meiner Familie, manchmal auch mit Kollegen.", "Am liebsten an einen See oder in den Park."] },
    { theme: "Essen und Trinken", hint: "Was essen und trinken Sie gern? Wo und wann?",
      cards: ["Was …?", "Wo …?", "Wie oft …?", "Wer …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Wann …?“ könnte man fragen: Wann essen Sie zu Mittag?",
      partnerQs: ["Was kochst du gern?", "Wie oft gehst du ins Restaurant?", "Was trinkst du am Morgen?"],
      partnerReplies: ["Ich esse sehr gern Nudeln mit Gemüse.", "Ungefähr einmal im Monat, das ist ziemlich teuer.", "Bei uns kocht meistens mein Mann, er kocht besser als ich."] },
    { theme: "Wohnen", hint: "Wie und wo wohnen Sie?",
      cards: ["Wo …?", "Wie groß …?", "Mit wem …?", "Was …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Wie viele …?“ könnte man fragen: Wie viele Zimmer hat Ihre Wohnung?",
      partnerQs: ["Wo wohnst du genau?", "Wie groß ist deine Wohnung?", "Mit wem wohnst du zusammen?"],
      partnerReplies: ["Ich wohne in der Nähe vom Bahnhof, im dritten Stock.", "Meine Wohnung hat zwei Zimmer, eine Küche und einen kleinen Balkon.", "Am liebsten mag ich mein Wohnzimmer, da ist viel Licht."] },
    { theme: "Einkaufen", hint: "Wo, wann und was kaufen Sie ein?",
      cards: ["Wo …?", "Wann …?", "Was …?", "Wie viel …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Wie oft …?“ könnte man fragen: Wie oft gehen Sie in den Supermarkt?",
      partnerQs: ["Wo kaufst du am liebsten ein?", "Wann gehst du meistens einkaufen?", "Was kaufst du gern im Internet?"],
      partnerReplies: ["Ich kaufe meistens im Supermarkt in meiner Straße ein.", "Am Samstagvormittag, dann habe ich Zeit.", "Für Lebensmittel brauche ich ungefähr siebzig Euro pro Woche."] },
    { theme: "Urlaub und Reisen", hint: "Wohin reisen Sie gern? Wie und mit wem?",
      cards: ["Wohin …?", "Wie …?", "Mit wem …?", "Wie lange …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Wann …?“ könnte man fragen: Wann machen Sie Urlaub?",
      partnerQs: ["Wohin bist du zuletzt gereist?", "Wie reist du am liebsten – mit dem Zug, dem Auto oder dem Flugzeug?", "Mit wem machst du gern Urlaub?"],
      partnerReplies: ["Letzten Sommer war ich in Spanien am Meer.", "Am liebsten mit dem Zug, das ist bequem.", "Meistens zwei Wochen im Sommer."] },
    { theme: "Arbeit und Beruf", hint: "Was arbeiten Sie und wie sieht Ihr Arbeitstag aus?",
      cards: ["Wo …?", "Wann …?", "Was …?", "Wie …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Wie viele Stunden …?“ könnte man fragen: Wie viele Stunden arbeiten Sie pro Woche?",
      partnerQs: ["Wo arbeitest du?", "Wann fängt deine Arbeit an?", "Was machst du in der Mittagspause?"],
      partnerReplies: ["Ich arbeite in einer Bäckerei in der Altstadt.", "Meistens um sechs Uhr morgens, das ist sehr früh.", "Mit dem Fahrrad, das dauert nur zehn Minuten."] },
    { theme: "Familie", hint: "Erzählen Sie von Ihrer Familie.",
      cards: ["Wer …?", "Wo …?", "Wie oft …?", "Was …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Wie viele …?“ könnte man fragen: Wie viele Geschwister haben Sie?",
      partnerQs: ["Wo wohnt deine Familie?", "Wie oft siehst du deine Eltern?", "Was macht ihr gern zusammen?"],
      partnerReplies: ["Meine Eltern wohnen in Wien, mein Bruder wohnt in Berlin.", "Leider nur zweimal im Jahr, an Weihnachten und im Sommer.", "Wir kochen zusammen und spielen Karten."] },
    { theme: "Gesundheit", hint: "Was machen Sie für Ihre Gesundheit?",
      cards: ["Was …?", "Wie oft …?", "Wann …?", "Warum …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Wie lange …?“ könnte man fragen: Wie lange schlafen Sie normalerweise?",
      partnerQs: ["Was machst du, wenn du erkältet bist?", "Wie oft gehst du zum Arzt?", "Isst du gesund?"],
      partnerReplies: ["Ich gehe jeden Tag eine halbe Stunde spazieren.", "Nur wenn ich wirklich krank bin, vielleicht einmal im Jahr.", "Ich trinke viel Tee und bleibe im Bett."] },
    { theme: "Unterwegs in der Stadt", hint: "Wie kommen Sie in Ihrer Stadt von A nach B?",
      cards: ["Wie …?", "Wie lange …?", "Wie viel …?", "Wohin …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Wie oft …?“ könnte man fragen: Wie oft fahren Sie mit der U-Bahn?",
      partnerQs: ["Wie kommst du zur Arbeit oder zum Kurs?", "Hast du ein Auto oder ein Fahrrad?", "Wohin fährst du am liebsten in der Stadt?"],
      partnerReplies: ["Ich fahre mit der Straßenbahn, das ist am bequemsten.", "Ungefähr zwanzig Minuten, wenn kein Stau ist.", "Ich habe ein Monatsticket, das kostet neunundvierzig Euro."] },
    { theme: "Feste und Geburtstage", hint: "Wie feiern Sie gern?",
      cards: ["Wann …?", "Wo …?", "Mit wem …?", "Was …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Welches …?“ könnte man fragen: Welches Fest ist Ihnen am wichtigsten?",
      partnerQs: ["Wann hast du Geburtstag?", "Wie feierst du deinen Geburtstag?", "Was war dein schönstes Geschenk?"],
      partnerReplies: ["Am liebsten feiere ich zu Hause mit ein paar Freunden.", "Meistens mit meiner Familie und meinen besten Freunden.", "Es gibt immer einen großen Kuchen und viel Musik."] },
    { theme: "Kleidung und Einkaufen", hint: "Was ziehen Sie gern an und wo kaufen Sie Kleidung?",
      cards: ["Was …?", "Wo …?", "Wie viel …?", "Welche Farbe …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Wann …?“ könnte man fragen: Wann kaufen Sie neue Kleidung?",
      partnerQs: ["Was trägst du am liebsten?", "Wo kaufst du deine Kleidung?", "Welche Farbe magst du am meisten?"],
      partnerReplies: ["Ich trage am liebsten Jeans und T-Shirts.", "Oft in Second-Hand-Läden, das ist billiger.", "Für eine Jacke gebe ich höchstens achtzig Euro aus."] },
    { theme: "Wetter und Jahreszeiten", hint: "Welches Wetter mögen Sie? Was machen Sie bei Regen oder Sonne?",
      cards: ["Welche …?", "Was …?", "Wohin …?", "Warum …?", "…?"],
      example: "Ein Beispiel: Mit der Karte „Wie …?“ könnte man fragen: Wie ist das Wetter in Ihrem Heimatland im Winter?",
      partnerQs: ["Welche Jahreszeit magst du am liebsten?", "Was machst du, wenn es regnet?", "Wie ist das Wetter in deiner Heimat?"],
      partnerReplies: ["Ich mag den Herbst, die Farben sind so schön.", "Dann bleibe ich zu Hause und lese ein Buch.", "Im Sommer fahre ich gern an die Ostsee."] }
  ];

  const A2_T3 = [
    { title: "Ein Sonntag in der Stadt", task: "Am Sonntag haben Sie beide frei und wollen zusammen etwas in Ihrer Stadt unternehmen. Sprechen Sie über Ihre Ideen und einigen Sie sich auf zwei Aktivitäten.",
      mine: ["Zoo", "Picknick im Park", "Stadtführung", "Minigolf", "…?"],
      partnerLines: [
        "Ich habe Lust auf einen Flohmarkt. Da kann man schöne Sachen finden. Kommst du mit?",
        "Okay, und was ist deine Idee? Was möchtest du gern machen?",
        "Das klingt gut! Um wie viel Uhr wollen wir anfangen? Ich schlafe am Sonntag gern lange.",
        "Prima. Und was machen wir danach, am Nachmittag?"
      ] },
    { title: "Ein Wochenende in Hamburg", task: "Sie wollen zusammen ein Wochenende nach Hamburg fahren und dort etwas unternehmen. Jeder hat andere Vorschläge. Finden Sie passende Aktivitäten.",
      mine: ["Hafenrundfahrt", "Museum", "Einkaufen gehen", "Fischmarkt", "…?"],
      partnerLines: [
        "Ich möchte gern in ein Musical gehen. Hast du Lust?",
        "Ach so. Was möchtest du lieber machen?",
        "Okay! Und wann machen wir das – am Samstag oder am Sonntag?",
        "Gut. Dann müssen wir noch festlegen: Um wie viel Uhr und wo treffen wir uns?"
      ] },
    { title: "Ein Geburtstagsgeschenk", task: "Eine Freundin aus dem Deutschkurs hat bald Geburtstag. Sie wollen zusammen ein Geschenk kaufen. Was kaufen Sie? Wie viel kostet es? Wer kauft es?",
      mine: ["Blumen", "ein Buch", "Kinokarten", "einen Kuchen", "…?"],
      partnerLines: [
        "Ich finde, wir können ihr eine Tasche schenken. Was denkst du?",
        "Was hast du denn für eine Idee?",
        "Wie viel Geld wollen wir ausgeben? Ich denke, zwanzig Euro pro Person.",
        "Und wer kauft das Geschenk – du oder ich? Wann?"
      ] },
    { title: "Zusammen kochen", task: "Sie wollen am Wochenende zusammen kochen und Freunde einladen. Was kochen Sie? Was kaufen Sie? Wer macht was?",
      mine: ["Suppe", "Pizza", "Salat", "Nachtisch", "…?"],
      partnerLines: [
        "Ich möchte gern Nudeln mit Tomatensoße kochen. Magst du das?",
        "Was möchtest du denn kochen?",
        "Gut. Wer kauft ein? Ich habe am Freitag keine Zeit.",
        "Okay. Wann sollen die Freunde kommen?"
      ] },
    { title: "Sport zusammen machen", task: "Sie wollen zusammen Sport machen. Welcher Sport? Wann? Wo? Finden Sie zwei Aktivitäten, die Sie beide mögen.",
      mine: ["Schwimmen", "Joggen", "Yoga", "Tennis", "…?"],
      partnerLines: [
        "Ich gehe gern Fahrrad fahren. Fährst du auch gern Fahrrad?",
        "Was machst du lieber?",
        "Gute Idee. Wann können wir das machen? Ich habe am Mittwoch frei.",
        "Und wo treffen wir uns?"
      ] },
    { title: "Ein Kinoabend", task: "Sie wollen diese Woche zusammen etwas am Abend unternehmen. Sprechen Sie über Ihre Ideen und finden Sie einen passenden Abend und ein Programm.",
      mine: ["Kino", "Konzert", "Bowling", "Restaurant", "…?"],
      partnerLines: [
        "Ich möchte gern ins Theater gehen. Magst du Theater?",
        "Hm, was möchtest du lieber machen?",
        "Gute Idee. Welcher Tag passt dir? Ich kann am Donnerstag oder am Freitag.",
        "Okay. Wo und um wie viel Uhr treffen wir uns?"
      ] },
    { title: "Eine Freundin im Krankenhaus besuchen", task: "Eine Freundin aus dem Kurs liegt im Krankenhaus. Sie wollen sie zusammen besuchen. Was bringen Sie mit? Wann gehen Sie hin?",
      mine: ["Obst", "Zeitschriften", "Schokolade", "eine Karte", "…?"],
      partnerLines: [
        "Ich denke, wir bringen ihr Blumen mit. Was meinst du?",
        "Was möchtest du ihr mitbringen?",
        "Wann können wir hingehen? Die Besuchszeit ist von 14 bis 18 Uhr.",
        "Gut. Fahren wir zusammen mit dem Bus?"
      ] },
    { title: "Eine Fahrradtour", task: "Am Wochenende soll das Wetter schön sein. Sie wollen zusammen eine Fahrradtour machen. Wohin fahren Sie? Was nehmen Sie mit?",
      mine: ["zum See", "Picknick mitnehmen", "Samstagmorgen", "Fotos machen", "…?"],
      partnerLines: [
        "Ich würde gern in den Wald fahren. Da ist es schön ruhig. Wie findest du das?",
        "Und was ist deine Idee?",
        "Wann fahren wir los? Ich stehe am Wochenende nicht so gern früh auf.",
        "Was nehmen wir zum Essen mit?"
      ] },
    { title: "Eine Party im Deutschkurs", task: "Ihr Deutschkurs ist bald zu Ende. Sie wollen zusammen eine kleine Party im Kursraum machen. Was brauchen Sie? Wer macht was?",
      mine: ["Getränke", "Kuchen", "Musik", "Spiele", "…?"],
      partnerLines: [
        "Ich kann einen Salat machen. Was bringst du mit?",
        "Und was machen wir mit der Musik?",
        "Wer kauft die Getränke? Ich habe kein Auto.",
        "Gut. Und wer fragt die Lehrerin, ob wir den Raum benutzen dürfen?"
      ] },
    { title: "Einem Freund beim Umzug helfen", task: "Ein Freund zieht am Samstag um. Sie wollen ihm zusammen helfen. Was machen Sie? Wann kommen Sie?",
      mine: ["Kisten tragen", "Küche einpacken", "Essen kaufen", "Auto mieten", "…?"],
      partnerLines: [
        "Ich kann am Samstagmorgen kommen. Wann kannst du?",
        "Was möchtest du lieber machen – tragen oder einpacken?",
        "Wer kümmert sich um das Essen für alle?",
        "Super. Wann treffen wir uns genau?"
      ] }
  ];

  function buildA2Part(part) {
    if (part === 1) {
      const extra = pickN(A2_EXTRA_QS, 2);
      const partner = pickFresh("A2-partner", A2_PARTNERS);
      return {
        key: "t1", name: "Teil 1 · Sich vorstellen", dur: "ca. 3 Min.",
        card: { title: "Über mich", lines: ["Name · Herkunft · Wohnort", "Familie · Alter", "Arbeit oder Schule", "Sprachen · Freizeit"] },
        topic: "Sich vorstellen",
        turns: [
          { who: "Prüfer", say: "Hallo und herzlich willkommen! Zuerst möchten wir Sie ein wenig kennenlernen. Erzählen Sie bitte etwas über sich.", task: "Karttaki başlıkları kullanarak kendini tanıt (isim, nereden geldiğin, şehir, aile, iş/okul, diller, boş zaman).", kind: "monologue", target: 60 },
          { who: "Prüfer", say: extra[0], task: "Sınav görevlisinin ek sorusunu cevapla.", kind: "answer", target: 30 },
          { who: "Prüfer", say: extra[1], task: "İkinci ek soruyu cevapla.", kind: "answer", target: 30 },
          { who: "Partner", say: partner.intro, task: "Partnerine kendisiyle ilgili bir soru sor.", kind: "ask", target: 20,
            reply: partner.reply }
        ]
      };
    }
    if (part === 2) {
      const t = pickFresh("A2-t2", A2_T2);
      const myCards = pickN(t.cards.slice(0, 4), 2).concat(["…?"]);
      return {
        key: "t2", name: "Teil 2 · Ein Alltagsgespräch führen", dur: "ca. 4 Min.",
        card: { title: "Thema: " + t.theme, lines: ["Senin kartların: " + myCards.join("  ·  "), "(„…?“ = Joker: istediğin soruyu sor)"] },
        topic: t.theme,
        turns: [
          { who: "Prüfer", say: "Danke. Jetzt sprechen Sie zusammen über ein Alltagsthema: " + t.theme + ". " + t.hint + " Sie stellen einander Fragen mit Ihren Karten. " + t.example, task: "Örnek soruyu cevapla, böylece görevi anladığını göster.", kind: "answer", target: 20 },
          { who: "Partner", say: t.partnerQs[0], task: "Partnerinin sorusunu cevapla.", kind: "answer", target: 25 },
          { who: "Partner", say: "", task: "Kartın: „" + myCards[0] + "“ — bu kelimeyle konuya uygun bir soru sor.", kind: "ask", target: 15, reply: t.partnerReplies[0] },
          { who: "Partner", say: t.partnerQs[1], task: "Partnerinin sorusunu cevapla.", kind: "answer", target: 25 },
          { who: "Partner", say: "", task: "Kartın: „" + myCards[1] + "“ — bu kelimeyle bir soru sor.", kind: "ask", target: 15, reply: t.partnerReplies[1] },
          { who: "Partner", say: t.partnerQs[2], task: "Partnerinin sorusunu cevapla.", kind: "answer", target: 25 },
          { who: "Partner", say: "", task: "Joker kartın „…?“ — konuyla ilgili istediğin bir soruyu sor.", kind: "ask", target: 15, reply: t.partnerReplies[2] }
        ]
      };
    }
    const t = pickFresh("A2-t3", A2_T3);
    return {
      key: "t3", name: "Teil 3 · Etwas aushandeln", dur: "ca. 4 Min.",
      card: { title: t.title, lines: [t.task, "Senin önerilerin: " + t.mine.join("  ·  ")] },
      topic: t.title,
      turns: [
        { who: "Prüfer", say: "Sehr gut. Zum Schluss treffen Sie zusammen eine Entscheidung. " + t.task, task: "Görevi dinle. Partnerinle birlikte karar vereceksiniz.", kind: "listen" },
        { who: "Partner", say: t.partnerLines[0], task: "Partnerinin önerisine tepki ver (kabul et ya da nedeniyle reddet).", kind: "answer", target: 25 },
        { who: "Partner", say: t.partnerLines[1], task: "Kendi kartından bir öneri yap ve nedenini söyle.", kind: "answer", target: 30 },
        { who: "Partner", say: t.partnerLines[2], task: "Zaman/ayrıntı konusunda anlaş.", kind: "answer", target: 25 },
        { who: "Partner", say: t.partnerLines[3], task: "Anlaşmayı netleştir (ne, ne zaman, nerede).", kind: "answer", target: 25 }
      ]
    };
  }

  /* ════════════════════════════════ B1 ════════════════════════════════ */
  const B1_EXTRA = [
    "Wie verbringen Sie normalerweise Ihr Wochenende?",
    "Welche Hobbys haben Sie?",
    "Was möchten Sie mit Ihren Deutschkenntnissen später machen?",
    "Was gefällt Ihnen an der Stadt, in der Sie wohnen, und was nicht?",
    "Was war für Sie am Anfang in Deutschland besonders schwierig?",
    "Wie sieht ein ganz normaler Tag bei Ihnen aus?",
    "Was vermissen Sie aus Ihrem Heimatland am meisten?",
    "Welche Pläne haben Sie für die nächsten Jahre?",
    "Wie halten Sie Kontakt zu Familie und Freunden im Ausland?",
    "Was machen Sie, um Ihr Deutsch zu verbessern?",
    "Erzählen Sie von einem schönen Erlebnis im letzten Jahr.",
    "Wie haben Sie Ihre Wohnung gefunden?"
  ];

  // Teil 1: Partner (her sınavda farklı biri). greet → isim/köken sorusu,
  // home → yaşam/aile sorusu, reply → kullanıcının sorusuna cevap, lang → dil sorusu
  const B1_PARTNERS = [
    { name: "Tom", greet: "Hallo, ich heiße Tom. Ich komme aus England, aus Manchester. Und du? Wie heißt du und woher kommst du?",
      home: "Und wie wohnst du hier? In einer Wohnung oder in einem Haus? Mit deiner Familie?",
      reply: "Ich arbeite als Koch in einem Restaurant. Deutsch habe ich zuerst in der Volkshochschule gelernt, jetzt lerne ich vor allem bei der Arbeit.",
      lang: "Wo hast du Deutsch gelernt? Und welche Sprachen sprichst du noch?" },
    { name: "Sara", greet: "Hallo! Ich bin Sara und komme aus Italien, aus der Nähe von Neapel. Wie heißt du denn, und woher kommst du?",
      home: "Wohnst du allein oder mit anderen zusammen? Ich wohne in einer WG mit zwei Studentinnen.",
      reply: "Ich studiere Medizin hier in Heidelberg. Meine Familie ist in Italien, aber meine Schwester kommt mich oft besuchen.",
      lang: "Wie lange lernst du schon Deutsch? Und warum hast du angefangen?" },
    { name: "Yusuf", greet: "Hallo, ich bin Yusuf. Ich komme aus Marokko und lebe seit drei Jahren in Bremen. Und du, woher kommst du?",
      home: "Hast du Familie hier in Deutschland, oder bist du allein hergekommen?",
      reply: "Ich bin Pflegefachkraft in einem Altenheim. Die Arbeit ist anstrengend, aber sie macht mir Spaß.",
      lang: "Welche Sprachen sprichst du? Ich spreche Arabisch, Französisch und jetzt Deutsch." },
    { name: "Anna", greet: "Guten Tag, ich heiße Anna und komme aus Polen. Wie heißen Sie, und wo kommen Sie her?",
      home: "Wie gefällt Ihnen Ihre Wohnung hier? Ich suche gerade eine neue, das ist gar nicht so einfach.",
      reply: "Ich bin Bürokauffrau in einer Spedition. In meiner Freizeit singe ich in einem Chor.",
      lang: "Wo haben Sie Deutsch gelernt? In einem Kurs oder allein?" },
    { name: "Daniel", greet: "Hi, ich bin Daniel aus Brasilien. Ich bin vor einem Jahr nach Stuttgart gekommen. Und du, wie heißt du?",
      home: "Wohnst du in der Stadt oder eher außerhalb?",
      reply: "Ich bin Ingenieur bei einem Autozulieferer. Meine Frau und ich haben eine kleine Tochter.",
      lang: "Was war beim Deutschlernen für dich am schwierigsten? Für mich sind es die Artikel!" },
    { name: "Mei", greet: "Hallo, mein Name ist Mei. Ich komme aus China, aus Shanghai. Wie ist dein Name und woher kommst du?",
      home: "Was machst du beruflich? Oder studierst du noch?",
      reply: "Ich mache gerade meinen Master in Wirtschaft. Nebenbei arbeite ich in einem Café.",
      lang: "Welche Sprachen sprichst du außer Deutsch?" },
    { name: "Lukas", greet: "Servus, ich bin Lukas und komme aus Österreich. Ich arbeite hier in München. Und wer bist du?",
      home: "Erzähl mal von deiner Familie. Hast du Geschwister?",
      reply: "Ich bin Physiotherapeut. Meine Freundin kommt aus Spanien, deshalb lerne ich gerade Spanisch.",
      lang: "Wie hast du Deutsch gelernt – im Kurs, mit Apps oder bei der Arbeit?" },
    { name: "Amira", greet: "Hallo, ich bin Amira. Ich komme aus Ägypten und wohne seit sechs Monaten in Köln. Woher kommst du?",
      home: "Wie wohnst du? Ich wohne bei einer Gastfamilie, das ist sehr nett.",
      reply: "Ich bin Zahnärztin und warte gerade auf die Anerkennung meines Abschlusses.",
      lang: "Brauchst du Deutsch für deinen Beruf? Ich brauche für meine Arbeit das Niveau C1." },
    { name: "Ivan", greet: "Guten Tag, ich heiße Ivan und komme aus Bulgarien. Wie heißen Sie?",
      home: "Und wie sieht Ihre Familie aus? Sind Sie verheiratet?",
      reply: "Ich arbeite als Lkw-Fahrer und bin deshalb oft unterwegs. Am Wochenende bin ich bei meiner Familie.",
      lang: "Welche Sprachen sprechen Sie? Ich spreche auch etwas Russisch." },
    { name: "Elena", greet: "Hallo zusammen! Ich bin Elena aus Spanien. Und du? Erzähl mal, woher kommst du?",
      home: "Wo wohnst du hier genau? Gefällt dir das Viertel?",
      reply: "Ich arbeite als Erzieherin in einem Kindergarten. Die Kinder helfen mir sehr beim Deutschlernen!",
      lang: "Wo und wie lange hast du Deutsch gelernt?" }
  ];

  const B1_T2 = [
    { theme: "Selbst kochen oder Essen bestellen?",
      mine: { name: "Lukas, 31, Pfleger", quote: "Nach der Schicht bin ich oft zu müde zum Kochen. Dann bestelle ich mir einfach etwas. Das spart Zeit, und es gibt so viel Auswahl – heute Pizza, morgen Sushi." },
      partner: { name: "Ayla, 44, Buchhalterin", quote: "Ich koche jeden Abend frisch für meine Familie. Das ist gesünder und viel billiger als Essen vom Lieferdienst. Und zusammen kochen macht auch Spaß." },
      partnerLines: ["Auf meinem Blatt erzählt Ayla, dass sie jeden Abend frisch kocht. Sie findet, das ist gesünder und billiger als ein Lieferdienst, und mit der Familie zusammen zu kochen macht ihr Spaß.",
        "Wie ist das bei dir? Kochst du selbst oder bestellst du oft Essen?",
        "Ich verstehe das. Aber auf Dauer ist Bestellen doch ziemlich teuer und oft nicht so gesund, oder? Was meinst du?"] },
    { theme: "Handy in der Schule",
      mine: { name: "Murat, 41, Vater von zwei Kindern", quote: "Handys sollten in der Schule verboten sein. Die Kinder spielen in der Pause nur noch am Handy und reden nicht mehr miteinander." },
      partner: { name: "Clara, 16, Schülerin", quote: "Mit dem Handy können wir im Unterricht schnell Informationen suchen. Man sollte lernen, das Handy sinnvoll zu benutzen, statt es zu verbieten." },
      partnerLines: ["Auf meinem Blatt meint Clara, eine Schülerin, dass das Handy im Unterricht nützlich ist. Man sollte lernen, es sinnvoll zu benutzen, und es nicht verbieten.",
        "Wie war das bei dir in der Schule? Durfte man ein Handy benutzen?",
        "Aber Kinder müssen doch auch lernen, mit Technik umzugehen, oder? Wie siehst du das?"] },
    { theme: "Leben auf dem Land oder in der Stadt",
      mine: { name: "Petra, 52, Lehrerin", quote: "Ich wohne auf dem Land. Hier ist es ruhig, die Luft ist sauber und die Mieten sind günstig. Ich brauche keine Großstadt." },
      partner: { name: "Ali, 27, Grafiker", quote: "In der Stadt ist immer etwas los: Kinos, Cafés, Konzerte. Und ich brauche kein Auto, weil Bus und Bahn überall fahren." },
      partnerLines: ["Ali, auf meinem Blatt, wohnt lieber in der Stadt. Dort gibt es viel Kultur, und er braucht kein Auto, weil der Nahverkehr gut ist.",
        "Wo wohnst du lieber – und warum?",
        "Aber auf dem Land braucht man fast immer ein Auto. Ist das nicht ein Problem?"] },
    { theme: "Online einkaufen",
      mine: { name: "Thomas, 45, Ingenieur", quote: "Ich kaufe fast alles online. Das spart Zeit, ich kann die Preise vergleichen und muss nicht in volle Geschäfte gehen." },
      partner: { name: "Maria, 60, Rentnerin", quote: "Ich gehe lieber in die Geschäfte. Dort kann ich die Sachen anfassen und anprobieren, und die Verkäufer beraten mich." },
      partnerLines: ["Maria auf meinem Blatt kauft lieber in Geschäften ein, weil sie die Sachen anfassen und anprobieren kann und gut beraten wird.",
        "Was kaufst du online und was lieber im Geschäft?",
        "Viele kleine Geschäfte in der Stadt schließen wegen des Online-Handels. Findest du das schlimm?"] },
    { theme: "Haustiere in der Wohnung",
      mine: { name: "Nina, 29, Verkäuferin", quote: "Mein Hund ist mein bester Freund. Ein Haustier macht glücklich und man bewegt sich mehr, weil man jeden Tag spazieren geht." },
      partner: { name: "Herr Weber, 58, Hausmeister", quote: "Tiere gehören nicht in eine kleine Stadtwohnung. Sie sind oft allein, machen Lärm und die Nachbarn ärgern sich." },
      partnerLines: ["Herr Weber findet, dass Tiere nicht in kleine Stadtwohnungen gehören. Sie sind oft allein, machen Lärm, und das stört die Nachbarn.",
        "Hast du ein Haustier oder hattest du früher eins?",
        "Aber wer viel arbeitet, hat doch keine Zeit für einen Hund, oder?"] },
    { theme: "Sport im Fitnessstudio",
      mine: { name: "Kevin, 24, Student", quote: "Ich gehe viermal pro Woche ins Fitnessstudio. Dort gibt es gute Geräte und Trainer, und man ist motivierter." },
      partner: { name: "Elke, 47, Ärztin", quote: "Fitnessstudios sind teuer. Ich mache lieber Sport draußen, zum Beispiel Joggen oder Radfahren – das kostet nichts und man ist an der frischen Luft." },
      partnerLines: ["Elke auf meinem Blatt sagt, Fitnessstudios sind zu teuer. Sie macht lieber draußen Sport, zum Beispiel Joggen, das kostet nichts.",
        "Wie und wo machst du selbst Sport?",
        "Aber im Winter ist es draußen kalt und dunkel. Was macht man dann?"] },
    { theme: "Taschengeld für Kinder",
      mine: { name: "Stefan, 42, Elektriker", quote: "Meine Kinder bekommen jede Woche Taschengeld. So lernen sie früh, mit Geld umzugehen und für etwas zu sparen." },
      partner: { name: "Monika, 38, Erzieherin", quote: "Ich gebe meinen Kindern kein festes Taschengeld. Wenn sie etwas brauchen, sprechen wir darüber. Geld sollte man sich verdienen, zum Beispiel mit Hilfe im Haushalt." },
      partnerLines: ["Monika auf meinem Blatt gibt ihren Kindern kein festes Taschengeld. Sie findet, Kinder sollten sich Geld verdienen, zum Beispiel durch Hilfe im Haushalt.",
        "Hast du als Kind Taschengeld bekommen? Wie viel war das ungefähr?",
        "Aber wenn Kinder für Hausarbeit Geld bekommen, helfen sie dann nur noch für Geld? Was meinst du?"] },
    { theme: "Kinder und Fernsehen",
      mine: { name: "Jana, 35, Grafikerin", quote: "Meine Kinder dürfen jeden Tag eine Stunde fernsehen. Es gibt gute Sendungen, bei denen sie viel lernen, und ich habe auch mal Zeit für mich." },
      partner: { name: "Paul, 50, Grundschullehrer", quote: "Kinder sitzen viel zu viel vor dem Bildschirm. Sie sollten lieber draußen spielen, lesen oder Sport machen. Bei uns gibt es unter der Woche kein Fernsehen." },
      partnerLines: ["Paul auf meinem Blatt ist Lehrer. Er findet, dass Kinder zu viel vor dem Bildschirm sitzen. Bei ihm zu Hause gibt es unter der Woche gar kein Fernsehen.",
        "Wie war das bei dir früher? Durftest du viel fernsehen?",
        "Aber heute haben Kinder doch Tablets und Handys. Kann man das überhaupt noch kontrollieren?"] },
    { theme: "Schuluniform",
      mine: { name: "Derya, 40, Krankenschwester", quote: "Ich bin für Schuluniformen. Dann gibt es keinen Streit um teure Markenkleidung, und alle Kinder sind gleich." },
      partner: { name: "Max, 17, Schüler", quote: "Eine Uniform finde ich schrecklich. Mit meiner Kleidung zeige ich, wer ich bin. Das sollte man Jugendlichen nicht wegnehmen." },
      partnerLines: ["Max ist Schüler. Er findet Schuluniformen schrecklich, weil man mit Kleidung zeigt, wer man ist, und das möchte er nicht verlieren.",
        "Gab es in deiner Schule eine Uniform? Wie fandest du das?",
        "Aber Uniformen kosten auch Geld. Ist das für Familien mit wenig Geld nicht ein Problem?"] },
    { theme: "Vegetarisch leben",
      mine: { name: "Lea, 26, Studentin", quote: "Ich esse seit drei Jahren kein Fleisch mehr. Ich fühle mich gesünder, und es ist auch besser für die Tiere und die Umwelt." },
      partner: { name: "Frank, 55, Metzger", quote: "Ein gutes Stück Fleisch gehört für mich zu einem richtigen Essen. Wichtig ist nur, dass das Fleisch aus der Region kommt und die Tiere gut leben." },
      partnerLines: ["Frank auf meinem Blatt ist Metzger. Für ihn gehört Fleisch zu einem guten Essen, aber er sagt, es sollte aus der Region kommen und die Tiere sollten gut leben.",
        "Wie ist das bei dir? Isst du Fleisch, und wie wichtig ist dir das?",
        "Aber vegetarisch essen ist oft teurer und man muss viel kochen. Ist das nicht schwierig?"] },
    { theme: "Computerspiele",
      mine: { name: "Tim, 22, Azubi", quote: "Ich spiele jeden Abend online mit Freunden. Das ist für mich Entspannung, und man trainiert dabei auch Konzentration und Teamarbeit." },
      partner: { name: "Sandra, 46, Mutter", quote: "Mein Sohn sitzt stundenlang vor dem Computer und vergisst alles andere. Ich finde, Computerspiele machen einsam und manche Spiele sind zu brutal." },
      partnerLines: ["Sandra auf meinem Blatt ist Mutter. Ihr Sohn spielt stundenlang am Computer. Sie glaubt, dass Spiele einsam machen und manche zu brutal sind.",
        "Spielst du selbst Computer- oder Handyspiele?",
        "Wie viel Zeit am Tag findest du für Spiele in Ordnung, besonders für Kinder?"] },
    { theme: "Bei den Eltern wohnen oder ausziehen?",
      mine: { name: "Elif, 24, Bankkauffrau", quote: "Ich wohne noch bei meinen Eltern. Ich spare viel Geld für die Miete, und wir verstehen uns gut. Warum sollte ich ausziehen?" },
      partner: { name: "Jonas, 23, Student", quote: "Ich bin mit 19 ausgezogen. Allein zu wohnen hat mich selbstständig gemacht: Ich koche, wasche und bezahle meine Rechnungen selbst." },
      partnerLines: ["Jonas ist mit neunzehn ausgezogen. Er sagt, dass er dadurch selbstständig geworden ist, weil er jetzt alles allein machen muss.",
        "Wie war das bei dir? Wann bist du von zu Hause ausgezogen, oder wohnst du noch bei deiner Familie?",
        "In vielen Städten sind die Mieten sehr hoch. Können junge Leute überhaupt noch allein wohnen?"] },
    { theme: "Hausarbeit teilen",
      mine: { name: "Nadine, 34, Ärztin", quote: "Bei uns macht jeder die Hälfte im Haushalt. Wir haben einen Plan: Wer kocht, muss nicht abwaschen. So gibt es keinen Streit." },
      partner: { name: "Herr Schulz, 61, Rentner", quote: "Ein fester Plan ist mir zu kompliziert. Jeder macht das, was er gut kann. Meine Frau kocht, und ich repariere Sachen und mache den Garten." },
      partnerLines: ["Herr Schulz findet einen festen Plan zu kompliziert. Bei ihm macht jeder, was er gut kann: Seine Frau kocht, er repariert Sachen und kümmert sich um den Garten.",
        "Wie ist das bei dir zu Hause oder in deiner WG?",
        "Aber ist es nicht unfair, wenn einer immer die unangenehmen Arbeiten machen muss?"] },
    { theme: "Urlaub: Camping oder Hotel?",
      mine: { name: "Björn, 37, Förster", quote: "Ich fahre immer zum Campen. Man ist in der Natur, es ist billig, und man trifft nette Leute auf dem Campingplatz." },
      partner: { name: "Irina, 45, Sekretärin", quote: "Im Urlaub möchte ich mich erholen. Im Hotel habe ich ein bequemes Bett, ein eigenes Bad und muss nicht kochen. Camping ist mir zu anstrengend." },
      partnerLines: ["Irina macht lieber Urlaub im Hotel. Sie möchte sich erholen, ein bequemes Bett haben und nicht kochen müssen. Camping findet sie zu anstrengend.",
        "Wie machst du am liebsten Urlaub? Warst du schon einmal campen?",
        "Und was machst du, wenn es beim Camping eine Woche lang regnet?"] },
    { theme: "Ehrenamtlich arbeiten",
      mine: { name: "Carla, 29, Bürokauffrau", quote: "Ich helfe jeden Samstag bei der Tafel und verteile Lebensmittel. Es tut gut, anderen Menschen zu helfen, und ich habe dort viele Freunde gefunden." },
      partner: { name: "Murat, 35, Taxifahrer", quote: "Ich arbeite fünfzig Stunden pro Woche. Für ein Ehrenamt habe ich keine Zeit. Ich finde, für soziale Aufgaben ist der Staat zuständig." },
      partnerLines: ["Murat auf meinem Blatt arbeitet sehr viel und hat keine Zeit für ein Ehrenamt. Er meint, dass der Staat für soziale Aufgaben zuständig ist.",
        "Hast du dich schon einmal ehrenamtlich engagiert, zum Beispiel in einem Verein?",
        "Sollte man Menschen, die ehrenamtlich arbeiten, nicht ein bisschen Geld bezahlen? Was denkst du?"] },
    { theme: "Bio-Lebensmittel",
      mine: { name: "Sophie, 31, Yogalehrerin", quote: "Ich kaufe fast nur Bio-Produkte. Sie sind gesünder, und die Bauern gehen besser mit Tieren und Natur um." },
      partner: { name: "Ralf, 48, Lagerarbeiter", quote: "Bio ist mir zu teuer. Ich habe eine Familie mit drei Kindern und muss auf den Preis achten. Ob Bio wirklich gesünder ist, weiß doch niemand genau." },
      partnerLines: ["Ralf auf meinem Blatt findet Bio-Produkte zu teuer. Er hat drei Kinder und muss sparen, und er glaubt nicht sicher, dass Bio gesünder ist.",
        "Kaufst du Bio-Produkte? Bei welchen Lebensmitteln achtest du darauf?",
        "Wenn alle nur noch Bio kaufen würden, wäre das Essen dann nicht für viele zu teuer?"] }
  ];

  const B1_T3 = [
    { title: "Grillabend im Hof", situation: "In Ihrem Haus sind in letzter Zeit viele neue Mieter eingezogen. Sie möchten einen Grillabend im Hof organisieren, damit sich alle Nachbarn kennenlernen.",
      points: ["Termin", "Einladung", "Grill und Essen", "Getränke und Musik", "Aufräumen", "…"],
      partnerLines: ["Ich würde den Grillabend an einem Samstag machen, dann haben die meisten Zeit. Wie findest du das?", "Wie laden wir die Nachbarn ein? Mit einem Zettel im Treppenhaus oder persönlich?", "Was ist mit dem Essen? Kaufen wir alles oder bringt jede Familie etwas mit?", "Und wer kümmert sich danach ums Aufräumen?"] },
    { title: "Geburtstag einer Kollegin", situation: "Eine Kollegin hat nächste Woche Geburtstag. Sie möchten zusammen eine kleine Überraschung im Büro organisieren.",
      points: ["Wann?", "Was für eine Überraschung?", "Geschenk", "Essen/Kuchen", "Wer macht was?", "…"],
      partnerLines: ["Ich finde, wir sollten in der Mittagspause feiern. Was meinst du?", "Was für ein Geschenk könnten wir kaufen?", "Sollen wir einen Kuchen backen oder kaufen?", "Wer sagt den anderen Kollegen Bescheid und wer kauft das Geschenk?"] },
    { title: "Ausflug mit dem Deutschkurs", situation: "Ihr Deutschkurs ist bald zu Ende. Sie möchten zusammen mit allen einen Ausflug machen. Planen Sie den Ausflug.",
      points: ["Wohin?", "Wann?", "Wie fahren Sie dorthin?", "Essen", "Kosten", "…"],
      partnerLines: ["Ich hätte Lust auf einen Ausflug an einen See. Was hältst du davon?", "Wann sollen wir fahren? Am Wochenende haben die meisten Zeit.", "Wie kommen wir dorthin – mit dem Zug oder mit Autos?", "Und wer organisiert das Essen und sammelt das Geld ein?"] },
    { title: "Ein Straßenfest", situation: "In Ihrer Straße soll ein Nachbarschaftsfest stattfinden. Sie beide helfen bei der Organisation.",
      points: ["Wann?", "Programm (Musik, Spiele …)", "Essen und Getränke", "Wer hilft?", "…"],
      partnerLines: ["Ich denke, ein Samstag im Juni wäre gut. Was denkst du?", "Was für ein Programm könnten wir für Kinder und Erwachsene machen?", "Was machen wir mit dem Essen? Grillen vielleicht?", "Wer fragt die Nachbarn, ob sie helfen können?"] },
    { title: "Besuch aus dem Ausland", situation: "Eine gemeinsame Freundin aus dem Ausland besucht Sie für ein Wochenende. Planen Sie zusammen das Programm.",
      points: ["Abholen", "Übernachtung", "Programm Samstag", "Programm Sonntag", "Kosten", "…"],
      partnerLines: ["Sie kommt am Freitagabend am Bahnhof an. Kannst du sie abholen?", "Wo kann sie übernachten? Ich habe leider nur ein kleines Zimmer.", "Was zeigen wir ihr am Samstag?", "Und was machen wir am Sonntag, bevor sie wieder fährt?"] },
    { title: "Überraschungsparty für einen Freund", situation: "Ein guter Freund wird 30. Sie möchten zusammen eine Überraschungsparty für ihn organisieren.",
      points: ["Wann und wo?", "Gäste einladen", "Essen und Getränke", "Geschenk", "Wie bleibt es eine Überraschung?", "…"],
      partnerLines: ["Ich finde, wir sollten am Samstag vor seinem Geburtstag feiern. Was denkst du?", "Wo können wir feiern, ohne dass er etwas merkt?", "Was schenken wir ihm? Vielleicht etwas zusammen mit allen Gästen?", "Gut. Wer kümmert sich um die Einladungen und wer um das Essen?"] },
    { title: "Kinderfest im Kindergarten", situation: "Der Kindergarten Ihrer Kinder feiert ein Sommerfest. Die Eltern sollen helfen. Sie beide planen einen Teil des Festes.",
      points: ["Spiele für Kinder", "Kuchen und Getränke", "Dekoration", "Was passiert bei Regen?", "Wer hilft wann?", "…"],
      partnerLines: ["Ich hätte die Idee, dass wir Spiele für die Kinder machen, zum Beispiel Sackhüpfen. Was meinst du?", "Was brauchen wir zum Essen und Trinken?", "Und was machen wir, wenn es regnet?", "Wer ist wann am Stand? Ich kann nur am Nachmittag."] },
    { title: "Eine Kollegin verabschieden", situation: "Eine beliebte Kollegin geht in Rente. Sie beide sollen eine kleine Abschiedsfeier im Betrieb organisieren.",
      points: ["Termin", "Raum", "Geschenk", "Rede", "Essen", "…"],
      partnerLines: ["Ich schlage vor, wir feiern an ihrem letzten Arbeitstag nach der Arbeit. Passt das?", "Was für ein Geschenk könnte ihr gefallen?", "Sollte jemand eine kleine Rede halten? Wer?", "Was machen wir mit dem Essen, und wer sammelt das Geld ein?"] },
    { title: "Wochenendausflug mit Freunden", situation: "Sie möchten mit einer Gruppe von Freunden ein Wochenende in die Berge fahren. Sie beide übernehmen die Planung.",
      points: ["Ziel", "Anreise", "Unterkunft", "Programm", "Kosten", "…"],
      partnerLines: ["Ich würde gern in den Schwarzwald fahren. Hast du eine andere Idee?", "Wie fahren wir hin – mit dem Zug oder mit Autos?", "Wo übernachten wir? Eine Ferienwohnung ist vielleicht günstiger als ein Hotel.", "Was machen wir dort am Samstag, und wer bucht was?"] },
    { title: "Hilfe für eine kranke Nachbarin", situation: "Ihre ältere Nachbarin hat sich das Bein gebrochen und kann zwei Wochen nicht aus dem Haus. Sie beide möchten ihr helfen.",
      points: ["Einkaufen", "Arztbesuche", "Haustier versorgen", "Besuche", "Wer macht was wann?", "…"],
      partnerLines: ["Ich kann am Montag und Mittwoch für sie einkaufen. Wann hast du Zeit?", "Sie hat einen Hund. Wer geht mit ihm spazieren?", "Am Donnerstag hat sie einen Termin beim Arzt. Wie kommt sie dorthin?", "Sollten wir auch ihre Familie informieren? Was meinst du?"] }
  ];

  function buildB1Part(part) {
    if (part === 1) {
      const extra = pickFresh("B1-extra", B1_EXTRA);
      const partner = pickFresh("B1-partner", B1_PARTNERS);
      return {
        key: "t1", name: "Teil 1 · Einander kennenlernen", dur: "ca. 3 Min.",
        card: { title: "Gesprächsthemen", lines: ["Herkunft und Heimatstadt", "Wohnsituation und Familie", "Deutschlernen: seit wann? wo?", "Arbeit, Ausbildung oder Studium", "Weitere Sprachen und Interessen"] },
        topic: "Einander kennenlernen",
        turns: [
          { who: "Prüfer", say: "Guten Tag und herzlich willkommen! Wir starten mit dem ersten Teil. Unterhalten Sie sich bitte ein paar Minuten und erfahren Sie etwas über Ihr Gegenüber.", task: "Sınav başlıyor — dinle.", kind: "listen" },
          { who: "Partner", say: partner.greet, task: "Partnerine adını ve nereden geldiğini anlat.", kind: "answer", target: 25 },
          { who: "Partner", say: partner.home, task: "Partnerinin sorusunu cevapla (yaşam, aile, iş).", kind: "answer", target: 30 },
          { who: "Partner", say: "", task: "Şimdi sen partnerine (" + partner.name + ") bir soru sor (ör. ailesi, işi, boş zamanı).", kind: "ask", target: 20,
            reply: partner.reply },
          { who: "Partner", say: partner.lang, task: "Almanca öğrenme sürecini ve bildiğin dilleri anlat.", kind: "answer", target: 30 },
          { who: "Prüfer", say: extra, task: "Sınav görevlisinin ek sorusunu cevapla.", kind: "answer", target: 30 }
        ]
      };
    }
    if (part === 2) {
      const t = pickFresh("B1-t2", B1_T2);
      return {
        key: "t2", name: "Teil 2 · Über ein Thema sprechen", dur: "ca. 6 Min.",
        card: { title: "Thema: „" + t.theme + "“", lines: ["Senin metnin — " + t.mine.name + ":", "„" + t.mine.quote + "“", "Görev: Metnindeki görüşü partnerine anlat, sonra kendi fikrini ve deneyimlerini söyle."] },
        topic: t.theme,
        turns: [
          { who: "Prüfer", say: "Danke. Im zweiten Teil geht es um das Thema „" + t.theme + "“. Jeder von Ihnen hat eine andere Meinung dazu gelesen. Erzählen Sie bitte zuerst, was die Person auf Ihrem Blatt denkt.", task: "Metnindeki kişinin görüşünü kendi cümlelerinle özetle (okuma, anlat).", kind: "monologue", target: 60 },
          { who: "Partner", say: t.partnerLines[0], task: "Partnerinin metnini dinle.", kind: "listen" },
          { who: "Prüfer", say: "Und was denken Sie selbst über dieses Thema?", task: "Kendi fikrini gerekçeleriyle söyle.", kind: "answer", target: 45 },
          { who: "Partner", say: t.partnerLines[1], task: "Kendi deneyiminden anlat.", kind: "answer", target: 40 },
          { who: "Partner", say: t.partnerLines[2], task: "Partnerinin itirazına tepki ver; katılıyorsan ya da katılmıyorsan nedenini söyle.", kind: "answer", target: 40 },
          { who: "Partner", say: "", task: "Partnerine konuyla ilgili bir soru sor (ör. onun deneyimi ya da fikri).", kind: "ask", target: 20,
            reply: "Das ist eine gute Frage. Ich glaube, es kommt auf die Situation an – beides hat Vor- und Nachteile." }
        ]
      };
    }
    const t = pickFresh("B1-t3", B1_T3);
    return {
      key: "t3", name: "Teil 3 · Gemeinsam etwas planen", dur: "ca. 6 Min.",
      card: { title: t.title, lines: [t.situation, "Notlar: " + t.points.join("  ·  ")] },
      topic: t.title,
      turns: [
        { who: "Prüfer", say: "Danke schön. Im letzten Teil planen Sie etwas zusammen. " + t.situation + " Am Ende sollten Sie wissen, welche Aufgaben es gibt und wer sie übernimmt.", task: "Görevi dinle.", kind: "listen" },
        { who: "Partner", say: t.partnerLines[0], task: "Öneriye tepki ver; gerekirse başka bir öneri yap ve gerekçelendir.", kind: "answer", target: 35 },
        { who: "Partner", say: t.partnerLines[1], task: "Kendi fikrini söyle ve öner.", kind: "answer", target: 35 },
        { who: "Partner", say: t.partnerLines[2], task: "Bu noktayı birlikte netleştir.", kind: "answer", target: 35 },
        { who: "Partner", say: t.partnerLines[3], task: "Görev paylaşımı yap: kim ne yapacak?", kind: "answer", target: 35 },
        { who: "Prüfer", say: "Fassen Sie bitte kurz zusammen: Was ist zu tun und wer macht was?", task: "Kararlarınızı kısaca özetle.", kind: "answer", target: 40 }
      ]
    };
  }

  /* ════════════════════════════════ B2 ════════════════════════════════ */
  const B2_T1 = [
    { topic: "Ein Buch, das Sie beeindruckt hat", qs: ["Warum hat dich gerade dieses Buch so beeindruckt?", "Würdest du es auch jemandem empfehlen, der nicht gern liest?"] },
    { topic: "Eine Reise, die Sie nicht vergessen werden", qs: ["Was war das Schönste an dieser Reise?", "Würdest du noch einmal dorthin fahren? Warum?"] },
    { topic: "Ein Film oder eine Serie, die Sie empfehlen", qs: ["Was unterscheidet diesen Film von anderen in diesem Genre?", "Siehst du lieber im Kino oder zu Hause fern?"] },
    { topic: "Ihre Erfahrungen mit dem Deutschlernen", qs: ["Was war für dich am schwierigsten?", "Welche Methode hat dir am meisten geholfen?"] },
    { topic: "Ein Hobby, das Ihnen wichtig ist", qs: ["Wie bist du zu diesem Hobby gekommen?", "Wie viel Zeit investierst du ungefähr pro Woche?"] },
    { topic: "Eine Person, die Sie geprägt hat", qs: ["Was genau hast du von dieser Person gelernt?", "Habt ihr heute noch Kontakt?"] },
    { topic: "Ihre Erfahrungen mit einem Umzug", qs: ["Was war beim Umzug das größte Problem?", "Wie lange hat es gedauert, bis du dich zu Hause gefühlt hast?"] },
    { topic: "Ein Sportereignis, das Sie erlebt haben", qs: ["Was hat dich an diesem Ereignis besonders begeistert?", "Machst du selbst auch Sport? Welchen?"] },
    { topic: "Ein Konzert oder eine Musikveranstaltung", qs: ["Wie war die Stimmung beim Konzert?", "Welche Musik hörst du im Alltag am liebsten?"] },
    { topic: "Ein Erlebnis, das Ihr Leben verändert hat", qs: ["Was hast du aus dieser Erfahrung gelernt?", "Würdest du heute etwas anders machen?"] }
  ];
  const B2_PARTNER_T1 = [
    { topic: "eine Sprachreise nach Spanien", text: "Ich möchte über meine Sprachreise nach Valencia erzählen. Ich war drei Wochen dort und habe bei einer Gastfamilie gewohnt. Am Anfang war es schwierig, weil die Familie sehr schnell gesprochen hat. Aber nach einer Woche habe ich viel mehr verstanden. Am meisten habe ich nicht im Kurs gelernt, sondern beim Abendessen mit der Familie. Deshalb würde ich jedem empfehlen, bei einer Gastfamilie zu wohnen." },
    { topic: "ein Ehrenamt im Tierheim", text: "Ich erzähle von meinem Ehrenamt im Tierheim. Seit zwei Jahren gehe ich jeden Samstag dorthin und gehe mit den Hunden spazieren. Am Anfang dachte ich, das ist nur ein Hobby. Inzwischen habe ich gemerkt, dass ich dadurch viel ruhiger geworden bin. Außerdem habe ich dort Menschen kennengelernt, die heute gute Freunde sind." },
    { topic: "mein erster Halbmarathon", text: "Ich erzähle von meinem ersten Halbmarathon. Vor zwei Jahren konnte ich kaum fünf Kilometer laufen. Dann habe ich mit einer Laufgruppe trainiert, dreimal pro Woche, auch im Winter. Beim Lauf selbst hatte ich nach fünfzehn Kilometern große Probleme, aber die Zuschauer haben mich angefeuert. Als ich ins Ziel kam, war ich unglaublich stolz. Seitdem weiß ich, dass man mit Geduld fast alles schaffen kann." },
    { topic: "ein Open-Air-Konzert", text: "Ich möchte von einem Open-Air-Konzert im letzten Sommer erzählen. Meine Lieblingsband hat in einem Park gespielt, und ich war mit meiner Schwester dort. Zuerst hat es stark geregnet und wir waren total nass. Aber dann kam die Sonne raus, und alle haben zusammen gesungen und getanzt. Diese Atmosphäre werde ich nie vergessen. Seitdem gehe ich viel öfter auf Konzerte, statt nur Musik zu Hause zu hören." },
    { topic: "ein Buch über Auswanderung", text: "Ich möchte über ein Buch sprechen, das mich sehr bewegt hat. Es erzählt die Geschichte einer Familie, die in den Sechzigerjahren nach Deutschland gekommen ist. Besonders beeindruckt hat mich, wie ehrlich die Autorin über Heimweh und Sprachprobleme schreibt. Beim Lesen habe ich oft an meine eigenen ersten Monate hier gedacht. Das Buch hat mir gezeigt, dass viele Schwierigkeiten ganz normal sind und vorbeigehen." },
    { topic: "ein Praktikum in einem Krankenhaus", text: "Ich erzähle von meinem Praktikum in einem Krankenhaus. Ich war sechs Wochen auf einer Kinderstation. Am Anfang hatte ich große Angst, Fehler zu machen, vor allem wegen der Fachsprache. Aber das Team war sehr geduldig und hat mir alles erklärt. Am meisten hat mich beeindruckt, wie viel Kraft die Familien in schwierigen Situationen haben. Seitdem weiß ich sicher, dass ich im Gesundheitsbereich arbeiten möchte." },
    { topic: "meine Großmutter", text: "Die wichtigste Person in meinem Leben ist meine Großmutter. Sie hat mit sechzig Jahren noch Englisch gelernt, weil sie mit ihren Enkeln im Ausland sprechen wollte. Von ihr habe ich gelernt, dass man nie zu alt ist, um etwas Neues anzufangen. Wenn ich beim Deutschlernen keine Lust mehr habe, denke ich an sie. Wir telefonieren jede Woche, und sie fragt immer, wie es mit meinem Deutsch vorangeht." },
    { topic: "ein Fußballspiel im Stadion", text: "Ich möchte von meinem ersten Bundesligaspiel im Stadion erzählen. Ein Kollege hatte Karten für das Derby und hat mich eingeladen. Schon auf dem Weg zum Stadion haben überall Fans gesungen. Die Stimmung im Stadion war unglaublich laut, und als in der letzten Minute das Siegtor fiel, haben wildfremde Menschen mich umarmt. Seitdem verstehe ich, warum Fußball in Deutschland so wichtig ist." },
    { topic: "eine Reise mit dem Nachtzug", text: "Ich erzähle von einer Reise mit dem Nachtzug von Wien nach Venedig. Ich wollte einmal nicht fliegen, sondern langsam reisen. Im Abteil habe ich ein älteres Ehepaar aus der Schweiz kennengelernt, und wir haben bis spät in die Nacht geredet. Am Morgen bin ich direkt am Wasser in Venedig angekommen. Seitdem versuche ich, öfter mit dem Zug zu reisen, auch wenn es länger dauert." },
    { topic: "ein Film über Freundschaft", text: "Ich möchte über einen Film sprechen, den ich mehrmals gesehen habe. Es geht um zwei Männer aus völlig unterschiedlichen Welten, die durch Zufall Freunde werden. Der Film ist gleichzeitig lustig und traurig. Mir gefällt besonders, dass er ohne Klischees zeigt, wie Menschen voneinander lernen können. Ich habe ihn auf Deutsch mit Untertiteln geschaut, und das hat meinem Hörverstehen sehr geholfen." }
  ];

  const B2_T2 = [
    { title: "Vier-Tage-Woche für alle?", text: "Immer mehr Unternehmen in Deutschland testen die Vier-Tage-Woche bei gleichem Gehalt. Erste Studien zeigen, dass die Beschäftigten zufriedener sind und seltener krank werden. Viele Firmen berichten sogar, dass die Produktivität gleich geblieben ist. Kritiker warnen jedoch: Gerade in Pflege, Handwerk und Gastronomie fehlen schon heute Fachkräfte. Eine kürzere Arbeitswoche würde diesen Mangel noch verschärfen. Außerdem sei das Modell nicht in jeder Branche umsetzbar, etwa dort, wo Kunden jeden Tag betreut werden müssen.",
      partnerArgs: ["Ich finde die Idee grundsätzlich gut. Wer ausgeruht ist, arbeitet doch konzentrierter. Siehst du das auch so?", "Aber denk mal an Krankenhäuser oder Restaurants. Dort kann man nicht einfach einen Tag zumachen. Wie soll das funktionieren?", "Vielleicht ist das Modell eher etwas für Büroberufe. Wäre das dann nicht ungerecht gegenüber den anderen?"] },
    { title: "Sollen Plastiktüten komplett verboten werden?", text: "Seit 2022 sind leichte Plastiktüten in deutschen Geschäften verboten. Umweltverbände fordern nun, auch dünne Tüten für Obst und Gemüse sowie Einwegverpackungen stärker einzuschränken. Sie argumentieren, dass Plastik die Meere verschmutzt und nur ein kleiner Teil wirklich recycelt wird. Händler und manche Verbraucher halten dagegen: Alternativen aus Papier oder Baumwolle verbrauchen bei der Herstellung oft mehr Energie und Wasser. Ein Verbot allein löse das Problem nicht, wichtiger sei ein Umdenken beim Konsum.",
      partnerArgs: ["Ich denke, Verbote sind der einzige Weg, damit sich wirklich etwas ändert. Freiwillig machen das die Leute doch nicht, oder?", "Andererseits stimmt es, dass Papiertüten auch nicht umweltfreundlich sind. Was wäre denn die bessere Lösung?", "Welche Rolle spielen deiner Meinung nach die Supermärkte selbst?"] },
    { title: "Homeoffice – Zukunft oder Auslaufmodell?", text: "Während der Pandemie haben Millionen Menschen von zu Hause gearbeitet. Viele möchten das beibehalten: Sie sparen Fahrzeit, können Familie und Beruf besser verbinden und arbeiten konzentrierter. Inzwischen holen jedoch zahlreiche Unternehmen ihre Angestellten zurück ins Büro. Sie befürchten, dass Teamgeist und spontaner Austausch verloren gehen. Auch junge Mitarbeitende lernen im Büro schneller von erfahrenen Kolleginnen und Kollegen. Viele Experten empfehlen deshalb ein Mischmodell.",
      partnerArgs: ["Ich arbeite viel lieber zu Hause. Im Büro werde ich ständig gestört. Wie ist das bei dir?", "Aber ich verstehe auch die Firmen: Wenn niemand mehr ins Büro kommt, kennt man seine Kollegen kaum. Ist das nicht ein Problem?", "Wie könnte ein guter Kompromiss für beide Seiten aussehen?"] },
    { title: "Kostenloser Nahverkehr in Städten?", text: "Einige europäische Städte bieten Busse und Bahnen inzwischen kostenlos an. Befürworter sagen, so würden mehr Menschen das Auto stehen lassen, die Luft würde sauberer und auch Menschen mit wenig Geld wären mobil. Gegner verweisen auf die hohen Kosten, die am Ende über Steuern bezahlt werden müssten. Außerdem seien Busse und Bahnen in vielen Städten schon jetzt überfüllt. Wichtiger als ein kostenloses Angebot seien deshalb mehr Verbindungen und pünktliche Züge.",
      partnerArgs: ["Für mich klingt das super. Wenn es nichts kostet, fahren doch viel mehr Leute mit dem Bus. Meinst du nicht?", "Aber wer bezahlt das am Ende? Die Steuerzahler, also wir alle. Ist das fair?", "Was ist deiner Meinung nach wichtiger: niedrige Preise oder ein besseres Angebot?"] },
    { title: "Smartphones erst ab 14?", text: "Immer mehr Eltern in Deutschland schließen sich Initiativen an, die ihren Kindern erst ab 14 Jahren ein eigenes Smartphone geben wollen. Sie verweisen auf Studien, nach denen eine hohe Bildschirmzeit Schlaf, Konzentration und das Selbstwertgefühl beeinträchtigen kann. Andere Eltern halten das für unrealistisch: Wer als Einziger in der Klasse kein Handy habe, werde schnell ausgeschlossen. Außerdem müssten Kinder früh lernen, mit digitalen Medien verantwortungsvoll umzugehen.",
      partnerArgs: ["Ich finde, Kinder brauchen heute einfach ein Handy, schon wegen der Sicherheit. Wie siehst du das?", "Andererseits sieht man ja überall Kinder, die nur noch auf den Bildschirm starren. Macht dir das keine Sorgen?", "Wer sollte deiner Meinung nach die Regeln festlegen – die Eltern, die Schule oder der Staat?"] },
    { title: "Tattoos im Berufsleben", text: "Fast jeder vierte Erwachsene in Deutschland hat inzwischen ein Tattoo. In vielen Branchen sind sichtbare Tattoos längst kein Problem mehr. Dennoch gibt es Berufe, in denen Arbeitgeber erwarten, dass Tätowierungen verdeckt werden – etwa in Banken, bei der Polizei oder im Hotelempfang. Befürworter strenger Regeln argumentieren, dass Kundinnen und Kunden ein seriöses Erscheinungsbild erwarten. Kritiker halten dagegen, dass Tattoos nichts über die Qualität der Arbeit aussagen und Ausdruck der Persönlichkeit seien.",
      partnerArgs: ["Ich finde, Tattoos sind heute völlig normal. Warum sollte ein Arbeitgeber das verbieten dürfen?", "Andererseits: Wenn ich zu einem Anwalt gehe, erwarte ich schon ein bestimmtes Auftreten. Verstehst du die Firmen nicht ein bisschen?", "Wo genau würdest du die Grenze ziehen – bei der Größe, beim Motiv oder beim Beruf?"] },
    { title: "Massentourismus – Fluch oder Segen?", text: "Beliebte Reiseziele wie Venedig, Barcelona oder Mallorca leiden unter dem Ansturm von Touristen. Anwohner klagen über steigende Mieten, Lärm und überfüllte Straßen. Einige Städte erheben deshalb Eintrittsgebühren oder begrenzen die Zahl der Kreuzfahrtschiffe. Auf der anderen Seite lebt die Wirtschaft vieler Regionen vom Tourismus; Hotels, Restaurants und Geschäfte sichern tausende Arbeitsplätze. Experten fordern, Besucherströme besser zu verteilen und den Tourismus nachhaltiger zu gestalten.",
      partnerArgs: ["Ich finde Eintrittsgebühren für Städte übertrieben. Reisen sollte doch für alle möglich sein, oder?", "Aber wenn die Einheimischen sich keine Wohnung mehr leisten können, läuft doch etwas falsch. Wie siehst du das?", "Was kann jeder Einzelne tun, um verantwortungsvoller zu reisen?"] },
    { title: "Bargeldlos bezahlen", text: "Immer mehr Menschen in Deutschland bezahlen mit Karte oder Smartphone, selbst kleine Beträge beim Bäcker. Das ist schnell, hygienisch und praktisch. Einige Geschäfte akzeptieren bereits gar kein Bargeld mehr. Datenschützer warnen jedoch: Jede digitale Zahlung hinterlässt Spuren, aus denen sich Gewohnheiten ablesen lassen. Zudem haben ältere Menschen oder Personen ohne Bankkonto Schwierigkeiten. Auch bei Stromausfällen oder technischen Störungen sei man ohne Bargeld hilflos.",
      partnerArgs: ["Ich zahle fast nur noch mit dem Handy. Bargeld ist doch unpraktisch. Wie ist das bei dir?", "Aber die Sache mit dem Datenschutz macht mich schon nachdenklich. Wer weiß, was mit den Daten passiert?", "Sollte es ein Gesetz geben, dass Geschäfte Bargeld annehmen müssen?"] },
    { title: "Künstliche Intelligenz im Alltag", text: "Programme mit künstlicher Intelligenz schreiben Texte, übersetzen in Sekunden und beantworten Fragen rund um die Uhr. Viele Menschen nutzen sie bereits im Beruf und im Studium. Befürworter sehen darin eine enorme Zeitersparnis und neue Chancen, etwa in der Medizin. Kritiker befürchten dagegen, dass viele Arbeitsplätze wegfallen und Menschen verlernen, selbst nachzudenken. Außerdem seien die Antworten nicht immer zuverlässig, und es bleibe oft unklar, woher die Informationen stammen.",
      partnerArgs: ["Ich nutze KI fast jeden Tag, sie spart mir viel Zeit. Siehst du darin eher Vorteile oder Nachteile?", "Aber was ist mit den Arbeitsplätzen? Übersetzer zum Beispiel haben schon jetzt weniger Aufträge. Macht dir das keine Sorgen?", "Sollte man in der Schule lernen, wie man mit KI umgeht, oder sollte sie dort verboten sein?"] },
    { title: "Ausbildung oder Studium?", text: "Seit Jahren beginnen in Deutschland mehr junge Menschen ein Studium als eine Berufsausbildung. Viele Eltern sehen im Studium den sicheren Weg zu einem guten Einkommen. Gleichzeitig suchen Handwerksbetriebe dringend Nachwuchs, und gut ausgebildete Fachkräfte verdienen inzwischen oft mehr als manche Akademiker. Zudem verdient man in der Ausbildung von Anfang an Geld. Experten raten deshalb, die Entscheidung von den eigenen Interessen und nicht vom Ansehen eines Berufs abhängig zu machen.",
      partnerArgs: ["Für mich war immer klar, dass ich studieren will. Ein Abschluss öffnet doch mehr Türen, oder nicht?", "Andererseits kenne ich Handwerker, die heute ihre eigene Firma haben und sehr gut verdienen. Wird die Ausbildung unterschätzt?", "Was sollten Schulen tun, damit Jugendliche die richtige Entscheidung treffen?"] },
    { title: "Online-Unterricht statt Klassenzimmer?", text: "Seit der Pandemie bieten viele Schulen und Hochschulen Kurse auch online an. Lernende schätzen die Flexibilität: Sie sparen Fahrtzeit und können Aufzeichnungen mehrmals ansehen. Lehrkräfte berichten jedoch, dass die Motivation vor dem Bildschirm schnell sinkt und der persönliche Kontakt fehlt. Besonders Kinder aus Familien ohne ruhigen Arbeitsplatz oder gute Internetverbindung seien benachteiligt. Viele Bildungsexperten halten deshalb eine Mischung aus Präsenz- und Online-Unterricht für sinnvoll.",
      partnerArgs: ["Ich lerne online viel effektiver, weil ich mein eigenes Tempo habe. Geht dir das auch so?", "Aber in einem Online-Kurs findet man kaum Freunde. Ist das nicht ein großer Nachteil?", "Für welche Fächer oder Kurse eignet sich Online-Unterricht deiner Meinung nach am besten?"] },
    { title: "Mehr Videoüberwachung auf öffentlichen Plätzen?", text: "Nach mehreren Überfällen fordern Politiker in einigen Städten mehr Kameras an Bahnhöfen und auf öffentlichen Plätzen. Die Aufnahmen könnten helfen, Täter schneller zu finden, und sollen abschreckend wirken. Bürgerrechtler warnen dagegen vor einer zunehmenden Überwachung unbescholtener Menschen. Studien zeigen außerdem, dass Kameras Straftaten nicht unbedingt verhindern, sondern sie oft nur an andere Orte verlagern. Mehr Polizeipräsenz und eine bessere Beleuchtung seien wirksamer.",
      partnerArgs: ["Ich fühle mich sicherer, wenn es Kameras gibt. Wer nichts zu verbergen hat, muss sich doch keine Sorgen machen, oder?", "Andererseits finde ich die Vorstellung unangenehm, dass ich ständig gefilmt werde. Wo hört Sicherheit auf und fängt Überwachung an?", "Welche anderen Maßnahmen könnten Plätze sicherer machen?"] },
    { title: "Wohnen in einer WG – auch im Alter?", text: "Wohngemeinschaften sind längst nicht mehr nur etwas für Studierende. Immer mehr Berufstätige und sogar Seniorinnen und Senioren entscheiden sich, gemeinsam zu wohnen. Sie teilen sich Miete und Haushalt und sind seltener einsam. Gerade für ältere Menschen kann eine WG eine Alternative zum Pflegeheim sein. Allerdings entstehen auch Konflikte, etwa um Sauberkeit, Lautstärke oder Besuch. Nicht jeder ist bereit, Privatsphäre aufzugeben.",
      partnerArgs: ["Ich könnte mir gut vorstellen, auch später in einer WG zu wohnen. Allein zu leben finde ich langweilig. Und du?", "Aber gerade beim Thema Sauberkeit gibt es doch ständig Streit. Hast du damit Erfahrungen?", "Wie müsste eine WG organisiert sein, damit das Zusammenleben gut funktioniert?"] }
  ];

  const B2_T3 = [
    { title: "Ein Abschiedsfest im Sprachkurs", situation: "Ihr Kurs geht zu Ende und Sie möchten mit allen Teilnehmenden und der Lehrkraft ein Abschiedsfest organisieren.",
      partnerLines: ["Ich schlage vor, wir feiern gleich nach der letzten Unterrichtsstunde im Kursraum. Was hältst du davon?", "Was machen wir mit dem Essen? Bestellen oder bringt jeder etwas mit?", "Sollen wir der Lehrerin etwas schenken? Wenn ja, was?", "Okay, dann müssen wir noch die Aufgaben verteilen. Was übernimmst du?"] },
    { title: "Ein Wochenende für eine Gastgruppe", situation: "Eine Gruppe von Studierenden aus einer Partnerstadt besucht Ihre Stadt für ein Wochenende. Sie sollen das Programm planen.",
      partnerLines: ["Ich würde am Freitagabend mit einem gemeinsamen Essen anfangen. Wie findest du das?", "Was zeigen wir ihnen am Samstag von unserer Stadt?", "Wo sollen sie übernachten? Hotel ist teuer.", "Und wie finanzieren wir das Ganze – gibt es Fördermittel oder zahlen alle selbst?"] },
    { title: "Ein Umzug für einen Freund", situation: "Ein gemeinsamer Freund zieht am nächsten Wochenende um. Er hat Sie beide gebeten, den Umzug zu organisieren.",
      partnerLines: ["Zuerst brauchen wir ein Auto. Sollen wir einen Transporter mieten?", "Wie viele Helfer brauchen wir und wen fragen wir?", "Was machen wir mit dem Essen für die Helfer?", "Wer kümmert sich um die alte Wohnung – Putzen, Schlüssel abgeben?"] },
    { title: "Ein Benefizlauf", situation: "Ihr Verein möchte einen Spendenlauf für ein soziales Projekt organisieren. Sie beide sind für die Planung verantwortlich.",
      partnerLines: ["Für welches Projekt sollen wir eigentlich Geld sammeln? Hast du eine Idee?", "Wo könnte der Lauf stattfinden? Wir brauchen eine Genehmigung.", "Wie machen wir Werbung, damit möglichst viele mitlaufen?", "Wer übernimmt was am Tag selbst?"] },
    { title: "Ein Betriebsausflug", situation: "Sie sollen für Ihre Abteilung (ca. 20 Personen) einen Betriebsausflug organisieren.",
      partnerLines: ["Ich hätte Lust auf etwas Aktives, zum Beispiel Kanufahren. Was meinst du?", "Was machen wir, wenn das Wetter schlecht ist?", "Wie kommen alle dorthin?", "Wer kümmert sich um Reservierungen und das Budget?"] },
    { title: "Eine Präsentation für den Kurs", situation: "Sie sollen gemeinsam eine 15-minütige Präsentation über ein Thema Ihrer Wahl für Ihren Kurs vorbereiten.",
      partnerLines: ["Welches Thema sollen wir nehmen? Ich hätte Lust auf etwas über Umweltschutz. Was meinst du?", "Wie teilen wir uns die Arbeit auf – recherchiert jeder einen Teil?", "Wann und wo treffen wir uns zum Üben?", "Sollen wir mit Folien arbeiten oder lieber mit Plakaten?"] },
    { title: "Ein Flohmarkt für einen guten Zweck", situation: "Ihre Nachbarschaft möchte einen Flohmarkt veranstalten. Der Erlös soll an ein Kinderheim gehen. Sie beide übernehmen die Organisation.",
      partnerLines: ["Ich denke, der Schulhof wäre ein guter Ort. Wie siehst du das?", "Wie bekommen wir genug Verkäuferinnen und Verkäufer?", "Sollte es auch Kaffee und Kuchen geben? Wer backt?", "Wie stellen wir sicher, dass das Geld wirklich beim Kinderheim ankommt?"] },
    { title: "Ein Sprachcafé gründen", situation: "Sie möchten in Ihrer Stadt ein monatliches Sprachcafé gründen, in dem sich Deutschlernende und Muttersprachler treffen.",
      partnerLines: ["Wo könnten wir uns treffen? Ein Café oder lieber die Stadtbibliothek?", "Wie finden wir Muttersprachler, die mitmachen wollen?", "Wie soll ein Abend ablaufen – mit Themen oder ganz frei?", "Brauchen wir Geld für irgendetwas, und wenn ja, woher bekommen wir es?"] },
    { title: "Ein Hochzeitsgeschenk", situation: "Gemeinsame Freunde heiraten in einem Monat. Sie möchten zusammen mit anderen Freunden ein besonderes Geschenk organisieren.",
      partnerLines: ["Ich fände ein gemeinsames Geldgeschenk für die Hochzeitsreise gut. Oder hast du eine kreativere Idee?", "Wie viele Leute fragen wir, und wie viel soll jeder beitragen?", "Sollen wir bei der Feier auch etwas vorführen, zum Beispiel ein Video?", "Wer sammelt das Geld ein und wer kümmert sich um die Verpackung?"] },
    { title: "Ein Tag der offenen Tür", situation: "Ihre Sprachschule veranstaltet einen Tag der offenen Tür, um neue Teilnehmende zu gewinnen. Sie beide sollen das Programm planen.",
      partnerLines: ["Ich fände Probestunden für Interessierte gut. Wie siehst du das?", "Sollen auch aktuelle Kursteilnehmende von ihren Erfahrungen erzählen?", "Wie machen wir Werbung, damit möglichst viele Leute kommen?", "Wer übernimmt am Tag selbst welche Aufgabe?"] },
    { title: "Eine Willkommensmappe für neue Kollegen", situation: "In Ihrer Firma fangen bald mehrere Kolleginnen und Kollegen aus dem Ausland an. Sie beide sollen eine Willkommensmappe und einen ersten Arbeitstag planen.",
      partnerLines: ["Was gehört deiner Meinung nach unbedingt in die Mappe?", "Sollte jeder neue Kollege eine Patin oder einen Paten bekommen?", "Wie könnten wir den ersten Tag gestalten, damit sich alle willkommen fühlen?", "Und wer kümmert sich um Behördengänge wie die Anmeldung?"] }
  ];

  function buildB2Part(part, opts) {
    if (part === 1) {
      const t = (opts && opts.topic) ? B2_T1.find(x => x.topic === opts.topic) || pickFresh("B2-t1", B2_T1) : pickFresh("B2-t1", B2_T1);
      const p = pickFresh("B2-partner", B2_PARTNER_T1);
      return {
        key: "t1", name: "Teil 1 · Über Erfahrungen sprechen", dur: "ca. 5 Min.",
        card: { title: "Thema: " + t.topic, lines: ["Yaklaşık 1,5 dakika bu konudaki deneyimlerini anlat. Sonra partnerinin sorularını cevapla.", "Partnerin de kendi konusunu anlatacak — dinleyip ona soru soracaksın."] },
        topic: t.topic,
        turns: [
          { who: "Prüfer", say: "Herzlich willkommen. Bevor es richtig losgeht: Stellen Sie sich bitte kurz gegenseitig vor.", task: "Isınma (puanlanmaz): kendini kısaca tanıt.", kind: "answer", target: 30 },
          { who: "Prüfer", say: "Danke. Im ersten Teil berichten Sie über eigene Erfahrungen. Ihr Thema lautet: " + t.topic + ".", task: "Yaklaşık 1,5 dakika deneyimlerini anlat (giriş – ayrıntı/örnek – değerlendirme).", kind: "monologue", target: 90 },
          { who: "Partner", say: t.qs[0], task: "Partnerinin sorusunu cevapla.", kind: "answer", target: 35 },
          { who: "Partner", say: t.qs[1], task: "İkinci soruyu cevapla.", kind: "answer", target: 35 },
          { who: "Partner", say: p.text, task: "Partnerin " + p.topic + " hakkında konuşuyor — dikkatle dinle.", kind: "listen" },
          { who: "Partner", say: "", task: "Partnerine anlattıklarıyla ilgili bir soru sor ya da yorum yap.", kind: "ask", target: 25,
            reply: "Gute Frage! Ehrlich gesagt hat mich das selbst überrascht – im Nachhinein war es eine der besten Entscheidungen, die ich getroffen habe." }
        ]
      };
    }
    if (part === 2) {
      const t = pickFresh("B2-t2", B2_T2);
      return {
        key: "t2", name: "Teil 2 · Diskussion", dur: "ca. 5 Min.",
        card: { title: t.title, lines: [t.text] },
        topic: t.title,
        turns: [
          { who: "Prüfer", say: "Weiter geht es mit der Diskussion. Grundlage ist der Text „" + t.title + "“. Fassen Sie bitte kurz zusammen, worum es geht, und sagen Sie, welcher Punkt Sie am meisten anspricht.", task: "Metnin içeriğini özetle ve seni en çok ilgilendiren noktayı söyle.", kind: "monologue", target: 60 },
          { who: "Partner", say: t.partnerArgs[0], task: "Kendi görüşünü gerekçe ve örnekle söyle.", kind: "answer", target: 45 },
          { who: "Partner", say: t.partnerArgs[1], task: "Karşı argümana yanıt ver.", kind: "answer", target: 45 },
          { who: "Partner", say: t.partnerArgs[2], task: "Görüşünü geliştir; kendi deneyiminden bir örnek ver.", kind: "answer", target: 45 },
          { who: "Prüfer", say: "Zum Abschluss dieses Teils: Wie könnte ein Mittelweg aussehen, mit dem beide Seiten leben können?", task: "Bir uzlaşma ya da çözüm öner.", kind: "answer", target: 40 }
        ]
      };
    }
    const t = pickFresh("B2-t3", B2_T3);
    return {
      key: "t3", name: "Teil 3 · Gemeinsam etwas planen", dur: "ca. 5 Min.",
      card: { title: t.title, lines: [t.situation, "Düşünebileceğin noktalar: program, yer ve zaman, ulaşım, yiyecek-içecek, bütçe, görev paylaşımı"] },
      topic: t.title,
      turns: [
        { who: "Prüfer", say: "Jetzt der letzte Teil. Ihre gemeinsame Aufgabe: " + t.situation, task: "Görevi dinle.", kind: "listen" },
        { who: "Partner", say: t.partnerLines[0], task: "Öneriye tepki ver; katılmıyorsan alternatif öner ve gerekçelendir.", kind: "answer", target: 35 },
        { who: "Partner", say: t.partnerLines[1], task: "Kendi önerini yap.", kind: "answer", target: 35 },
        { who: "Partner", say: t.partnerLines[2], task: "Bu konuyu birlikte çöz.", kind: "answer", target: 35 },
        { who: "Partner", say: t.partnerLines[3], task: "Görevleri paylaştırın.", kind: "answer", target: 35 },
        { who: "Prüfer", say: "Vielen Dank. Fassen Sie bitte zum Schluss Ihre Planung kurz zusammen.", task: "Planı kısaca özetle.", kind: "answer", target: 40 }
      ]
    };
  }

  /* ════════════════════════════════ katalog ════════════════════════════════ */
  window.__TELC_PICKFRESH__ = pickFresh; // C1 konuları da tekrar etmesin (muendlich.html)
  window.__TELC_LEVELS__ = {
    A2: { label: "A2", exam: "telc Deutsch A2 (Start Deutsch 2)", prepSecs: 0, total: "ca. 15 Min.",
          blurb: "Hazırlık süresi yok. Kendini tanıtma, kartlarla günlük konuşma ve birlikte karar verme.",
          parts: [1, 2, 3], partNames: ["Sich vorstellen", "Alltagsgespräch", "Etwas aushandeln"], build: buildA2Part },
    B1: { label: "B1", exam: "telc Deutsch B1 (Zertifikat Deutsch)", prepSecs: 1200, total: "ca. 15 Min.",
          blurb: "20 dk hazırlık. Tanışma, iki farklı görüş üzerine konuşma ve birlikte plan yapma.",
          parts: [1, 2, 3], partNames: ["Einander kennenlernen", "Über ein Thema sprechen", "Gemeinsam etwas planen"], build: buildB1Part },
    B2: { label: "B2", exam: "telc Deutsch B2", prepSecs: 1200, total: "ca. 16 Min.",
          blurb: "20 dk hazırlık. Deneyimlerini anlatma, bir metin üzerine tartışma ve birlikte plan yapma.",
          parts: [1, 2, 3], partNames: ["Über Erfahrungen sprechen", "Diskussion", "Gemeinsam etwas planen"], build: buildB2Part }
  };
})();
