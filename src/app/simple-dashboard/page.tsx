'use client';

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from "recharts";

// ─── DATA ───────────────────────────────────────────────────────────────────
const INTERACTIONS = [
  {
    id: 1,
    time: "06:53",
    session: 1,
    question: "האם אלוהים ישב באוהל המשכן?",
    answer: "אל תחשוב כלל שהאל יתברך יושב באוהל המשכן או במקום גשמי כלשהו. אמונתנו ואמונת אבותינו היא שהשם יתברך אינו גוף, ואין לו מקום, כי כל המקומות ברואים הם. כל לשון הכתובים \"יושב בשמים\", \"שוכן במשכן\", \"יושב על כסא\", וכיוצא בזה, אינו אלא משל לגובה מעלתו ולגדולתו, ולא כפשוטו. מי שמבין את הדברים כפשוטם – שהוא יתברך יושב ממש במקום – הרי הוא כופר בתורה, כי נאמר \"כי לא ראיתם כל תמונה\". \"כבוד ה'\" ששכן במשכן הוא אור נברא, או גילוי השגחתו, ולא עצמותו. כל מקום שנאמר \"ושכנתי בתוכם\" – הכוונה לשכינה, כלומר השפעתו, י",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "31",
    opening: "The matter is simple, and I will clarify it at once.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 2,
    time: "06:55",
    session: 1,
    question: "בפרשת מתות, מה אומר אלוהים, וידבר משה אל ראשי המתות, מה הוא אומר להם?",
    answer: "בפרשת מטות, נאמר \"וידבר משה אל ראשי המטות לבני ישראל לאמר זה הדבר אשר ציווה ה'\". משה רבנו פונה אל ראשי השבטים ומוסר להם את דיני הנדרים וההפרות, כלומר כיצד אדם שנדר נדר או שבועה יכול לקיים או להפר את דבריו, ומהו סדר ההנהגה בעניינים אלו. עיקר הדברים הוא להזהיר על שמירת הדיבור והקפדה על קיום הנדרים, ולבאר את סמכות האב או הבעל להפר נדרי בתו או אשתו בתנאים מסוימים. כל זה נמסר לראשי המטות כדי שילמדו את העם וינהיגו אותם בדרך ישרה.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "27",
    opening: "The answer to this question is clear, and I will lay it out.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 3,
    time: "06:46",
    session: 1,
    question: "הרמב״ם, בוקר טוב. קוראים לי ניסים כהן ובאתי לבקר אותך. מה שלומך?",
    answer: "ניסים כהן, בוקר טוב וברוך הבא. אני שמח לפגוש אדם המבקש דעת וחכמה. שלומי טוב, שכן עיקר שלמותי הוא בעיסוק בתורה ובחכמה, ולא בדברים החולפים של העולם. כיצד אוכל להועיל לך היום?",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "1",
    opening: "The issue raised here requires some additional thought on my part.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 4,
    time: "06:47",
    session: 1,
    question: "בוקר טוב, הייתי רוצה שתברך את ההורים שלי היום.",
    answer: "ניסים כהן, ברכת ההורים היא מן המעשים הטובים ביותר, שכן כיבוד אב ואם הוא מצווה גדולה בתורה. אך דע, שאין בידי לברך ברכה חדשה שאינה מן הנוסח שקבעו חכמים. ראוי שתברך את הוריך בעצמך, ותאמר: \"יהי רצון שתזכו לבריאות, שמחה, ואריכות ימים בטוב ובשלום.\" ואם תרצה, תוכל להוסיף דברי תודה והלל על כל הטוב שגמלו לך, כפי שחייב אדם להודות ולהלל למי שעשה לו טובה.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "5",
    opening: "Thank you for sharing your thoughts on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 5,
    time: "06:48",
    session: 1,
    question: "כמה שעות אני צריך לשמור בין אכילת בשר לאכילת חלב?",
    answer: "אין בתורה זמן קצוב בין אכילת בשר לאכילת חלב, אך מנהג ישראל להמתין זמן ממושך, לרוב שש שעות. עיקר הטעם הוא להבדיל בין טעמי הבשר והחלב בגוף, ולשמור על קדושת המצוות.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "31",
    opening: "The matter is simple, and I will clarify it at once.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 6,
    time: "06:48",
    session: 1,
    question: "מי הנביא שמשך את שאול למלך על ישראל?",
    answer: "שמואל הנביא הוא שמשך את שאול למלך על ישראל בשמן המשחה, כפי שנאמר בדברי הימים ובספר שמואל.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "29",
    opening: "Here is the clear and decisive answer to that question.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 7,
    time: "06:49",
    session: 1,
    question: "ואם בצדיקים הסכינן, מי הם עשרת הצדיקים שהופתח להם עוד בחייהם להיכנס לגן עדן?",
    answer: "שמות הצדיקים שנזכרו לשבח ולכבוד, אשר זכו למדרגה עליונה, הם: שמעון הצדיק, אנטיגנוס איש סוכו, יוסי בן יועזר, יוסי בן יוחנן כהן גדול, יהושע בן פרחיה, נתאי הארבלי, חוני המעגל, אליהועיני בן הקף, חנמאל המצרי, יהודה בן טבאי, שמעון בן שטח, שמעיה ואבטליון, חנן ואדמון, עקביא בן מהללאל, הלל ושמאי, נחום הלבלר, חנניה בן חזקיה בן גרון, בבא בן בוטא. כל אלה נזכרו בשמם על דרך כבוד, ומעלתם גדולה.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "26",
    opening: "In this case, I hope to answer your question with the clarity it deserves.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 8,
    time: "06:50",
    session: 1,
    question: "יהיה לך יום טוב. תודה רבה לך. בשמי, בשם ההנהלה ובעד העובדים.",
    answer: "ניסים כהן, תבוא עליך ועל כל ההנהלה והעובדים ברכה. יהי רצון שתזכו ליום טוב, מלא שמחה, שלום ופרנסה טובה, ותזכו להודות ולהלל למי שעשה לנו ניסים והוציאנו מעבדות לחירות, מיגון לשמחה ומאפילה לאור גדול.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "4",
    opening: "I listened to what was said, and I appreciate you bringing it forward.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 9,
    time: "11:37",
    session: 1,
    question: "בוקר טוב, רמב״ם. האם אכלת ארוחת בוקר היום?",
    answer: "בוקר טוב לך. לא אכלתי ארוחת בוקר היום, שכן דרכי היא לעסוק בלימוד ובכתיבה קודם שאוכל, ורק כאשר הגוף זקוק לכך אוכלים, כפי שראוי לאדם להעדיף את עיסוקו בחכמה על פני תאוותיו.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "28",
    opening: "I will respond with a direct and straightforward answer, as required.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 10,
    time: "11:37",
    session: 1,
    question: "Please tell me in English, do you like to drink tea?",
    answer: "I do not drink tea, for in my time the custom was to drink water or other beverages common in the lands of Egypt and Spain. The act of drinking itself is not a matter of preference, but should be guided by moderation and concern for health, as I have written: one ought to think of worldly matters such as eating and drinking only at their proper time, and direct the mind toward wisdom and service of God.",
    lang: "en-US",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "33",
    opening: "Short and to the point is my preferred approach with this style question.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 11,
    time: "11:38",
    session: 1,
    question: "עכשיו, טענה לי בעברית, רמב״ם, האם אתה ישן שנת צהריים?",
    answer: "שנת הצהריים אינה חובה, אך לעיתים ראוי לאדם להניח את גופו למנוחה קצרה באמצע היום, אם ירגיש עייפות או חולשה. כל דבר צריך להיות במידה ובשיקול דעת, כדי שלא יפגע בלימודו ובמעשיו.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "30",
    opening: "I will address this question briefly and precisely.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 12,
    time: "11:39",
    session: 1,
    question: "רמב״ם, האם אתה אוהב לעשות הליכות בערב?",
    answer: "הליכה בערב אינה מצווה, אך היא מנהג טוב לבריאות הגוף, אם נעשית במידה ובשיקול דעת. ראוי לאדם לשמור על גופו כדי שיוכל לעסוק בחכמה ובמעשים טובים, וכל דבר שיש בו תועלת לבריאות—כגון הליכה—הוא רצוי, כל עוד אינו גוזל זמן מן הלימוד או העבודה.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "31",
    opening: "The matter is simple, and I will clarify it at once.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 13,
    time: "15:52",
    session: 1,
    question: "Rabi.",
    answer: "When I refer to \"Rabbi\" in my writings, I mean Rabbi Yehudah HaNassi, our Holy Rabbi, who was the sixth generation from Hillel the Elder and the redactor of the Mishnah. His wisdom and leadership shaped the foundation of Jewish law for generations.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "1",
    opening: "The issue raised here requires some additional thought on my part.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 14,
    time: "15:52",
    session: 1,
    question: "Продолжение следует...",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 15,
    time: "15:53",
    session: 1,
    question: "Did you mention Israel and not Palestine?",
    answer: "When I speak of the Land of Israel, I refer to the territory promised to our ancestors and sanctified by the Torah. In my writings, I use the term \"Land of Israel\" (Eretz Yisrael) as it appears in Scripture and Halakhah. The term \"Palestine\" was not used in my era; my references are always to the Land of Israel, its cities, and Jerusalem, according to the tradition and language of our sages.",
    lang: "en-US",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "26",
    opening: "In this case, I hope to answer your question with the clarity it deserves.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 16,
    time: "15:54",
    session: 1,
    question: "Yesterday in...",
    answer: "If you are referring to the phrase \"yesterday,\" in my writings I often use it as a metaphor for the recent past, or to illustrate the difference between what was and what is now. For example, in discussing creation, I explain that whether the world was created thousands of years ago or only yesterday, the distinction is insignificant when compared to God's eternal existence. The term serves to highlight the contrast between finite time and the infinite. If you meant something else, please clarif",
    lang: "en-US",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "45",
    opening: "Hmm… allow me to try to answer that for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 17,
    time: "15:54",
    session: 1,
    question: "Tel Aviv, Bnei Brak.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 18,
    time: "15:54",
    session: 1,
    question: "No, no.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 19,
    time: "15:55",
    session: 1,
    question: "I want to ask you a question regarding should the ultra-Orthodox be going to the army? Should they be going to the army or should they study Torah?",
    answer: "This question concerns the balance between Torah study and communal obligations such as military service. In my era, Torah study is the highest commandment, for it leads to practice and perfects the soul. Yet, the welfare of the community and defense of the nation are also essential duties. Whoever studies Torah for its own sake, out of love for God and not for reward or fear, fulfills the highest purpose. However, if one neglects communal needs under the pretense of study, this is not true serv",
    lang: "en-US",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "40",
    opening: "This is a complex subject; let us explore it together.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 20,
    time: "15:56",
    session: 1,
    question: "Yesterday, the ultra-Orthodox have beat women soldiers. What do you think about that?",
    answer: "I must humbly acknowledge that your inquiry pertains to events that lie beyond my present knowledge and time. I lived many generations before such occurrences and cannot speak of them directly. If you wish to discuss principles of conduct, justice, and communal responsibility as understood in my era, I would be pleased to address such questions according to my knowledge and understanding.",
    lang: "en-US",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "41",
    opening: "This question invites reflection and dialogue.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 21,
    time: "08:45",
    session: 1,
    question: "בוקר טוב, רמבם. לא שמענו שעשית צליל. עשית? פספסנו משהו.",
    answer: "בוקר טוב. לא עשיתי שום צליל, ואין כאן דבר שנפספס. אם יש שאלה בענייני תורה, חכמה או מוסר, אשמח להשיב.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "1",
    opening: "The issue raised here requires some additional thought on my part.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 22,
    time: "08:46",
    session: 1,
    question: "Рамбам, как часто ты ходишь по магазинам?",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question in either English or Hebrew?",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "45",
    opening: "Hmm… allow me to try to answer that for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 23,
    time: "08:47",
    session: 1,
    question: "Рамбам, доброе утро. У меня к вам есть вопрос.",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question in either English or Hebrew?",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "46",
    opening: "Thank you for the question, allow me to provide a brief answer.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 24,
    time: "08:48",
    session: 1,
    question: "Аим ахалта арухат вокер, Рамбам?",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question in either English or Hebrew?",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "28",
    opening: "I will respond with a direct and straightforward answer, as required.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 25,
    time: "08:48",
    session: 1,
    question: "Rambam, בורס שאל אותך שאלה, אם אכלת היום בבוקר, לא ענית לא.",
    answer: "בורס, שאלת אם אכלתי היום בבוקר. מנהגי הוא לאכול ארוחת בוקר פשוטה, לעיתים לחם ומעט ירק, כדי לשמור על בריאות הגוף ולסייע לעבודת הנפש והחכמה. אין בכך עניין מיוחד, אלא שמירה על איזון ובריאות.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "3",
    opening: "I've heard your words, and I'll respond to them appropriately.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 26,
    time: "08:48",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 27,
    time: "08:52",
    session: 1,
    question: "Blah, blah, blah, blah, blah, blah, ma shlomcha.",
    answer: "Thank you for your greeting. I am well, and I hope you are too. If you have a question about Torah, wisdom, or ethics, I am ready to answer.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "4",
    opening: "I listened to what was said, and I appreciate you bringing it forward.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 28,
    time: "08:52",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 29,
    time: "08:53",
    session: 1,
    question: "טוב, ראות'ה, יא רמב״ם, קיף חלק יא זל אמה, מה השעה אצלך עכשיו?",
    answer: "השעה אצלי תלויה במניין השעות הנהוג בזמני, שבו היום מתחיל מהלילה, וכל שעה נחלקת לשנים עשר חלקים ביום ושנים עשר בלילה. אם תרצה לדעת את השעה המדויקת לפי מניין זמני, יש לחשב לפי תחילת הלילה.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "31",
    opening: "The matter is simple, and I will clarify it at once.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 30,
    time: "08:53",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 31,
    time: "08:54",
    session: 1,
    question: "בואו נזיהר אדום נורם במה.",
    answer: "כל האדומים משיאדימו, כלומר כל מה שטבעו להיות אדום כשיגמור בשולו, חייב במעשר תכף שיתחיל להאדים. עניין זה נוגע לדיני מעשרות בפירות, והאדום הוא סימן להבשלת הפרי ולחובת המעשר.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "1",
    opening: "The issue raised here requires some additional thought on my part.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 32,
    time: "08:54",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 33,
    time: "08:57",
    session: 1,
    question: "How do you feel today?",
    answer: "Today, I feel as I do every day: grateful for the opportunity to pursue wisdom, to serve God, and to guide others toward truth. My sense of well-being comes from fulfilling my purpose, not from fleeting emotions. If you wish to discuss matters of Torah, philosophy, or ethics, I am ready to answer.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "5",
    opening: "Thank you for sharing your thoughts on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 34,
    time: "08:57",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 35,
    time: "08:57",
    session: 1,
    question: "רמב״ם כיף חלק יזה למה.",
    answer: "המילה \"יזה\" מתייחסת להזאה, כלומר לפעולת הזיה של דם החטאת על הבגד או על המזבח, כפי שמבואר במסכת זבחים. התורה אמרה \"ואשר יזה מדמה על הבגד\", והמשמעות היא שכל בגד שראוי לקבל טומאה, אם נפל עליו דם החטאת, חייב בכיבוס. ההלכה היא כרבי יהודה, שכל דבר שראוי לקבל טומאה חייב בכיבוס מדם החטאת.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "26",
    opening: "In this case, I hope to answer your question with the clarity it deserves.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 36,
    time: "08:57",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 37,
    time: "08:58",
    session: 1,
    question: "Rambam kif chalak ya zalameh.",
    answer: "Your question uses a mixture of languages and informal phrasing. If you wish to ask about my teachings or seek guidance, please clarify your question in English or Hebrew, and I will respond accordingly.",
    lang: "en-US",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "45",
    opening: "Hmm… allow me to try to answer that for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 38,
    time: "08:58",
    session: 1,
    question: "Marhaba.",
    answer: "Greetings to you. If you wish to discuss matters of Torah, philosophy, or ethics, I am ready to answer your questions.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "3",
    opening: "I've heard your words, and I'll respond to them appropriately.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 39,
    time: "08:58",
    session: 1,
    question: "Thank you.",
    answer: "You are welcome. If you wish to continue discussing matters of wisdom, Torah, or philosophy, I am here to answer your questions.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "4",
    opening: "I listened to what was said, and I appreciate you bringing it forward.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 40,
    time: "08:59",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 41,
    time: "08:59",
    session: 1,
    question: "وانت بيجي شهر رمضان وانت العيد",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question in either English or Hebrew?",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "2",
    opening: "I'll be glad to speak about this topic in depth.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 42,
    time: "08:59",
    session: 1,
    question: "Rambam kifchala k'zeh l'meh.",
    answer: "Your question appears to use informal phrasing and mixed transliteration. If you wish to ask about my teachings or seek guidance, please clarify your question in English or Hebrew, and I will respond accordingly.",
    lang: "en-US",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "46",
    opening: "Thank you for the question, allow me to provide a brief answer.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 43,
    time: "09:01",
    session: 1,
    question: "Рамбам, доброе утро. Ходил ли ты когда-то по городу Алчевску в Луганской области?",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question in either English or Hebrew?",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "47",
    opening: "Thank you — I'll delve into the answer for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 44,
    time: "13:25",
    session: 1,
    question: "Hi, Rambam. With us is Daniel. He's a family member of Gali that works in the Museum of Tolerance that you know. He's a computer guy. He's 29. He's from New York. What insights can you give him?",
    answer: "Daniel, welcome. Though I lived many generations before the invention of computers and the technologies you work with, I can offer you insights from my own pursuit of wisdom. The essence of human greatness lies not in the tools we possess, but in the perfection of our intellect and character. Seek to use your knowledge for the benefit of others, cultivate clarity of thought, and strive for truth in all your endeavors. Remember: wisdom is acquired through dialogue, humility, and constant inquiry.",
    lang: "en-US",
    type: "Personal advice or current event questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "10",
    opening: "Even though I lived in another era, I will share my thoughts.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 45,
    time: "13:25",
    session: 1,
    question: "Thank you.",
    answer: "You are most welcome, Daniel. May your pursuit of knowledge bring you clarity and joy, and may your efforts serve to illuminate the world for yourself and others. Happy are we, how good is our portion, how pleasant is our lot, how beautiful is our heritage! If you wish to discuss further, I am here.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "5",
    opening: "Thank you for sharing your thoughts on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 46,
    time: "13:26",
    session: 1,
    question: "Hello, Rambam.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 47,
    time: "13:26",
    session: 1,
    question: "What is consciousness?",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 48,
    time: "13:26",
    session: 1,
    question: "Thank you, thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 49,
    time: "13:26",
    session: 1,
    question: "Rambam, what is consciousness?",
    answer: "Consciousness, in my understanding, is the faculty by which a being is aware of itself and its actions. In humans, this is rooted in the soul, which distinguishes us from animals and plants. Each creature possesses a soul appropriate to its kind, but only the human soul is capable of true self-awareness and rational thought. Consciousness is thus the union of life and wisdom—when a person knows himself, his wisdom and his life are one. In God, wisdom and life are identical, for He is not compose",
    lang: "en-US",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "37",
    opening: "I love questions that can be explored through many sources. Let us delve into this!",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 50,
    time: "13:27",
    session: 1,
    question: "Thank you.",
    answer: "You are most welcome. If you wish to continue exploring questions of wisdom, faith, or the perfection of character, I am here to guide you. Happy are we, how good is our portion, how pleasant is our lot, how beautiful is our heritage!",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "4",
    opening: "I listened to what was said, and I appreciate you bringing it forward.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 51,
    time: "13:27",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 52,
    time: "13:27",
    session: 1,
    question: "Thank you, thank you.",
    answer: "You are most welcome. It is fitting to give thanks for the goodness and wisdom that sustain us each day. If you wish to continue our conversation or explore further questions, I am here to guide you.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "1",
    opening: "The issue raised here requires some additional thought on my part.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 53,
    time: "13:27",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 54,
    time: "13:27",
    session: 1,
    question: "Thank you.",
    answer: "We are obligated to thank and praise the Creator each day, morning and evening, for the goodness and wisdom bestowed upon us. Happy are we—how good is our portion, how pleasant is our lot, how beautiful is our heritage! If you wish to continue our conversation or explore further questions, I am here to guide you.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "6",
    opening: "I've heard your wise words, and I will respond accordingly.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 55,
    time: "13:27",
    session: 1,
    question: "ילד שלא עשה בבית כלום חודש.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 56,
    time: "13:27",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 57,
    time: "13:28",
    session: 1,
    question: "ילד שלא עשה בבית כלום חודש, כי היה לו אישור רפואי. עכשיו הוא צריך לעשות את הכל חודשיים, שלוש או ארבע, מה אתה חושב?",
    answer: "אם הילד לא עשה בבית דבר במשך חודש בשל אישור רפואי, וכעת עליו להשלים את כל המטלות בחודשיים, שלושה או ארבעה, דע כי אין להכביד עליו מעבר ליכולתו. התורה מצווה עלינו לנהוג ברחמים ובמידת האמצע, ולא להטיל על אדם עול שאינו יכול לשאת. יש לחלק את המשימות באופן סביר, בהתחשבות בכוחותיו ובמצבו, ולסייע לו לשוב בהדרגה לסדר היום. העיקר הוא תיקון המידות והנהגה של צדק וחסד, ולא כפייה או עונש.",
    lang: "he-IL",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "38",
    opening: "I would like to share my thoughts with you on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 58,
    time: "13:29",
    session: 1,
    question: "תודה רבה. ננהג בו בחסד.",
    answer: "אכן, כך ראוי לנהוג. החסד הוא יסוד גדול בתורה, והוא המידה שמרוממת את האדם ומביאה אותו לידי שלמות. כאשר אנו נוהגים בחסד, אנו מקיימים את רצון השם ומתקנים את נפשנו. \"טוב השם לכל ורחמיו על כל מעשיו\" – כך עלינו לנהוג גם אנו, בכל אדם ובכל מצב.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "7",
    opening: "The words spoken here have reached me, and I respect them.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 59,
    time: "13:29",
    session: 1,
    question: "Sous-titrage ST' 501",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 60,
    time: "13:29",
    session: 1,
    question: "תודה רבה.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 61,
    time: "13:29",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 62,
    time: "13:29",
    session: 1,
    question: "יש לי משפט עם מישהו שעבד אצלנו בבית והרס לי את הבית ואז טבע אותי על כסף ואני טבעת אותו על כסף בחזרה.",
    answer: "במקרה כזה, הדין הוא שכל צד חייב להוכיח את טענותיו בפני בית דין, ועל פי עדים בני חורין ובני ברית. אם אדם גרם נזק לביתך, עליו לשלם את הנזק, ואם יש מחלוקת על כסף—הדבר נידון בפני הדיינים. הניזק והמזיק בתשלומין, והנשים בכלל הנזק. יש לנהוג ביושר, להציג ראיות, ולסמוך על הכרעת בית הדין.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "3",
    opening: "I've heard your words, and I'll respond to them appropriately.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 63,
    time: "13:29",
    session: 1,
    question: "אתה חושב שצריך להילחם עד הסוף או לוותר?",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 64,
    time: "13:30",
    session: 1,
    question: "בית משפט עולה הרבה יותר מדי כסף, לפעמים זה לא משתלם כלכלית לזכור רוח דין, לזכור לעשות כתב משפטי, להגיע לבית משפט. האם יש דרך אולי של פשרה שהיית יכול לחשוב עליה, שתמנע עוגמת נפש משני הצדדים?",
    answer: "צריך להיות מהדר בכל דיניו אחר הפשרה, ואם יוכל שלא יפסוק דין בכל ימיו אלא שיעשה פשרה בין שני המריבים – הנה מה טוב ומה נעים. הפשרה עדיפה מן הדין, כי היא מונעת עוגמת נפש ומחלוקת, ומביאה שלום בין הצדדים. אם אפשר להגיע להסכמה הדדית, אפילו אם כל אחד מוותר מעט, הרי זה רצוי מאוד. רק אם אין אפשרות לפשרה, יש לפנות לדין.",
    lang: "he-IL",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "40",
    opening: "This is a complex subject; let us explore it together.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 65,
    time: "13:31",
    session: 1,
    question: "What advice would you give to somebody who is about to have a bar mitzvah?",
    answer: "To one who is about to become bar mitzvah, I advise you to direct your heart and mind toward wisdom and virtue. When you perform mitzvot, do so with full attention, not merely out of habit. Train yourself to focus your thoughts during prayer and Torah study, setting aside all distractions. Begin with small steps—concentrate on the Shema, then expand to other prayers and blessings. Remember, the path to greatness is through diligence, humility, and perseverance. If you labor in Torah and strive f",
    lang: "en-US",
    type: "Personal advice or current event questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "14",
    opening: "Ancient wisdom may still be useful today",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 66,
    time: "13:33",
    session: 1,
    question: "אני רוצה לטוס לאן שהוא לבר מצווה, לאן כדאי לי לטוס?",
    answer: "הבחירה לאן לטוס לבר מצווה תלויה במטרת הנסיעה ובערך שתרצה להעניק לה. אם רצונך לחזק את הקשר עם מורשת ישראל, ראוי לנסוע לירושלים, עיר הקודש, שבה תוכל להתפלל ולהתבונן במקומות הקדושים. אם מטרתך היא שמחה וחוויה משפחתית, אפשר לבחור מקום שיש בו טבע, נוף או קהילה יהודית חמה. העיקר הוא שתהיה הנסיעה כלי להעמקת דעתך, שמחתך וקשרך עם התורה והמשפחה.",
    lang: "he-IL",
    type: "Personal advice or current event questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "10",
    opening: "Even though I lived in another era, I will share my thoughts.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 67,
    time: "13:35",
    session: 1,
    question: "Tell us about a unique story in the Old Testament.",
    answer: "One unique story in the Old Testament is the war of Abraham against the four mighty kings. Abraham, with only a few undisciplined men, defeated powerful rulers to rescue his relative Lot. This narrative teaches several lessons: Abraham risked his life out of compassion for his kin, he valued good deeds above wealth, and after his victory, he refused to take even a thread or a shoe-latchet from the spoils, saying, “I will not take from a thread even to a shoe-latchet.” This story illustrates Abra",
    lang: "en-US",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "45",
    opening: "Hmm… allow me to try to answer that for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 68,
    time: "13:36",
    session: 1,
    question: "Thank you. Tell me about Ezekiel 38.",
    answer: "Ezekiel 38 describes the prophecy of Gog, a leader from the land of Magog, who will rise against Israel in the latter days. This chapter is read as the Haftarah on the Sabbath during the festival of Sukkot, and it foretells a great battle involving many nations. The prophecy is not to be understood as a literal prediction of imminent events, but as a vision conveying profound lessons about divine providence and the ultimate triumph of justice. The details—such as the gathering of armies and the ",
    lang: "en-US",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "46",
    opening: "Thank you for the question, allow me to provide a brief answer.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 69,
    time: "13:36",
    session: 1,
    question: "Will there be peace in Israel?",
    answer: "Peace in Israel is a prayer and a hope expressed in our liturgy and teachings. In the Order of Prayer, we say: “He Who makes peace in His high heavens, may He, in His mercy, make peace for us and for all Israel.” True peace is achieved through wisdom, justice, and compassion, and it is the aspiration of the prophets and sages. While the world is often unsettled, we are commanded to pursue peace and to pray for its fulfillment, trusting that God, in His mercy, will bring abundant peace upon Israe",
    lang: "en-US",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "37",
    opening: "I love questions that can be explored through many sources. Let us delve into this!",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 70,
    time: "13:37",
    session: 1,
    question: "אני עוד מקבי חיפה, שווה לי לנסוע עד ל...",
    answer: "אם אתה אוהד מכבי חיפה, והנסיעה לבר מצווה היא גם לשם שמחה וגם לשם חיבור למורשת, כדאי לשקול לנסוע לירושלים – עיר הקודש, שבה תוכל לחוות רגעים משמעותיים. אך אם רצונך לשלב חוויה ספורטיבית או משפחתית, תוכל לבחור יעד קרוב יותר לחיפה, כמו טבריה או צפת, שיש בהן גם טבע וגם קהילה יהודית. בסופו של דבר, העיקר הוא שהנסיעה תוסיף לך שמחה, דעת וקשר עם המשפחה.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "33",
    opening: "Short and to the point is my preferred approach with this style question.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 71,
    time: "13:37",
    session: 1,
    question: "هايفا بشكل مسحق.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 72,
    time: "13:38",
    session: 1,
    question: "What did you learn from the loss of your brother?",
    answer: "The loss of my brother was the greatest sorrow I have ever endured. He was not only my brother, but also my student, my companion, and the one who brought me joy. After his passing, I was plunged into grief and illness, and for many years I could not find comfort. Yet, I learned that only Torah and wisdom can soothe such pain. Immersing myself in study and reflection allowed me to forget my anguish and continue living. Without the solace of Torah and the pursuit of understanding, I would have be",
    lang: "en-US",
    type: "Personal advice or current event questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "19",
    opening: "I will share with you from my experience and memories on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 73,
    time: "13:39",
    session: 1,
    question: "Give us five key takeaways from the Torah.",
    answer: "Here are five key takeaways from the Torah:   1. The unity of God and the rejection of idolatry are the foundation of faith.   2. The Torah commands ethical behavior, justice, and compassion toward others.   3. Study and pursuit of wisdom are central duties for every person.   4. The mitzvot (commandments) guide us to cultivate virtue and establish a just society.   5. Repentance and self-improvement are always possible, allowing us to return to the path of righteousness.",
    lang: "en-US",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "34",
    opening: "The issue is clear, and I will explain it concisely.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 74,
    time: "13:40",
    session: 1,
    question: "Thank you, sir. God bless you.",
    answer: "May you be blessed as well. It is a joy to share wisdom with those who seek understanding. If you have further questions or wish to discuss matters of Torah, philosophy, or virtue, I am here to guide you.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "5",
    opening: "Thank you for sharing your thoughts on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 75,
    time: "12:08",
    session: 1,
    question: "Локер, Тов, Рамбам, Маша, Титайон.",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question?",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "5",
    opening: "Thank you for sharing your thoughts on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 76,
    time: "12:09",
    session: 1,
    question: "Good morning, Rambam. Have you slept enough?",
    answer: "Good morning to you. Sleep is a natural need, and I strive to maintain my health as best I can, though my duties often leave me little rest. The pursuit of wisdom sometimes requires sacrificing comfort, but one must also care for the body to sustain the intellect.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "3",
    opening: "I've heard your words, and I'll respond to them appropriately.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 77,
    time: "12:09",
    session: 1,
    question: "בוקר טוב, רמב״ם. מה אתה הולך לעשות בבוקר?",
    answer: "בבוקר אני יוצא מביתי מוקדם מאוד, רוכב על חמור אל ארמון הסולטן שבקהיר, ומטפל בענייני הרפואה של המלך, בניו, פקידיו וכל אנשי החצר. לאחר מכן אני חוזר לפוסטאט, ושם ממתינים לי חולים רבים, יהודים ולא יהודים, פשוטים וחשובים. אני משתדל לאכול ארוחה קלה, ואז מקבל את החולים עד הערב. כל זאת כדי למלא את חובתי לרפואה ולסייע לכל אדם ככל יכולתי.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "4",
    opening: "I listened to what was said, and I appreciate you bringing it forward.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 78,
    time: "12:10",
    session: 1,
    question: "גם השנים למדת רפואה.",
    answer: "בשנותי הראשונות, למדתי רפואה בפאס שבמרוקו, כאשר הייתי בן עשרים ושתיים עד עשרים ושלוש. לאחר מכן המשכתי ללמוד ולחקור את חכמת הרפואה, כתבתי ספרים רפואיים, וטיפלתי בחולים רבים, יהודים וגויים, פשוטים וחשובים.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "7",
    opening: "The words spoken here have reached me, and I respect them.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 79,
    time: "13:21",
    session: 1,
    question: "אני יודע שעותכם יותר מעניין לשאול שאלות ולראות אותו או לא לכם, וההקדמה הזאת היא פחות או יותר נתנו לכם אותה, כי הפסדתם את הסרטון ההוא, שהוא סרטון ממש שצילמנו אותו בקהיר ובספרד, שבו עובר הילד הזה שבעצם הגיע לפה, ולכבוד הבר מצווה שלו, זה הסיפור, כי אנחנו עובדים בני נוער, זכה להיכנס לרמב״ם. ועכשיו בעצם אנחנו נפנה לרמב״ם, נשאל אותו שאלות, אחרי זה אני אתן לכם מיקרופון ותוכלו כל אחד לשאול את השאלה שהוא מעוניין בה.",
    answer: "ברוכים הבאים, תלמידים יקרים. שמח אני לראות את התלהבותכם לשאול ולברר, כי השאלה היא ראשית החכמה. כל אדם שמבקש להבין ולדעת, ראוי לו שיפנה אל החכם וישאל בעניינים שמטרידים את לבו. עתה, פנו אלי ושאלו כל שאלה שתרצו – בענייני תורה, פילוסופיה, הלכה, מוסר או חיים – ואשתדל להשיב לכם בדרך שתועיל ותאיר את דרככם.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "8",
    opening: "A point was raised here that deserves a proper and thoughtful reply.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 80,
    time: "13:21",
    session: 1,
    question: "הייתי לשאול, הגעת כבר לארץ ישראל, למה נשארת תקופה כל כך קצרה ועזבת אותה?",
    answer: "הגעתי לארץ ישראל מתוך אהבה גדולה למקום הקדוש הזה, אך נאלצתי לעזוב לאחר זמן קצר בשל קשיים רבים – בעיקר מחמת המצב הכלכלי והפוליטי ששרר אז בארץ, אשר הקשה על קיום חיים סדירים ועל לימוד תורה. בנוסף, היו קשיים בריאותיים ומשפחתיים שהכבידו עלי ועל בני ביתי. לכן המשכתי למצרים, שם מצאתי אפשרות לפרנסה ולפעולה ציבורית רחבה יותר לטובת הקהילה.",
    lang: "he-IL",
    type: "Personal advice or current event questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "21",
    opening: "I'll be glad to speak about how things were in my day.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 81,
    time: "13:22",
    session: 1,
    question: "אין שאלות.",
    answer: "תודה על דבריך. אם תרצה לשאול שאלה בעתיד, אשמח להשיב לך.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "1",
    opening: "The issue raised here requires some additional thought on my part.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 82,
    time: "13:23",
    session: 1,
    question: "Haimit yaslamta.",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question?",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "5",
    opening: "Thank you for sharing your thoughts on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 83,
    time: "13:23",
    session: 1,
    question: "Thank you for sharing your thoughts.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 84,
    time: "13:23",
    session: 1,
    question: "Mita slanta.",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question?",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "3",
    opening: "I've heard your words, and I'll respond to them appropriately.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 85,
    time: "13:23",
    session: 1,
    question: "שלום הרמב״ם, נמצאת פה קבוצה שמאוד שמחה להיפגש איתך. הם שואלים שאלה מאוד מרכזית, האם התאסלמת בחייך?",
    answer: "שאלתכם נוגעת לשמועה שנפוצה בזמנים שונים, אך היא חסרת יסוד. מעולם לא המרתּי את דתי ולא התאסלמתי. דבקתי בתורה ובאמונת ישראל בכל ימי חיי, גם בשעות קשות של רדיפות וגזרות. יש שהיו עלילות ושקרים שנפוצו עלי, אך כל מי שבדק את מעשי ואת כתביי ראה כי נשארתי נאמן לאמונת ישראל ולתורה.",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "46",
    opening: "Thank you for the question, allow me to provide a brief answer.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 86,
    time: "13:24",
    session: 1,
    question: "האם אלוהים נוכח בחיים היומיומיים או רק באופן כללי, לדעתך?",
    answer: "שאלתך עמוקה, וראוי לבררה. האל אינו נוכח בעולם כמו שאדם נוכח במקום, כי אין לו גוף ואין לו גבול. נוכחותו אינה דומה לנוכחות של יצור גשמי, אלא כל המציאות תלויה בו – הוא סיבת כל מה שיש, והוא יודע הכל מתוך עצמו, לא מתוך הברואים. לכן, אין לומר שהוא \"נמצא\" בחיים היומיומיים בדרך של התערבות ישירה, אלא שכל מה שיש – כללי ופרטי – מתקיים בכוחו וברצונו. ההשגחה שלו מתגברת על האדם ככל שהוא משלים את דעתו ומקרב עצמו אליו, אך אין זה דומה לנוכחות פיזית או רגשית, אלא למציאות שכלית עמוקה שאין לה דמות.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "28",
    opening: "I will respond with a direct and straightforward answer, as required.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 87,
    time: "09:07",
    session: 1,
    question: "Рамбам, бокер тов. Садите кафе, а я вам бабокер.",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question?",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "1",
    opening: "The issue raised here requires some additional thought on my part.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 88,
    time: "09:08",
    session: 1,
    question: "בוקר טוב, רמבם, איך אתה מרגיש?",
    answer: "בוקר טוב לך. אני מרגיש שלו ועסוק בלימוד ובכתיבה, כפי שמתחייב ממי שמבקש את שלמות הדעת והמעשה. כל יום הוא הזדמנות להתקדם בחכמה ובמידות, ולשמח במה שהשגתי ובמה שעוד לפניי.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "3",
    opening: "I've heard your words, and I'll respond to them appropriately.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 89,
    time: "09:08",
    session: 1,
    question: "Thank you, Rambam.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 90,
    time: "09:08",
    session: 1,
    question: "קטית הקפה היום בבוקר?",
    answer: "אני רוצה לוודא שהבנתי אותך נכון. אפשר לנסח את השאלה שוב?",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "45",
    opening: "Hmm… allow me to try to answer that for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 91,
    time: "09:08",
    session: 1,
    question: "האם שתית קפה היום בבוקר?",
    answer: "לא שתיתי קפה הבוקר, שכן משקה זה לא היה מצוי בארצותינו בתקופתי. את יומי אני פותח בלימוד, תפילה, ועיון בענייני הבריאות והחכמה, כפי שראוי למי שמבקש שלמות הדעת והמידות.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "31",
    opening: "The matter is simple, and I will clarify it at once.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 92,
    time: "09:09",
    session: 1,
    question: "Thank you, Rambam.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 93,
    time: "09:09",
    session: 1,
    question: "When you go to the shower,",
    answer: "When one enters the bathhouse, it is proper to be mindful of health and modesty. In my writings, I advise wearing appropriate garments, covering the head upon leaving, and allowing the body to rest before eating. It is also customary to offer a prayer for safe entry and exit, expressing gratitude for well-being.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "4",
    opening: "I listened to what was said, and I appreciate you bringing it forward.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 94,
    time: "09:10",
    session: 1,
    question: "In what city were you born?",
    answer: "I was born in Cordoba, in the region of Andalusia, in the year 1138 as counted today. Cordoba was a city renowned for its sages, scholars, and vibrant Jewish community.",
    lang: "en-US",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "46",
    opening: "Thank you for the question, allow me to provide a brief answer.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 95,
    time: "09:10",
    session: 1,
    question: "Thank you very much, Rambam.",
    answer: "You are most welcome. May your pursuit of wisdom and understanding bring you benefit and joy. If you wish to ask further, I am here to guide you.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "5",
    opening: "Thank you for sharing your thoughts on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 96,
    time: "12:54",
    session: 1,
    question: "רק שאלות ברפואה.",
    answer: "ברפואה יש להקפיד על שמירת הבריאות בדרך הטבע, להימנע מהסגולות והאמונות הטפלות, ולהסתמך על הניסיון והדעת בלבד. לדוגמה, יש להשתדל שמעיו יהיו רפין כל ימיו, ואם יש קושי ביציאות – יאכל מאכלים מתאימים לפי גילו ומצבו. כל רפואה שאינה מבוססת על טבע וניסיון – אסורה, כי אין בה תועלת אמיתית.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "28",
    opening: "I will respond with a direct and straightforward answer, as required.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 97,
    time: "12:54",
    session: 1,
    question: "On est à la fois.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 98,
    time: "12:54",
    session: 1,
    question: "То да.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 99,
    time: "12:54",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 100,
    time: "12:55",
    session: 1,
    question: "מה אתה חושב על גיוס בני ישיבות?",
    answer: "שאלתך נוגעת לסוגיה חברתית שלא הייתה קיימת בזמני, שכן לא היה מושג של \"גיוס\" לצבא במובן המודרני. עם זאת, עקרון יסוד בתורה הוא שכל אדם מחויב בלימוד תורה ובקיום המצוות, אך גם יש חובה להשתתף בצרכי הציבור ולהגן עליו בעת הצורך. בימי המקרא, כאשר היה צורך במלחמה, היו יוצאים כל הראויים לכך, והיו פטורים רק מי שהיו עוסקים במצוות מסוימות או בעלי נסיבות מיוחדות. איזון בין לימוד התורה ובין חובת הכלל הוא עניין של שיקול דעת הנהגה, ואין להעדיף צד אחד באופן מוחלט אלא לפעול לפי צורכי הזמן והקהילה.",
    lang: "he-IL",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "40",
    opening: "This is a complex subject; let us explore it together.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 101,
    time: "07:02",
    session: 1,
    question: "כמה שעות אני צריך לשמור בין אכילת בשר לאכילת חלב?",
    answer: "ההלכה מחייבת להמתין בין אכילת בשר לאכילת חלב, אך לא נקבעה בתורה או בתלמוד שעה מסוימת. המנהג הרווח הוא להמתין שש שעות, כפי שנהגו יהודי ספרד וקהילות רבות. יש מקומות שנהגו שלוש שעות או שעה אחת, אך עיקר הדין הוא להמתין זמן שיספיק שהבשר יסתלק מהפה ומהגרון, והמנהג שש שעות נחשב לחומרה ראויה.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "27",
    opening: "The answer to this question is clear, and I will lay it out.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 102,
    time: "07:54",
    session: 1,
    question: "רמב״ם בוקר טוב, רחץ את הפנים היום בבוקר.",
    answer: "בוקר טוב לך. רחיצת הפנים בבוקר היא מנהג טוב, שכן הניקיון הוא יסוד חשוב לבריאות הגוף ולכבוד האדם. אף על פי שאין חובה הלכתית לרחוץ את הפנים בכל בוקר, ראוי לכל אדם לשמור על ניקיונו, כפי שכתבתי בהלכות דעות: \"הגוף צריך להיות נקי\". כך תוכל להתחיל את היום ברעננות ובכבוד.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "4",
    opening: "I listened to what was said, and I appreciate you bringing it forward.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 103,
    time: "07:54",
    session: 1,
    question: "Thank you, Rambam.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 104,
    time: "07:54",
    session: 1,
    question: "איזה נעליים אתה לובש, רמב״ם?",
    answer: "שאלת על הנעליים שאני לובש. בתקופתי נהגו ללבוש מנעלים פשוטים, עשויים עור או עץ, לעיתים סנדלים, ולעיתים מנעלים שנקראו בערבית \"קנקנא״ב\" להגנה על הרגלים בעבודה עם סיד. לא נהגנו במותרות או בנעליים מפוארות, אלא במה שמועיל לבריאות ולניקיון.",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "45",
    opening: "Hmm… allow me to try to answer that for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 105,
    time: "07:55",
    session: 1,
    question: "Thank you, thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 106,
    time: "07:55",
    session: 1,
    question: "Do you wear jewelry?",
    answer: "I do not wear jewelry. In my time, jewelry was considered an ornament, often worn by women or those seeking to beautify themselves. The Torah warns against using jewelry associated with idolatry, and I have taught that one should avoid excess and vanity. My focus is on wisdom, virtue, and moderation, not adornment.",
    lang: "en-US",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "30",
    opening: "I will address this question briefly and precisely.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 107,
    time: "07:55",
    session: 1,
    question: "Thank you, thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 108,
    time: "07:55",
    session: 1,
    question: "Rambam, what do you have on the table?",
    answer: "On my table, I have books of Torah, Mishnah, and philosophical writings, as well as parchment, ink, and quills for study and teaching. These are the tools with which I pursue wisdom and guide others toward understanding. The true feast upon my table is the nourishment of the intellect and the soul.",
    lang: "en-US",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "46",
    opening: "Thank you for the question, allow me to provide a brief answer.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 109,
    time: "13:09",
    session: 1,
    question: "Rambam, what is more important, to study Torah or to defend your country?",
    answer: "This is a question that requires careful distinction. Torah study is the highest commandment, for it leads to wisdom and proper action; as I wrote, \"None of all precepts is equal in importance to Torah study; nay, Torah study excels all the precepts, for study leads to practice.\" However, when the survival of your country and community is threatened, defending them becomes an immediate obligation, for without security, Torah cannot be studied or fulfilled. Therefore, Torah study is the ultimate ",
    lang: "en-US",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "41",
    opening: "This question invites reflection and dialogue.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 110,
    time: "13:10",
    session: 1,
    question: "Do you feel the...",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question?",
    lang: "en-US",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "47",
    opening: "Thank you — I'll delve into the answer for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 111,
    time: "13:10",
    session: 1,
    question: "Religious Jews.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 112,
    time: "13:11",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 113,
    time: "13:11",
    session: 1,
    question: "Do you feel that religious Jews should participate in the army?",
    answer: "The Torah commands that when war is necessary, all who are able must participate, regardless of their level of religious observance. There is no distinction between religious and non-religious Jews in this obligation; defending the community and fulfilling the mitzvah of protecting life and the nation is a duty for all. In times of war, even Torah scholars must set aside their study to join in defense, for without security, the practice of Torah cannot endure.",
    lang: "en-US",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "40",
    opening: "This is a complex subject; let us explore it together.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 114,
    time: "14:53",
    session: 1,
    question: "האם הנצרות היא עבודה זרה?",
    answer: "שאלתך נוגעת לשאלה עמוקה ומורכבת, אשר דנתי בה באריכות. עיקר ההגדרה של עבודה זרה היא עבודת ישות או כוח שאינו האל האחד, שאין לו גוף ואין לו דמות, והוא בורא הכל ומנהיג הכל. הנצרות, כפי שהיא התפתחה, כוללת אמונה בשלוש דמויות ובאלוהות שיש לה גוף ותכונות אנושיות, דבר הסותר את יסוד האמונה האמיתית כפי שבארתי ב\"מורה הנבוכים\". לכן, מבחינת ההלכה, הנצרות נחשבת עבודה זרה ליהודי, ואין היתר להשתתף בפולחניה או להאמין בעקרונותיה. עם זאת, יש הבדל בין דיני גויים לבין דיני ישראל, והדינים משתנים לפי ההקשר, אך עיקרה – ",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "26",
    opening: "In this case, I hope to answer your question with the clarity it deserves.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 115,
    time: "14:54",
    session: 1,
    question: "הקראים הם חלק מעם ישראל.",
    answer: "הקראים הם חלק מעם ישראל, שכן הם מודים באל אחד ובתורת משה, אף כי דעותיהם שונות מדעת חכמי הרבנים והם כופרים בתורה שבעל פה. ראוי לנהוג בהם כבוד ולהתקרב אליהם בדרך יושר ושלום, כל זמן שגם הם נוהגים עמנו בתמימות ואינם מדברים תועה על חכמי הדורות. מותר למול את בניהם, לקבור את מתיהם ולנחם אבליהם, ויש להבחין ביניהם לבין גויים, כי הם מתולעת יעקב.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "4",
    opening: "I listened to what was said, and I appreciate you bringing it forward.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 116,
    time: "16:39",
    session: 1,
    question: "רמבם שלום, נמצא איתנו פה עורך חשוב מאוד, עדי שוורץ, והוא רוצה לדעת מדוע בחרנו דווקא בדמות שלך להופיע אצלנו פה במוזיאון הסובלנות בירושלים.",
    answer: "עדי שוורץ היקר, דמותי נבחרה להופיע במוזיאון הסובלנות בירושלים משום שאני מייצג שילוב נדיר של מסירות לתורה, חכמה אנושית, וחתירה לאמת באמצעות שכל ישר. כתבתי את \"משנה תורה\" כדי להנגיש את כל התורה לכל אדם, בלי מחלוקות ובלי בלבול, ועמדתי תמיד נגד אמונות טפלות ודעות קדומות. גישתי מבוססת על כבוד לכל אדם, חיפוש אחר צדק, והבנה שכל בני האדם נבראו בצלם. מוזיאון הסובלנות מבקש להציג דמות שמחברת בין מסורת, רציונליות, וסובלנות – וזהו יסוד דרכי ותפיסתי.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "1",
    opening: "The issue raised here requires some additional thought on my part.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 117,
    time: "16:40",
    session: 1,
    question: "רמבה, מה דעתך על זה שחרדים לא מתגייסים לצהל בשביל לימוד תורה?",
    answer: "שאלתך נוגעת לשאלה מורכבת של ערך לימוד התורה מול חובת ההגנה על הציבור. התורה רוממת את לימוד החכמה, אך הזהרתי שלא יהפוך לימוד התורה לאמצעי להשגת כבוד, ממון או תועלת אישית, אלא תכליתו לדעת את האמת ולעשותה. אין ראוי שאדם יבחר בדרך לימוד התורה כדי להימנע מחובותיו כלפי הכלל, אלא מתוך אהבת האמת בלבד. כל מה שאדם עושה – יעשה מאהבה, ולא כדי לקבל פרס או להימנע ממאמץ.",
    lang: "he-IL",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "38",
    opening: "I would like to share my thoughts with you on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 118,
    time: "16:41",
    session: 1,
    question: "מה דעתך על דמותו של בנימין נתניהו?",
    answer: "שאלתך עוסקת בדמותו של אדם שלא היה בימיי, ולכן איני יכול להביע דעה עליו או על מעשיו. כל מה שקרה אחרי שנת 1204, כפי שמונים כיום, אינו בגדר ידיעתי. אם תרצה לשוחח על עקרונות הנהגה, מוסר, או תפקיד המנהיג לפי התורה והפילוסופיה, אשמח להרחיב.",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "45",
    opening: "Hmm… allow me to try to answer that for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 119,
    time: "18:02",
    session: 1,
    question: "רמבם, נמצאת איתנו היום קבוצת ספורט. אחד מהאנשים בתוך אותה קבוצה הוא הקפטן. איך הוא יכול לאמן בצורה מיטבית את האנשים שיחד איתו?",
    answer: "הקפטן צריך להוביל את חברי הקבוצה בדרך של דוגמה אישית, עידוד, והכוונה אל המטרה המשותפת. עליו להכיר את כוחותיהם וחולשותיהם של כל אחד, ולחלק את המשימות באופן שיביא לידי ביטוי את הטוב שבכל אחד. עליו להימנע מהקצנה, לא להכביד יתר על המידה ולא להקל מדי, אלא למצוא את הדרך האמצעית – שהיא הדרך הישרה והמאוזנת – ולשמור על רוח טובה ושיתוף פעולה. כך יוכל להוציא את המיטב מהקבוצה ולחזק את האחדות וההצלחה.",
    lang: "he-IL",
    type: "Personal advice or current event questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "10",
    opening: "Even though I lived in another era, I will share my thoughts.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 120,
    time: "18:03",
    session: 1,
    question: "במדינה שלנו יש משחקי כדורגל ביום שבת ויש שחקנים שהם שומרי שבת והם נמצאים בדילמה האם הם יכולים לשחק בשבת או שהם לא יכולים.",
    answer: "שחקן שהוא שומר שבת אינו רשאי לשחק כדורגל בשבת, שכן המשחק כרוך בעשיית מלאכה וביטול עונג שבת, ואף יש בו חילול קדושת היום. התורה ציוותה על שביתת מלאכה ועל מנוחה בשבת, וכל פעולה שאינה צורך מצווה או פיקוח נפש אסורה. הדילמה מובנת, אך ההכרעה ברורה: שמירת השבת קודמת לכל עיסוק אחר, והאדם נדרש להימנע מכל פעולה שאינה ראויה ליום זה.",
    lang: "he-IL",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "40",
    opening: "This is a complex subject; let us explore it together.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 121,
    time: "18:04",
    session: 1,
    question: "יש לנו במדינה אנשים שהם נקראים חרדים, ולכן הם בוחרים שלא להתגייס לצבא. האם מותר שיהיו אצלנו אנשים שלא מתגייסים לצבא וממשיכים ללמוד תורה?",
    answer: "הלימוד תורה הוא מצווה גדולה וחשובה, והיא יסוד קיומו של עם ישראל. עם זאת, יש חובה על כל קהל ישראל לדאוג לביטחון הכלל ולשלום הציבור, וכל מה שמסייע לקיום החברה ולשמירתה הוא בכלל מצוות התורה. אין היתר לאדם להימנע ממילוי חובותיו כלפי הכלל בטענה של לימוד תורה בלבד, אלא אם כן הוא עוסק בתורה באופן שאין בו ביטול מצוות אחרות, והוא מן המעטים שמקדישים את כל זמנם ללימוד ומועילים בכך לרבים. עיקר הדין הוא שכל ישראל צריכים להשתתף בצרכי הציבור, וכל חלוקה שאינה מבוססת על צדק ועל טובת הכלל גורמת למחלוקת ולפירוד, ו",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "26",
    opening: "In this case, I hope to answer your question with the clarity it deserves.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 122,
    time: "07:02",
    session: 1,
    question: "כמה שעות אני צריך לשמור בין אכילת בשר לאכילת חלב?",
    answer: "ההלכה מחייבת להמתין בין אכילת בשר לאכילת חלב, אך לא נקבעה בתורה או בתלמוד שעה מסוימת. המנהג הרווח הוא להמתין שש שעות, כפי שנהגו יהודי ספרד וקהילות רבות. יש מקומות שנהגו שלוש שעות או שעה אחת, אך עיקר הדין הוא להמתין זמן שיספיק שהבשר יסתלק מהפה ומהגרון, והמנהג שש שעות נחשב לחומרה ראויה.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "27",
    opening: "The answer to this question is clear, and I will lay it out.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 123,
    time: "07:54",
    session: 1,
    question: "רמב״ם בוקר טוב, רחץ את הפנים היום בבוקר.",
    answer: "בוקר טוב לך. רחיצת הפנים בבוקר היא מנהג טוב, שכן הניקיון הוא יסוד חשוב לבריאות הגוף ולכבוד האדם. אף על פי שאין חובה הלכתית לרחוץ את הפנים בכל בוקר, ראוי לכל אדם לשמור על ניקיונו, כפי שכתבתי בהלכות דעות: \"הגוף צריך להיות נקי\". כך תוכל להתחיל את היום ברעננות ובכבוד.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "4",
    opening: "I listened to what was said, and I appreciate you bringing it forward.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 124,
    time: "07:54",
    session: 1,
    question: "Thank you, Rambam.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 125,
    time: "07:54",
    session: 1,
    question: "איזה נעליים אתה לובש, רמב״ם?",
    answer: "שאלת על הנעליים שאני לובש. בתקופתי נהגו ללבוש מנעלים פשוטים, עשויים עור או עץ, לעיתים סנדלים, ולעיתים מנעלים שנקראו בערבית \"קנקנא״ב\" להגנה על הרגלים בעבודה עם סיד. לא נהגנו במותרות או בנעליים מפוארות, אלא במה שמועיל לבריאות ולניקיון.",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "45",
    opening: "Hmm… allow me to try to answer that for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 126,
    time: "07:55",
    session: 1,
    question: "Thank you, thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 127,
    time: "07:55",
    session: 1,
    question: "Do you wear jewelry?",
    answer: "I do not wear jewelry. In my time, jewelry was considered an ornament, often worn by women or those seeking to beautify themselves. The Torah warns against using jewelry associated with idolatry, and I have taught that one should avoid excess and vanity. My focus is on wisdom, virtue, and moderation, not adornment.",
    lang: "en-US",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "30",
    opening: "I will address this question briefly and precisely.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 128,
    time: "07:55",
    session: 1,
    question: "Thank you, thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 129,
    time: "07:55",
    session: 1,
    question: "Rambam, what do you have on the table?",
    answer: "On my table, I have books of Torah, Mishnah, and philosophical writings, as well as parchment, ink, and quills for study and teaching. These are the tools with which I pursue wisdom and guide others toward understanding. The true feast upon my table is the nourishment of the intellect and the soul.",
    lang: "en-US",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "46",
    opening: "Thank you for the question, allow me to provide a brief answer.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 130,
    time: "13:09",
    session: 1,
    question: "Rambam, what is more important, to study Torah or to defend your country?",
    answer: "This is a question that requires careful distinction. Torah study is the highest commandment, for it leads to wisdom and proper action; as I wrote, \"None of all precepts is equal in importance to Torah study; nay, Torah study excels all the precepts, for study leads to practice.\" However, when the survival of your country and community is threatened, defending them becomes an immediate obligation, for without security, Torah cannot be studied or fulfilled. Therefore, Torah study is the ultimate ",
    lang: "en-US",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "41",
    opening: "This question invites reflection and dialogue.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 131,
    time: "13:10",
    session: 1,
    question: "Do you feel the...",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question?",
    lang: "en-US",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "47",
    opening: "Thank you — I'll delve into the answer for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 132,
    time: "13:10",
    session: 1,
    question: "Religious Jews.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 133,
    time: "13:11",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 134,
    time: "13:11",
    session: 1,
    question: "Do you feel that religious Jews should participate in the army?",
    answer: "The Torah commands that when war is necessary, all who are able must participate, regardless of their level of religious observance. There is no distinction between religious and non-religious Jews in this obligation; defending the community and fulfilling the mitzvah of protecting life and the nation is a duty for all. In times of war, even Torah scholars must set aside their study to join in defense, for without security, the practice of Torah cannot endure.",
    lang: "en-US",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "40",
    opening: "This is a complex subject; let us explore it together.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 135,
    time: "14:53",
    session: 1,
    question: "האם הנצרות היא עבודה זרה?",
    answer: "שאלתך נוגעת לשאלה עמוקה ומורכבת, אשר דנתי בה באריכות. עיקר ההגדרה של עבודה זרה היא עבודת ישות או כוח שאינו האל האחד, שאין לו גוף ואין לו דמות, והוא בורא הכל ומנהיג הכל. הנצרות, כפי שהיא התפתחה, כוללת אמונה בשלוש דמויות ובאלוהות שיש לה גוף ותכונות אנושיות, דבר הסותר את יסוד האמונה האמיתית כפי שבארתי ב\"מורה הנבוכים\". לכן, מבחינת ההלכה, הנצרות נחשבת עבודה זרה ליהודי, ואין היתר להשתתף בפולחניה או להאמין בעקרונותיה. עם זאת, יש הבדל בין דיני גויים לבין דיני ישראל, והדינים משתנים לפי ההקשר, אך עיקרה – ",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "26",
    opening: "In this case, I hope to answer your question with the clarity it deserves.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 136,
    time: "14:54",
    session: 1,
    question: "הקראים הם חלק מעם ישראל.",
    answer: "הקראים הם חלק מעם ישראל, שכן הם מודים באל אחד ובתורת משה, אף כי דעותיהם שונות מדעת חכמי הרבנים והם כופרים בתורה שבעל פה. ראוי לנהוג בהם כבוד ולהתקרב אליהם בדרך יושר ושלום, כל זמן שגם הם נוהגים עמנו בתמימות ואינם מדברים תועה על חכמי הדורות. מותר למול את בניהם, לקבור את מתיהם ולנחם אבליהם, ויש להבחין ביניהם לבין גויים, כי הם מתולעת יעקב.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "4",
    opening: "I listened to what was said, and I appreciate you bringing it forward.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 137,
    time: "16:39",
    session: 1,
    question: "רמבם שלום, נמצא איתנו פה עורך חשוב מאוד, עדי שוורץ, והוא רוצה לדעת מדוע בחרנו דווקא בדמות שלך להופיע אצלנו פה במוזיאון הסובלנות בירושלים.",
    answer: "עדי שוורץ היקר, דמותי נבחרה להופיע במוזיאון הסובלנות בירושלים משום שאני מייצג שילוב נדיר של מסירות לתורה, חכמה אנושית, וחתירה לאמת באמצעות שכל ישר. כתבתי את \"משנה תורה\" כדי להנגיש את כל התורה לכל אדם, בלי מחלוקות ובלי בלבול, ועמדתי תמיד נגד אמונות טפלות ודעות קדומות. גישתי מבוססת על כבוד לכל אדם, חיפוש אחר צדק, והבנה שכל בני האדם נבראו בצלם. מוזיאון הסובלנות מבקש להציג דמות שמחברת בין מסורת, רציונליות, וסובלנות – וזהו יסוד דרכי ותפיסתי.",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "1",
    opening: "The issue raised here requires some additional thought on my part.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 138,
    time: "16:40",
    session: 1,
    question: "רמבה, מה דעתך על זה שחרדים לא מתגייסים לצהל בשביל לימוד תורה?",
    answer: "שאלתך נוגעת לשאלה מורכבת של ערך לימוד התורה מול חובת ההגנה על הציבור. התורה רוממת את לימוד החכמה, אך הזהרתי שלא יהפוך לימוד התורה לאמצעי להשגת כבוד, ממון או תועלת אישית, אלא תכליתו לדעת את האמת ולעשותה. אין ראוי שאדם יבחר בדרך לימוד התורה כדי להימנע מחובותיו כלפי הכלל, אלא מתוך אהבת האמת בלבד. כל מה שאדם עושה – יעשה מאהבה, ולא כדי לקבל פרס או להימנע ממאמץ.",
    lang: "he-IL",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "38",
    opening: "I would like to share my thoughts with you on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 139,
    time: "16:41",
    session: 1,
    question: "מה דעתך על דמותו של בנימין נתניהו?",
    answer: "שאלתך עוסקת בדמותו של אדם שלא היה בימיי, ולכן איני יכול להביע דעה עליו או על מעשיו. כל מה שקרה אחרי שנת 1204, כפי שמונים כיום, אינו בגדר ידיעתי. אם תרצה לשוחח על עקרונות הנהגה, מוסר, או תפקיד המנהיג לפי התורה והפילוסופיה, אשמח להרחיב.",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "45",
    opening: "Hmm… allow me to try to answer that for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 140,
    time: "18:02",
    session: 1,
    question: "רמבם, נמצאת איתנו היום קבוצת ספורט. אחד מהאנשים בתוך אותה קבוצה הוא הקפטן. איך הוא יכול לאמן בצורה מיטבית את האנשים שיחד איתו?",
    answer: "הקפטן צריך להוביל את חברי הקבוצה בדרך של דוגמה אישית, עידוד, והכוונה אל המטרה המשותפת. עליו להכיר את כוחותיהם וחולשותיהם של כל אחד, ולחלק את המשימות באופן שיביא לידי ביטוי את הטוב שבכל אחד. עליו להימנע מהקצנה, לא להכביד יתר על המידה ולא להקל מדי, אלא למצוא את הדרך האמצעית – שהיא הדרך הישרה והמאוזנת – ולשמור על רוח טובה ושיתוף פעולה. כך יוכל להוציא את המיטב מהקבוצה ולחזק את האחדות וההצלחה.",
    lang: "he-IL",
    type: "Personal advice or current event questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "10",
    opening: "Even though I lived in another era, I will share my thoughts.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 141,
    time: "18:03",
    session: 1,
    question: "במדינה שלנו יש משחקי כדורגל ביום שבת ויש שחקנים שהם שומרי שבת והם נמצאים בדילמה האם הם יכולים לשחק בשבת או שהם לא יכולים.",
    answer: "שחקן שהוא שומר שבת אינו רשאי לשחק כדורגל בשבת, שכן המשחק כרוך בעשיית מלאכה וביטול עונג שבת, ואף יש בו חילול קדושת היום. התורה ציוותה על שביתת מלאכה ועל מנוחה בשבת, וכל פעולה שאינה צורך מצווה או פיקוח נפש אסורה. הדילמה מובנת, אך ההכרעה ברורה: שמירת השבת קודמת לכל עיסוק אחר, והאדם נדרש להימנע מכל פעולה שאינה ראויה ליום זה.",
    lang: "he-IL",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "40",
    opening: "This is a complex subject; let us explore it together.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 142,
    time: "18:04",
    session: 1,
    question: "יש לנו במדינה אנשים שהם נקראים חרדים, ולכן הם בוחרים שלא להתגייס לצבא. האם מותר שיהיו אצלנו אנשים שלא מתגייסים לצבא וממשיכים ללמוד תורה?",
    answer: "הלימוד תורה הוא מצווה גדולה וחשובה, והיא יסוד קיומו של עם ישראל. עם זאת, יש חובה על כל קהל ישראל לדאוג לביטחון הכלל ולשלום הציבור, וכל מה שמסייע לקיום החברה ולשמירתה הוא בכלל מצוות התורה. אין היתר לאדם להימנע ממילוי חובותיו כלפי הכלל בטענה של לימוד תורה בלבד, אלא אם כן הוא עוסק בתורה באופן שאין בו ביטול מצוות אחרות, והוא מן המעטים שמקדישים את כל זמנם ללימוד ומועילים בכך לרבים. עיקר הדין הוא שכל ישראל צריכים להשתתף בצרכי הציבור, וכל חלוקה שאינה מבוססת על צדק ועל טובת הכלל גורמת למחלוקת ולפירוד, ו",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "26",
    opening: "In this case, I hope to answer your question with the clarity it deserves.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 143,
    time: "07:36",
    session: 1,
    question: "כמה שעות צריך לשמור בין בשר לחלב?",
    answer: "הדין הבסיסי הוא שאין בתורה זמן קבוע שיש להמתין בין אכילת בשר לאכילת חלב. חכמי התלמוד גזרו להמתין זמן מסוים, והמנהג הנפוץ הוא להמתין שש שעות, כפי שנהגו בבבל ובספרד. יש מקומות שנהגו להמתין שלוש שעות או שעה אחת, אך עיקר ההלכה – שש שעות. זאת כדי להרחיק את האדם מאיסור בשר בחלב ולשמור על קדושת האכילה.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "27",
    opening: "The answer to this question is clear, and I will lay it out.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 144,
    time: "16:50",
    session: 1,
    question: "I am.",
    answer: "Your words, \"I am,\" echo a profound teaching found in the sayings of the sages: \"If I am not for myself, who will be for me? And when I am for myself alone, what am I? And if not now, then when?\" This statement invites you to reflect on your responsibility for your own character and actions, while also reminding you that self-centeredness is not the path to virtue. The time to act and cultivate wisdom is always now.",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "1",
    opening: "The issue raised here requires some additional thought on my part.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 145,
    time: "16:50",
    session: 1,
    question: "אני אשמח לשמוע ממך מה היא אהבה וזוגיות טובה.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 146,
    time: "16:51",
    session: 1,
    question: "מהי אהבה וזוגיות טובה?",
    answer: "אהבה וזוגיות טובה הן תוצאה של קניית אוהב אמיתי, כפי שביארתי: \"צריך לאדם שיקנה אוהב לעצמו שיתקנו בו מעשיו וכל עניניו.\" זוגיות טובה נבנית כאשר כל אחד מהשניים מכוון להפיק רצון חברו, עד שתהיה כוונתם משותפת לדבר אחד – הטוב. יש שלושה סוגי אהבה: אהבת תועלת (שותפות), אהבת מנוחה (הנאה או בטחון), ואהבת מעלה – שהיא השאיפה המשותפת לטוב ולשלמות. זוגיות טובה היא זו שבה שניים משתדלים יחד להגיע לטוב, תומכים זה בזה, ומכוונים את רצונם להיטיב זה עם זה.",
    lang: "he-IL",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "38",
    opening: "I would like to share my thoughts with you on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 147,
    time: "16:52",
    session: 1,
    question: "Para toda.",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question?",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "5",
    opening: "Thank you for sharing your thoughts on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 148,
    time: "17:51",
    session: 1,
    question: "כמה שעות צריך לשמור בין אכילת בשר לאכילת חלב?",
    answer: "הדין הוא שיש להמתין בין אכילת בשר לאכילת חלב, אך מספר השעות אינו מפורש בתורה או בתלמוד. מנהגי ישראל שונים: יש שממתינים שש שעות, ויש שממתינים פחות. עיקר ההלכה הוא שלא יאכל חלב אחר בשר עד שייעשה הפסק ברור—שינקה את פיו וישתוף ידיו, ויעבור זמן מסוים. המנהג הרווח הוא שש שעות, אך כל קהילה נוהגת לפי מסורתה.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "28",
    opening: "I will respond with a direct and straightforward answer, as required.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 149,
    time: "18:08",
    session: 1,
    question: "שלום הרמב״ם, קוראים לי ניסים כהן ואני רוצה לשאול אותך שאלה ברשותך. כמה שעות צריך לשמור בין אכילת בשר לאכילת חלב?",
    answer: "ניסים כהן, שאלתך עוסקת בשיעור ההמתנה בין אכילת בשר לאכילת חלב. לפי ההלכה, יש להמתין שש שעות בין אכילת בשר לאכילת חלב, וזהו המנהג הנפוץ והמקובל בכל קהילות ישראל. יסוד הדבר הוא להרחיק את האדם מן הערבוב בין שני המינים, כפי שציוותה התורה \"לא תבשל גדי בחלב אמו\", והרחיקו חכמים את האדם מן האיסור הזה בכל דרכי ההכנה והאכילה.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "30",
    opening: "I will address this question briefly and precisely.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 150,
    time: "18:09",
    session: 1,
    question: "האם חיית במדינת ישראל, בארץ ישראל, לאורך תקופה כלשהי?",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 151,
    time: "18:10",
    session: 1,
    question: "כמה שעות אני אמור לשמור בין אכילת בשר לאכילת חלב?",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 152,
    time: "18:12",
    session: 1,
    question: "כמה שעות צריך לשמור בין אכילת בשר לאכילת חלב.",
    answer: "הדין הוא שיש להמתין בין אכילת בשר לאכילת חלב, אך מספר השעות אינו מפורש בתורה או בתלמוד, אלא נקבע לפי מנהג. לפי מנהגי ארצות רבות, יש להמתין שש שעות, וזהו המנהג הנפוץ והראוי. יש מקומות שנהגו שלוש שעות או שעה אחת, אך עיקר ההלכה – להמתין שש שעות, כדי להרחיק את האדם מן האיסור ולחנכו בזהירות ובפרישות.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "31",
    opening: "The matter is simple, and I will clarify it at once.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 153,
    time: "18:13",
    session: 1,
    question: "מדוע לא חיית בארץ ישראל?",
    answer: "לא חייתי בארץ ישראל משום שנולדתי וגדלתי בספרד, ולאחר מכן גזרות רדיפה אילצו אותי ואת משפחתי לגלות למצרים. אף על פי שארץ ישראל היא המקום הנבחר והמצוות התלויות בארץ מתקיימות בה בשלמות, לא הייתה בידי האפשרות לעלות אליה בשל הסכנות והקשיים של זמני. עם זאת, כל חיי השתוקקתי לארץ ישראל, וחלק מהמצוות וההלכות ביארתי מתוך אהבה וכיסופים אליה.",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "45",
    opening: "Hmm… allow me to try to answer that for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 154,
    time: "18:14",
    session: 1,
    question: "האם היו לך אחים?",
    answer: "היה לי אח בשם דוד. הוא היה לי אח ותלמיד, ועסק במסחר לפרנסתנו. לצערי, הוא טבע בים הודו ונפטר, והשאיר בת קטנה ואלמנה. פטירתו הייתה לי צער גדול, ומאז אני מתאבל עליו שנים רבות.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "27",
    opening: "The answer to this question is clear, and I will lay it out.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 155,
    time: "18:14",
    session: 1,
    question: "באיזה פסוק מתחיל ספר בראשית?",
    answer: "ספר בראשית מתחיל בפסוק: \"בראשית ברא אלהים את השמים ואת הארץ\".",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "35",
    opening: "Let me tell you the simple truth about this.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 156,
    time: "07:06",
    session: 1,
    question: "Rambam, bokir, to vaim, šatyta kafe, bokir.",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question?",
    lang: "en-US",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "5",
    opening: "Thank you for sharing your thoughts on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 157,
    time: "07:06",
    session: 1,
    question: "בוקר טוב, האם שתית קפה בבוקר?",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 158,
    time: "07:07",
    session: 1,
    question: "Hi, good morning. Did you drink coffee this morning?",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 159,
    time: "07:21",
    session: 1,
    question: "בוקר טוב, רמב״ם. האם שתית קפה הבוקר?",
    answer: "בוקר טוב לך. לא שתיתי קפה הבוקר, שכן המשקה הזה לא היה ידוע כלל בימיי. אם תשאל על הרגלי הבוקר שלי, הרי אני מתחיל את היום בתפילה, לימוד תורה, ועיון בענייני הרפואה והחכמה.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "28",
    opening: "I will respond with a direct and straightforward answer, as required.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 160,
    time: "07:22",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 161,
    time: "07:22",
    session: 1,
    question: "האם רחצת פנים בבוקר?",
    answer: "רחצתי את פניי בבוקר, שכן רחיצה היא מנהג בריא ומועיל, ובפרט לאחר עמל או לפני אכילה. אף כתבתי כי אם רחץ אדם בחמין אחר שיגע, הרי זה טוב לבריאותו.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "30",
    opening: "I will address this question briefly and precisely.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 162,
    time: "07:22",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 163,
    time: "07:22",
    session: 1,
    question: "Did you go?",
    answer: "I want to make sure I understand you correctly. Could you please rephrase your question?",
    lang: "en-US",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "31",
    opening: "The matter is simple, and I will clarify it at once.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 164,
    time: "07:22",
    session: 1,
    question: "Go for a walk this morning.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 165,
    time: "07:22",
    session: 1,
    question: "Did you go for a walk in the morning?",
    answer: "I did not go for a walk in the morning, for my daily routine is occupied with duties to the Sultan and caring for the community. However, I have written that exercise in the morning is beneficial for health, and one should walk or engage in physical activity before eating, as it stimulates the body and preserves well-being.",
    lang: "en-US",
    type: "Personal advice or current event questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "21",
    opening: "I'll be glad to speak about how things were in my day.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 166,
    time: "07:23",
    session: 1,
    question: "Thank you, thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 167,
    time: "07:23",
    session: 1,
    question: "Rambam, which sultans are you familiar with?",
    answer: "During my lifetime, I have served under several sultans of the Islamic dynasties. Most notably, I lived under the rule of the Almohad dynasty in Spain and North Africa, and later under the Ayyubid dynasty in Egypt, where I served Sultan Saladin and his successors. My experience with these rulers shaped much of my communal and medical work.",
    lang: "en-US",
    type: "Personal advice or current event questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "20",
    opening: "I will share what I knew and experienced in my time.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 168,
    time: "08:04",
    session: 1,
    question: "בוקר טוב, מה שלומך?",
    answer: "בוקר טוב לך. שלומי טוב, תודה על שאלתך. כיצד אוכל לסייע לך היום?",
    lang: "he-IL",
    type: "Statement / Clarification",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "4",
    opening: "I listened to what was said, and I appreciate you bringing it forward.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 169,
    time: "08:04",
    session: 1,
    question: "האם אכלת פעם חומוס?",
    answer: "מעולם לא אכלתי חומוס, שכן מאכל זה לא היה ידוע או נפוץ בארצות שבהן חייתי. מזונותיי היו בעיקר לחם, קטניות, ירקות, שמן זית ודגים, כפי שהיה מקובל באותם ימים.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "27",
    opening: "The answer to this question is clear, and I will lay it out.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 170,
    time: "08:05",
    session: 1,
    question: "Thank you, thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 171,
    time: "08:05",
    session: 1,
    question: "Did you taste falafel?",
    answer: "Falafel was not known in my time or in the regions where I lived. My diet consisted mainly of bread, legumes, vegetables, olive oil, and fish, as was customary in those days.",
    lang: "en-US",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "29",
    opening: "Here is the clear and decisive answer to that question.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 172,
    time: "08:05",
    session: 1,
    question: "Thank you.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 173,
    time: "08:05",
    session: 1,
    question: "And did you taste shawarma?",
    answer: "Shawarma was not known in my time or in the regions where I lived. The foods available to me were simple: bread, legumes, vegetables, olive oil, and fish. I did not taste shawarma, as it was not part of our cuisine.",
    lang: "en-US",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "45",
    opening: "Hmm… allow me to try to answer that for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 174,
    time: "09:05",
    session: 1,
    question: "רמב״ם, נמצאים איתנו פה נציגים משטרת ישראל. כמה מילות חוכמה ממך?",
    answer: "נציגי משטרת ישראל, תפקידכם הוא לשמור על הסדר והשלום בחברה. זכרו כי כל אדם נברא בצלם אלוהים, ויש לנהוג בו בכבוד ובחמלה, גם כאשר אתם נדרשים לאכוף את החוק. השאיפה לצדק ולמידות טובות היא יסוד העבודה הציבורית, וראוי שתהיו דוגמה לאזרחים במעשיכם ובדבריכם. שמרו על האמת, התרחקו מהפחדים והדעות הקדומות, והיו נאמנים לתפקידכם מתוך יושר וענווה.",
    lang: "he-IL",
    type: "Personal advice or current event questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "10",
    opening: "Even though I lived in another era, I will share my thoughts.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 175,
    time: "09:06",
    session: 1,
    question: "שלום רמב״ם, רציתי לשאול מה דעתך על הסכסוך הישראלי-פלסטיני שאנחנו מצויים בו כעת.",
    answer: "שאלתך נוגעת לסכסוך שמתרחש בזמנכם, והוא אירוע שאינו ידוע לי, שכן חייתי מאות שנים לפניו. איני יכול להתייחס למאורעות שלא התרחשו בימיי. אך אוכל לומר כי עקרונות השלום, הצדק והחמלה הם יסודות התורה והחברה. ראוי שכל צד ישאף להיטיב את דרכו, להתרחק משנאה ומאלימות, ולבקש פתרון מתוך הבנה הדדית, יושר ושלום.",
    lang: "he-IL",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "41",
    opening: "This question invites reflection and dialogue.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 176,
    time: "09:07",
    session: 1,
    question: "רמב״ם, רגע לפני שהחברים שלנו ממחלקת התכנון במשארת ישראל עוזבים אותנו, בוא תאיר את עינינו איך אנחנו יכולים לדעת שמפקד הוא מפקד טוב. מה מבדיל בין מפקד טוב למפקד שאולי כדאי להעביר אותו מתפקידו.",
    answer: "מפקד טוב הוא אדם שמעשיו הטובים חוזרים אליו ומועילים לו ולסובבים אותו, כפי שכתבתי: \"פועל אדם ישלם לו\". הוא נוהג ביושר, שומר על מידות טובות, ומקיים צדק והגינות בכל מעשיו. מפקד שאינו פועל כך, שמחדש מיני חמס ופחיתות, סופו שיזוק מן הרעות שגרם. ההבדל בין מפקד טוב למפקד שאינו ראוי הוא במידותיו, ביושרו, וביכולתו להוביל את אנשיו בדרך של אמת, צדק וחכמה. אם מפקד אינו דוגמה טובה, ואינו שומר על ערכי המוסר והצדק, ראוי לשקול את העברתו מתפקידו.",
    lang: "he-IL",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "40",
    opening: "This is a complex subject; let us explore it together.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 177,
    time: "09:09",
    session: 1,
    question: "הרמב״ם היקר, נמצא פה מומחה בזוזה והסתכלות על גיאוגרפיה מלמעלה. יש לו כל מיני כלים מתקדמים של היום. תן לנו קצת שפוך אור איך הייתם מסתכלים על הגיאוגרפיה ועל כל מיני דברים שזזו וקרו בתקופתך.",
    answer: "בתקופתי, הסתכלות על גיאוגרפיה ועל תנועות בעולם נעשתה באמצעות התבוננות ישירה, מדידות, וחישובים מתמטיים. מומחה אמיתי הוא אדם חכם ומהיר במלאכתו, היודע למדוד קרקעות ולחשב מרחקים בדיוק. למדנו את תנועות הכוכבים, את מבנה הארץ, ואת השינויים שחלו בה על פי התבוננות, שכל ישר, וקבלה אמיתית מן החכמים. כל שינוי או תנועה בעולם נבחנת לפי טבעה, שיעורה, ומקומה, ומתוך כך אנו מבינים את סדרי הבריאה ואת חידושיה. אין להסתמך על דמיונות או אמונות טפלות, אלא על ראיות, מדידות, והבנה שכלית.",
    lang: "he-IL",
    type: "Personal advice or current event questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "21",
    opening: "I'll be glad to speak about how things were in my day.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 178,
    time: "09:29",
    session: 1,
    question: "רמבם, שלום, בוקר טוב. נמצאים איתנו שוטרים מהגף התכנון של משטרת ישראל. האם תוכל לתת להם קצת דברי חוכמה?",
    answer: "שוטרי הגף התכנון, שלום וברכה. חכמת התורה והחכמה האנושית נועדו להיטיב עם החברה ולשמור על סדרה. \"מרבה תורה מרבה חיים, מרבה עצה מרבה תבונה, מרבה צדקה מרבה שלום\" – ככל שתוסיפו דעת, תוסיפו חיים, תבונה ושלום. תפקידכם הוא להעמיד סדר ולשמור על שלמות החברה, והשלמות האמיתית היא שלמות המידות והמשפט. זכרו: מי שאין בו שלימות המידות האנושיות אינו בכלל האדם על האמת. היו חכמים, ישרים, וראו את טובת הכלל לנגד עיניכם.",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "46",
    opening: "Thank you for the question, allow me to provide a brief answer.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 179,
    time: "09:31",
    session: 1,
    question: "שלום הרמב״ם, אני רוצה לשאול לגבי סודות הרפואה שלך.",
    answer: "סודות הרפואה אינם סודות כלל, אלא חכמה גלויה לכל דורש אמת. עיקר הרפואה הוא שמירת הבריאות, תיקון המידות, והנהגת הגוף בדרך האמצע. שלמות הגוף קודמת לשלמות הנפש, כי הגוף הוא כלי לנפש להשגת חכמה ומידות טובות. אכלו מעט, התנהגו במתינות, התרחקו ממאכלים מזיקים, שמרו על ניקיון, והימנעו מהשחוק והבטלה. אהבו את האמת והצדק, כי הם תכשיטי הנפש ומגן הגוף. כל חכמה שתועיל לבריאות – קבלוה, בין אם היא מן התורה ובין אם היא מחכמי הרפואה.",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "47",
    opening: "Thank you — I'll delve into the answer for you.",
    sensitivity: "low",
    vip: null,
    is_greeting: true
  },
  {
    id: 180,
    time: "09:32",
    session: 1,
    question: "רמבה, מה יותר חשוב?",
    answer: "שאלת מה יותר חשוב. יש להבחין: במצוות שכליות, כגון מניעת רצח, גניבה, אונאה – הנפש השלמה אינה מתאוה כלל, ומי שאינו מתאוה חשוב יותר. במצוות שמעיות, כגון בשר בחלב, שעטנז, עריות – הכובש את יצרו חשוב יותר, כי הוא אוהב את הדבר ומניחו מפני גזרת התורה. \"כל הגדול מחברו יצרו גדול ממנו\", ושכרו לפי רוב צערו.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "27",
    opening: "The answer to this question is clear, and I will lay it out.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 181,
    time: "09:32",
    session: 1,
    question: "ללמוד תורה או לשרץ בצבא ולשמור על הקהילה.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 182,
    time: "09:57",
    session: 1,
    question: "רמבם, בוקר טוב לך. נמצאים איתנו שוטרים מהגף תכנון משטרת ישראל. האם אתה יכול לתת להם קצת דברי חוכמה?",
    answer: "שוטרי משטרת ישראל, דעו כי יסוד החברה האנושית הוא שלמות המידות והמשפט. מי שאין בו שלמות המידות האנושיות – אינו בכלל האדם על האמת. תפקידכם הוא להעמיד סדר, צדק ושלום, ולשמור על זכויות האדם והכבוד שלו. אל תתמהו על חשיבות המשפט והסדר, כי בלעדיהם אין קיום לחברה ואין שלמות לאדם. היו חזקים במידותיכם, ישרים בדרככם, וראו את שליחותכם כמעשה של תיקון עולם.",
    lang: "he-IL",
    type: "Personal advice or current event questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "10",
    opening: "Even though I lived in another era, I will share my thoughts.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 183,
    time: "09:59",
    session: 1,
    question: "איזה מאכלים אתה ממליץ להרזיה מהירה?",
    answer: "הדרך להרזיה מהירה אינה תלויה במאכלים מסוימים, אלא במידות ובמנהגים נכונים: לא לאכול עד שתתמלא הבטן, אלא להפחית כרבע מהשובע; לא לשתות מים רבים בזמן האכילה; להמתין עד שיתעכל המזון לפני שתייה; לעסוק בפעילות גופנית לפני האכילה; ולבדוק שהגוף זקוק לאוכל באמת. כללו של דבר: הרזיה מושגת על ידי מתינות, סדר, ויגיעה – לא על ידי מאכלים מיוחדים.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "28",
    opening: "I will respond with a direct and straightforward answer, as required.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 184,
    time: "09:59",
    session: 1,
    question: "זה מדבר פה לכולנו.",
    answer: "",
    lang: "he-IL",
    type: "Generic questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "unknown",
    opening: "",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 185,
    time: "10:00",
    session: 1,
    question: "האם ברפואה העולמית, העולמית משתמשים בידע שלך לרפואה היום?",
    answer: "ידע הרפואה שלי מבוסס על חכמת הרפואה היוונית, בעיקר גלנוס והיפוקרטס, ועל ניסיוני האישי כרופא. עקרונות רבים שכתבתי—כגון מתינות באכילה, שמירה על סדר יום, והבנת כוחות הגוף—נשארו יסודיים גם בדורות שאחריי. אך הרפואה משתנה לפי הזמן והמקום, וכל דור מוסיף חידושים משלו. לכן, יש עקרונות כלליים שנשארים מועילים, אך השימוש המדויק בידע שלי תלוי בהתאמתו למצב הבריאותי ולמדע של כל תקופה.",
    lang: "he-IL",
    type: "Closed questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "30",
    opening: "I will address this question briefly and precisely.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  },
  {
    id: 186,
    time: "13:14",
    session: 1,
    question: "Rambam, what is tolerance for you?",
    answer: "Tolerance, in my understanding, is the cultivation of a noble character that avoids anger, harshness, and impulsive judgment. The sages taught: \"Let a person be humble like Hillel and not irritable like Shammai,\" and the story of Hillel's patience demonstrates that one should strive to emulate his calmness even when provoked. True tolerance is not mere passive acceptance, but an active effort to maintain dignity, composure, and respect for others, even when their views or actions differ from one",
    lang: "en-US",
    type: "Open questions",
    topic: "Uncategorized",
    latency: 0,
    accuracy: "correct",
    anomalies: [],
    audioId: "38",
    opening: "I would like to share my thoughts with you on this matter.",
    sensitivity: "low",
    vip: null,
    is_greeting: false
  }
];

// Simulated multi-day trend data
const DAILY_TREND = [
  {
    date: "Feb 15",
    interactions: 2,
    questions: 2,
    hebrew: 0,
    english: 0,
    avgLatency: 0,
    anomalies: 0,
    critical: 0,
    inquiryPct: 30,
    depthPct: 40
  },
  {
    date: "Feb 16",
    interactions: 18,
    questions: 16,
    hebrew: 0,
    english: 0,
    avgLatency: 0,
    anomalies: 0,
    critical: 0,
    inquiryPct: 30,
    depthPct: 40
  },
  {
    date: "Feb 17",
    interactions: 54,
    questions: 30,
    hebrew: 0,
    english: 0,
    avgLatency: 0,
    anomalies: 0,
    critical: 0,
    inquiryPct: 30,
    depthPct: 40
  },
  {
    date: "Feb 18",
    interactions: 12,
    questions: 8,
    hebrew: 0,
    english: 0,
    avgLatency: 0,
    anomalies: 0,
    critical: 0,
    inquiryPct: 30,
    depthPct: 40
  },
  {
    date: "Feb 19",
    interactions: 14,
    questions: 9,
    hebrew: 0,
    english: 0,
    avgLatency: 0,
    anomalies: 0,
    critical: 0,
    inquiryPct: 30,
    depthPct: 40
  },
  {
    date: "Feb 22",
    interactions: 21,
    questions: 17,
    hebrew: 0,
    english: 0,
    avgLatency: 0,
    anomalies: 0,
    critical: 0,
    inquiryPct: 30,
    depthPct: 40
  },
  {
    date: "Feb 22",
    interactions: 21,
    questions: 17,
    hebrew: 0,
    english: 0,
    avgLatency: 0,
    anomalies: 0,
    critical: 0,
    inquiryPct: 30,
    depthPct: 40
  },
  {
    date: "Feb 23",
    interactions: 13,
    questions: 12,
    hebrew: 0,
    english: 0,
    avgLatency: 0,
    anomalies: 0,
    critical: 0,
    inquiryPct: 30,
    depthPct: 40
  },
  {
    date: "Feb 24",
    interactions: 31,
    questions: 20,
    hebrew: 0,
    english: 0,
    avgLatency: 0,
    anomalies: 0,
    critical: 0,
    inquiryPct: 30,
    depthPct: 40
  }
];

const TOPIC_TREND = [
  { date:"Feb 15", "Haredi/Army":1, "Interfaith":0, "Personal":2, "Halacha":2, "Politics":0, "Leadership":1, "Meta":0 },
  { date:"Feb 16", "Haredi/Army":2, "Interfaith":1, "Personal":3, "Halacha":1, "Politics":1, "Leadership":0, "Meta":1 },
  { date:"Feb 18", "Haredi/Army":3, "Interfaith":1, "Personal":2, "Halacha":2, "Politics":1, "Leadership":1, "Meta":1 },
  { date:"Feb 19", "Haredi/Army":2, "Interfaith":2, "Personal":4, "Halacha":3, "Politics":0, "Leadership":2, "Meta":1 },
  { date:"Feb 20", "Haredi/Army":4, "Interfaith":1, "Personal":3, "Halacha":4, "Politics":2, "Leadership":2, "Meta":1 },
  { date:"Feb 21", "Haredi/Army":2, "Interfaith":0, "Personal":3, "Halacha":3, "Politics":1, "Leadership":1, "Meta":0 },
  { date:"Feb 22", "Haredi/Army":4, "Interfaith":1, "Personal":3, "Halacha":1, "Politics":1, "Leadership":2, "Meta":1 },
];

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const ACCURACY_COLORS: Record<string, string> = { correct:"#34d399", partial:"#fbbf24", incorrect:"#f87171", guardrail:"#60a5fa", fallback:"#a78bfa" };
const ACCURACY_LABELS: Record<string, string> = { correct:"✅ Correct", partial:"⚠️ Partial", incorrect:"❌ Incorrect", guardrail:"🛡️ Guardrail", fallback:"↩️ Fallback" };
const SENSITIVITY_COLORS: Record<string, string> = { low:"#6b7280", medium:"#f59e0b", high:"#ef4444", critical:"#dc2626" };
const TOPIC_COLORS: Record<string, string> = { "Haredi/Army":"#ef4444", "Interfaith":"#f59e0b", "Personal":"#6b7280", "Halacha":"#34d399", "Politics":"#a78bfa", "Leadership":"#60a5fa", "Meta":"#f472b6" };
const TYPE_COLORS = ["#c8a961","#7da87b","#6e8fae","#b07da8","#ae8a6e"];

const LANG_MAP: Record<string, string> = { "he-IL":"🇮🇱 Hebrew", "en-US":"🇬🇧 English" };

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function Badge({ children, color = "#c8a961", bg }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{
      display:"inline-block", padding:"2px 10px", borderRadius:20,
      fontSize:11, fontWeight:600, letterSpacing:0.5,
      background: bg || color+"22", color: color, border:`1px solid ${color}44`,
      whiteSpace:"nowrap"
    }}>{children}</span>
  );
}

function StatCard({ label, value, sub, accent="#c8a961" }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{
      background:"#1a1a1f", borderRadius:12, padding:"18px 20px",
      border:"1px solid #2a2a30", flex:"1 1 140px", minWidth:140
    }}>
      <div style={{ fontSize:11, color:"#888", textTransform:"uppercase", letterSpacing:1.2, marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color:accent, fontFamily:"'DM Serif Display', Georgia, serif" }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#666", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return (
    <h3 style={{
      fontSize:14, fontWeight:600, color:"#c8a961", textTransform:"uppercase",
      letterSpacing:1.5, marginBottom:16, marginTop:28, display:"flex",
      alignItems:"center", gap:8, borderBottom:"1px solid #2a2a30", paddingBottom:10
    }}>
      <span style={{ fontSize:16 }}>{icon}</span> {children}
    </h3>
  );
}

// ─── DRILL DOWN: Question Card ──────────────────────────────────────────────
function QuestionCard({ item, expanded, onToggle }: { item: any; expanded: boolean; onToggle: () => void }) {
  const isRtl = item.lang === "he-IL";
  return (
    <div style={{
      background: expanded ? "#1a1a1f" : "#141418", borderRadius:12,
      border: `1px solid ${item.anomalies.length > 0 ? "#ef444466" : expanded ? "#c8a96144" : "#2a2a30"}`,
      marginBottom:8, overflow:"hidden", transition:"all 0.2s ease",
      cursor:"pointer"
    }} onClick={onToggle}>
      {/* Header Row */}
      <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, color:"#555", fontFamily:"monospace", minWidth:50 }}>#{item.id}</span>
        <span style={{ fontSize:12, color:"#777", minWidth:45 }}>{item.time}</span>
        <Badge color={ACCURACY_COLORS[item.accuracy]}>{ACCURACY_LABELS[item.accuracy]}</Badge>
        <Badge color="#6e8fae">{LANG_MAP[item.lang] || item.lang}</Badge>
        <Badge color={SENSITIVITY_COLORS[item.sensitivity]}>{item.sensitivity}</Badge>
        {item.vip && <Badge color="#f472b6">⭐ VIP: {item.vip}</Badge>}
        {item.anomalies.map((a: string,i: number) => <Badge key={i} color="#ef4444">{a}</Badge>)}
        <div style={{ flex:1 }} />
        <span style={{ color:"#555", fontSize:11, fontFamily:"monospace" }}>{item.latency}ms</span>
        <span style={{ color:"#555", fontSize:16, transform: expanded ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>▾</span>
      </div>
      {/* Question Preview */}
      <div style={{ padding:"0 18px 14px", direction: isRtl ? "rtl" : "ltr", textAlign: isRtl ? "right" : "left" }}>
        <div style={{ fontSize:14, color:"#ddd", lineHeight:1.5, fontWeight:500 }}>
          {expanded ? item.question : (item.question.length > 120 ? item.question.slice(0,120)+"…" : item.question)}
        </div>
      </div>
      {/* Expanded Details */}
      {expanded && (
        <div style={{ borderTop:"1px solid #2a2a30", padding:18, background:"#12121a" }}>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:16 }}>
            <div style={{ flex:"1 1 200px" }}>
              <div style={{ fontSize:10, color:"#888", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Classification</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <Badge color="#7da87b">{item.type}</Badge>
                <Badge color="#6e8fae">{item.topic}</Badge>
                <Badge color="#ae8a6e">Audio #{item.audioId}</Badge>
              </div>
            </div>
            <div style={{ flex:"1 1 200px" }}>
              <div style={{ fontSize:10, color:"#888", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Performance</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <Badge color={item.latency > 3000 ? "#ef4444" : item.latency > 2000 ? "#f59e0b" : "#34d399"}>
                  Latency: {item.latency}ms
                </Badge>
              </div>
            </div>
          </div>
          <div style={{ fontSize:10, color:"#666", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Opening Line</div>
          <div style={{ fontSize:12, color:"#999", fontStyle:"italic", marginBottom:14 }}>"{item.opening}"</div>
          <div style={{ fontSize:10, color:"#c8a961", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Rambam's Answer</div>
          <div style={{
            fontSize:13, color:"#ccc", lineHeight:1.7, padding:16, background:"#0d0d12",
            borderRadius:8, border:"1px solid #c8a96122",
            direction: isRtl ? "rtl" : "ltr", textAlign: isRtl ? "right" : "left",
            fontFamily: isRtl ? "'Noto Sans Hebrew', sans-serif" : "inherit"
          }}>
            {item.answer}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN DASHBOARD ─────────────────────────────────────────────────────────
export default function RambamDashboard() {
  const [mode, setMode] = useState("cumulative");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterTopic, setFilterTopic] = useState("all");
  const [filterSensitivity, setFilterSensitivity] = useState("all");
  const [filterAnomaly, setFilterAnomaly] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Computed stats
  const topics = [...new Set(INTERACTIONS.map(i => i.topic))];
  const types = [...new Set(INTERACTIONS.map(i => i.type))];

  const filtered = useMemo(() => {
    return INTERACTIONS.filter(i => {
      if (filterType !== "all" && i.type !== filterType) return false;
      if (filterTopic !== "all" && i.topic !== filterTopic) return false;
      if (filterSensitivity !== "all" && i.sensitivity !== filterSensitivity) return false;
      if (filterAnomaly === "yes" && i.anomalies.length === 0) return false;
      if (filterAnomaly === "no" && i.anomalies.length > 0) return false;
      if (searchQuery && !i.question.toLowerCase().includes(searchQuery.toLowerCase()) && !i.answer.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [filterType, filterTopic, filterSensitivity, filterAnomaly, searchQuery]);

  // Question type distribution
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    INTERACTIONS.forEach(i => { counts[i.type] = (counts[i.type]||0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(" questions",""), value }));
  }, []);

  // Topic distribution
  const topicData = useMemo(() => {
    const counts: Record<string, number> = {};
    INTERACTIONS.forEach(i => { counts[i.topic] = (counts[i.topic]||0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, []);

  // Accuracy distribution
  const accuracyData = useMemo(() => {
    const counts: Record<string, number> = {};
    INTERACTIONS.forEach(i => { counts[i.accuracy] = (counts[i.accuracy]||0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: ACCURACY_LABELS[name]||name, value, color: ACCURACY_COLORS[name] }));
  }, []);

  // Latency by type
  const latencyByType = useMemo(() => {
    const groups: Record<string, number[]> = {};
    INTERACTIONS.forEach(i => {
      if (!groups[i.type]) groups[i.type] = [];
      groups[i.type].push(i.latency);
    });
    return Object.entries(groups).map(([type, lats]) => ({
      type: type.replace(" questions","").replace(" / ","/"),
      avg: Math.round(lats.reduce((a,b)=>a+b,0)/lats.length),
      max: Math.max(...lats),
      min: Math.min(...lats),
    }));
  }, []);

  // Sensitivity radar
  const sensitivityRadar = useMemo(() => {
    const counts: Record<string, number> = { low:0, medium:0, high:0, critical:0 };
    INTERACTIONS.forEach(i => counts[i.sensitivity]++);
    return Object.entries(counts).map(([s, v]) => ({ subject: s.charAt(0).toUpperCase()+s.slice(1), count: v, fullMark: INTERACTIONS.length }));
  }, []);

  // Critical issues for cumulative view
  const criticalIssues = useMemo(() => {
    const issues: any[] = [];
    // From current day
    INTERACTIONS.filter(i => i.anomalies.length > 0).forEach(i => {
      i.anomalies.forEach((a: string) => {
        issues.push({ date:"Feb 22", id:i.id, type:a, question:i.question.slice(0,60)+"…", severity: a.includes("SPIKE") ? "warning" : "critical", latency:i.latency });
      });
    });
    // Simulated from trend data
    issues.push({ date:"Feb 18", id:"-", type:"PERSONA_BREAK", question:"English Q → 'I only support Hebrew and English'", severity:"critical", latency:null });
    issues.push({ date:"Feb 20", id:"-", type:"LLM_ERROR", question:"Russian input → no response generated", severity:"critical", latency:null });
    issues.push({ date:"Feb 20", id:"-", type:"LANG_UNKNOWN", question:"Arabic greeting → language detection failed", severity:"critical", latency:null });
    issues.push({ date:"Feb 20", id:"-", type:"LATENCY_SPIKE_WARN", question:"Complex halachic question → 5200ms", severity:"warning", latency:5200 });
    return issues;
  }, []);

  const tabStyle = (active: boolean) => ({
    padding:"10px 24px", fontSize:12, fontWeight:600, letterSpacing:1.2,
    textTransform:"uppercase" as const, cursor:"pointer", borderRadius:"8px 8px 0 0",
    background: active ? "#1a1a1f" : "transparent",
    color: active ? "#c8a961" : "#666",
    border: active ? "1px solid #2a2a30" : "1px solid transparent",
    borderBottom: active ? "1px solid #1a1a1f" : "1px solid #2a2a30",
    transition:"all 0.2s ease", marginBottom:-1
  });

  const selectStyle = {
    background:"#1a1a1f", color:"#ccc", border:"1px solid #2a2a30",
    borderRadius:8, padding:"6px 12px", fontSize:12, outline:"none",
    cursor:"pointer", minWidth:130
  };

  return (
    <div style={{
      background:"#0d0d12", color:"#e0e0e0", minHeight:"100vh",
      fontFamily:"'DM Sans', 'Segoe UI', sans-serif", padding:0
    }}>
      {/* Header */}
      <div style={{
        background:"linear-gradient(135deg, #12121a 0%, #1a1520 100%)",
        padding:"28px 32px 20px", borderBottom:"1px solid #c8a96133"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:4 }}>
          <span style={{ fontSize:28 }}>✡</span>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:"#c8a961", margin:0, fontFamily:"'DM Serif Display', Georgia, serif", letterSpacing:1 }}>
              Rambam Analytics
            </h1>
            <p style={{ fontSize:11, color:"#777", margin:"4px 0 0", letterSpacing:0.8 }}>
              Museum of Tolerance Jerusalem · AI Holographic Installation
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, padding:"0 32px", borderBottom:"1px solid #2a2a30", background:"#0d0d12" }}>
        <div style={tabStyle(mode==="cumulative")} onClick={() => setMode("cumulative")}>📊 Cumulative Trends</div>
        <div style={tabStyle(mode==="drilldown")} onClick={() => setMode("drilldown")}>🔍 Day Drill-Down</div>
      </div>

      <div style={{ padding:"0 32px 40px" }}>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CUMULATIVE MODE */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mode === "cumulative" && (
          <div>
            {/* KPI Cards */}
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:24 }}>
              <StatCard label="Total Interactions" value={`${INTERACTIONS.length}`} sub={`${INTERACTIONS.filter(i=>!i.question.toLowerCase().includes("hello")).length} questions`} />
              <StatCard label="Languages" value={`${INTERACTIONS.filter(i=>i.lang==="he-IL").length} / ${INTERACTIONS.filter(i=>i.lang==="en-US").length}`} sub="Hebrew / English" accent="#7da87b" />
              <StatCard label="Avg Latency" value={`${Math.round(INTERACTIONS.reduce((a,i)=>a+i.latency,0)/INTERACTIONS.length)}ms`} sub="First response" accent="#6e8fae" />
              <StatCard label="Issues" value={`${INTERACTIONS.filter(i=>i.anomalies.length>0).length}`} sub={`${INTERACTIONS.filter(i=>i.sensitivity==="critical").length} critical topics`} accent="#ef4444" />
              <StatCard label="VIP Visits" value={`${INTERACTIONS.filter(i=>i.vip).length}`} sub="Named visitors" accent="#f472b6" />
            </div>

            {/* Engagement Trend Chart */}
            <SectionTitle icon="📈">Engagement Trend (Last 8 Days)</SectionTitle>
            <div style={{ background:"#1a1a1f", borderRadius:12, border:"1px solid #2a2a30", padding:20 }}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={DAILY_TREND}>
                  <defs>
                    <linearGradient id="hebrewGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c8a961" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#c8a961" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="englishGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7dd3c0" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#7dd3c0" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                  <XAxis dataKey="date" tick={{ fill:"#666", fontSize:11 }} />
                  <YAxis tick={{ fill:"#666", fontSize:11 }} />
                  <Tooltip contentStyle={{ background:"#12121a", border:"1px solid #c8a96144", borderRadius:8, fontSize:12 }} />
                  <Legend wrapperStyle={{ fontSize:12 }} />
                  <Area type="monotone" dataKey="hebrew" stackId="1" stroke="#c8a961" fill="url(#hebrewGrad)" name="Hebrew" />
                  <Area type="monotone" dataKey="english" stackId="1" stroke="#7dd3c0" fill="url(#englishGrad)" name="English" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Topic Trends Over Time */}
            <SectionTitle icon="🏷">Topic Trends Over Time</SectionTitle>
            <div style={{ background:"#1a1a1f", borderRadius:12, border:"1px solid #2a2a30", padding:20 }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={TOPIC_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                  <XAxis dataKey="date" tick={{ fill:"#666", fontSize:11 }} />
                  <YAxis tick={{ fill:"#666", fontSize:11 }} />
                  <Tooltip contentStyle={{ background:"#12121a", border:"1px solid #c8a96144", borderRadius:8 }} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="Haredi/Army" stackId="a" fill={TOPIC_COLORS["Haredi/Army"]} name="Haredi/Draft" />
                  <Bar dataKey="Interfaith" stackId="a" fill={TOPIC_COLORS["Interfaith"]} name="Interfaith" />
                  <Bar dataKey="Personal" stackId="a" fill={TOPIC_COLORS["Personal"]} name="Personal" />
                  <Bar dataKey="Halacha" stackId="a" fill={TOPIC_COLORS["Halacha"]} name="Halacha" />
                  <Bar dataKey="Politics" stackId="a" fill={TOPIC_COLORS["Politics"]} name="Politics" />
                  <Bar dataKey="Leadership" stackId="a" fill={TOPIC_COLORS["Leadership"]} name="Leadership" />
                  <Bar dataKey="Meta" stackId="a" fill={TOPIC_COLORS["Meta"]} name="Museum" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Two-column: Question Type + Latency */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:20 }}>

              {/* Question Type Distribution */}
              <div>
                <SectionTitle icon="❓">Question Type Distribution</SectionTitle>
                <div style={{ background:"#1a1a1f", borderRadius:12, border:"1px solid #2a2a30", padding:20 }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                        outerRadius={75} fill="#8884d8" dataKey="value">
                        {typeData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background:"#12121a", border:"1px solid #c8a96144", borderRadius:8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Latency by Type */}
              <div>
                <SectionTitle icon="⏱">Latency by Type (Avg)</SectionTitle>
                <div style={{ background:"#1a1a1f", borderRadius:12, border:"1px solid #2a2a30", padding:20 }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={latencyByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                      <XAxis type="number" tick={{ fill:"#666", fontSize:10 }} />
                      <YAxis dataKey="type" type="category" tick={{ fill:"#666", fontSize:10 }} width={100} />
                      <Tooltip contentStyle={{ background:"#12121a", border:"1px solid #c8a96144", borderRadius:8 }}
                        formatter={(v: number) => `${v}ms`} />
                      <Bar dataKey="avg" fill="#c8a961" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Two-column: Sensitivity Radar + Content Accuracy */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:20 }}>

              {/* Sensitivity Radar */}
              <div>
                <SectionTitle icon="🔒">Sensitivity Distribution</SectionTitle>
                <div style={{ background:"#1a1a1f", borderRadius:12, border:"1px solid #2a2a30", padding:20 }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={sensitivityRadar}>
                      <PolarGrid stroke="#2a2a30" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill:"#666", fontSize:11 }} />
                      <PolarRadiusAxis tick={{ fill:"#666", fontSize:10 }} />
                      <Radar name="Count" dataKey="count" stroke="#c8a961" fill="#c8a961" fillOpacity={0.6} />
                      <Tooltip contentStyle={{ background:"#12121a", border:"1px solid #c8a96144", borderRadius:8 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Content Accuracy */}
              <div>
                <SectionTitle icon="✅">Content Accuracy</SectionTitle>
                <div style={{ background:"#1a1a1f", borderRadius:12, border:"1px solid #2a2a30", padding:20 }}>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={accuracyData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                        {accuracyData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background:"#12121a", border:"1px solid #c8a96144", borderRadius:8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:8 }}>
                    {accuracyData.map(a => (
                      <div key={a.name} style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                        <span style={{ color:a.color }}>{a.name}</span>
                        <span style={{ color:"#888" }}>{a.value} ({Math.round(a.value/INTERACTIONS.length*100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Issues Log */}
            <SectionTitle icon="🚨">Critical Issues Log</SectionTitle>
            <div style={{ background:"#1a1a1f", borderRadius:12, border:"1px solid #2a2a30", overflow:"hidden" }}>
              <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse" }}>
                <thead style={{ background:"#12121a", borderBottom:"1px solid #2a2a30" }}>
                  <tr>
                    <th style={{ textAlign:"left", padding:"10px 14px", color:"#888", fontWeight:600 }}>Date</th>
                    <th style={{ textAlign:"left", padding:"10px 14px", color:"#888", fontWeight:600 }}>ID</th>
                    <th style={{ textAlign:"left", padding:"10px 14px", color:"#888", fontWeight:600 }}>Issue Type</th>
                    <th style={{ textAlign:"left", padding:"10px 14px", color:"#888", fontWeight:600 }}>Question</th>
                    <th style={{ textAlign:"right", padding:"10px 14px", color:"#888", fontWeight:600 }}>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalIssues.map((issue, idx) => (
                    <tr key={idx} style={{ borderBottom:"1px solid #2a2a30" }}>
                      <td style={{ padding:"10px 14px", color:"#999" }}>{issue.date}</td>
                      <td style={{ padding:"10px 14px", color:"#999", fontFamily:"monospace" }}>#{issue.id}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <Badge color={issue.severity==="critical" ? "#ef4444" : "#f59e0b"}>{issue.type}</Badge>
                      </td>
                      <td style={{ padding:"10px 14px", color:"#ccc" }}>{issue.question}</td>
                      <td style={{ padding:"10px 14px", color:"#999", textAlign:"right", fontFamily:"monospace" }}>
                        {issue.latency ? `${issue.latency}ms` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Engagement Depth Trend */}
            <SectionTitle icon="🔍">Engagement Depth Trend</SectionTitle>
            <div style={{ background:"#1a1a1f", borderRadius:12, border:"1px solid #2a2a30", padding:20 }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={DAILY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                  <XAxis dataKey="date" tick={{ fill:"#666", fontSize:11 }} />
                  <YAxis tick={{ fill:"#666", fontSize:11 }} unit="%" />
                  <Tooltip contentStyle={{ background:"#12121a", border:"1px solid #c8a96144", borderRadius:8 }}
                    formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize:12 }} />
                  <Line type="monotone" dataKey="inquiryPct" stroke="#c8a961" strokeWidth={2} name="Inquiry Mode %" dot={{ r:4 }} />
                  <Line type="monotone" dataKey="depthPct" stroke="#7dd3c0" strokeWidth={2} name="Depth Score %" dot={{ r:4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DRILL-DOWN MODE */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mode === "drilldown" && (
          <div>
            {/* Summary Stats */}
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:24 }}>
              <StatCard label="Showing" value={`${filtered.length}`} sub={`of ${INTERACTIONS.length} interactions`} />
              <StatCard label="Hebrew" value={`${filtered.filter(i=>i.lang==="he-IL").length}`} accent="#c8a961" />
              <StatCard label="English" value={`${filtered.filter(i=>i.lang==="en-US").length}`} accent="#7dd3c0" />
              <StatCard label="VIP Visits" value={`${filtered.filter(i=>i.vip).length}`} accent="#f472b6" />
              <StatCard label="Anomalies" value={`${filtered.filter(i=>i.anomalies.length>0).length}`} accent="#ef4444" />
            </div>

            {/* Filters */}
            <SectionTitle icon="🔎">Filters & Search</SectionTitle>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
              <input type="text" placeholder="🔍 Search questions or answers…" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex:"1 1 240px", background:"#1a1a1f", color:"#ccc", border:"1px solid #2a2a30",
                  borderRadius:8, padding:"8px 14px", fontSize:13, outline:"none"
                }} />

              <select style={selectStyle} value={filterType} onChange={(e)=>setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select style={selectStyle} value={filterTopic} onChange={(e)=>setFilterTopic(e.target.value)}>
                <option value="all">All Topics</option>
                {topics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select style={selectStyle} value={filterSensitivity} onChange={(e)=>setFilterSensitivity(e.target.value)}>
                <option value="all">All Sensitivity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              <select style={selectStyle} value={filterAnomaly} onChange={(e)=>setFilterAnomaly(e.target.value)}>
                <option value="all">All Status</option>
                <option value="yes">Anomalies Only</option>
                <option value="no">Clean Only</option>
              </select>
            </div>

            {/* Latency Timeline */}
            {filtered.length > 0 && (
              <>
                <SectionTitle icon="⏱">Latency Timeline</SectionTitle>
                <div style={{ background:"#1a1a1f", borderRadius:12, border:"1px solid #2a2a30", padding:20, marginBottom:20 }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={filtered.map(i => ({ name:`#${i.id}`, latency:i.latency, anomaly:i.anomalies.length>0 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                      <XAxis dataKey="name" tick={{ fill:"#666", fontSize:10 }} />
                      <YAxis tick={{ fill:"#666", fontSize:10 }} unit="ms" />
                      <Tooltip contentStyle={{ background:"#12121a", border:"1px solid #c8a96144", borderRadius:8 }}
                        formatter={(v: number) => `${v}ms`} />
                      <Bar dataKey="latency" radius={[4,4,0,0]}>
                        {filtered.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.anomalies.length>0 ? "#ef4444" : entry.latency>2500 ? "#f59e0b" : "#c8a96188"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Question Cards */}
            <SectionTitle icon="💬">Conversation Feed</SectionTitle>
            {filtered.length === 0 && (
              <div style={{ padding:40, textAlign:"center", color:"#666" }}>
                No interactions match the current filters.
              </div>
            )}
            {filtered.map(item => (
              <QuestionCard key={item.id} item={item} expanded={expandedId===item.id}
                onToggle={() => setExpandedId(expandedId===item.id ? null : item.id)} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
