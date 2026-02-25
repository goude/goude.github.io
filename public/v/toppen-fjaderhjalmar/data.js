/* ============================================================
   Hyaa — Þrjár tungur  |  data.js
   ============================================================

   DESIGN PRINCIPLE
   ────────────────
   svTokens is the canonical backbone of the whole piece.
   Each token is one Swedish-heard word/token as it appears in
   the commentary, in order, with an approximate timestamp (seconds
   from video start, estimated — to be refined once the video is
   processed).

   Everything else is derived from or referenced by svToken keys:
     • wordData[key]  — linguistic annotation for each unique word
     • lines[]        — line-level groupings (sv/is/en poem display)
     • The graph starts from SV nodes and follows edges outward

   VIDEO FORMAT RECOMMENDATION
   ────────────────────────────
   Use WebM (VP9 + Opus) as primary, MP4 (H.264 + AAC) as fallback.
   Both stream well in all browsers. Recommended encoding:
     ffmpeg -i input.mp4 \
       -c:v libvpx-vp9 -crf 33 -b:v 0 -c:a libopus -b:a 96k \
       output.webm
     ffmpeg -i input.mp4 \
       -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 128k \
       output.mp4
   ============================================================ */

// ── SV TOKENS — canonical spine ──────────────────────────────
// id:        unique token id (may repeat for same word said twice)
// word:      the Swedish phonetic transcription word
// t:         approximate seconds from video start (to be refined)
// lineIdx:   which line[] this token belongs to
//
// NOTE: words appearing multiple times in the poem each get their
// own token with a unique id (e.g. "hyaa_1" ... "hyaa_6").
const svTokens = [
  // Line 0 — "toppen, fjäderhjälmar"
  { id: "toppen_1", word: "toppen", t: 1.0, lineIdx: 0 },
  { id: "fjäderhjälmar_1", word: "fjäderhjälmar", t: 1.5, lineIdx: 0 },
  // Line 1 — "är leken och fyra"
  { id: "är_1", word: "är", t: 2.2, lineIdx: 1 },
  { id: "leken_1", word: "leken", t: 2.5, lineIdx: 1 },
  { id: "och_1", word: "och", t: 3.0, lineIdx: 1 },
  { id: "fyra_1", word: "fyra", t: 3.3, lineIdx: 1 },
  // Line 2 — "vart aldrig"
  { id: "vart_1", word: "vart", t: 4.0, lineIdx: 2 },
  { id: "aldrig_1", word: "aldrig", t: 4.4, lineIdx: 2 },
  // Line 3 — "fyra och två"
  { id: "fyra_2", word: "fyra", t: 5.0, lineIdx: 3 },
  { id: "och_2", word: "och", t: 5.3, lineIdx: 3 },
  { id: "två_1", word: "två", t: 5.6, lineIdx: 3 },
  // Line 4 — "Emmy"
  { id: "emmy_1", word: "emmy", t: 6.5, lineIdx: 4 },
  // Line 5 — "polle och te"
  { id: "polle_1", word: "polle", t: 7.2, lineIdx: 5 },
  { id: "och_3", word: "och", t: 7.5, lineIdx: 5 },
  { id: "te_1", word: "te", t: 7.7, lineIdx: 5 },
  // Line 6 — "polle och te" (repeated)
  { id: "polle_2", word: "polle", t: 8.2, lineIdx: 6 },
  { id: "och_4", word: "och", t: 8.5, lineIdx: 6 },
  { id: "te_2", word: "te", t: 8.7, lineIdx: 6 },
  // Line 7 — "Emily"
  { id: "emily_1", word: "emily", t: 9.5, lineIdx: 7 },
  // Lines 8–13 — "Hyaa" × 6
  { id: "hyaa_1", word: "hyaa", t: 11.0, lineIdx: 8 },
  { id: "hyaa_2", word: "hyaa", t: 11.5, lineIdx: 9 },
  { id: "hyaa_3", word: "hyaa", t: 12.0, lineIdx: 10 },
  { id: "hyaa_4", word: "hyaa", t: 12.5, lineIdx: 11 },
  { id: "hyaa_5", word: "hyaa", t: 13.0, lineIdx: 12 },
  { id: "hyaa_6", word: "hyaa", t: 13.5, lineIdx: 13 },
  // Line 14 — "Hjalmar ville hata"
  { id: "hjalmar_1", word: "hjalmar", t: 15.0, lineIdx: 14 },
  { id: "ville_1", word: "ville", t: 15.4, lineIdx: 14 },
  { id: "hata_1", word: "hata", t: 15.8, lineIdx: 14 },
  // Line 15 — "Du är en kakbit"
  { id: "du_1", word: "du", t: 16.5, lineIdx: 15 },
  { id: "är_2", word: "är", t: 16.8, lineIdx: 15 },
  { id: "en_1", word: "en", t: 17.0, lineIdx: 15 },
  { id: "kakbit_1", word: "kakbit", t: 17.3, lineIdx: 15 },
  // Line 16 — "i 16 avsnitt"
  { id: "i_1", word: "i", t: 17.8, lineIdx: 16 },
  { id: "16_1", word: "16", t: 18.0, lineIdx: 16 },
  { id: "avsnitt_1", word: "avsnitt", t: 18.3, lineIdx: 16 },
  // Line 17 — "Nu är det kavling"
  { id: "nu_1", word: "nu", t: 19.0, lineIdx: 17 },
  { id: "är_3", word: "är", t: 19.3, lineIdx: 17 },
  { id: "det_1", word: "det", t: 19.5, lineIdx: 17 },
  { id: "kavling_1", word: "kavling", t: 19.8, lineIdx: 17 },
  // Line 18 — "i 16 avsnitt" (repeated)
  { id: "i_2", word: "i", t: 20.3, lineIdx: 18 },
  { id: "16_2", word: "16", t: 20.5, lineIdx: 18 },
  { id: "avsnitt_2", word: "avsnitt", t: 20.8, lineIdx: 18 },
  // Line 19 — "Nu är det bara och vinna"
  { id: "nu_2", word: "nu", t: 21.5, lineIdx: 19 },
  { id: "är_4", word: "är", t: 21.8, lineIdx: 19 },
  { id: "det_2", word: "det", t: 22.0, lineIdx: 19 },
  { id: "bara_1", word: "bara", t: 22.3, lineIdx: 19 },
  { id: "och_5", word: "och", t: 22.6, lineIdx: 19 },
  { id: "vinna_1", word: "vinna", t: 22.9, lineIdx: 19 },
  // Line 20 — "och Österrike"
  { id: "och_6", word: "och", t: 23.5, lineIdx: 20 },
  { id: "österrike_1", word: "österrike", t: 23.8, lineIdx: 20 },
  // Line 21 — "Ratten är för rik"
  { id: "ratten_1", word: "ratten", t: 24.5, lineIdx: 21 },
  { id: "är_5", word: "är", t: 24.9, lineIdx: 21 },
  { id: "för_1", word: "för", t: 25.1, lineIdx: 21 },
  { id: "rik_1", word: "rik", t: 25.4, lineIdx: 21 },
  // Line 22 — "Är det någon skriftlig rink med Mali?"
  { id: "är_6", word: "är", t: 26.0, lineIdx: 22 },
  { id: "det_3", word: "det", t: 26.3, lineIdx: 22 },
  { id: "någon_1", word: "någon", t: 26.6, lineIdx: 22 },
  { id: "skriftlig_1", word: "skriftlig", t: 26.9, lineIdx: 22 },
  { id: "rink_1", word: "rink", t: 27.3, lineIdx: 22 },
  { id: "med_1", word: "med", t: 27.6, lineIdx: 22 },
  { id: "mali_1", word: "mali", t: 27.9, lineIdx: 22 },
  // Line 23 — "Verum kavling"
  { id: "verum_1", word: "verum", t: 28.8, lineIdx: 23 },
  { id: "kavling_2", word: "kavling", t: 29.1, lineIdx: 23 },
  // Line 24 — "Volfram"
  { id: "volfram_1", word: "volfram", t: 30.0, lineIdx: 24 },
  // Line 25 — "18 Ingvild"
  { id: "18_1", word: "18", t: 31.0, lineIdx: 25 },
  { id: "ingvild_1", word: "ingvild", t: 31.4, lineIdx: 25 },
  // Line 26 — "Krusbärsson eran skåra"
  { id: "krusbärsson_1", word: "krusbärsson", t: 32.2, lineIdx: 26 },
  { id: "eran_1", word: "eran", t: 32.8, lineIdx: 26 },
  { id: "skåra_1", word: "skåra", t: 33.2, lineIdx: 26 },
  // Line 27 — "Island - två öl"
  { id: "island_1", word: "island", t: 34.5, lineIdx: 27 },
  { id: "två_2", word: "två", t: 35.0, lineIdx: 27 },
  { id: "öl_1", word: "öl", t: 35.3, lineIdx: 27 },
  // Line 28 — "Österrike - ej"
  { id: "österrike_2", word: "österrike", t: 36.0, lineIdx: 28 },
  { id: "ej_1", word: "ej", t: 36.5, lineIdx: 28 },
  // Line 29 — "Filip och han aids"
  { id: "filip_1", word: "filip", t: 37.5, lineIdx: 29 },
  { id: "och_7", word: "och", t: 37.9, lineIdx: 29 },
  { id: "han_1", word: "han", t: 38.2, lineIdx: 29 },
  { id: "aids_1", word: "aids", t: 38.5, lineIdx: 29 },
  // Line 30 — "Filip och han har aids"
  { id: "filip_2", word: "filip", t: 39.5, lineIdx: 30 },
  { id: "och_8", word: "och", t: 39.9, lineIdx: 30 },
  { id: "han_2", word: "han", t: 40.2, lineIdx: 30 },
  { id: "har_1", word: "har", t: 40.5, lineIdx: 30 },
  { id: "aids_2", word: "aids", t: 40.8, lineIdx: 30 },
  // Line 31 — "Han"
  { id: "han_3", word: "han", t: 42.0, lineIdx: 31 },
  // Line 32 — "Han bara flöjta till äggs klocka ger"
  { id: "han_4", word: "han", t: 43.0, lineIdx: 32 },
  { id: "bara_2", word: "bara", t: 43.3, lineIdx: 32 },
  { id: "flöjta_1", word: "flöjta", t: 43.7, lineIdx: 32 },
  { id: "till_1", word: "till", t: 44.1, lineIdx: 32 },
  { id: "äggs_1", word: "äggs", t: 44.5, lineIdx: 32 },
  { id: "klocka_1", word: "klocka", t: 44.9, lineIdx: 32 },
  { id: "ger_1", word: "ger", t: 45.3, lineIdx: 32 },
  // Line 33 — "Och aldrig naken klibbat"
  { id: "och_9", word: "och", t: 46.0, lineIdx: 33 },
  { id: "aldrig_2", word: "aldrig", t: 46.3, lineIdx: 33 },
  { id: "naken_1", word: "naken", t: 46.7, lineIdx: 33 },
  { id: "klibbat_1", word: "klibbat", t: 47.1, lineIdx: 33 },
  // Line 34 — "Och aldrig något till man"
  { id: "och_10", word: "och", t: 48.0, lineIdx: 34 },
  { id: "aldrig_3", word: "aldrig", t: 48.3, lineIdx: 34 },
  { id: "något_1", word: "något", t: 48.7, lineIdx: 34 },
  { id: "till_2", word: "till", t: 49.0, lineIdx: 34 },
  { id: "man_1", word: "man", t: 49.3, lineIdx: 34 },
  // Line 35 — "Hör min lille aids vän"
  { id: "hör_1", word: "hör", t: 50.0, lineIdx: 35 },
  { id: "min_1", word: "min", t: 50.3, lineIdx: 35 },
  { id: "lille_1", word: "lille", t: 50.6, lineIdx: 35 },
  { id: "aids_3", word: "aids", t: 51.0, lineIdx: 35 },
  { id: "vän_1", word: "vän", t: 51.4, lineIdx: 35 },
  // Line 36 — "18 Ingvild tröstar son"
  { id: "18_2", word: "18", t: 52.5, lineIdx: 36 },
  { id: "ingvild_2", word: "ingvild", t: 52.9, lineIdx: 36 },
  { id: "tröstar_1", word: "tröstar", t: 53.3, lineIdx: 36 },
  { id: "son_1", word: "son", t: 53.7, lineIdx: 36 },
  // Line 37 — "Hans tryck-jackor fistas i urin"
  { id: "hans_1", word: "hans", t: 55.0, lineIdx: 37 },
  { id: "tryck-jackor_1", word: "tryck-jackor", t: 55.5, lineIdx: 37 },
  { id: "fistas_1", word: "fistas", t: 56.0, lineIdx: 37 },
  { id: "i_3", word: "i", t: 56.4, lineIdx: 37 },
  { id: "urin_1", word: "urin", t: 56.8, lineIdx: 37 },
  // Line 38 — "A och EM"
  { id: "a_1", word: "a", t: 58.0, lineIdx: 38 },
  { id: "och_11", word: "och", t: 58.3, lineIdx: 38 },
  { id: "em_1", word: "em", t: 58.6, lineIdx: 38 },
  // Line 39 — "Aldrig tappa"
  { id: "aldrig_4", word: "aldrig", t: 60.0, lineIdx: 39 },
  { id: "tappa_1", word: "tappa", t: 60.4, lineIdx: 39 },
  // Line 40 — "Klibbig, flikig"
  { id: "klibbig_1", word: "klibbig", t: 61.5, lineIdx: 40 },
  { id: "flikig_1", word: "flikig", t: 62.0, lineIdx: 40 },
  // Line 41 — "Aldrig tappad"
  { id: "aldrig_5", word: "aldrig", t: 63.0, lineIdx: 41 },
  { id: "tappad_1", word: "tappad", t: 63.4, lineIdx: 41 },
  // Line 42 — "En piss-diss i urin"
  { id: "en_2", word: "en", t: 64.5, lineIdx: 42 },
  { id: "piss-diss_1", word: "piss-diss", t: 64.9, lineIdx: 42 },
  { id: "i_4", word: "i", t: 65.3, lineIdx: 42 },
  { id: "urin_2", word: "urin", t: 65.6, lineIdx: 42 },
  // Line 43 — "Hästen har rymt"
  { id: "hästen_1", word: "hästen", t: 67.0, lineIdx: 43 },
  { id: "har_2", word: "har", t: 67.4, lineIdx: 43 },
  { id: "rymt_1", word: "rymt", t: 67.8, lineIdx: 43 },
  // Line 44 — "Island - två"
  { id: "island_2", word: "island", t: 69.0, lineIdx: 44 },
  { id: "två_3", word: "två", t: 69.4, lineIdx: 44 },
  // Line 45 — "Österrike - ett"
  { id: "österrike_3", word: "österrike", t: 70.0, lineIdx: 45 },
  { id: "ett_1", word: "ett", t: 70.4, lineIdx: 45 },
  // Line 46 — "Tack för du kom då Österrike"
  { id: "tack_1", word: "tack", t: 71.5, lineIdx: 46 },
  { id: "för_2", word: "för", t: 71.9, lineIdx: 46 },
  { id: "du_2", word: "du", t: 72.2, lineIdx: 46 },
  { id: "kom_1", word: "kom", t: 72.5, lineIdx: 46 },
  { id: "då_1", word: "då", t: 72.9, lineIdx: 46 },
  { id: "österrike_4", word: "österrike", t: 73.3, lineIdx: 46 },
  // Line 47 — "Tack för din Kommunal"
  { id: "tack_2", word: "tack", t: 74.5, lineIdx: 47 },
  { id: "för_3", word: "för", t: 74.9, lineIdx: 47 },
  { id: "din_1", word: "din", t: 75.2, lineIdx: 47 },
  { id: "kommunal_1", word: "kommunal", t: 75.6, lineIdx: 47 },
];

// ── POEM LINES ───────────────────────────────────────────────
// sv:     Swedish phonetic transcription (heard)
// is:     Icelandic reconstructed original
// en:     English translation of the Swedish phonetic text
//         (= what the Swedish words literally mean, not what Gummi Ben said)
// realSv: Real Swedish translation of the Icelandic original
// realEn: Real English translation of the Icelandic original
const lines = [
  {
    sv: "toppen, fjäderhjälmar",
    is: "~Toppur! Fjörðurhjálmar",
    en: "The peak! Feather-helmets",
    realSv: "Utmärkt! Fjordhjälmar",
    realEn: "Excellent! Fjord-helmets",
  },
  {
    sv: "är leken och fyra",
    is: "~er leikurinn og fjórir",
    en: "is the game and four",
    realSv: "är spelet och fyra",
    realEn: "is the game and four",
  },
  {
    sv: "vart aldrig",
    is: "~fór aldrei",
    en: "went never",
    realSv: "gick aldrig",
    realEn: "never went",
  },
  {
    sv: "fyra och två",
    is: "~fjórir og tveir",
    en: "four and two",
    realSv: "fyra och två",
    realEn: "four and two",
  },
  { sv: "Emmy", is: "~Emmi!", en: "Emmy!", realSv: "Emmy!", realEn: "Emmy!" },
  {
    sv: "polle och te",
    is: "~palli og té",
    en: "horsey and tea",
    realSv: "lille häst och te",
    realEn: "little horse and tea",
  },
  {
    sv: "polle och te",
    is: "~palli og té",
    en: "horsey and tea",
    realSv: "lille häst och te",
    realEn: "little horse and tea",
  },
  {
    sv: "Emily",
    is: "~Emilý!",
    en: "Emily!",
    realSv: "Emily!",
    realEn: "Emily!",
  },
  { sv: "Hyaa", is: "Já!", en: "Yes!", realSv: "Ja!", realEn: "Yes!" },
  { sv: "Hyaa", is: "Já!", en: "Yes!", realSv: "Ja!", realEn: "Yes!" },
  { sv: "Hyaa", is: "Já!", en: "Yes!", realSv: "Ja!", realEn: "Yes!" },
  { sv: "Hyaa", is: "Já!", en: "Yes!", realSv: "Ja!", realEn: "Yes!" },
  { sv: "Hyaa", is: "Já!", en: "Yes!", realSv: "Ja!", realEn: "Yes!" },
  { sv: "Hyaa", is: "Já!", en: "Yes!", realSv: "Ja!", realEn: "Yes!" },
  {
    sv: "Hjalmar ville hata",
    is: "~Hjalmar vildi hata",
    en: "Hjalmar wanted to hate",
    realSv: "Hjalmar ville hata",
    realEn: "Hjalmar wanted to hate",
  },
  {
    sv: "Du är en kakbit",
    is: "~Þú ert einn kakabiti",
    en: "You are a cookie-bit",
    realSv: "Du är en kakbit",
    realEn: "You are a piece of cake",
  },
  {
    sv: "i 16 avsnitt",
    is: "~í sextán þáttum",
    en: "in sixteen episodes",
    realSv: "i sexton delar",
    realEn: "in sixteen parts",
  },
  {
    sv: "Nu är det kavling",
    is: "~Nú er það kaflingur",
    en: "Now it's rope-coiling",
    realSv: "Nu är det reprulle",
    realEn: "Now it's rope-coiling",
  },
  {
    sv: "i 16 avsnitt",
    is: "~í sextán þáttum",
    en: "in sixteen episodes",
    realSv: "i sexton delar",
    realEn: "in sixteen parts",
  },
  {
    sv: "Nu är det bara och vinna",
    is: "~Nú er það bara að vinna",
    en: "Now it's just and win",
    realSv: "Nu handlar det bara om att vinna",
    realEn: "Now it's just about winning",
  },
  {
    sv: "och Österrike",
    is: "~og Austurríki",
    en: "and Austria",
    realSv: "och Österrike",
    realEn: "and Austria",
  },
  {
    sv: "Ratten är för rik",
    is: "~Ráðið er of ríkt",
    en: "The rat is too rich",
    realSv: "Rådet är för mäktigt",
    realEn: "The plan is too mighty",
  },
  {
    sv: "Är det någon skriftlig rink med Mali?",
    is: "~Er einhver skriflegur hringur með Malí?",
    en: "Is there a written rink with Mali?",
    realSv: "Finns det någon skriftlig ring med Mali?",
    realEn: "Is there any written connection with Mali?",
  },
  {
    sv: "Verum kavling",
    is: "~Satt kafling",
    en: "Verum rope-coiling",
    realSv: "Sant reprulle",
    realEn: "True rope-coiling",
  },
  {
    sv: "Volfram",
    is: "~Volfram",
    en: "Tungsten (element W)",
    realSv: "Volfram",
    realEn: "Tungsten (element W)",
  },
  {
    sv: "18 Ingvild",
    is: "~18 Ingvildur",
    en: "Player #18 Ingvild",
    realSv: "18 Ingvild",
    realEn: "Player #18 Ingvild",
  },
  {
    sv: "Krusbärsson eran skåra",
    is: "~Rifsbersson á skori",
    en: "Gooseberry-son, the era's score",
    realSv: "Rifsbersson på poängtavlan",
    realEn: "Rifsbersson on the scoreboard",
  },
  {
    sv: "Island - två öl",
    is: "~Ísland — tvö öl",
    en: "Iceland — two beers",
    realSv: "Island — två öl",
    realEn: "Iceland — two beers",
  },
  {
    sv: "Österrike - ej",
    is: "~Austurríki — nei",
    en: "Austria — nope",
    realSv: "Österrike — nej",
    realEn: "Austria — no",
  },
  {
    sv: "Filip och han aids",
    is: "~Filippus og eyðis hans",
    en: "Filip and his AIDS",
    realSv: "Filip och hans AIDS",
    realEn: "Filip and his AIDS",
  },
  {
    sv: "Filip och han har aids",
    is: "~Filippus og hann er með eyðis",
    en: "Filip and he has AIDS",
    realSv: "Filip och han har AIDS",
    realEn: "Filip and he has AIDS",
  },
  { sv: "Han", is: "~Hann", en: "He", realSv: "Han", realEn: "He" },
  {
    sv: "Han bara flöjta till äggs klocka ger",
    is: "~Hann blæs á flautu þar til eggsklukkan gefur",
    en: "He just flutes until egg-clock gives",
    realSv: "Han spelar flöjt tills äggklockan ringer",
    realEn: "He plays flute until the egg timer rings",
  },
  {
    sv: "Och aldrig naken klibbat",
    is: "~Og aldrei nakinn klístraður",
    en: "And never naked stuck",
    realSv: "Och aldrig naken klistrad",
    realEn: "And never naked and sticky",
  },
  {
    sv: "Och aldrig något till man",
    is: "~Og aldrei neitt til manns",
    en: "And never anything to man",
    realSv: "Och aldrig något till en man",
    realEn: "And never anything for a man",
  },
  {
    sv: "Hör min lille aids vän",
    is: "~Heyðu minn litli eyðisvingur",
    en: "Hear my little AIDS-friend",
    realSv: "Hör min lille AID-svän (eyðisvingur)",
    realEn: "Hey my little AIDS buddy",
  },
  {
    sv: "18 Ingvild tröstar son",
    is: "~18 Ingvildur treystar son",
    en: "18 Ingvild comforts son",
    realSv: "18 Ingvild tröstar sin son",
    realEn: "18 Ingvild comforts her son",
  },
  {
    sv: "Hans tryck-jackor fistas i urin",
    is: "~Hans þrýstijakkarnir festast í þvagi",
    en: "His pressure-jackets are fisted in urine",
    realSv: "Hans tryckkläder fastnar i urinen",
    realEn: "His compression garments are fixed in urine",
  },
  {
    sv: "A och EM",
    is: "~A og EM",
    en: "A and European Championship",
    realSv: "A och EM",
    realEn: "A and the European Championship",
  },
  {
    sv: "Aldrig tappa",
    is: "~Aldrei missa",
    en: "Never drop",
    realSv: "Aldrig missa",
    realEn: "Never miss",
  },
  {
    sv: "Klibbig, flikig",
    is: "~Klístraður, flipaður",
    en: "Sticky, tabby",
    realSv: "Klistrig, flikig",
    realEn: "Sticky, tabbed",
  },
  {
    sv: "Aldrig tappad",
    is: "~Aldrei misst",
    en: "Never dropped",
    realSv: "Aldrig missad",
    realEn: "Never missed",
  },
  {
    sv: "En piss-diss i urin",
    is: "~Þvagsvik í þvagi",
    en: "A piss-diss in urine",
    realSv: "Ett urinsvek i urinen",
    realEn: "A urine-betrayal in urine",
  },
  {
    sv: "Hästen har rymt",
    is: "~Hesturinn er flúinn",
    en: "The horse has escaped",
    realSv: "Hästen har rymt",
    realEn: "The horse has escaped",
  },
  {
    sv: "Island - två",
    is: "~Ísland — tvö",
    en: "Iceland — two",
    realSv: "Island — två",
    realEn: "Iceland — two",
  },
  {
    sv: "Österrike - ett",
    is: "~Austurríki — eitt",
    en: "Austria — one",
    realSv: "Österrike — ett",
    realEn: "Austria — one",
  },
  {
    sv: "Tack för du kom då Österrike",
    is: "Takk fyrir að þú komst, Austurríki",
    en: "Thanks for you came then Austria",
    realSv: "Tack för att du kom, Österrike",
    realEn: "Thank you for coming, Austria",
  },
  {
    sv: "Tack för din Kommunal",
    is: "Takk fyrir Sveitarfélagið þitt",
    en: "Thanks for your Kommunal",
    realSv: "Tack för din municipality",
    realEn: "Thank you for your municipality",
  },
];

// ── WORD DATA ─────────────────────────────────────────────────
// Keys = canonical Swedish-heard word forms (lowercase).
// These are the unique vocabulary items referenced by svTokens.
//
// Fields:
//   is           – Icelandic original word(s)
//   isCorrectSv  – [{sv, canon}] correct Swedish translation(s)
//   en           – English meaning of the SWEDISH HEARD word
//   note         – linguistic annotation
//   meanings     – English meanings array (for graph EN nodes)
const wordData = {
  toppen: {
    is: "toppur / góður",
    isCorrectSv: [{ sv: "toppen / bra!", canon: true }],
    en: "peak / great!",
    note: "Sw. 'toppen!' = great (exclamation). Is. 'toppur' = peak. Both work here.",
    meanings: ["the peak", "great! (exclamation)"],
  },
  fjäderhjälmar: {
    is: "Fjörðurhjálmar",
    isCorrectSv: [
      { sv: "fjordhjälmar", canon: true },
      { sv: "fjäderhjälmar", canon: false },
    ],
    en: "feather-helmets",
    note: "Probably 'Fjörður' (place/name) + hjálmar. Swedish child hears 'fjäder' = feather.",
    meanings: ["feather helmets", "fjord-helmets"],
  },
  är: {
    is: "er",
    isCorrectSv: [{ sv: "är", canon: true }],
    en: "is/are",
    note: "Direct cognate.",
    meanings: ["is", "are"],
  },
  leken: {
    is: "leikurinn",
    isCorrectSv: [
      { sv: "spelet", canon: true },
      { sv: "leken", canon: false },
    ],
    en: "the game",
    note: "leikur = game; Sw. lek = play (cognate)",
    meanings: ["the game", "the play"],
  },
  och: {
    is: "og",
    isCorrectSv: [{ sv: "och", canon: true }],
    en: "and",
    note: "og → och, near-identical",
    meanings: ["and"],
  },
  fyra: {
    is: "fjórir",
    isCorrectSv: [{ sv: "fyra", canon: true }],
    en: "four",
    note: "fjórir → fyra, cognate",
    meanings: ["four"],
  },
  vart: {
    is: "fór",
    isCorrectSv: [
      { sv: "gick", canon: true },
      { sv: "vart", canon: false },
    ],
    en: "went",
    note: "fór = went; Sw. 'vart' = where/went (dialectal)",
    meanings: ["went", "where to"],
  },
  aldrig: {
    is: "aldrei",
    isCorrectSv: [{ sv: "aldrig", canon: true }],
    en: "never",
    note: "aldrei → aldrig, direct cognate",
    meanings: ["never"],
  },
  två: {
    is: "tveir / tvö",
    isCorrectSv: [{ sv: "två", canon: true }],
    en: "two",
    note: "tveir/tvö → två cognate",
    meanings: ["two"],
  },
  emmy: {
    is: "Emmi",
    isCorrectSv: [{ sv: "Emmy", canon: true }],
    en: "Emmy (name)",
    note: "Name passed through phonetically intact",
    meanings: ["Emmy"],
  },
  polle: {
    is: "palli",
    isCorrectSv: [
      { sv: "pålle / lille häst", canon: true },
      { sv: "polle", canon: false },
    ],
    en: "horsey",
    note: "'Pålle' är ett vardagligt, smekfullt ord för häst, särskilt i barnspråk. Troligen ljudhärmande från lockrop som 'påll, påll'. Ingen verklig svensk standardform 'polle' existerar — det är en fonetisk transkription av isländskans 'palli' (kompis/lill-kuse).",
    meanings: ["horsey (childspeak)", "little horse", "pal"],
  },
  te: {
    is: "té",
    isCorrectSv: [{ sv: "te", canon: true }],
    en: "tea",
    note: "Direct loanword cognate",
    meanings: ["tea"],
  },
  emily: {
    is: "Emilý",
    isCorrectSv: [{ sv: "Emily", canon: true }],
    en: "Emily (name)",
    note: "Same name, different accent",
    meanings: ["Emily"],
  },
  hyaa: {
    is: "Já!",
    isCorrectSv: [
      { sv: "Ja! / Jaaaa!", canon: true },
      { sv: "Hyaa", canon: false },
    ],
    en: "YES!",
    note: "Icel. 'Já!' shouted in extreme excitement → child hears 'Hyaa'",
    meanings: ["Yes! (Icelandic)", "battle cry"],
  },
  hjalmar: {
    is: "Hjalmar",
    isCorrectSv: [{ sv: "Hjalmar", canon: true }],
    en: "Hjalmar (name)",
    note: "Shared Norse name",
    meanings: ["Hjalmar"],
  },
  ville: {
    is: "vildi",
    isCorrectSv: [{ sv: "ville", canon: true }],
    en: "wanted",
    note: "vildi → ville, cognate past tense",
    meanings: ["wanted"],
  },
  hata: {
    is: "hata",
    isCorrectSv: [{ sv: "hata", canon: true }],
    en: "to hate",
    note: "Direct cognate",
    meanings: ["to hate"],
  },
  du: {
    is: "þú",
    isCorrectSv: [{ sv: "du", canon: true }],
    en: "you",
    note: "þú → du cognate",
    meanings: ["you"],
  },
  en: {
    is: "einn / ein",
    isCorrectSv: [{ sv: "en / ett", canon: true }],
    en: "a / one",
    note: "einn → en cognate",
    meanings: ["a/an", "one"],
  },
  kakbit: {
    is: "kakabiti",
    isCorrectSv: [{ sv: "kakbit", canon: true }],
    en: "cookie bit",
    note: "kaka = cake (cognate), biti = bit (cognate)",
    meanings: ["cookie bit", "piece of cake"],
  },
  i: {
    is: "í",
    isCorrectSv: [{ sv: "i", canon: true }],
    en: "in",
    note: "Direct cognate",
    meanings: ["in", "into"],
  },
  16: {
    is: "sextán",
    isCorrectSv: [{ sv: "sexton", canon: true }],
    en: "sixteen",
    note: "Numeral",
    meanings: ["sixteen"],
  },
  avsnitt: {
    is: "þáttum",
    isCorrectSv: [{ sv: "avsnitt / delar", canon: true }],
    en: "episodes",
    note: "þáttum (episodes/parts) → avsnitt",
    meanings: ["episodes", "parts"],
  },
  nu: {
    is: "nú",
    isCorrectSv: [{ sv: "nu", canon: true }],
    en: "now",
    note: "nú → nu direct cognate",
    meanings: ["now"],
  },
  det: {
    is: "það",
    isCorrectSv: [{ sv: "det", canon: true }],
    en: "it / that",
    note: "það → det cognate",
    meanings: ["it", "that"],
  },
  kavling: {
    is: "kaflingur",
    isCorrectSv: [
      { sv: "kafling / reprulle", canon: true },
      { sv: "kavling", canon: false },
    ],
    en: "rope-coiling",
    note: "kaflingur (rope coil) → kavling phonetically",
    meanings: ["rope-coiling", "tumbling"],
  },
  bara: {
    is: "bara",
    isCorrectSv: [{ sv: "bara", canon: true }],
    en: "only / just",
    note: "Direct cognate",
    meanings: ["only/just"],
  },
  vinna: {
    is: "vinna",
    isCorrectSv: [{ sv: "vinna", canon: true }],
    en: "to win",
    note: "Direct cognate",
    meanings: ["to win"],
  },
  österrike: {
    is: "Austurríki",
    isCorrectSv: [{ sv: "Österrike", canon: true }],
    en: "Austria",
    note: "Austurríki = eastern realm; Österrike = eastern empire. Exact calque.",
    meanings: ["Austria"],
  },
  ratten: {
    is: "ráðið",
    isCorrectSv: [
      { sv: "rådet / beslutet", canon: true },
      { sv: "ratten", canon: false },
    ],
    en: "the rat / the wheel",
    note: "ráðið (the plan/council) → sounds like 'ratten' (the rat, or steering wheel)",
    meanings: ["the wheel", "the rat", "the plan (Is.)"],
  },
  för: {
    is: "of",
    isCorrectSv: [{ sv: "för / alltför", canon: true }],
    en: "too / for",
    note: "Is. 'of' (too) → Sw. 'för' (too/for)",
    meanings: ["too/too much", "for"],
  },
  rik: {
    is: "ríkt",
    isCorrectSv: [
      { sv: "rikt / mäktigt", canon: true },
      { sv: "rik", canon: false },
    ],
    en: "rich / mighty",
    note: "ríkt (mighty/rich) → rik cognate",
    meanings: ["rich", "mighty"],
  },
  någon: {
    is: "einhver",
    isCorrectSv: [{ sv: "någon", canon: true }],
    en: "someone / any",
    note: "einhver → någon",
    meanings: ["someone", "any"],
  },
  skriftlig: {
    is: "skriflegur",
    isCorrectSv: [{ sv: "skriftlig", canon: true }],
    en: "written",
    note: "Near-cognate: skrif-",
    meanings: ["written"],
  },
  rink: {
    is: "hringur",
    isCorrectSv: [
      { sv: "ring / länk", canon: true },
      { sv: "rink", canon: false },
    ],
    en: "ring / rink",
    note: "hringur (ring) → 'rink' by mishearing",
    meanings: ["rink (ice)", "ring"],
  },
  med: {
    is: "með",
    isCorrectSv: [{ sv: "med", canon: true }],
    en: "with",
    note: "með → med direct cognate",
    meanings: ["with"],
  },
  mali: {
    is: "Malí",
    isCorrectSv: [{ sv: "Mali", canon: true }],
    en: "Mali",
    note: "Proper noun, same in both",
    meanings: ["Mali (country)"],
  },
  verum: {
    is: "satt / sannur",
    isCorrectSv: [
      { sv: "sant / verkligen", canon: true },
      { sv: "Verum", canon: false },
    ],
    en: "true / Verum (brand)",
    note: "Is. 'satt' (true) → possibly misheard as Latin 'verum'; also a Swedish dairy brand",
    meanings: ["true", "Verum (brand)"],
  },
  volfram: {
    is: "Volfram",
    isCorrectSv: [{ sv: "Volfram / Wolfram", canon: true }],
    en: "Tungsten (W)",
    note: "Identical loanword in both",
    meanings: ["Tungsten"],
  },
  ingvild: {
    is: "Ingvildur",
    isCorrectSv: [{ sv: "Ingvild", canon: true }],
    en: "Ingvild (name)",
    note: "Norwegian/Icelandic feminine name",
    meanings: ["Ingvild"],
  },
  krusbärsson: {
    is: "Rifsbersson",
    isCorrectSv: [
      { sv: "Rifsbersson / Krusbersson", canon: true },
      { sv: "Krusbärsson", canon: false },
    ],
    en: "Gooseberry-son",
    note: "rifsber (Icel. gooseberry) → krusbär (Sw.) + -son patronymic",
    meanings: ["Gooseberry-son"],
  },
  eran: {
    is: "á skori",
    isCorrectSv: [
      { sv: "på poängtavlan", canon: true },
      { sv: "eran", canon: false },
    ],
    en: "the era's / on score",
    note: "á skori = on the score; heard as 'eran' (your era / the era)",
    meanings: ["the era's", "on the scoreboard"],
  },
  skåra: {
    is: "skori",
    isCorrectSv: [
      { sv: "poäng / mål", canon: true },
      { sv: "skåra", canon: false },
    ],
    en: "score / notch",
    note: "skora (Icel. score) → skåra cognate",
    meanings: ["score", "goal", "notch"],
  },
  island: {
    is: "Ísland",
    isCorrectSv: [{ sv: "Island", canon: true }],
    en: "Iceland",
    note: "Direct cognate, accent dropped",
    meanings: ["Iceland"],
  },
  öl: {
    is: "öl",
    isCorrectSv: [{ sv: "öl", canon: true }],
    en: "beer",
    note: "Exact cognate",
    meanings: ["beer"],
  },
  ej: {
    is: "nei",
    isCorrectSv: [
      { sv: "nej / inte", canon: true },
      { sv: "ej", canon: false },
    ],
    en: "no / not",
    note: "nei → ej (formal Swedish negative)",
    meanings: ["no", "not (formal)"],
  },
  filip: {
    is: "Filippus",
    isCorrectSv: [{ sv: "Filip", canon: true }],
    en: "Filip / Philip",
    note: "Filippus (Is.) → Filip (Sw.)",
    meanings: ["Filip (name)"],
  },
  han: {
    is: "hann",
    isCorrectSv: [{ sv: "han", canon: true }],
    en: "he / him",
    note: "hann → han direct cognate",
    meanings: ["he", "him"],
  },
  aids: {
    is: "eyðis",
    isCorrectSv: [{ sv: "aids", canon: true }],
    en: "AIDS",
    note: "eyðis (Icel. AIDS) → aids phonetically",
    meanings: ["AIDS (disease)"],
  },
  har: {
    is: "er með",
    isCorrectSv: [{ sv: "har", canon: true }],
    en: "has",
    note: "er með = has in Icelandic",
    meanings: ["has/have"],
  },
  bara: {
    is: "bara",
    isCorrectSv: [{ sv: "bara", canon: true }],
    en: "just / only",
    note: "Direct cognate",
    meanings: ["just", "only"],
  },
  flöjta: {
    is: "blæs á flautu",
    isCorrectSv: [
      { sv: "spelar flöjt", canon: true },
      { sv: "flöjta", canon: false },
    ],
    en: "plays flute",
    note: "blæs á flautu = blows on flute; → flöjta (Sw. dialectal/informal verb)",
    meanings: ["to play flute", "to whistle"],
  },
  till: {
    is: "þar til / til",
    isCorrectSv: [{ sv: "till", canon: true }],
    en: "to / until",
    note: "til → till direct cognate",
    meanings: ["to", "until"],
  },
  äggs: {
    is: "eggsins",
    isCorrectSv: [
      { sv: "äggklockan", canon: true },
      { sv: "äggs", canon: false },
    ],
    en: "of the egg",
    note: "eggs (egg's genitive) heard as Swedish possessive",
    meanings: ["egg's (genitive)", "of the egg"],
  },
  klocka: {
    is: "klukka",
    isCorrectSv: [{ sv: "klocka", canon: true }],
    en: "clock / bell",
    note: "klukka → klocka cognate",
    meanings: ["clock", "bell"],
  },
  ger: {
    is: "gefur",
    isCorrectSv: [{ sv: "ger", canon: true }],
    en: "gives",
    note: "gefur → ger phonetically",
    meanings: ["gives"],
  },
  naken: {
    is: "nakinn",
    isCorrectSv: [{ sv: "naken", canon: true }],
    en: "naked",
    note: "nakinn → naken cognate",
    meanings: ["naked"],
  },
  klibbat: {
    is: "klístraður",
    isCorrectSv: [
      { sv: "klistrad / klibbig", canon: true },
      { sv: "klibbat", canon: false },
    ],
    en: "sticky / stuck",
    note: "klístraður = sticky/glued",
    meanings: ["sticky", "stuck"],
  },
  något: {
    is: "neitt",
    isCorrectSv: [{ sv: "något / ingenting", canon: true }],
    en: "something / nothing",
    note: "neitt → något",
    meanings: ["something", "nothing"],
  },
  man: {
    is: "manns",
    isCorrectSv: [{ sv: "man / människa", canon: true }],
    en: "man / one",
    note: "manns → man cognate",
    meanings: ["man", "one (impersonal)"],
  },
  hör: {
    is: "heyðu",
    isCorrectSv: [{ sv: "hör", canon: true }],
    en: "hear! (imperative)",
    note: "heyðu → hör imperative cognate",
    meanings: ["hear! (imperative)"],
  },
  min: {
    is: "minn",
    isCorrectSv: [{ sv: "min", canon: true }],
    en: "my / mine",
    note: "minn → min cognate",
    meanings: ["my"],
  },
  lille: {
    is: "litli",
    isCorrectSv: [{ sv: "lille / lilla", canon: true }],
    en: "little",
    note: "litli → lille cognate",
    meanings: ["little (affectionate)"],
  },
  vän: {
    is: "vinur",
    isCorrectSv: [{ sv: "vän", canon: true }],
    en: "friend",
    note: "vinur = friend (Is.); → vän (Sw.)",
    meanings: ["friend"],
  },
  tröstar: {
    is: "treystar",
    isCorrectSv: [{ sv: "tröstar / lugnar", canon: true }],
    en: "comforts",
    note: "treystar → tröstar near-cognate",
    meanings: ["comforts", "consoles"],
  },
  son: {
    is: "son",
    isCorrectSv: [{ sv: "son", canon: true }],
    en: "son",
    note: "Exact cognate",
    meanings: ["son"],
  },
  hans: {
    is: "hans",
    isCorrectSv: [{ sv: "hans", canon: true }],
    en: "his",
    note: "Exact cognate",
    meanings: ["his"],
  },
  "tryck-jackor": {
    is: "þrýstijakkarnir",
    isCorrectSv: [
      { sv: "tryckkläder / kompressionsjackor", canon: true },
      { sv: "tryck-jackor", canon: false },
    ],
    en: "pressure-jackets",
    note: "þrýsti (pressure) → tryck; jakki → jacka",
    meanings: ["compression jackets", "pressure vests"],
  },
  fistas: {
    is: "festast",
    isCorrectSv: [
      { sv: "fästs / fastnar", canon: true },
      { sv: "fistas", canon: false },
    ],
    en: "are fixed / fisted",
    note: "festast (are fixed) → fistas",
    meanings: ["are fixed", "are attached"],
  },
  urin: {
    is: "þvagi",
    isCorrectSv: [{ sv: "urin", canon: true }],
    en: "urine",
    note: "þvag = urine; meaning transferred",
    meanings: ["urine"],
  },
  a: {
    is: "A",
    isCorrectSv: [{ sv: "A", canon: true }],
    en: "A",
    note: "Letter A",
    meanings: ["A (letter)"],
  },
  em: {
    is: "EM",
    isCorrectSv: [{ sv: "EM", canon: true }],
    en: "European Championship",
    note: "EM = Europameistaramót (Is.) = Europamästerskapet (Sw.)",
    meanings: ["European Championship"],
  },
  tappa: {
    is: "missa",
    isCorrectSv: [{ sv: "tappa / missa", canon: true }],
    en: "to drop / lose",
    note: "missa (Is.) = to miss/lose; → tappa",
    meanings: ["to drop", "to lose"],
  },
  klibbig: {
    is: "klístraður",
    isCorrectSv: [{ sv: "klibbig / kladdig", canon: true }],
    en: "sticky",
    note: "klístraður = sticky",
    meanings: ["sticky"],
  },
  flikig: {
    is: "flipaður",
    isCorrectSv: [{ sv: "flikig / med flikar", canon: true }],
    en: "tabbed / flappy",
    note: "flipaður → flikig phonetically",
    meanings: ["tabbed", "with flaps"],
  },
  tappad: {
    is: "misst",
    isCorrectSv: [{ sv: "tappad / missad", canon: true }],
    en: "dropped / lost",
    note: "misst (past part.) = missed/dropped",
    meanings: ["dropped", "lost"],
  },
  "piss-diss": {
    is: "þvagsvik",
    isCorrectSv: [{ sv: "urinsvek / pissdiss", canon: true }],
    en: "piss-diss",
    note: "þvag=urine + svik=betrayal/trick",
    meanings: ["piss-diss", "urine betrayal"],
  },
  hästen: {
    is: "hesturinn",
    isCorrectSv: [{ sv: "hästen", canon: true }],
    en: "the horse",
    note: "hestur → häst cognate + definite article",
    meanings: ["the horse"],
  },
  rymt: {
    is: "flúinn",
    isCorrectSv: [
      { sv: "rymt / flytt", canon: true },
      { sv: "rymt", canon: false },
    ],
    en: "escaped",
    note: "flúinn = escaped; rymt = Sw. past part. of rymma",
    meanings: ["escaped", "fled"],
  },
  ett: {
    is: "eitt",
    isCorrectSv: [{ sv: "ett", canon: true }],
    en: "one / a (neuter)",
    note: "eitt → ett cognate",
    meanings: ["one", "a/an (neuter)"],
  },
  tack: {
    is: "takk",
    isCorrectSv: [{ sv: "tack", canon: true }],
    en: "thank you",
    note: "takk → tack exact cognate",
    meanings: ["thank you"],
  },
  kom: {
    is: "komst",
    isCorrectSv: [{ sv: "kom", canon: true }],
    en: "came",
    note: "komst → kom past tense",
    meanings: ["came"],
  },
  då: {
    is: "þá",
    isCorrectSv: [{ sv: "då / nu", canon: true }],
    en: "then / so",
    note: "þá → då cognate",
    meanings: ["then", "so"],
  },
  din: {
    is: "þitt",
    isCorrectSv: [{ sv: "din", canon: true }],
    en: "your",
    note: "þitt → din cognate",
    meanings: ["your"],
  },
  kommunal: {
    is: "sveitarfélagið",
    isCorrectSv: [
      { sv: "kommunen / facket", canon: true },
      { sv: "Kommunal", canon: false },
    ],
    en: "municipality / Kommunal",
    note: "Kommunal = Swedish municipal workers' union. Is. sveitarfélagið = municipality.",
    meanings: ["municipality", "Kommunal (union)"],
  },
  18: {
    is: "18",
    isCorrectSv: [{ sv: "18", canon: true }],
    en: "18 (jersey number)",
    note: "Player jersey number",
    meanings: ["18 (jersey number)"],
  },
};
