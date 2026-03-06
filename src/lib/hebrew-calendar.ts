import { HebrewCalendar, HDate, Location, flags as hebFlags } from '@hebcal/core'

export interface HebrewDayInfo {
  /** ISO date string */
  date: string
  /** Hebrew date in gematriya, e.g. "כ״ח שְׁבָט תשפ״ו" */
  hebrewDate: string
  /** Day of week in Hebrew */
  hebrewDay: string
  /** Is Shabbat (Saturday) */
  isShabbat: boolean
  /** Is Friday (erev Shabbat — museum may close early) */
  isFriday: boolean
  /** Holiday name in Hebrew, null if none */
  holidayHe: string | null
  /** Holiday name in English, null if none */
  holidayEn: string | null
  /** Is a major holiday where museum would be closed (Yom Tov, Shabbat, major fast) */
  isClosed: boolean
  /** Reason string for closure: "שבת", holiday name, or null */
  closureReason: string | null
  /** Closure reason in English */
  closureReasonEn: string | null
}

const HEBREW_DAYS = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת']

// Flags that indicate museum closure (major events)
const CLOSURE_FLAGS = hebFlags.CHAG | hebFlags.MAJOR_FAST | hebFlags.CHOL_HAMOED

export function getHebrewDayInfo(isoDate: string): HebrewDayInfo {
  const d = new Date(isoDate + 'T12:00:00')
  const hd = new HDate(d)
  const dow = d.getDay() // 0=Sun, 6=Sat
  const isShabbat = dow === 6
  const isFriday = dow === 5

  // Get events for this specific day
  const events = HebrewCalendar.calendar({
    start: d,
    end: d,
    location: Location.lookup('Jerusalem'),
    il: true,
    candlelighting: false,
    sedrot: false,
    omer: false,
    molad: false,
  })

  // Filter out candle lighting / havdalah timing events
  const significantEvents = events.filter(
    (e) => !(e.getFlags() & (hebFlags.LIGHT_CANDLES | hebFlags.YOM_TOV_ENDS | hebFlags.LIGHT_CANDLES_TZEIS))
  )

  // Check if any event indicates closure
  const closureEvent = significantEvents.find((e) => e.getFlags() & CLOSURE_FLAGS)

  // Get the most significant holiday name
  const mainEvent = significantEvents.find(
    (e) => e.getFlags() & (CLOSURE_FLAGS | hebFlags.MINOR_HOLIDAY | hebFlags.MODERN_HOLIDAY | hebFlags.ROSH_CHODESH | hebFlags.SPECIAL_SHABBAT | hebFlags.MINOR_FAST)
  )

  const holidayHe = mainEvent?.render('he') || null
  const holidayEn = mainEvent?.render('en') || null

  // Determine closure reason
  let closureReason: string | null = null
  let closureReasonEn: string | null = null
  if (isShabbat) {
    closureReason = 'שבת'
    closureReasonEn = 'Shabbat'
  }
  if (closureEvent) {
    closureReason = closureEvent.render('he')
    closureReasonEn = closureEvent.render('en')
  }

  return {
    date: isoDate,
    hebrewDate: hd.renderGematriya(),
    hebrewDay: HEBREW_DAYS[dow],
    isShabbat,
    isFriday,
    holidayHe,
    holidayEn,
    isClosed: isShabbat || !!closureEvent,
    closureReason,
    closureReasonEn,
  }
}

/**
 * Get Hebrew calendar info for a date range.
 * Returns a Map keyed by ISO date string.
 */
export function getHebrewCalendarRange(startDate: string, endDate: string): Map<string, HebrewDayInfo> {
  const map = new Map<string, HebrewDayInfo>()
  const d = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')

  while (d <= end) {
    const iso = d.toISOString().split('T')[0]
    map.set(iso, getHebrewDayInfo(iso))
    d.setDate(d.getDate() + 1)
  }

  return map
}
