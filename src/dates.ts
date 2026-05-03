/**
 * Date manipulation and formatting utilities
 * Consolidated from specialized/date module
 */

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import weekOfYearPlugin from 'dayjs/plugin/weekOfYear.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js'
import weekday from 'dayjs/plugin/weekday.js'
import localeData from 'dayjs/plugin/localeData.js'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import 'dayjs/locale/es.js'
import * as dateValidator from 'iso-datestring-validator'
const { isValidDate, isValidISODateString } = dateValidator

// Configure dayjs plugins
dayjs.extend(utc)
dayjs.extend(relativeTime)
dayjs.extend(weekOfYearPlugin)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(weekday)
dayjs.extend(localeData)
dayjs.extend(localizedFormat)

// Set default locale to Spanish
dayjs.locale('es')

/**
 * Formats current date with specified format
 */
export const formatNow = (formatStr = 'DD/MM/YYYY'): string => dayjs().format(formatStr)

/**
 * Formats date with specified format string (Spanish locale by default)
 *
 * Flexible date formatter with special support for week-of-year formats.
 * Uses dayjs Spanish locale for month/day names.
 *
 * @param value - Date value to format (Date, string, timestamp, dayjs)
 * @param formatStr - Format string (default: 'DD/MM/YYYY' for Spanish dates)
 * @returns Formatted date string, empty string if value is null/undefined
 *
 * @example
 * ```typescript
 * const date = new Date('2024-03-15')
 *
 * format(date)                    // '15/03/2024' (Spanish default)
 * format(date, 'DD-MM-YYYY')      // '15-03-2024'
 * format(date, 'YYYY/MM/DD')      // '2024/03/15'
 * format(date, 'DD MMM YYYY')     // '15 mar 2024' (Spanish month)
 * format(date, 'dddd, DD MMMM')   // 'viernes, 15 marzo' (Spanish)
 * format(date, 'gg')              // '11' (week of year)
 * format(date, 'gggg')            // '2411' (year + week)
 * ```
 *
 * @see {@link longString} for localized long format
 * @see {@link formatNow} for current date formatting
 */
export const format = (value: any, formatStr = 'DD/MM/YYYY'): string => {
  if (!value) return ''
  if (formatStr.toLowerCase() === 'gg') return weekOfYear(value)
  else if (formatStr.toLowerCase() === 'gggg') return dayjs(value).format('YY') + weekOfYear(value)
  return dayjs(value).format(formatStr)
}

/**
 * Converts date to localized long string format (Spanish)
 *
 * Formats date as human-readable string with full month name in Spanish locale.
 * Uses dayjs 'LL' format: "15 de marzo de 2024"
 *
 * @param value - Date value to format (null returns empty string)
 * @returns Localized long format date string (e.g., "15 de marzo de 2024")
 *
 * @example
 * ```typescript
 * longString(new Date('2024-03-15'))  // "15 de marzo de 2024"
 * longString('2024-12-25')            // "25 de diciembre de 2024"
 * longString(null)                    // ""
 *
 * // Real-world: Document headers
 * const reportDate = longString(new Date())
 * console.log(`Informe generado el ${reportDate}`)
 * // "Informe generado el 15 de marzo de 2024"
 * ```
 *
 * @see {@link format} for custom format strings
 */
export const longString = (value: any = null) => {
  if (!value) return ''
  return dayjs(value).format('LL')
}

/**
 * Converts value to native JavaScript Date object
 */
export const toDate = (value: any, isUtc?: boolean) => {
  if (isUtc === undefined) return dayjs(value).toDate()
  return isUtc ? dayjs.utc(value).toDate() : dayjs(value).toDate()
}

type DateStringFormat =
  | 'DD/MM/YYYY'
  | 'YYYY-MM-DD'
  | 'MM/DD/YYYY'
  | 'YYYY/MM/DD'
  | 'DD-MM-YYYY'
  | 'MM-DD-YYYY'
  | 'YYYYMMDD'
  | 'DDMMYYYY'
  | 'MMDDYYYY'
  | 'YYYY.MM.DD'
  | 'DD.MM.YYYY'
  | 'MM.DD.YYYY'

/**
 * Parses date string with specific format to native Date object
 *
 * Strict parser that validates format and creates Date from structured date strings.
 * Supports 12 common date formats with validation.
 *
 * @param dateString - Date string to parse
 * @param format - Expected format (DD/MM/YYYY, YYYY-MM-DD, etc.)
 * @returns Date object or null if invalid
 *
 * @example
 * ```typescript
 * toDateFromString('15/03/2024', 'DD/MM/YYYY')  // Date object
 * toDateFromString('2024-03-15', 'YYYY-MM-DD')  // Date object
 * toDateFromString('invalid', 'DD/MM/YYYY')     // null
 * ```
 *
 * @see {@link format} for formatting dates
 */
export const toDateFromString = (dateString: string, format: DateStringFormat): Date | null => {
  const formatRegex: Record<string, RegExp> = {
    'DD/MM/YYYY': /^(\d{2})\/(\d{2})\/(\d{4})$/,
    'YYYY-MM-DD': /^(\d{4})-(\d{2})-(\d{2})$/,
    'MM/DD/YYYY': /^(\d{2})\/(\d{2})\/(\d{4})$/,
    'YYYY/MM/DD': /^(\d{4})\/(\d{2})\/(\d{2})$/,
    'DD-MM-YYYY': /^(\d{2})-(\d{2})-(\d{4})$/,
    'MM-DD-YYYY': /^(\d{2})-(\d{2})-(\d{4})$/,
    YYYYMMDD: /^(\d{4})(\d{2})(\d{2})$/,
    DDMMYYYY: /^(\d{2})(\d{2})(\d{4})$/,
    MMDDYYYY: /^(\d{2})(\d{2})(\d{4})$/,
    'YYYY.MM.DD': /^(\d{4})\.(\d{2})\.(\d{2})$/,
    'DD.MM.YYYY': /^(\d{2})\.(\d{2})\.(\d{4})$/,
    'MM.DD.YYYY': /^(\d{2})\.(\d{2})\.(\d{4})$/,
  }

  const regex = formatRegex[format]
  if (!regex) return null

  const match = dateString.match(regex)
  if (match) {
    let year: number, month: number, day: number

    if (format.startsWith('YYYY')) {
      year = parseInt(match[1], 10)
      month = parseInt(match[2], 10) - 1
      day = parseInt(match[3], 10)
    } else if (format.startsWith('DD')) {
      day = parseInt(match[1], 10)
      month = parseInt(match[2], 10) - 1
      year = parseInt(match[3], 10)
    } else if (format.startsWith('MM')) {
      month = parseInt(match[1], 10) - 1
      day = parseInt(match[2], 10)
      year = parseInt(match[3], 10)
    } else {
      return null
    }

    return new Date(year, month, day)
  }

  return null
}

/**
 * Returns current date
 */
export const now = () => dayjs().toDate()

/**
 * Checks if date is considered "new" based on days threshold
 */
export const isNew = (value: any, daysnew = 1) =>
  dayjs().isSameOrBefore(dayjs(value).add(daysnew, 'days'))

/**
 * Converts date to ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ)
 *
 * Standard ISO format for API communication and storage.
 *
 * @param value - Date to convert (null = now)
 * @param isUtc - Force UTC timezone (default: false, uses local)
 * @returns ISO 8601 formatted string
 *
 * @example
 * ```typescript
 * toISO()  // "2024-03-15T10:30:00.000+01:00" (now, local time)
 * toISO(new Date('2024-03-15'))  // "2024-03-15T00:00:00.000+01:00"
 * toISO(new Date('2024-03-15'), true)  // "2024-03-14T23:00:00.000Z" (UTC)
 * ```
 */
export const toISO = (value: any = null, isUtc = false) => {
  if (!value) return dayjs().toISOString()
  return isUtc ? dayjs.utc(value).toISOString() : dayjs(value).toISOString()
}

/**
 * Returns relative time from now in Spanish (e.g., "hace 2 horas")
 *
 * @param value - Date to compare with now
 * @returns Relative time string in Spanish
 *
 * @example
 * ```typescript
 * const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
 * fromNow(twoHoursAgo)  // "hace 2 horas"
 * ```
 */
export const fromNow = (value: any) => dayjs(value).fromNow()

/**
 * Returns day of week (0-6, Sunday is 0)
 */
export const dayOfWeek = (value: any = null) => {
  if (!value) return dayjs().format('d')
  return dayjs(value).format('d')
}

/**
 * Returns week of year with zero padding
 */
export const weekOfYear = (value: any = null) => {
  if (!value) return dayjs().locale('es').week().toString().padStart(2, '0')
  return dayjs(value).locale('es').week().toString().padStart(2, '0')
}

/**
 * Calculates difference in days between two dates
 */
export const diffDays = (start: any, end: any = null, precise = false) => {
  const v2 = !end ? dayjs() : dayjs(end)
  return dayjs(start).diff(v2, 'days', precise)
}

/**
 * Calculates difference in business days (weekdays only, excludes weekends)
 *
 * Counts Mon-Fri between two dates, excluding Saturdays and Sundays.
 * Does NOT account for holidays.
 *
 * @param start - Start date
 * @param end - End date (null = now)
 * @param precise - Include fractional days (default: false)
 * @returns Number of business days (Mon-Fri)
 *
 * @example
 * ```typescript
 * // Monday to Friday (same week)
 * diffBusinessDays('2024-03-11', '2024-03-15')  // 4 business days
 *
 * // Including weekend (skip Sat/Sun)
 * diffBusinessDays('2024-03-15', '2024-03-18')  // 1 (Fri to Mon)
 *
 * // Real-world: SLA calculation
 * const ticketCreated = new Date('2024-03-11')
 * const businessDays = diffBusinessDays(ticketCreated)
 * if (businessDays > 5) {
 *   console.log('⚠️ SLA violation: > 5 business days')
 * }
 * ```
 */
export const diffBusinessDays = (start: any, end: any = null, precise = false) => {
  let startDate = dayjs(start).startOf('day')
  let endDate = end ? dayjs(end).startOf('day') : dayjs().startOf('day')

  if (startDate.isAfter(endDate)) {
    ;[startDate, endDate] = [endDate, startDate]
  }

  let businessDays = 0
  let currentDate = startDate

  while (currentDate.isBefore(endDate)) {
    if (isWeekday(currentDate)) {
      businessDays++
    }
    currentDate = currentDate.add(1, 'day')
  }

  if (precise) {
    const fractionalDay = endDate.diff(currentDate, 'hours') / 24
    businessDays += fractionalDay
  }

  return businessDays
}

/**
 * Calculates difference in months between two dates
 */
export const diffMonths = (value: any, valueRefOrNow: any = null, precise = false) => {
  const v2 = !valueRefOrNow ? dayjs() : dayjs(valueRefOrNow)
  return dayjs(value).diff(v2, 'months', precise)
}

/**
 * Calculates difference in years between two dates
 */
export const diffYears = (value: any, valueRefOrNow: any = null, precise = false) => {
  const v2 = !valueRefOrNow ? dayjs() : dayjs(valueRefOrNow)
  return dayjs(value).diff(v2, 'years', precise)
}

/**
 * Calculates difference in milliseconds between two dates
 */
export const diffMilliSeconds = (value: any, valueRefOrNow: any = null) => {
  const v2 = !valueRefOrNow ? dayjs() : dayjs(valueRefOrNow)
  return dayjs(value).diff(v2, 'milliseconds', true)
}

/**
 * Adds days to a date
 */
export const addDays = (value: any, nDays: number = 1) => dayjs(value).add(nDays, 'days').toDate()

/**
 * Adds seconds to a date
 */
export const addSeconds = (value: any, nSeconds: number = 1) =>
  dayjs(value).add(nSeconds, 'seconds').toDate()

/**
 * Compares two dates with ± 2 seconds tolerance
 */
export const areDatesEqualWithTolerance = (date1: Date, date2: Date): boolean => {
  const tolerance = 2 * 1000 // 2 seconds in milliseconds
  return Math.abs(dayjs(date1).diff(dayjs(date2))) <= tolerance
}

/**
 * Adds days to current date
 */
export const addNowDays = (nDays: number = 1) => dayjs().add(nDays, 'days').toDate()

/**
 * Adds seconds to current date
 */
export const addNowSeconds = (nSeconds: number = 60) => dayjs().add(nSeconds, 'seconds').toDate()

/**
 * Adds months to a date
 */
export const addMonths = (value: any, nMonths: number = 1) =>
  dayjs(value).add(nMonths, 'months').toDate()

/**
 * Adds months to current date
 */
export const addNowMonths = (nMonths: number = 1) => dayjs().add(nMonths, 'months').toDate()

/**
 * Adds years to a date
 */
export const addYears = (value: any, nYears: number = 1) =>
  dayjs(value).add(nYears, 'years').toDate()

/**
 * Adds years to current date
 */
export const addNowYears = (nYears: number = 1) => dayjs().add(nYears, 'years').toDate()

/**
 * Converts Excel serial number to Date
 * JavaScript dates can be constructed by passing milliseconds since Unix epoch
 */
export const excelToDate = (value: any) => {
  try {
    const d: number = Number(value)
    if (d >= 18000 && d <= 300000) return new Date(Math.round((d - 25569) * 86400 * 1000))
    return null
  } catch (_err) {
    return null
  }
}

/**
 * Detects if a variable contains a valid date
 */
export const isDateTime = (value: any): boolean => {
  try {
    if (!value) return false
    if (typeof value === 'number') return false
    else if (typeof value === 'boolean') return false
    else if (
      typeof value === 'string' &&
      !isValidISODateString(value) &&
      !isValidDate(value) &&
      !isValidDate(value, '')
    )
      return false
    else if (typeof value === 'object' && !(value instanceof Date) && !dayjs.isDayjs(value))
      return false
    return dayjs(value).isValid()
  } catch (_err) {
    return false
  }
}

/**
 * Compares dates by day
 */
export const isEqualsDateTimeByDay = (value1: any, value2: any): boolean => {
  if (!isDateTime(value1)) return false
  if (!isDateTime(value2)) return false
  return dayjs(value1).isSame(dayjs(value2), 'day')
}

/**
 * Checks if a date has expired relative to current time
 */
export const isExpired = (value: any, valueRefOrNow: any = null): boolean => {
  const v2 = !valueRefOrNow ? dayjs() : dayjs(valueRefOrNow)
  if (isDateTime(value)) {
    return v2.isAfter(value)
  }
  return true
}

/**
 * Formats date for MySQL database
 */
export const formatForMysql = (fecha: Date | null) => {
  if (!fecha) return null
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset())
  return fecha.toISOString().slice(0, 19).replace('T', ' ')
}

/**
 * Gets first workday of month
 */
export const getFirstWorkdayOfMonth = (month?: number) => {
  const monthToUse = month === undefined ? dayjs().month() : month
  let firstDay = dayjs().month(monthToUse).startOf('month')
  while (firstDay.day() === 0 || firstDay.day() === 6) {
    firstDay = firstDay.add(1, 'day')
  }
  return firstDay.toDate()
}

/**
 * Gets last workday of month
 */
export const getLastWorkdayOfMonth = (month?: number) => {
  const monthToUse = month === undefined ? dayjs().month() : month
  let lastDay = dayjs().month(monthToUse).endOf('month')
  while (lastDay.day() === 0 || lastDay.day() === 6) {
    lastDay = lastDay.subtract(1, 'day')
  }
  return lastDay.toDate()
}

/**
 * Gets first workday after adding specified months
 */
export const getFirstWorkdayAfterMonths = (initialDate: Date, n: number) => {
  const startDate = dayjs(initialDate)
  const monthsToAdd = n
  const targetDate = startDate.add(monthsToAdd, 'months')

  let firstWorkday = targetDate.startOf('month')
  while (firstWorkday.day() === 0 || firstWorkday.day() === 6) {
    firstWorkday = firstWorkday.add(1, 'day')
  }
  return firstWorkday.toDate()
}

/**
 * Gets first day of current year
 */
export const getFirstDayOfYear = () => dayjs().startOf('year').toDate()

/**
 * Gets last day of current year
 */
export const getLastDayOfYear = () => dayjs().endOf('year').toDate()

/**
 * Checks if date is a weekday (not Saturday or Sunday)
 */
export const isWeekday = (date: any) => {
  const d = dayjs(date)
  const dayOfWeek = d.day() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return dayOfWeek !== 0 && dayOfWeek !== 6 // Exclude Saturdays and Sundays
}
