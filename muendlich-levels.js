/* Mündlich Pratik — telc A2 / B1 / B2 sınav simülasyonu: format + konu bankası.
   Formatlar telc'in resmi Übungstest / Tipps belgelerine göre:
   - A2  telc Deutsch A2 (Start Deutsch 2): hazırlık yok; Teil 1 Sich vorstellen (~3'),
         Teil 2 Ein Alltagsgespräch führen (~4'), Teil 3 Etwas aushandeln (~4').
   - B1  telc Deutsch B1 (Zertifikat Deutsch): 20' hazırlık; Teil 1 Einander kennenlernen (~3'),
         Teil 2 Über ein Thema sprechen (~6'), Teil 3 Gemeinsam etwas planen (~6').
   - B2  telc Deutsch B2: 20' hazırlık; Einander kennenlernen (puansız), Teil 1 Über Erfahrungen
         sprechen (~5'), Teil 2 Diskussion (~5'), Teil 3 Gemeinsam etwas planen (~5').
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
    "Wie kommen Sie normalerweise zur Arbeit oder zum Kurs?"
  ];

  const A2_T2 = [
    { theme: "Tagesablauf", hint: "Was machen Sie normalerweise am Morgen, am Mittag, am Abend?",
      cards: ["Wann …?", "Was …?", "Wo …?", "Wie lange …?", "…?"],
      example: "Ich habe die Karte „Wie oft …?“. Ich kann also fragen: Wie oft am Tag essen Sie?",
      partnerQs: ["Wann stehst du normalerweise auf?", "Was isst du gern zum Frühstück?", "Wo arbeitest oder lernst du am Nachmittag?"],
      partnerReplies: ["Ich stehe meistens um halb sieben auf, am Wochenende später.", "Normalerweise mache ich das zu Hause, manchmal auch in der Bibliothek.", "Ungefähr eine Stunde, dann bin ich müde und gehe ins Bett."] },
    { theme: "Wochenende", hint: "Was machen Sie am Samstag und am Sonntag?",
      cards: ["Was …?", "Mit wem …?", "Wohin …?", "Wann …?", "…?"],
      example: "Ich habe die Karte „Wie lange …?“. Ich kann also fragen: Wie lange schlafen Sie am Sonntag?",
      partnerQs: ["Was machst du gern am Samstag?", "Mit wem verbringst du dein Wochenende?", "Wohin fährst du am Sonntag manchmal?"],
      partnerReplies: ["Am Samstag gehe ich meistens einkaufen und am Abend treffe ich Freunde.", "Meistens mit meiner Familie, manchmal auch mit Kollegen.", "Am liebsten an einen See oder in den Park."] },
    { theme: "Essen und Trinken", hint: "Was essen und trinken Sie gern? Wo und wann?",
      cards: ["Was …?", "Wo …?", "Wie oft …?", "Wer …?", "…?"],
      example: "Ich habe die Karte „Wann …?“. Ich kann also fragen: Wann essen Sie zu Mittag?",
      partnerQs: ["Was kochst du gern?", "Wie oft gehst du ins Restaurant?", "Was trinkst du am Morgen?"],
      partnerReplies: ["Ich esse sehr gern Nudeln mit Gemüse.", "Ungefähr einmal im Monat, das ist ziemlich teuer.", "Bei uns kocht meistens mein Mann, er kocht besser als ich."] },
    { theme: "Wohnen", hint: "Wie und wo wohnen Sie?",
      cards: ["Wo …?", "Wie groß …?", "Mit wem …?", "Was …?", "…?"],
      example: "Ich habe die Karte „Wie viele …?“. Ich kann also fragen: Wie viele Zimmer hat Ihre Wohnung?",
      partnerQs: ["Wo wohnst du genau?", "Wie groß ist deine Wohnung?", "Mit wem wohnst du zusammen?"],
      partnerReplies: ["Ich wohne in der Nähe vom Bahnhof, im dritten Stock.", "Meine Wohnung hat zwei Zimmer, eine Küche und einen kleinen Balkon.", "Am liebsten mag ich mein Wohnzimmer, da ist viel Licht."] },
    { theme: "Einkaufen", hint: "Wo, wann und was kaufen Sie ein?",
      cards: ["Wo …?", "Wann …?", "Was …?", "Wie viel …?", "…?"],
      example: "Ich habe die Karte „Wie oft …?“. Ich kann also fragen: Wie oft gehen Sie in den Supermarkt?",
      partnerQs: ["Wo kaufst du am liebsten ein?", "Wann gehst du meistens einkaufen?", "Was kaufst du gern im Internet?"],
      partnerReplies: ["Ich kaufe meistens im Supermarkt in meiner Straße ein.", "Am Samstagvormittag, dann habe ich Zeit.", "Für Lebensmittel brauche ich ungefähr siebzig Euro pro Woche."] },
    { theme: "Urlaub und Reisen", hint: "Wohin reisen Sie gern? Wie und mit wem?",
      cards: ["Wohin …?", "Wie …?", "Mit wem …?", "Wie lange …?", "…?"],
      example: "Ich habe die Karte „Wann …?“. Ich kann also fragen: Wann machen Sie Urlaub?",
      partnerQs: ["Wohin bist du zuletzt gereist?", "Wie reist du am liebsten – mit dem Zug, dem Auto oder dem Flugzeug?", "Mit wem machst du gern Urlaub?"],
      partnerReplies: ["Letzten Sommer war ich in Spanien am Meer.", "Am liebsten mit dem Zug, das ist bequem.", "Meistens zwei Wochen im Sommer."] }
  ];

  const A2_T3 = [
    { title: "Ein neues Hobby", task: "Sie suchen ein neues Hobby. Was können Sie zusammen machen? Was? Wann? Warum? Warum nicht? Finden Sie zwei passende Aktivitäten.",
      mine: ["Singen", "Tanzen", "Malen", "Fußball spielen", "…?"],
      partnerLines: [
        "Ich möchte gern Musik machen. Spielst du ein Instrument? Was meinst du?",
        "Hmm. Was möchtest du denn gern machen? Was steht auf deinem Blatt?",
        "Gute Idee! Wann hast du Zeit? Ich kann am Dienstagabend oder am Samstag.",
        "Super. Was machen wir als zweite Aktivität?"
      ] },
    { title: "Ein Wochenende in Hamburg", task: "Sie wollen zusammen ein Wochenende nach Hamburg fahren und dort etwas unternehmen. Jeder hat andere Vorschläge. Finden Sie passende Aktivitäten.",
      mine: ["Hafenrundfahrt", "Museum", "Einkaufen gehen", "Fischmarkt", "…?"],
      partnerLines: [
        "Ich möchte gern in ein Musical gehen. Hast du Lust?",
        "Ach so. Was möchtest du lieber machen?",
        "Okay! Und wann machen wir das – am Samstag oder am Sonntag?",
        "Gut. Wissen wir jetzt, wann und wo genau wir uns treffen?"
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
      ] }
  ];

  function buildA2Part(part) {
    if (part === 1) {
      const extra = pickN(A2_EXTRA_QS, 2);
      return {
        key: "t1", name: "Teil 1 · Sich vorstellen", dur: "ca. 3 Min.",
        card: { title: "Sich vorstellen", lines: ["Name?", "Alter?", "Land?", "Wohnort?", "Sprachen?", "Beruf?", "Hobby?"] },
        topic: "Sich vorstellen",
        turns: [
          { who: "Prüfer", say: "Willkommen bei der Mündlichen Prüfung telc Deutsch A2. Am Anfang wollen wir uns ein bisschen kennenlernen. Bitte stellen Sie sich kurz vor.", task: "Kartlardaki başlıkları kullanarak kendini tanıt (isim, yaş, ülke, şehir, diller, meslek, hobi).", kind: "monologue", target: 60 },
          { who: "Prüfer", say: extra[0], task: "Sınav görevlisinin ek sorusunu cevapla.", kind: "answer", target: 30 },
          { who: "Prüfer", say: extra[1], task: "İkinci ek soruyu cevapla.", kind: "answer", target: 30 },
          { who: "Partner", say: "Hallo, ich bin Lena. Ich komme aus Österreich und wohne jetzt in Köln. Ich bin Krankenschwester.", task: "Partnerine kendisiyle ilgili bir soru sor.", kind: "ask", target: 20,
            reply: "Ich lerne Deutsch für meine Arbeit. In meiner Freizeit gehe ich gern schwimmen." }
        ]
      };
    }
    if (part === 2) {
      const t = pick(A2_T2);
      const myCards = pickN(t.cards.slice(0, 4), 2).concat(["…?"]);
      return {
        key: "t2", name: "Teil 2 · Ein Alltagsgespräch führen", dur: "ca. 4 Min.",
        card: { title: "Thema: " + t.theme, lines: ["Senin kartların: " + myCards.join("  ·  "), "(„…?“ = Joker: istediğin soruyu sor)"] },
        topic: t.theme,
        turns: [
          { who: "Prüfer", say: "Wir kommen nun zum zweiten Teil. Sie sollen ein kurzes Gespräch miteinander führen. Das Thema ist: " + t.theme + ". " + t.hint + " " + t.example, task: "Örnek soruyu cevapla, böylece görevi anladığını göster.", kind: "answer", target: 20 },
          { who: "Partner", say: t.partnerQs[0], task: "Partnerinin sorusunu cevapla.", kind: "answer", target: 25 },
          { who: "Partner", say: "", task: "Kartın: „" + myCards[0] + "“ — bu kelimeyle konuya uygun bir soru sor.", kind: "ask", target: 15, reply: t.partnerReplies[0] },
          { who: "Partner", say: t.partnerQs[1], task: "Partnerinin sorusunu cevapla.", kind: "answer", target: 25 },
          { who: "Partner", say: "", task: "Kartın: „" + myCards[1] + "“ — bu kelimeyle bir soru sor.", kind: "ask", target: 15, reply: t.partnerReplies[1] },
          { who: "Partner", say: t.partnerQs[2], task: "Partnerinin sorusunu cevapla.", kind: "answer", target: 25 },
          { who: "Partner", say: "", task: "Joker kartın „…?“ — konuyla ilgili istediğin bir soruyu sor.", kind: "ask", target: 15, reply: t.partnerReplies[2] }
        ]
      };
    }
    const t = pick(A2_T3);
    return {
      key: "t3", name: "Teil 3 · Etwas aushandeln", dur: "ca. 4 Min.",
      card: { title: t.title, lines: [t.task, "Senin önerilerin: " + t.mine.join("  ·  ")] },
      topic: t.title,
      turns: [
        { who: "Prüfer", say: "Danke schön. Wir kommen zum dritten Teil. " + t.task, task: "Görevi dinle. Partnerinle birlikte karar vereceksiniz.", kind: "listen" },
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
    "Was gefällt Ihnen an der Stadt, in der Sie wohnen, und was nicht?"
  ];

  const B1_T2 = [
    { theme: "Gruppenreisen",
      mine: { name: "Sabine, 33, Bürokauffrau", quote: "Ich verreise gern in einer Gruppe. Allein reisen macht mir keinen Spaß. Bei Gruppenreisen lernt man neue Leute kennen und ein Reiseführer zeigt einem die Sehenswürdigkeiten." },
      partner: { name: "Jens, 39, Physiker", quote: "In einer Gruppe gibt es meist ein festes Programm. Deshalb reise ich immer allein – ganz nach Lust und Laune." },
      partnerLines: ["Auf meinem Blatt sagt Jens, dass er immer allein reist. In einer Gruppe gibt es ein festes Programm, und er möchte lieber selbst entscheiden, wann er ausschläft oder etwas besichtigt.",
        "Hast du selbst schon einmal eine Gruppenreise gemacht? Wie war das?",
        "Ich verstehe dich. Aber findest du nicht, dass man allein flexibler ist? Was denkst du?"] },
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
        "Aber im Winter ist es draußen kalt und dunkel. Was macht man dann?"] }
  ];

  const B1_T3 = [
    { title: "Abschiedsparty", situation: "Sie haben im Urlaub nette Deutsche kennengelernt. Bevor alle nach Hause fahren, möchten Sie eine Abschiedsparty feiern. Planen Sie die Party zusammen.",
      points: ["Wann?", "Wo?", "Essen", "Getränke", "Wer bezahlt wofür?", "…"],
      partnerLines: ["Ich schlage vor, wir feiern am Freitagabend. Passt dir das?", "Wo sollen wir feiern? Ich dachte an den Garten vom Hotel.", "Und was machen wir mit dem Essen? Sollen alle etwas mitbringen?", "Gut. Wer kümmert sich um die Getränke und wer bezahlt was?"] },
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
      partnerLines: ["Sie kommt am Freitagabend am Bahnhof an. Kannst du sie abholen?", "Wo kann sie übernachten? Ich habe leider nur ein kleines Zimmer.", "Was zeigen wir ihr am Samstag?", "Und was machen wir am Sonntag, bevor sie wieder fährt?"] }
  ];

  function buildB1Part(part) {
    if (part === 1) {
      const extra = pick(B1_EXTRA);
      return {
        key: "t1", name: "Teil 1 · Einander kennenlernen", dur: "ca. 3 Min.",
        card: { title: "Einander kennenlernen", lines: ["Name", "Woher sie/er kommt", "Wie sie/er wohnt (Wohnung, Haus …)", "Familie", "Wo sie/er Deutsch gelernt hat", "Was sie/er macht (Schule, Studium, Beruf …)", "Sprachen (welche? wie lange? warum?)"] },
        topic: "Einander kennenlernen",
        turns: [
          { who: "Prüfer", say: "Willkommen bei der Mündlichen Prüfung telc Deutsch B1. Die Prüfung hat drei Teile. Beginnen wir mit Teil 1: Bitte lernen Sie sich gegenseitig kennen.", task: "Sınav başlıyor — dinle.", kind: "listen" },
          { who: "Partner", say: "Hallo, ich heiße Tom. Ich komme aus England, aus Manchester. Und du? Wie heißt du und woher kommst du?", task: "Partnerine adını ve nereden geldiğini anlat.", kind: "answer", target: 25 },
          { who: "Partner", say: "Und wie wohnst du hier? In einer Wohnung oder in einem Haus? Mit deiner Familie?", task: "Nasıl yaşadığını ve aileni anlat.", kind: "answer", target: 30 },
          { who: "Partner", say: "", task: "Şimdi sen Tom'a soru sor (ör. ailesi, işi, Almanca'yı nerede öğrendiği).", kind: "ask", target: 20,
            reply: "Ich arbeite als Koch in einem Restaurant. Deutsch habe ich zuerst in der Volkshochschule gelernt, jetzt lerne ich vor allem bei der Arbeit." },
          { who: "Partner", say: "Wo hast du Deutsch gelernt? Und welche Sprachen sprichst du noch?", task: "Almanca'yı nerede öğrendiğini ve bildiğin dilleri anlat.", kind: "answer", target: 30 },
          { who: "Prüfer", say: extra, task: "Sınav görevlisinin ek sorusunu cevapla.", kind: "answer", target: 30 }
        ]
      };
    }
    if (part === 2) {
      const t = pick(B1_T2);
      return {
        key: "t2", name: "Teil 2 · Über ein Thema sprechen", dur: "ca. 6 Min.",
        card: { title: "Thema: „" + t.theme + "“", lines: ["Senin metnin — " + t.mine.name + ":", "„" + t.mine.quote + "“", "Görev: Metnindeki görüşü partnerine anlat, sonra kendi fikrini ve deneyimlerini söyle."] },
        topic: t.theme,
        turns: [
          { who: "Prüfer", say: "Vielen Dank. Nun kommen wir zu Teil 2. Sie haben beide unterschiedliche Aufgabenblätter mit Meinungen zum Thema „" + t.theme + "“ bekommen. Möchten Sie anfangen? Worum geht es auf Ihrem Blatt?", task: "Metnindeki kişinin görüşünü kendi cümlelerinle özetle (okuma, anlat).", kind: "monologue", target: 60 },
          { who: "Partner", say: t.partnerLines[0], task: "Partnerinin metnini dinle.", kind: "listen" },
          { who: "Prüfer", say: "Wie sehen Sie beide das? Wie ist Ihre Meinung dazu?", task: "Kendi fikrini gerekçeleriyle söyle.", kind: "answer", target: 45 },
          { who: "Partner", say: t.partnerLines[1], task: "Kendi deneyiminden anlat.", kind: "answer", target: 40 },
          { who: "Partner", say: t.partnerLines[2], task: "Partnerinin itirazına tepki ver; katılıyorsan ya da katılmıyorsan nedenini söyle.", kind: "answer", target: 40 },
          { who: "Partner", say: "", task: "Partnerine konuyla ilgili bir soru sor (ör. onun deneyimi ya da fikri).", kind: "ask", target: 20,
            reply: "Das ist eine gute Frage. Ich glaube, es kommt auf die Situation an – beides hat Vor- und Nachteile." }
        ]
      };
    }
    const t = pick(B1_T3);
    return {
      key: "t3", name: "Teil 3 · Gemeinsam etwas planen", dur: "ca. 6 Min.",
      card: { title: t.title, lines: [t.situation, "Notlar: " + t.points.join("  ·  ")] },
      topic: t.title,
      turns: [
        { who: "Prüfer", say: "Vielen Dank. Nun machen wir weiter mit Teil 3. Sie sollen gemeinsam etwas planen: " + t.situation + " Zum Schluss einigen Sie sich bitte darüber, was zu tun ist und wer welche Aufgabe übernimmt.", task: "Görevi dinle.", kind: "listen" },
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
    { topic: "Ihre Erfahrungen mit einem Umzug", qs: ["Was war beim Umzug das größte Problem?", "Wie lange hat es gedauert, bis du dich zu Hause gefühlt hast?"] }
  ];
  const B2_PARTNER_T1 = [
    { topic: "eine Sprachreise nach Spanien", text: "Ich möchte über meine Sprachreise nach Valencia erzählen. Ich war drei Wochen dort und habe bei einer Gastfamilie gewohnt. Am Anfang war es schwierig, weil die Familie sehr schnell gesprochen hat. Aber nach einer Woche habe ich viel mehr verstanden. Am meisten habe ich nicht im Kurs gelernt, sondern beim Abendessen mit der Familie. Deshalb würde ich jedem empfehlen, bei einer Gastfamilie zu wohnen." },
    { topic: "ein Ehrenamt im Tierheim", text: "Ich erzähle von meinem Ehrenamt im Tierheim. Seit zwei Jahren gehe ich jeden Samstag dorthin und gehe mit den Hunden spazieren. Am Anfang dachte ich, das ist nur ein Hobby. Inzwischen habe ich gemerkt, dass ich dadurch viel ruhiger geworden bin. Außerdem habe ich dort Menschen kennengelernt, die heute gute Freunde sind." }
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
      partnerArgs: ["Ich finde, Kinder brauchen heute einfach ein Handy, schon wegen der Sicherheit. Wie siehst du das?", "Andererseits sieht man ja überall Kinder, die nur noch auf den Bildschirm starren. Macht dir das keine Sorgen?", "Wer sollte deiner Meinung nach die Regeln festlegen – die Eltern, die Schule oder der Staat?"] }
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
      partnerLines: ["Ich hätte Lust auf etwas Aktives, zum Beispiel Kanufahren. Was meinst du?", "Was machen wir, wenn das Wetter schlecht ist?", "Wie kommen alle dorthin?", "Wer kümmert sich um Reservierungen und das Budget?"] }
  ];

  function buildB2Part(part, opts) {
    if (part === 1) {
      const t = (opts && opts.topic) ? B2_T1.find(x => x.topic === opts.topic) || pick(B2_T1) : pick(B2_T1);
      const p = pick(B2_PARTNER_T1);
      return {
        key: "t1", name: "Teil 1 · Über Erfahrungen sprechen", dur: "ca. 5 Min.",
        card: { title: "Thema: " + t.topic, lines: ["Yaklaşık 1,5 dakika bu konudaki deneyimlerini anlat. Sonra partnerinin sorularını cevapla.", "Partnerin de kendi konusunu anlatacak — dinleyip ona soru soracaksın."] },
        topic: t.topic,
        turns: [
          { who: "Prüfer", say: "Willkommen bei der Mündlichen Prüfung telc Deutsch B2. Darf ich Sie bitten, sich am Anfang kurz miteinander bekannt zu machen?", task: "Isınma (puanlanmaz): kendini kısaca tanıt.", kind: "answer", target: 30 },
          { who: "Prüfer", say: "Vielen Dank. Wir beginnen mit Teil 1. Bitte erzählen Sie über Ihre Erfahrungen zum Thema: " + t.topic + ".", task: "Yaklaşık 1,5 dakika deneyimlerini anlat (giriş – ayrıntı/örnek – değerlendirme).", kind: "monologue", target: 90 },
          { who: "Partner", say: t.qs[0], task: "Partnerinin sorusunu cevapla.", kind: "answer", target: 35 },
          { who: "Partner", say: t.qs[1], task: "İkinci soruyu cevapla.", kind: "answer", target: 35 },
          { who: "Partner", say: p.text, task: "Partnerin " + p.topic + " hakkında konuşuyor — dikkatle dinle.", kind: "listen" },
          { who: "Partner", say: "", task: "Partnerine anlattıklarıyla ilgili bir soru sor ya da yorum yap.", kind: "ask", target: 25,
            reply: "Gute Frage! Ehrlich gesagt hat mich das selbst überrascht – im Nachhinein war es eine der besten Entscheidungen, die ich getroffen habe." }
        ]
      };
    }
    if (part === 2) {
      const t = pick(B2_T2);
      return {
        key: "t2", name: "Teil 2 · Diskussion", dur: "ca. 5 Min.",
        card: { title: t.title, lines: [t.text] },
        topic: t.title,
        turns: [
          { who: "Prüfer", say: "Wir kommen zu Teil 2. Sie haben beide den Text „" + t.title + "“ gelesen. Sprechen Sie zunächst über den Inhalt: Welche Argumente oder Aspekte finden Sie interessant?", task: "Metnin içeriğini özetle ve seni en çok ilgilendiren noktayı söyle.", kind: "monologue", target: 60 },
          { who: "Partner", say: t.partnerArgs[0], task: "Kendi görüşünü gerekçe ve örnekle söyle.", kind: "answer", target: 45 },
          { who: "Partner", say: t.partnerArgs[1], task: "Karşı argümana yanıt ver.", kind: "answer", target: 45 },
          { who: "Partner", say: t.partnerArgs[2], task: "Görüşünü geliştir; kendi deneyiminden bir örnek ver.", kind: "answer", target: 45 },
          { who: "Prüfer", say: "Gibt es einen Kompromiss oder eine Lösung, die für beide Seiten akzeptabel wäre?", task: "Bir uzlaşma ya da çözüm öner.", kind: "answer", target: 40 }
        ]
      };
    }
    const t = pick(B2_T3);
    return {
      key: "t3", name: "Teil 3 · Gemeinsam etwas planen", dur: "ca. 5 Min.",
      card: { title: t.title, lines: [t.situation, "Yardımcı sorular: Was? Wer? Wann? Wo? Essen/Trinken? Kosten?"] },
      topic: t.title,
      turns: [
        { who: "Prüfer", say: "Wir kommen zum letzten Teil. Sie sollen gemeinsam etwas planen: " + t.situation, task: "Görevi dinle.", kind: "listen" },
        { who: "Partner", say: t.partnerLines[0], task: "Öneriye tepki ver; katılmıyorsan alternatif öner ve gerekçelendir.", kind: "answer", target: 35 },
        { who: "Partner", say: t.partnerLines[1], task: "Kendi önerini yap.", kind: "answer", target: 35 },
        { who: "Partner", say: t.partnerLines[2], task: "Bu konuyu birlikte çöz.", kind: "answer", target: 35 },
        { who: "Partner", say: t.partnerLines[3], task: "Görevleri paylaştırın.", kind: "answer", target: 35 },
        { who: "Prüfer", say: "Vielen Dank. Fassen Sie bitte zum Schluss Ihre Planung kurz zusammen.", task: "Planı kısaca özetle.", kind: "answer", target: 40 }
      ]
    };
  }

  /* ════════════════════════════════ katalog ════════════════════════════════ */
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
