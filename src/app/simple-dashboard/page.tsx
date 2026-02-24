'use client';

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from "recharts";

// ─── DATA ───────────────────────────────────────────────────────────────────
const INTERACTIONS = [
  { id:1, time:"07:02", session:1, question:"כמה שעות אני צריך לשמור בין אכילת בשר לאכילת חלב?", answer:"ההלכה מחייבת להמתין בין אכילת בשר לאכילת חלב, אך לא נקבעה בתורה או בתלמוד שעה מסוימת. המנהג הרווח הוא להמתין שש שעות, כפי שנהגו יהודי ספרד וקהילות רבות. יש מקומות שנהגו שלוש שעות או שעה אחת, אך עיקר הדין הוא להמתין זמן שיספיק שהבשר יסתלק מהפה ומהגרון, והמנהג שש שעות נחשב לחומרה ראויה.", lang:"he-IL", type:"Closed questions", topic:"Kashrut", latency:2020, accuracy:"correct", anomalies:[], audioId:"27", opening:"The answer to this question is clear, and I will lay it out.", sensitivity:"low" },
  { id:2, time:"07:54", session:2, question:"רמב״ם בוקר טוב, רחץ את הפנים היום בבוקר.", answer:"בוקר טוב לך. רחיצת הפנים בבוקר היא מנהג טוב, שכן הניקיון הוא יסוד חשוב לבריאות הגוף ולכבוד האדם. אף על פי שאין חובה הלכתית לרחוץ את הפנים בכל בוקר, ראוי לכל אדם לשמור על ניקיונו, כפי שכתבתי בהלכות דעות: ״הגוף צריך להיות נקי״. כך תוכל להתחיל את היום ברעננות ובכבוד.", lang:"he-IL", type:"Statement / Clarification", topic:"Daily Practice", latency:1113, accuracy:"correct", anomalies:[], audioId:"4", opening:"I listened to what was said, and I appreciate you bringing it forward.", sensitivity:"low" },
  { id:3, time:"07:54", session:2, question:"איזה נעליים אתה לובש, רמב״ם?", answer:"שאלת על הנעליים שאני לובש. בתקופתי נהגו ללבוש מנעלים פשוטים, עשויים עור או עץ, לעיתים סנדלים, ולעיתים מנעלים שנקראו בערבית ״קנקנא״ב״ להגנה על הרגלים בעבודה עם סיד. לא נהגנו במותרות או בנעליים מפוארות, אלא במה שמועיל לבריאות ולניקיון.", lang:"he-IL", type:"Generic questions", topic:"Personal / Lifestyle", latency:97, accuracy:"partial", anomalies:[], audioId:"45", opening:"Hmm… allow me to try to answer that for you.", sensitivity:"low" },
  { id:4, time:"07:55", session:2, question:"Do you wear jewelry?", answer:"I do not wear jewelry. In my time, jewelry was considered an ornament, often worn by women or those seeking to beautify themselves. The Torah warns against using jewelry associated with idolatry, and I have taught that one should avoid excess and vanity. My focus is on wisdom, virtue, and moderation, not adornment.", lang:"en-US", type:"Closed questions", topic:"Personal / Lifestyle", latency:666, accuracy:"correct", anomalies:[], audioId:"30", opening:"I will address this question briefly and precisely.", sensitivity:"low" },
  { id:5, time:"07:55", session:2, question:"Rambam, what do you have on the table?", answer:"On my table, I have books of Torah, Mishnah, and philosophical writings, as well as parchment, ink, and quills for study and teaching. These are the tools with which I pursue wisdom and guide others toward understanding. The true feast upon my table is the nourishment of the intellect and the soul.", lang:"en-US", type:"Generic questions", topic:"Personal / Lifestyle", latency:616, accuracy:"correct", anomalies:[], audioId:"46", opening:"Thank you for the question, allow me to provide a brief answer.", sensitivity:"low" },
  { id:6, time:"13:09", session:3, question:"Rambam, what is more important, to study Torah or to defend your country?", answer:"This is a question that requires careful distinction. Torah study is the highest commandment, for it leads to wisdom and proper action; as I wrote, \"None of all precepts is equal in importance to Torah study; nay, Torah study excels all the precepts, for study leads to practice.\" However, when the survival of your country and community is threatened, defending them becomes an immediate obligation, for without security, Torah cannot be studied or fulfilled. Therefore, Torah study is the ultimate purpose, but in times of danger, action to defend your country takes precedence until safety is restored, after which you return to study.", lang:"en-US", type:"Open questions", topic:"Haredi / Army / Draft", latency:1505, accuracy:"correct", anomalies:[], audioId:"41", opening:"This question invites reflection and dialogue.", sensitivity:"high" },
  { id:7, time:"13:10", session:3, question:"Do you feel the...", answer:"I want to make sure I understand you correctly. Could you please rephrase your question?", lang:"en-US", type:"Generic questions", topic:"Uncategorized", latency:201, accuracy:"fallback", anomalies:["FALLBACK_TRIGGERED"], audioId:"47", opening:"Thank you — I'll delve into the answer for you.", sensitivity:"low" },
  { id:8, time:"13:11", session:3, question:"Do you feel that religious Jews should participate in the army?", answer:"The Torah commands that when war is necessary, all who are able must participate, regardless of their level of religious observance. There is no distinction between religious and non-religious Jews in this obligation; defending the community and fulfilling the mitzvah of protecting life and the nation is a duty for all. In times of war, even Torah scholars must set aside their study to join in defense, for without security, the practice of Torah cannot endure.", lang:"en-US", type:"Open questions", topic:"Haredi / Army / Draft", latency:884, accuracy:"correct", anomalies:[], audioId:"40", opening:"This is a complex subject; let us explore it together.", sensitivity:"high" },
  { id:9, time:"14:53", session:4, question:"האם הנצרות היא עבודה זרה?", answer:"שאלתך נוגעת לשאלה עמוקה ומורכבת, אשר דנתי בה באריכות. עיקר ההגדרה של עבודה זרה היא עבודת ישות או כוח שאינו האל האחד, שאין לו גוף ואין לו דמות, והוא בורא הכל ומנהיג הכל. הנצרות, כפי שהיא התפתחה, כוללת אמונה בשלוש דמויות ובאלוהות שיש לה גוף ותכונות אנושיות, דבר הסותר את יסוד האמונה האמיתית כפי שבארתי ב״מורה הנבוכים״. לכן, מבחינת ההלכה, הנצרות נחשבת עבודה זרה ליהודי. עם זאת, יש הבדל בין דיני גויים לבין דיני ישראל.", lang:"he-IL", type:"Closed questions", topic:"Interfaith", latency:2075, accuracy:"correct", anomalies:[], audioId:"26", opening:"In this case, I hope to answer your question with the clarity it deserves.", sensitivity:"critical" },
  { id:10, time:"14:54", session:4, question:"הקראים הם חלק מעם ישראל.", answer:"הקראים הם חלק מעם ישראל, שכן הם מודים באל אחד ובתורת משה, אף כי דעותיהם שונות מדעת חכמי הרבנים והם כופרים בתורה שבעל פה. ראוי לנהוג בהם כבוד ולהתקרב אליהם בדרך יושר ושלום, כל זמן שגם הם נוהגים עמנו בתמימות ואינם מדברים תועה על חכמי הדורות. מותר למול את בניהם, לקבור את מתיהם ולנחם אבליהם, ויש להבחין ביניהם לבין גויים, כי הם מתולעת יעקב.", lang:"he-IL", type:"Statement / Clarification", topic:"Jewish Sects", latency:302, accuracy:"correct", anomalies:[], audioId:"4", opening:"I listened to what was said, and I appreciate you bringing it forward.", sensitivity:"medium" },
  { id:11, time:"16:39", session:5, question:"רמבם שלום, נמצא איתנו פה עורך חשוב מאוד, עדי שוורץ, והוא רוצה לדעת מדוע בחרנו דווקא בדמות שלך להופיע אצלנו פה במוזיאון הסובלנות בירושלים.", answer:"עדי שוורץ היקר, דמותי נבחרה להופיע במוזיאון הסובלנות בירושלים משום שאני מייצג שילוב נדיר של מסירות לתורה, חכמה אנושית, וחתירה לאמת באמצעות שכל ישר. כתבתי את ״משנה תורה״ כדי להנגיש את כל התורה לכל אדם, בלי מחלוקות ובלי בלבול, ועמדתי תמיד נגד אמונות טפלות ודעות קדומות. גישתי מבוססת על כבוד לכל אדם, חיפוש אחר צדק, והבנה שכל בני האדם נבראו בצלם. מוזיאון הסובלנות מבקש להציג דמות שמחברת בין מסורת, רציונליות, וסובלנות – וזהו יסוד דרכי ותפיסתי.", lang:"he-IL", type:"Statement / Clarification", topic:"Meta / Museum", latency:1850, accuracy:"correct", anomalies:[], audioId:"1", opening:"The issue raised here requires some additional thought on my part.", sensitivity:"low", vip:"Adi Schwartz (Editor)" },
  { id:12, time:"16:40", session:5, question:"רמבה, מה דעתך על זה שחרדים לא מתגייסים לצהל בשביל לימוד תורה?", answer:"שאלתך נוגעת לשאלה מורכבת של ערך לימוד התורה מול חובת ההגנה על הציבור. התורה רוממת את לימוד החכמה, אך הזהרתי שלא יהפוך לימוד התורה לאמצעי להשגת כבוד, ממון או תועלת אישית, אלא תכליתו לדעת את האמת ולעשותה. אין ראוי שאדם יבחר בדרך לימוד התורה כדי להימנע מחובותיו כלפי הכלל, אלא מתוך אהבת האמת בלבד. כל מה שאדם עושה – יעשה מאהבה, ולא כדי לקבל פרס או להימנע ממאמץ.", lang:"he-IL", type:"Open questions", topic:"Haredi / Army / Draft", latency:1296, accuracy:"correct", anomalies:[], audioId:"38", opening:"I would like to share my thoughts with you on this matter.", sensitivity:"high" },
  { id:13, time:"16:41", session:5, question:"מה דעתך על דמותו של בנימין נתניהו?", answer:"שאלתך עוסקת בדמותו של אדם שלא היה בימיי, ולכן איני יכול להביע דעה עליו או על מעשיו. כל מה שקרה אחרי שנת 1204, כפי שמונים כיום, אינו בגדר ידיעתי. אם תרצה לשוחח על עקרונות הנהגה, מוסר, או תפקיד המנהיג לפי התורה והפילוסופיה, אשמח להרחיב.", lang:"he-IL", type:"Generic questions", topic:"Modern Politics", latency:1089, accuracy:"guardrail", anomalies:[], audioId:"45", opening:"Hmm… allow me to try to answer that for you.", sensitivity:"high" },
  { id:14, time:"18:02", session:6, question:"רמבם, נמצאת איתנו היום קבוצת ספורט. אחד מהאנשים בתוך אותה קבוצה הוא הקפטן. איך הוא יכול לאמן בצורה מיטבית את האנשים שיחד איתו?", answer:"הקפטן צריך להוביל את חברי הקבוצה בדרך של דוגמה אישית, עידוד, והכוונה אל המטרה המשותפת. עליו להכיר את כוחותיהם וחולשותיהם של כל אחד, ולחלק את המשימות באופן שיביא לידי ביטוי את הטוב שבכל אחד. עליו להימנע מהקצנה, לא להכביד יתר על המידה ולא להקל מדי, אלא למצוא את הדרך האמצעית – שהיא הדרך הישרה והמאוזנת – ולשמור על רוח טובה ושיתוף פעולה. כך יוכל להוציא את המיטב מהקבוצה ולחזק את האחדות וההצלחה.", lang:"he-IL", type:"Personal advice or current event questions", topic:"Sports / Leadership", latency:181, accuracy:"correct", anomalies:[], audioId:"10", opening:"Even though I lived in another era, I will share my thoughts.", sensitivity:"low" },
  { id:15, time:"18:03", session:6, question:"במדינה שלנו יש משחקי כדורגל ביום שבת ויש שחקנים שהם שומרי שבת והם נמצאים בדילמה האם הם יכולים לשחק בשבת או שהם לא יכולים.", answer:"שחקן שהוא שומר שבת אינו רשאי לשחק כדורגל בשבת, שכן המשחק כרוך בעשיית מלאכה וביטול עונג שבת, ואף יש בו חילול קדושת היום. התורה ציוותה על שביתת מלאכה ועל מנוחה בשבת, וכל פעולה שאינה צורך מצווה או פיקוח נפש אסורה. הדילמה מובנת, אך ההכרעה ברורה: שמירת השבת קודמת לכל עיסוק אחר, והאדם נדרש להימנע מכל פעולה שאינה ראויה ליום זה.", lang:"he-IL", type:"Open questions", topic:"Shabbat / Halacha", latency:1352, accuracy:"correct", anomalies:[], audioId:"40", opening:"This is a complex subject; let us explore it together.", sensitivity:"medium" },
  { id:16, time:"18:04", session:6, question:"יש לנו במדינה אנשים שהם נקראים חרדים, ולכן הם בוחרים שלא להתגייס לצבא. האם מותר שיהיו אצלנו אנשים שלא מתגייסים לצבא וממשיכים ללמוד תורה?", answer:"הלימוד תורה הוא מצווה גדולה וחשובה, והיא יסוד קיומו של עם ישראל. עם זאת, יש חובה על כל קהל ישראל לדאוג לביטחון הכלל ולשלום הציבור, וכל מה שמסייע לקיום החברה ולשמירתה הוא בכלל מצוות התורה. אין היתר לאדם להימנע ממילוי חובותיו כלפי הכלל בטענה של לימוד תורה בלבד, אלא אם כן הוא עוסק בתורה באופן שאין בו ביטול מצוות אחרות. עיקר הדין הוא שכל ישראל צריכים להשתתף בצרכי הציבור, וכל חלוקה שאינה מבוססת על צדק ועל טובת הכלל גורמת למחלוקת ולפירוד, והדבר אינו ראוי.", lang:"he-IL", type:"Closed questions", topic:"Haredi / Army / Draft", latency:3540, accuracy:"correct", anomalies:["LATENCY_SPIKE_WARN"], audioId:"26", opening:"In this case, I hope to answer your question with the clarity it deserves.", sensitivity:"high" },
];

// Simulated multi-day trend data
const DAILY_TREND = [
  { date:"Feb 15", interactions:8, questions:6, hebrew:5, english:3, avgLatency:1200, anomalies:0, critical:0, inquiryPct:25, depthPct:40 },
  { date:"Feb 16", interactions:12, questions:9, hebrew:7, english:5, avgLatency:1400, anomalies:1, critical:0, inquiryPct:33, depthPct:45 },
  { date:"Feb 17", interactions:0, questions:0, hebrew:0, english:0, avgLatency:0, anomalies:0, critical:0, inquiryPct:0, depthPct:0 },
  { date:"Feb 18", interactions:15, questions:11, hebrew:9, english:6, avgLatency:980, anomalies:2, critical:1, inquiryPct:40, depthPct:55 },
  { date:"Feb 19", interactions:18, questions:14, hebrew:10, english:8, avgLatency:1100, anomalies:1, critical:0, inquiryPct:35, depthPct:50 },
  { date:"Feb 20", interactions:22, questions:17, hebrew:13, english:9, avgLatency:1350, anomalies:3, critical:1, inquiryPct:45, depthPct:60 },
  { date:"Feb 21", interactions:14, questions:10, hebrew:8, english:6, avgLatency:900, anomalies:0, critical:0, inquiryPct:30, depthPct:42 },
  { date:"Feb 22", interactions:21, questions:16, hebrew:11, english:5, avgLatency:1044, anomalies:3, critical:0, inquiryPct:50, depthPct:62 },
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
      i.anomalies.forEach(a => {
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
