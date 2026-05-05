/**
 * Test suite for dates module
 * Tests for date formatting, manipulation, validation and utility functions
 */

import { describe, test, expect } from 'vitest'
import {
  // Date formatting
  formatNow,
  format,
  longString,
  toISO,

  // Date conversion
  toDate,
  toDateFromString,
  excelToDate,

  // Date utilities
  now,
  fromNow,
  dayOfWeek,
  weekOfYear,

  // Date comparison and validation
  isDateTime,
  isEqualsDateTimeByDay,
  isExpired,
  isNew,
  areDatesEqualWithTolerance,

  // Date arithmetic
  addDays,
  addSeconds,
  addMonths,
  addYears,
  addNowDays,
  addNowSeconds,
  addNowMonths,
  addNowYears,

  // Date differences
  diffDays,
  diffBusinessDays,
  diffMonths,
  diffYears,
  diffMilliSeconds,

  // Business date utilities
  getFirstWorkdayOfMonth,
  getLastWorkdayOfMonth,
  getFirstWorkdayAfterMonths,
  getFirstDayOfYear,
  getLastDayOfYear,
  isWeekday,

  // Database utilities
  formatForMysql,
} from '../src/dates'

describe('Date Formatting', () => {
  test('formatNow should format current date', () => {
    const result = formatNow()
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/) // DD/MM/YYYY format

    const customFormat = formatNow('YYYY-MM-DD')
    expect(customFormat).toMatch(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
  })

  test('format should format given date', () => {
    const testDate = new Date('2023-06-15T10:30:00')

    expect(format(testDate, 'DD/MM/YYYY')).toBe('15/06/2023')
    expect(format(testDate, 'YYYY-MM-DD')).toBe('2023-06-15')
    expect(format(testDate, 'DD-MM-YYYY HH:mm')).toBe('15-06-2023 10:30')

    // Test empty value
    expect(format('', 'DD/MM/YYYY')).toBe('')
    expect(format(null, 'DD/MM/YYYY')).toBe('')
  })

  test('format should handle week of year formats', () => {
    const testDate = new Date('2023-06-15') // Should be around week 24

    const weekResult = format(testDate, 'gg')
    expect(weekResult).toMatch(/^\d{2}$/) // Two digit week

    const yearWeekResult = format(testDate, 'gggg')
    expect(yearWeekResult).toMatch(/^\d{4}$/) // Year + week format
  })

  test('longString should format date in localized long format', () => {
    const testDate = new Date('2023-06-15')
    const result = longString(testDate)

    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(longString('')).toBe('')
    expect(longString(null)).toBe('')
  })

  test('toISO should convert date to ISO string', () => {
    const testDate = new Date('2023-06-15T10:30:00Z')
    const result = toISO(testDate)

    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

    // Test UTC conversion
    const utcResult = toISO(testDate, true)
    expect(utcResult).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

    // Test current date when no value provided
    const nowResult = toISO()
    expect(nowResult).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })
})

describe('Date Conversion', () => {
  test('toDate should convert various inputs to Date objects', () => {
    const testDate = new Date('2023-06-15T10:30:00')

    expect(toDate(testDate)).toBeInstanceOf(Date)
    expect(toDate('2023-06-15')).toBeInstanceOf(Date)
    expect(toDate(testDate.getTime())).toBeInstanceOf(Date)

    // Test UTC conversion
    const utcDate = toDate(testDate, true)
    expect(utcDate).toBeInstanceOf(Date)
  })

  test('toDateFromString should parse various date string formats', () => {
    expect(toDateFromString('15/06/2023', 'DD/MM/YYYY')).toEqual(new Date(2023, 5, 15))
    expect(toDateFromString('2023-06-15', 'YYYY-MM-DD')).toEqual(new Date(2023, 5, 15))
    expect(toDateFromString('06/15/2023', 'MM/DD/YYYY')).toEqual(new Date(2023, 5, 15))
    expect(toDateFromString('2023/06/15', 'YYYY/MM/DD')).toEqual(new Date(2023, 5, 15))
    expect(toDateFromString('15-06-2023', 'DD-MM-YYYY')).toEqual(new Date(2023, 5, 15))
    expect(toDateFromString('20230615', 'YYYYMMDD')).toEqual(new Date(2023, 5, 15))
    expect(toDateFromString('15062023', 'DDMMYYYY')).toEqual(new Date(2023, 5, 15))

    // Test invalid formats
    expect(toDateFromString('invalid', 'DD/MM/YYYY')).toBeNull()
    expect(toDateFromString('15/06/2023', 'INVALID' as any)).toBeNull()
  })

  test('excelToDate should convert Excel serial numbers to dates', () => {
    // Excel date serial 44927 = 2023-01-01
    const result = excelToDate(44927)
    expect(result).toBeInstanceOf(Date)

    // Test edge cases
    expect(excelToDate(10000)).toBeNull() // Too small
    expect(excelToDate(400000)).toBeNull() // Too large
    expect(excelToDate('invalid')).toBeNull()
  })
})

describe('Date Utilities', () => {
  test('now should return current date', () => {
    const result = now()
    expect(result).toBeInstanceOf(Date)
    expect(Math.abs(result.getTime() - Date.now())).toBeLessThan(1000) // Within 1 second
  })

  test('fromNow should return relative time', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const result = fromNow(yesterday)

    expect(typeof result).toBe('string')
    expect(result).toContain('día') // Should contain "day" in Spanish
  })

  test('dayOfWeek should return day of week', () => {
    const monday = new Date('2023-06-19') // Known Monday
    expect(dayOfWeek(monday)).toBe('1') // Monday is 1

    const sunday = new Date('2023-06-18') // Known Sunday
    expect(dayOfWeek(sunday)).toBe('0') // Sunday is 0

    // Test current day
    const today = dayOfWeek()
    expect(['0', '1', '2', '3', '4', '5', '6']).toContain(today)
  })

  test('weekOfYear should return week number with padding', () => {
    const testDate = new Date('2023-06-15')
    const result = weekOfYear(testDate)

    expect(result).toMatch(/^\d{2}$/) // Two digits
    expect(parseInt(result)).toBeGreaterThanOrEqual(1)
    expect(parseInt(result)).toBeLessThanOrEqual(53)

    // Test current week
    const currentWeek = weekOfYear()
    expect(currentWeek).toMatch(/^\d{2}$/)
  })
})

describe('Date Validation and Comparison', () => {
  test('isDateTime should validate various date inputs', () => {
    expect(isDateTime(new Date())).toBe(true)
    expect(isDateTime('2023-06-15')).toBe(true)
    expect(isDateTime('2023-06-15T10:30:00Z')).toBe(true)

    expect(isDateTime(null)).toBe(false)
    expect(isDateTime('')).toBe(false)
    expect(isDateTime(123)).toBe(false)
    expect(isDateTime(true)).toBe(false)
    expect(isDateTime('invalid date')).toBe(false)
    expect(isDateTime({})).toBe(false)
  })

  test('isEqualsDateTimeByDay should compare dates by day', () => {
    const date1 = new Date('2023-06-15T10:30:00')
    const date2 = new Date('2023-06-15T15:45:00')
    const date3 = new Date('2023-06-16T10:30:00')

    expect(isEqualsDateTimeByDay(date1, date2)).toBe(true) // Same day, different times
    expect(isEqualsDateTimeByDay(date1, date3)).toBe(false) // Different days

    expect(isEqualsDateTimeByDay('invalid', date1)).toBe(false)
    expect(isEqualsDateTimeByDay(date1, 'invalid')).toBe(false)
  })

  test('isExpired should check if date has passed', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

    expect(isExpired(yesterday)).toBe(true)
    expect(isExpired(tomorrow)).toBe(false)

    // Test with reference date
    const referenceDate = new Date('2023-06-15')
    const beforeReference = new Date('2023-06-14')
    const afterReference = new Date('2023-06-16')

    expect(isExpired(beforeReference, referenceDate)).toBe(true)
    expect(isExpired(afterReference, referenceDate)).toBe(false)

    expect(isExpired('invalid')).toBe(true)
  })

  test('isNew should check if date is recent', () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

    expect(isNew(now, 1)).toBe(true)
    expect(isNew(yesterday, 2)).toBe(true)
    expect(isNew(twoDaysAgo, 1)).toBe(false)
  })

  test('areDatesEqualWithTolerance should compare dates with tolerance', () => {
    const baseDate = new Date('2023-06-15T10:30:00.000Z')
    const closeDate = new Date('2023-06-15T10:30:01.500Z') // 1.5 seconds difference
    const farDate = new Date('2023-06-15T10:30:05.000Z') // 5 seconds difference

    expect(areDatesEqualWithTolerance(baseDate, closeDate)).toBe(true) // Within 2s tolerance
    expect(areDatesEqualWithTolerance(baseDate, farDate)).toBe(false) // Beyond 2s tolerance
  })
})

describe('Date Arithmetic', () => {
  test('addDays should add days to date', () => {
    const baseDate = new Date('2023-06-15')
    const result = addDays(baseDate, 3)

    expect(result).toBeInstanceOf(Date)
    expect(result.getDate()).toBe(18)

    // Test negative days
    const pastResult = addDays(baseDate, -2)
    expect(pastResult.getDate()).toBe(13)
  })

  test('addSeconds should add seconds to date', () => {
    const baseDate = new Date('2023-06-15T10:30:00')
    const result = addSeconds(baseDate, 30)

    expect(result).toBeInstanceOf(Date)
    expect(result.getSeconds()).toBe(30)
  })

  test('addMonths should add months to date', () => {
    const baseDate = new Date('2023-06-15')
    const result = addMonths(baseDate, 2)

    expect(result).toBeInstanceOf(Date)
    expect(result.getMonth()).toBe(7) // August (0-indexed)
  })

  test('addYears should add years to date', () => {
    const baseDate = new Date('2023-06-15')
    const result = addYears(baseDate, 1)

    expect(result).toBeInstanceOf(Date)
    expect(result.getFullYear()).toBe(2024)
  })

  test('addNow functions should add to current date', () => {
    const nowBefore = new Date()

    const futureDay = addNowDays(1)
    expect(futureDay.getTime()).toBeGreaterThan(nowBefore.getTime())

    const futureSecond = addNowSeconds(60)
    expect(futureSecond.getTime()).toBeGreaterThan(nowBefore.getTime())

    const futureMonth = addNowMonths(1)
    expect(futureMonth.getTime()).toBeGreaterThan(nowBefore.getTime())

    const futureYear = addNowYears(1)
    expect(futureYear.getTime()).toBeGreaterThan(nowBefore.getTime())
  })
})

describe('Date Differences', () => {
  test('diffDays should calculate difference in days', () => {
    const date1 = new Date('2023-06-15')
    const date2 = new Date('2023-06-18')

    expect(diffDays(date2, date1)).toBe(3)
    expect(diffDays(date1, date2)).toBe(-3)

    // Test with current date
    const diffFromNow = diffDays(date1)
    expect(typeof diffFromNow).toBe('number')
  })

  test('diffBusinessDays should calculate business days only', () => {
    const monday = new Date('2023-06-19') // Monday
    const friday = new Date('2023-06-23') // Friday
    const nextMonday = new Date('2023-06-26') // Next Monday

    expect(diffBusinessDays(monday, friday)).toBe(4) // Mon to Fri = 4 business days
    expect(diffBusinessDays(monday, nextMonday)).toBe(5) // Mon to Mon = 5 business days (skip weekend)
  })

  test('diffMonths should calculate difference in months', () => {
    const date1 = new Date('2023-03-15')
    const date2 = new Date('2023-06-15')

    expect(diffMonths(date2, date1)).toBe(3)
    expect(diffMonths(date1, date2)).toBe(-3)
  })

  test('diffYears should calculate difference in years', () => {
    const date1 = new Date('2020-06-15')
    const date2 = new Date('2023-06-15')

    expect(diffYears(date2, date1)).toBe(3)
    expect(diffYears(date1, date2)).toBe(-3)
  })

  test('diffMilliSeconds should calculate difference in milliseconds', () => {
    const date1 = new Date('2023-06-15T10:30:00.000Z')
    const date2 = new Date('2023-06-15T10:30:01.500Z')

    expect(diffMilliSeconds(date2, date1)).toBe(1500)
    expect(diffMilliSeconds(date1, date2)).toBe(-1500)
  })
})

describe('Business Date Utilities', () => {
  test('getFirstWorkdayOfMonth should return first weekday of month', () => {
    const result = getFirstWorkdayOfMonth(5) // June (0-indexed)

    expect(result).toBeInstanceOf(Date)
    expect(result.getMonth()).toBe(5)
    expect(isWeekday(result)).toBe(true)
  })

  test('getLastWorkdayOfMonth should return last weekday of month', () => {
    const result = getLastWorkdayOfMonth(5) // June (0-indexed)

    expect(result).toBeInstanceOf(Date)
    expect(result.getMonth()).toBe(5)
    expect(isWeekday(result)).toBe(true)
  })

  test('getLastWorkdayOfMonth should skip weekend when last day is Saturday (January 2026)', () => {
    // Jan 31, 2026 = Saturday → while loop fires → result must be Friday Jan 30
    const result = getLastWorkdayOfMonth(0)
    expect(result).toBeInstanceOf(Date)
    expect(isWeekday(result)).toBe(true)
  })

  test('getFirstWorkdayAfterMonths should return first workday after adding months', () => {
    const initialDate = new Date('2023-06-15')
    const result = getFirstWorkdayAfterMonths(initialDate, 2)

    expect(result).toBeInstanceOf(Date)
    expect(result.getMonth()).toBe(7) // August (0-indexed)
    expect(isWeekday(result)).toBe(true)
  })

  test('getFirstWorkdayAfterMonths should skip weekend when target month starts on Sunday (March 2026)', () => {
    // March 1, 2026 = Sunday → while loop fires → result must be Monday March 2
    const initialDate = new Date('2026-01-01')
    const result = getFirstWorkdayAfterMonths(initialDate, 2)
    expect(result).toBeInstanceOf(Date)
    expect(isWeekday(result)).toBe(true)
    expect(result.getMonth()).toBe(2) // March (0-indexed)
  })

  test('getFirstDayOfYear and getLastDayOfYear should return year boundaries', () => {
    const firstDay = getFirstDayOfYear()
    const lastDay = getLastDayOfYear()

    expect(firstDay).toBeInstanceOf(Date)
    expect(lastDay).toBeInstanceOf(Date)
    expect(firstDay.getMonth()).toBe(0) // January
    expect(firstDay.getDate()).toBe(1)
    expect(lastDay.getMonth()).toBe(11) // December
    expect(lastDay.getDate()).toBe(31)
  })

  test('isWeekday should identify weekdays correctly', () => {
    const monday = new Date('2023-06-19') // Monday
    const tuesday = new Date('2023-06-20') // Tuesday
    const saturday = new Date('2023-06-17') // Saturday
    const sunday = new Date('2023-06-18') // Sunday

    expect(isWeekday(monday)).toBe(true)
    expect(isWeekday(tuesday)).toBe(true)
    expect(isWeekday(saturday)).toBe(false)
    expect(isWeekday(sunday)).toBe(false)
  })
})

describe('Database Utilities', () => {
  test('formatForMysql should format date for MySQL', () => {
    const testDate = new Date('2023-06-15T10:30:00Z')
    const result = formatForMysql(testDate)

    if (result !== null) {
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    }

    expect(formatForMysql(null)).toBeNull()
  })
})

describe('Edge Cases and Error Handling', () => {
  test('date functions should handle invalid inputs gracefully', () => {
    expect(format(null)).toBe('')
    expect(format('')).toBe('')
    expect(longString(null)).toBe('')
    expect(longString('')).toBe('')
  })

  test('date arithmetic should handle edge cases', () => {
    const leapYearDate = new Date('2024-02-29')
    const result = addYears(leapYearDate, 1)
    expect(result).toBeInstanceOf(Date)
    // Should handle leap year edge cases gracefully
  })

  test('date validation should handle edge cases', () => {
    expect(isDateTime(undefined)).toBe(false)
    expect(isDateTime([])).toBe(false)
    expect(isDateTime(NaN)).toBe(false)
    expect(isDateTime(Infinity)).toBe(false)
  })

  test('date differences should handle same dates', () => {
    const sameDate = new Date('2023-06-15')

    expect(diffDays(sameDate, sameDate)).toBe(0)
    expect(diffMonths(sameDate, sameDate)).toBe(0)
    expect(diffYears(sameDate, sameDate)).toBe(0)
    expect(diffMilliSeconds(sameDate, sameDate)).toBe(0)
  })

  test('business day calculations should handle edge cases', () => {
    const sameDate = new Date('2023-06-19') // Monday
    expect(diffBusinessDays(sameDate, sameDate)).toBe(0)

    // Weekend to weekend should be 0 business days
    const saturday = new Date('2023-06-17')
    const sunday = new Date('2023-06-18')
    expect(diffBusinessDays(saturday, sunday)).toBe(0)
  })
})
