/**
 * Mathematical calculations, statistics, and financial utilities
 * Consolidated from specialized/math module
 */

import * as lodash from 'lodash'
const { map, round, sumBy, get, meanBy, maxBy, some, minBy, uniq, size, sum, zipObject, groupBy } =
  lodash
import { roundToDecimals } from './number'

const GROUP_KEY_SEPARATOR = '$|marca|@'

/**
 * Mathematical operations configuration for data aggregation
 * @template T - The type of objects being processed
 * @example
 * ```ts
 * // Simple operations configuration
 * const ops: IMathOp = {
 *   $sum: ['amount', 'quantity'],
 *   $avg: ['price', 'rating'],
 *   $count: ['name'],
 *   $max: ['sales'],
 *   $min: ['cost']
 * }
 *
 * // For sales data
 * const salesOps: IMathOp<SalesRecord> = {
 *   $sum: ['revenue', 'units'],
 *   $avg: ['unitPrice'],
 *   $countUniq: ['customerId']
 * }
 * ```
 */
export interface IMathOp<T = any> {
  /** Calculate average of numeric fields */
  $avg?: (keyof T extends infer K
    ? K extends keyof T
      ? T[K] extends number
        ? K
        : never
      : never
    : never)[]
  /** Count occurrences of string fields */
  $count?: (keyof T extends infer K
    ? K extends keyof T
      ? T[K] extends string
        ? K
        : never
      : never
    : never)[]
  /** Count unique values in fields */
  $countUniq?: (keyof T)[]
  /** Check if field exists (1/0) */
  $exist?: (keyof T)[]
  /** Find maximum value in numeric fields */
  $max?: (keyof T extends infer K
    ? K extends keyof T
      ? T[K] extends number
        ? K
        : never
      : never
    : never)[]
  /** Find minimum value in numeric fields */
  $min?: (keyof T extends infer K
    ? K extends keyof T
      ? T[K] extends number
        ? K
        : never
      : never
    : never)[]
  /** Sum numeric fields */
  $sum?: (keyof T extends infer K
    ? K extends keyof T
      ? T[K] extends number
        ? K
        : never
      : never
    : never)[]
  /** Calculate trend slope for numeric fields */
  $trend?: (keyof T extends infer K
    ? K extends keyof T
      ? T[K] extends number
        ? K
        : never
      : never
    : never)[]
}

/**
 * Calculates mathematical operations on an array of objects with optional grouping
 * Supports statistical operations like sum, average, count, etc. with grouping capability
 * @param operations - Mathematical operations to perform on data fields
 * @param pgroupBy - Array of field names to group by (empty array for no grouping)
 * @param inData - Input data array to process
 * @param appendOperationToField - Whether to append operation name to result field names
 * @returns Aggregated data with calculated values
 * @example
 * ```ts
 * // Sales data aggregation
 * const sales = [
 *   { region: 'North', product: 'Laptop', amount: 1000, quantity: 2 },
 *   { region: 'North', product: 'Mouse', amount: 50, quantity: 5 },
 *   { region: 'South', product: 'Laptop', amount: 1200, quantity: 3 }
 * ]
 *
 * // Group by region and calculate totals
 * const regionTotals = calculateAggregations(
 *   { $sum: ['amount', 'quantity'], $avg: ['amount'] },
 *   ['region'],
 *   sales
 * )
 * // Result: [
 * //   { region: 'North', amount$sum: 1050, quantity$sum: 7, amount$avg: 525 },
 * //   { region: 'South', amount$sum: 1200, quantity$sum: 3, amount$avg: 1200 }
 * // ]
 *
 * // Overall totals (no grouping)
 * const totals = calculateAggregations(
 *   { $sum: ['amount'], $count: ['product'], $countUniq: ['region'] },
 *   [],
 *   sales,
 *   false
 * )
 * // Result: { amount: 2250, product: 3, region: 2 }
 * ```
 */
export const calculateAggregations = <T extends Record<string, unknown>>(
  operations: IMathOp<T>,
  pgroupBy: (keyof T & string)[],
  inData: T[],
  appendOperationToField = true
): Record<string, unknown> | Record<string, unknown>[] => {
  let data: Record<string, unknown> | Record<string, unknown>[] = []
  if (pgroupBy?.length) {
    const groupedData = groupBy(inData, item =>
      pgroupBy.map(field => get(item, field)).join(GROUP_KEY_SEPARATOR)
    )
    data = map(groupedData, (items, groupKey) => {
      const obj: Record<string, unknown> = zipObject(pgroupBy, groupKey.split(GROUP_KEY_SEPARATOR))
      for (const operation in operations) {
        const fields = operations[operation]
        fields.forEach(field => {
          const resultField = appendOperationToField ? field + operation : field
          switch (operation) {
            case '$count':
              obj[resultField] = items.length
              break
            case '$sum':
              obj[resultField] = sumBy(items, item => get(item, field) as number)
              break
            case '$avg':
              obj[resultField] = round(
                meanBy(items, item => get(item, field) as number),
                1
              )
              break
            case '$max': {
              const maxItem = maxBy(items, item => get(item, field))
              obj[resultField] = maxItem ? get(maxItem, field) : undefined
              break
            }
            case '$min': {
              const minItem = minBy(items, item => get(item, field))
              obj[resultField] = minItem ? get(minItem, field) : undefined
              break
            }
            case '$exist':
              obj[resultField] = some(items, item => get(item, field)) ? 1 : 0
              break
            case '$trend':
              obj[resultField] = calculateTrendSlope(
                items.map(item => get(item, field) as number),
                items.map((_item, index) => index + 1)
              )
              break
            case '$countUniq':
              obj[resultField] = uniq(items.map(item => get(item, field))).length
              break
          }
        })
      }
      return obj
    })
  } else {
    const results: Record<string, unknown> = {}
    for (const operation in operations) {
      const fields = operations[operation]
      fields.forEach(field => {
        const resultField = appendOperationToField ? field + operation : field
        switch (operation) {
          case '$count':
            results[resultField] = inData.length
            break
          case '$sum':
            results[resultField] = sumBy(inData, field)
            break
          case '$avg':
            results[resultField] = round(meanBy(inData, field) as number, 1)
            break
          case '$max':
            if (Array.isArray(inData)) {
              const maxItem = maxBy(inData, field)
              results[resultField] = maxItem ? maxItem[field as keyof T] : undefined
            }
            break
          case '$min':
            if (Array.isArray(inData)) {
              const minItem = minBy(inData, field)
              results[resultField] = minItem ? minItem[field as keyof T] : undefined
            }
            break
          case '$exist':
            results[resultField] = some(inData, { [field]: true }) ? 1 : 0
            break
          case '$trend':
            results[resultField] = calculateTrendSlope(
              inData.map(item => get(item, field) as number),
              inData.map((_item, index) => index + 1)
            )
            break
          case '$countUniq':
            results[resultField] = uniq(inData.map(item => get(item, field))).length
            break
        }
      })
    }
    data = results
  }
  return data
}

/**
 * Calculates the slope of a linear trend line using least squares regression
 *
 * Computes the "rise over run" coefficient that best fits the data points.
 * Uses the least squares method to find the line y = mx + b, returning only m (slope).
 *
 * Slope interpretation:
 * - **Positive slope**: Y increases as X increases (upward trend)
 * - **Negative slope**: Y decreases as X increases (downward trend)
 * - **Zero slope**: No trend, flat line
 * - **Magnitude**: How steep the trend is (larger = steeper)
 *
 * Algorithm (Least Squares):
 * 1. Calculate Σx, Σy, Σx², Σxy
 * 2. Compute slope: m = (n·Σxy - Σx·Σy) / (n·Σx² - (Σx)²)
 * 3. Handle division by zero (constant x values)
 * 4. Round to 1 decimal place
 *
 * @param y - Dependent variable values (response variable)
 * @param x - Independent variable values (predictor variable)
 * @returns Slope value rounded to 1 decimal (0 if denominator is zero)
 *
 * @example
 * ```typescript
 * // Basic trend slope calculation
 * const sales = [100, 120, 140, 160, 180]
 * const months = [1, 2, 3, 4, 5]
 * calculateTrendSlope(sales, months)  // 20.0 (sales increase 20 units/month)
 *
 * const declining = [100, 90, 80, 70, 60]
 * calculateTrendSlope(declining, months)  // -10.0 (decreasing 10 units/month)
 *
 * const flat = [100, 100, 100, 100, 100]
 * calculateTrendSlope(flat, months)  // 0.0 (no trend)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Sales forecasting and trend analysis
 * interface MonthlySales {
 *   month: number
 *   revenue: number
 * }
 *
 * function analyzeSalesTrend(data: MonthlySales[]): void {
 *   const months = data.map(d => d.month)
 *   const revenue = data.map(d => d.revenue)
 *   const slope = calculateTrendSlope(revenue, months)
 *
 *   console.log(`📈 Sales Trend Analysis:`)
 *   console.log(`  Slope: ${slope} per month`)
 *
 *   if (slope > 0) {
 *     const annualGrowth = slope * 12
 *     console.log(`✅ Growing trend: $${annualGrowth.toLocaleString()}/year projected`)
 *   } else if (slope < 0) {
 *     console.log(`⚠️ Declining trend: ${slope} per month`)
 *     console.log(`Action: Investigate causes and intervene`)
 *   } else {
 *     console.log(`➡️ Flat trend: No significant growth or decline`)
 *   }
 * }
 *
 * const salesData = [
 *   { month: 1, revenue: 50000 },
 *   { month: 2, revenue: 52000 },
 *   { month: 3, revenue: 54000 },
 *   { month: 4, revenue: 56000 }
 * ]
 * analyzeSalesTrend(salesData)
 * // Slope: 2000 per month
 * // ✅ Growing: $24,000/year projected
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: User engagement trending
 * function trackUserEngagement(dailyActiveUsers: number[]): string {
 *   const days = Array.from({ length: dailyActiveUsers.length }, (_, i) => i + 1)
 *   const slope = calculateTrendSlope(dailyActiveUsers, days)
 *
 *   const avgUsers = dailyActiveUsers.reduce((a, b) => a + b) / dailyActiveUsers.length
 *   const changePercent = ((slope * 30) / avgUsers) * 100
 *
 *   if (changePercent > 5) {
 *     return `🚀 Strong growth: ${changePercent.toFixed(1)}% monthly increase`
 *   } else if (changePercent < -5) {
 *     return `📉 Declining: ${changePercent.toFixed(1)}% monthly decrease (ALERT!)`
 *   } else {
 *     return `➡️ Stable: ${changePercent.toFixed(1)}% monthly change`
 *   }
 * }
 *
 * const dau = [1000, 1020, 1050, 1080, 1100, 1120, 1150]
 * trackUserEngagement(dau)
 * // "🚀 Strong growth: 12.8% monthly increase"
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Server response time degradation detection
 * function monitorPerformanceDegradation(
 *   responseTimes: number[],
 *   timestamps: number[]
 * ): void {
 *   const slope = calculateTrendSlope(responseTimes, timestamps)
 *
 *   console.log(`⏱️ Performance Trend: ${slope}ms per time unit`)
 *
 *   if (slope > 5) {
 *     console.log('🚨 ALERT: Response times degrading')
 *     console.log(`Degradation rate: ${slope}ms per unit`)
 *     console.log('Action: Investigate server load, memory leaks, database queries')
 *   } else if (slope < -5) {
 *     console.log('✅ Performance improving')
 *   } else {
 *     console.log('➡️ Performance stable')
 *   }
 * }
 *
 * const times = [120, 125, 135, 150, 170, 200]
 * const hours = [1, 2, 3, 4, 5, 6]
 * monitorPerformanceDegradation(times, hours)
 * // 🚨 ALERT: Response times degrading (16ms/hour)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Stock price momentum indicator
 * function calculatePriceMomentum(prices: number[], days: number[]): string {
 *   const slope = calculateTrendSlope(prices, days)
 *   const avgPrice = prices.reduce((a, b) => a + b) / prices.length
 *   const momentum = (slope / avgPrice) * 100
 *
 *   if (momentum > 1) {
 *     return `🟢 BULLISH (${momentum.toFixed(2)}% daily momentum)`
 *   } else if (momentum < -1) {
 *     return `🔴 BEARISH (${momentum.toFixed(2)}% daily momentum)`
 *   } else {
 *     return `🟡 NEUTRAL (${momentum.toFixed(2)}% daily momentum)`
 *   }
 * }
 *
 * const stockPrices = [100, 102, 105, 108, 112, 115]
 * const tradingDays = [1, 2, 3, 4, 5, 6]
 * calculatePriceMomentum(stockPrices, tradingDays)
 * // "🟢 BULLISH (2.86% daily momentum)"
 * ```
 *
 * @example
 * ```typescript
 * // Edge cases
 * calculateTrendSlope([1, 2, 3], [1, 2, 3])      // 1.0 (perfect positive correlation)
 * calculateTrendSlope([3, 2, 1], [1, 2, 3])      // -1.0 (perfect negative)
 * calculateTrendSlope([5, 5, 5], [1, 2, 3])      // 0.0 (flat line)
 * calculateTrendSlope([1, 2, 3], [1, 1, 1])      // 0.0 (constant X, div by zero)
 * calculateTrendSlope([10, 20], [1, 2])          // 10.0 (two points)
 * ```
 *
 * @see {@link calculateCorrelation} for correlation strength (not just slope)
 * @see {@link calculateAverage} for mean calculation
 */
export function calculateTrendSlope(y: number[], x: number[]): number {
  const n = size(y)
  const sum_x = sum(x)
  const sum_y = sum(y)
  const sum_x2 = sum(map(x, val => val * val))
  const sum_xy = sum(map(x, (val, i) => val * y[i]))

  const denominator = n * sum_x2 - sum_x * sum_x
  if (denominator === 0) {
    return 0
  }

  const slope = (n * sum_xy - sum_x * sum_y) / denominator
  return roundToDecimals(slope, 1)
}

// =============================================================================
// ADVANCED STATISTICAL FUNCTIONS
// =============================================================================

/**
 * Calculates the median of an array of numbers
 *
 * The median is the middle value in a sorted dataset. More robust than mean for
 * skewed distributions or datasets with outliers. For even-length arrays, returns
 * the average of the two middle values.
 *
 * Algorithm:
 * 1. Sort array in ascending order
 * 2. If odd length: return middle value
 * 3. If even length: return average of two middle values
 * 4. Empty array returns 0
 *
 * Use cases: Income analysis, response times, test scores, real estate prices
 *
 * @param values - Array of numbers to calculate median from (empty array returns 0)
 * @returns Median value, or 0 if array is empty
 *
 * @example
 * ```typescript
 * // Odd number of values
 * calculateMedian([1, 2, 3, 4, 5])          // 3 (middle value)
 * calculateMedian([10, 5, 15])              // 10 (after sorting: [5, 10, 15])
 *
 * // Even number of values
 * calculateMedian([1, 2, 3, 4])             // 2.5 (average of 2 and 3)
 * calculateMedian([10, 20, 30, 40])         // 25 (average of 20 and 30)
 *
 * // Edge cases
 * calculateMedian([])                       // 0
 * calculateMedian([42])                     // 42
 * calculateMedian([5, 5, 5])                // 5
 *
 * // Handles negative numbers
 * calculateMedian([-10, -5, 0, 5, 10])      // 0
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Analyze salary data (median better than mean for skewed data)
 * const salaries = [30000, 35000, 40000, 45000, 50000, 250000]
 *
 * const mean = salaries.reduce((a, b) => a + b) / salaries.length
 * const median = calculateMedian(salaries)
 *
 * console.log(`Mean: $${mean}`)     // $75,000 (skewed by outlier)
 * console.log(`Median: $${median}`) // $42,500 (more representative)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Website response time analysis
 * const responseTimes = [120, 150, 180, 200, 220, 5000] // milliseconds
 *
 * const medianResponseTime = calculateMedian(responseTimes)
 * console.log(`Median response: ${medianResponseTime}ms`) // 190ms
 * // More useful than mean (946ms) which is skewed by one slow request
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Grade distribution analysis
 * const grades = [65, 70, 75, 80, 85, 90, 95]
 *
 * const median = calculateMedian(grades)
 * const Q1 = calculatePercentile(grades, 25)
 * const Q3 = calculatePercentile(grades, 75)
 *
 * console.log(`Median grade: ${median}`)     // 80
 * console.log(`25th percentile: ${Q1}`)      // 70
 * console.log(`75th percentile: ${Q3}`)      // 90
 * ```
 *
 * @see {@link calculateAverage} for arithmetic mean calculation
 * @see {@link calculatePercentile} for other percentiles (median is 50th percentile)
 * @see {@link calculateQuartiles} for Q1, Q2 (median), Q3
 * @see {@link calculateMode} for most frequent value
 */
export const calculateMedian = (values: number[]): number => {
  if (!values.length) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

/**
 * Calculates the mode (most frequent value) in an array of numbers
 *
 * The mode is the value that appears most frequently in a dataset. Returns null
 * if the array is empty or if there are multiple modes (multimodal distribution).
 *
 * Algorithm:
 * 1. Count frequency of each value using hash map
 * 2. Track maximum frequency and corresponding value
 * 3. Detect multimodal distributions (multiple values with same max frequency)
 * 4. Return single mode or null if multimodal/empty
 *
 * Behavior:
 * - Empty array → null
 * - Single mode → returns that value
 * - Multiple modes (tie) → null
 * - All unique values → null (no mode)
 *
 * @param values - Array of numbers to analyze
 * @returns The mode (most frequent value) or null if multimodal/empty
 *
 * @example
 * ```typescript
 * // Basic mode calculation
 * calculateMode([1, 2, 2, 3, 3, 3, 4])  // 3 (appears 3 times)
 * calculateMode([5, 5, 5, 1, 2, 3])     // 5 (most frequent)
 * calculateMode([10, 20, 30])           // null (all unique, no mode)
 * calculateMode([1, 1, 2, 2, 3])        // null (multimodal: 1 and 2 tie)
 * calculateMode([])                     // null (empty array)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Find most common response time in API logs
 * const responseTimes = [
 *   150, 200, 150, 300, 150,  // 150ms appears most
 *   200, 400, 150, 200, 150
 * ]
 * const commonResponseTime = calculateMode(responseTimes)
 * // 150 (appears 5 times)
 *
 * if (commonResponseTime !== null) {
 *   console.log(`Most common response time: ${commonResponseTime}ms`)
 *   console.log('💡 Optimize for this latency profile')
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Detect most frequent error code in logs
 * function analyzeErrorCodes(errorLogs: { code: number }[]): void {
 *   const codes = errorLogs.map(log => log.code)
 *   const mostFrequentCode = calculateMode(codes)
 *
 *   if (mostFrequentCode !== null) {
 *     console.log(`🚨 Most frequent error: ${mostFrequentCode}`)
 *     console.log('Priority fix needed for this error type')
 *   } else {
 *     console.log('✅ No dominant error pattern (good distribution)')
 *   }
 * }
 *
 * // Example usage
 * const errors = [
 *   { code: 404 }, { code: 500 }, { code: 404 },
 *   { code: 404 }, { code: 503 }, { code: 404 }
 * ]
 * analyzeErrorCodes(errors)
 * // 🚨 Most frequent error: 404
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Find most popular product rating
 * interface ProductReview {
 *   productId: string
 *   rating: number  // 1-5 stars
 *   userId: string
 * }
 *
 * function getMostCommonRating(reviews: ProductReview[]): string {
 *   const ratings = reviews.map(r => r.rating)
 *   const mode = calculateMode(ratings)
 *
 *   if (mode === null) {
 *     return 'Ratings are evenly distributed'
 *   }
 *
 *   const sentiment = mode >= 4 ? '😊 Positive' : mode <= 2 ? '😞 Negative' : '😐 Neutral'
 *   return `Most common rating: ${mode}⭐ (${sentiment})`
 * }
 *
 * const reviews = [
 *   { productId: 'A1', rating: 5, userId: 'U1' },
 *   { productId: 'A1', rating: 5, userId: 'U2' },
 *   { productId: 'A1', rating: 4, userId: 'U3' },
 *   { productId: 'A1', rating: 5, userId: 'U4' }
 * ]
 *
 * getMostCommonRating(reviews)
 * // "Most common rating: 5⭐ (😊 Positive)"
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Detect most frequent user action in analytics
 * const userActions = [
 *   'click', 'scroll', 'click', 'click',
 *   'scroll', 'click', 'submit', 'click'
 * ].map(action => {
 *   const actionMap = { click: 1, scroll: 2, submit: 3 }
 *   return actionMap[action as keyof typeof actionMap]
 * })
 *
 * const dominantAction = calculateMode(userActions)
 * const actionNames = { 1: 'click', 2: 'scroll', 3: 'submit' }
 *
 * if (dominantAction !== null) {
 *   console.log(`Most frequent action: ${actionNames[dominantAction as keyof typeof actionNames]}`)
 *   // "Most frequent action: click"
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Edge cases
 * calculateMode([42])                   // 42 (single value)
 * calculateMode([1, 1])                 // 1 (all same)
 * calculateMode([1, 2, 3, 4, 5])        // null (all unique)
 * calculateMode([1, 1, 2, 2])           // null (bimodal)
 * calculateMode([1, 1, 1, 2, 2, 2])     // null (bimodal tie)
 * calculateMode([NaN, NaN, 1])          // NaN (NaN counted as value)
 * calculateMode([Infinity, Infinity])   // Infinity
 * ```
 *
 * @see {@link calculateMedian} for middle value (resistant to outliers)
 * @see {@link calculateAverage} for mean value
 * @see {@link calculateStandardDeviation} for data spread measurement
 */
export const calculateMode = (values: number[]): number | null => {
  if (!values.length) return null

  const frequency: { [key: number]: number } = {}
  let maxFreq = 0
  let mode: number | null = null
  let hasMultipleModes = false

  for (const value of values) {
    frequency[value] = (frequency[value] || 0) + 1

    if (frequency[value] > maxFreq) {
      maxFreq = frequency[value]
      mode = value
      hasMultipleModes = false
    } else if (frequency[value] === maxFreq && value !== mode) {
      hasMultipleModes = true
    }
  }

  return hasMultipleModes ? null : mode
}

/**
 * Calculates the standard deviation of an array of numbers
 *
 * Measures the amount of variation or dispersion in a dataset. Low standard deviation
 * means values are close to the mean; high standard deviation means values are spread out.
 *
 * Algorithm:
 * 1. Calculate mean (average)
 * 2. Calculate squared differences from mean
 * 3. Calculate variance (average of squared differences)
 * 4. Return square root of variance
 *
 * Formula:
 * - Population: σ = √(Σ(x - μ)² / N)
 * - Sample: s = √(Σ(x - x̄)² / (N - 1))
 *
 * @param values - Array of numbers (empty array returns 0)
 * @param sample - If true, uses sample standard deviation (N-1). If false, uses population (N). Default: false
 * @returns Standard deviation, or 0 if array is empty
 *
 * @example
 * ```typescript
 * // Low standard deviation (values close together)
 * calculateStandardDeviation([10, 11, 12, 13, 14])
 * // ~1.41 (values tightly clustered)
 *
 * // High standard deviation (values spread out)
 * calculateStandardDeviation([1, 5, 20, 50, 100])
 * // ~35.96 (values widely dispersed)
 *
 * // Population vs Sample
 * const data = [2, 4, 6, 8, 10]
 * calculateStandardDeviation(data, false)  // 2.83 (population)
 * calculateStandardDeviation(data, true)   // 3.16 (sample, Bessel's correction)
 *
 * // Edge cases
 * calculateStandardDeviation([])           // 0
 * calculateStandardDeviation([5])          // 0
 * calculateStandardDeviation([5, 5, 5])    // 0 (no variation)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Quality control - manufacturing consistency
 * const widgetWeights = [98.5, 99.2, 100.1, 99.8, 100.3, 98.9]
 * const targetWeight = 100
 *
 * const mean = widgetWeights.reduce((a, b) => a + b) / widgetWeights.length
 * const stdDev = calculateStandardDeviation(widgetWeights, true)
 *
 * console.log(`Mean weight: ${mean.toFixed(2)}g`)
 * console.log(`Std deviation: ${stdDev.toFixed(2)}g`)
 * // Low std dev = consistent manufacturing
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Investment volatility analysis
 * const monthlyReturns = [2.3, -1.5, 4.2, 0.8, -2.1, 3.5, 1.2] // %
 *
 * const avgReturn = monthlyReturns.reduce((a, b) => a + b) / monthlyReturns.length
 * const volatility = calculateStandardDeviation(monthlyReturns, true)
 *
 * console.log(`Average return: ${avgReturn.toFixed(2)}%`)
 * console.log(`Volatility (std dev): ${volatility.toFixed(2)}%`)
 * // High volatility = riskier investment
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Student performance analysis
 * const testScores = [75, 82, 68, 90, 78, 85, 72, 88, 80, 77]
 *
 * const mean = testScores.reduce((a, b) => a + b) / testScores.length
 * const stdDev = calculateStandardDeviation(testScores, true)
 *
 * // Identify outliers (beyond 2 standard deviations)
 * const outliers = testScores.filter(score =>
 *   Math.abs(score - mean) > 2 * stdDev
 * )
 *
 * console.log(`Mean: ${mean.toFixed(1)}`)
 * console.log(`Std Dev: ${stdDev.toFixed(1)}`)
 * console.log(`Outliers:`, outliers)
 * ```
 *
 * @see {@link calculateVariance} for variance (σ²)
 * @see {@link detectOutliers} for IQR-based outlier detection
 * @see {@link calculateMedian} for central tendency (robust to outliers)
 */
export const calculateStandardDeviation = (values: number[], sample = false): number => {
  if (!values.length) return 0

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
  const variance =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / (sample ? values.length - 1 : values.length)

  return Math.sqrt(variance)
}

/**
 * Calculates the variance of an array of numbers
 *
 * Variance measures how spread out numbers are from their mean (average).
 * It's the average of squared differences from the mean. Higher variance = more spread.
 *
 * Algorithm:
 * 1. Calculate mean (average) of all values
 * 2. Compute squared difference from mean for each value: (value - mean)²
 * 3. Sum all squared differences
 * 4. Divide by N (population) or N-1 (sample) depending on `sample` flag
 *
 * Population vs Sample variance:
 * - **Population (sample=false)**: Use when you have ALL data (divide by N)
 * - **Sample (sample=true)**: Use when you have a subset (divide by N-1, Bessel's correction)
 *
 * @param values - Array of numbers to analyze
 * @param sample - If true, uses sample variance (N-1). If false, uses population variance (N). Default: false
 * @returns Variance value (0 if empty array)
 *
 * @example
 * ```typescript
 * // Basic variance calculation
 * calculateVariance([1, 2, 3, 4, 5])           // 2 (population variance)
 * calculateVariance([1, 2, 3, 4, 5], true)     // 2.5 (sample variance)
 * calculateVariance([10, 10, 10, 10])          // 0 (no variance, all same)
 * calculateVariance([1, 100])                  // 2450.5 (high variance)
 * calculateVariance([])                        // 0 (empty array)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Analyze server response time consistency
 * const responseTimes = [120, 150, 130, 145, 125, 140, 135]  // milliseconds
 * const variance = calculateVariance(responseTimes)
 * const stdDev = Math.sqrt(variance)
 *
 * console.log(`Variance: ${variance.toFixed(2)}ms²`)
 * console.log(`Std Dev: ${stdDev.toFixed(2)}ms`)
 *
 * if (stdDev < 20) {
 *   console.log('✅ Consistent performance')
 * } else {
 *   console.log('⚠️ High variability - investigate outliers')
 * }
 * // Variance: 110.20ms²
 * // Std Dev: 10.50ms
 * // ✅ Consistent performance
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Quality control in manufacturing
 * interface Measurement {
 *   batchId: string
 *   weight: number  // grams
 * }
 *
 * function checkBatchQuality(measurements: Measurement[]): boolean {
 *   const weights = measurements.map(m => m.weight)
 *   const variance = calculateVariance(weights)
 *   const maxAcceptableVariance = 5  // Quality threshold
 *
 *   if (variance <= maxAcceptableVariance) {
 *     console.log('✅ Batch passes quality control')
 *     console.log(`Variance: ${variance.toFixed(2)}g² (within tolerance)`)
 *     return true
 *   } else {
 *     console.log('❌ Batch REJECTED - excessive variance')
 *     console.log(`Variance: ${variance.toFixed(2)}g² (exceeds ${maxAcceptableVariance}g²)`)
 *     return false
 *   }
 * }
 *
 * const batch = [
 *   { batchId: 'B001', weight: 100.2 },
 *   { batchId: 'B001', weight: 100.5 },
 *   { batchId: 'B001', weight: 99.8 },
 *   { batchId: 'B001', weight: 100.1 }
 * ]
 *
 * checkBatchQuality(batch)
 * // ✅ Batch passes quality control
 * // Variance: 0.09g² (within tolerance)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Stock price volatility analysis
 * function analyzeStockVolatility(prices: number[]): string {
 *   const variance = calculateVariance(prices, true)  // Sample variance
 *   const stdDev = Math.sqrt(variance)
 *   const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length
 *   const coefficientOfVariation = (stdDev / mean) * 100
 *
 *   if (coefficientOfVariation < 5) {
 *     return `Low volatility (${coefficientOfVariation.toFixed(1)}% CV) - Stable stock`
 *   } else if (coefficientOfVariation < 15) {
 *     return `Moderate volatility (${coefficientOfVariation.toFixed(1)}% CV) - Normal fluctuation`
 *   } else {
 *     return `High volatility (${coefficientOfVariation.toFixed(1)}% CV) - Risky investment`
 *   }
 * }
 *
 * const stockPrices = [100, 102, 98, 101, 99, 103, 97]  // Daily closing prices
 * analyzeStockVolatility(stockPrices)
 * // "Moderate volatility (2.1% CV) - Normal fluctuation"
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: A/B test result significance
 * function compareVariability(groupA: number[], groupB: number[]): void {
 *   const varA = calculateVariance(groupA, true)
 *   const varB = calculateVariance(groupB, true)
 *   const ratio = varA / varB
 *
 *   console.log(`Group A variance: ${varA.toFixed(2)}`)
 *   console.log(`Group B variance: ${varB.toFixed(2)}`)
 *   console.log(`Variance ratio: ${ratio.toFixed(2)}`)
 *
 *   if (ratio > 2 || ratio < 0.5) {
 *     console.log('⚠️ Groups have significantly different variability')
 *     console.log('Consider using Welch\'s t-test instead of Student\'s t-test')
 *   } else {
 *     console.log('✅ Groups have similar variability')
 *   }
 * }
 *
 * const conversionRatesA = [0.12, 0.15, 0.13, 0.14, 0.12]
 * const conversionRatesB = [0.18, 0.22, 0.19, 0.21, 0.20]
 *
 * compareVariability(conversionRatesA, conversionRatesB)
 * // Group A variance: 0.00013
 * // Group B variance: 0.00025
 * // Variance ratio: 0.52
 * // ✅ Groups have similar variability
 * ```
 *
 * @example
 * ```typescript
 * // Edge cases
 * calculateVariance([5])                       // 0 (single value)
 * calculateVariance([5], true)                 // NaN (sample size 1, division by 0)
 * calculateVariance([1, 1, 1])                 // 0 (no variation)
 * calculateVariance([0, 0, 0])                 // 0 (all zeros)
 * calculateVariance([-5, 0, 5])                // 16.67 (symmetric around 0)
 * calculateVariance([1e10, 1e10 + 1])          // 0.25 (large numbers)
 * ```
 *
 * @see {@link calculateStandardDeviation} for square root of variance (same units as data)
 * @see {@link calculateIQR} for robust spread measure (resistant to outliers)
 * @see {@link detectOutliers} for finding extreme values
 */
export const calculateVariance = (values: number[], sample = false): number => {
  if (!values.length) return 0

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2))

  return (
    squaredDiffs.reduce((sum, val) => sum + val, 0) / (sample ? values.length - 1 : values.length)
  )
}

/**
 * Calculates a specific percentile from an array of numbers
 *
 * Percentiles indicate the value below which a given percentage of observations fall.
 * For example, the 75th percentile is the value below which 75% of the data lies.
 *
 * Algorithm:
 * 1. Sort values in ascending order
 * 2. Calculate position: (percentile / 100) × (n - 1)
 * 3. If position is integer, return value at that index
 * 4. Otherwise, interpolate between lower and upper values using linear interpolation
 *
 * Common percentiles:
 * - 25th (Q1): First quartile
 * - 50th (Q2): Median
 * - 75th (Q3): Third quartile
 * - 90th: Top 10% threshold
 * - 95th: Top 5% threshold
 * - 99th: Top 1% threshold
 *
 * @param values - Array of numbers to analyze
 * @param percentile - Percentile to calculate (0-100)
 * @returns Value at the specified percentile (0 if empty array)
 * @throws {Error} If percentile is not between 0 and 100
 *
 * @example
 * ```typescript
 * // Basic percentile calculation
 * const scores = [55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
 *
 * calculatePercentile(scores, 25)   // 66.25 (Q1 - 25% below this)
 * calculatePercentile(scores, 50)   // 77.5 (Median - 50% below this)
 * calculatePercentile(scores, 75)   // 88.75 (Q3 - 75% below this)
 * calculatePercentile(scores, 90)   // 95.5 (90% below this)
 * calculatePercentile(scores, 100)  // 100 (Maximum)
 * calculatePercentile(scores, 0)    // 55 (Minimum)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: API response time SLA monitoring
 * const responseTimes = [
 *   120, 150, 180, 200, 250, 300, 350, 400, 450, 500,
 *   600, 700, 800, 1000, 1200
 * ]
 *
 * const p50 = calculatePercentile(responseTimes, 50)  // Median
 * const p95 = calculatePercentile(responseTimes, 95)  // 95th percentile
 * const p99 = calculatePercentile(responseTimes, 99)  // 99th percentile
 *
 * console.log(`📊 Response Time SLA:`)
 * console.log(`  50th (median): ${p50}ms`)
 * console.log(`  95th: ${p95}ms`)
 * console.log(`  99th: ${p99}ms`)
 *
 * if (p95 < 500) {
 *   console.log('✅ SLA met: 95% of requests under 500ms')
 * } else {
 *   console.log(`⚠️ SLA breach: p95=${p95}ms exceeds 500ms target`)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Grade distribution analysis
 * function analyzeExamResults(scores: number[]): void {
 *   const p10 = calculatePercentile(scores, 10)
 *   const p25 = calculatePercentile(scores, 25)
 *   const p50 = calculatePercentile(scores, 50)
 *   const p75 = calculatePercentile(scores, 75)
 *   const p90 = calculatePercentile(scores, 90)
 *
 *   console.log('📈 Exam Score Distribution:')
 *   console.log(`  Bottom 10%: ≤ ${p10.toFixed(1)}`)
 *   console.log(`  Q1 (25th): ${p25.toFixed(1)}`)
 *   console.log(`  Median (50th): ${p50.toFixed(1)}`)
 *   console.log(`  Q3 (75th): ${p75.toFixed(1)}`)
 *   console.log(`  Top 10%: ≥ ${p90.toFixed(1)}`)
 *
 *   // Identify struggling students
 *   if (p25 < 60) {
 *     console.log('⚠️ Warning: 25% of students scored below 60')
 *     console.log('Recommendation: Provide additional support')
 *   }
 * }
 *
 * const examScores = [45, 52, 58, 63, 67, 72, 75, 78, 82, 85, 88, 92, 95]
 * analyzeExamResults(examScores)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Server load capacity planning
 * interface ServerMetrics {
 *   timestamp: Date
 *   cpuUsage: number  // percentage
 * }
 *
 * function determineCapacityThreshold(metrics: ServerMetrics[]): number {
 *   const cpuUsages = metrics.map(m => m.cpuUsage)
 *   const p95 = calculatePercentile(cpuUsages, 95)
 *
 *   console.log(`Current p95 CPU usage: ${p95.toFixed(1)}%`)
 *
 *   if (p95 > 80) {
 *     console.log('🚨 CRITICAL: Scale up immediately')
 *     return 100  // Emergency threshold
 *   } else if (p95 > 60) {
 *     console.log('⚠️ WARNING: Plan scaling in next 24h')
 *     return 80
 *   } else {
 *     console.log('✅ Healthy capacity')
 *     return 70
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Income inequality analysis (Gini coefficient context)
 * const householdIncomes = [
 *   25000, 30000, 35000, 40000, 45000, 50000, 55000,
 *   60000, 70000, 80000, 90000, 120000, 150000, 200000
 * ]
 *
 * const p10 = calculatePercentile(householdIncomes, 10)
 * const p50 = calculatePercentile(householdIncomes, 50)
 * const p90 = calculatePercentile(householdIncomes, 90)
 *
 * const p90p10Ratio = p90 / p10
 *
 * console.log(`Income distribution:`)
 * console.log(`  Bottom 10%: ≤$${p10.toLocaleString()}`)
 * console.log(`  Median: $${p50.toLocaleString()}`)
 * console.log(`  Top 10%: ≥$${p90.toLocaleString()}`)
 * console.log(`  P90/P10 ratio: ${p90p10Ratio.toFixed(2)}x`)
 *
 * if (p90p10Ratio > 5) {
 *   console.log('⚠️ High income inequality detected')
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Edge cases
 * calculatePercentile([10], 50)              // 10 (single value)
 * calculatePercentile([1, 2, 3, 4], 0)       // 1 (minimum)
 * calculatePercentile([1, 2, 3, 4], 100)     // 4 (maximum)
 * calculatePercentile([], 50)                // 0 (empty array)
 * calculatePercentile([5, 5, 5], 75)         // 5 (all same values)
 *
 * // Error cases
 * calculatePercentile([1, 2, 3], -1)         // throws Error
 * calculatePercentile([1, 2, 3], 101)        // throws Error
 * ```
 *
 * @see {@link calculateQuartiles} for Q1, Q2, Q3 in one call
 * @see {@link calculateIQR} for interquartile range (Q3 - Q1)
 * @see {@link calculateMedian} for 50th percentile specifically
 * @see {@link detectOutliers} for finding extreme values using IQR method
 */
export const calculatePercentile = (values: number[], percentile: number): number => {
  if (!values.length) return 0
  if (percentile < 0 || percentile > 100) throw new Error('Percentile must be between 0 and 100')

  const sorted = [...values].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)

  if (Math.floor(index) === index) {
    return sorted[index]
  }

  const lower = sorted[Math.floor(index)]
  const upper = sorted[Math.ceil(index)]
  const weight = index - Math.floor(index)

  return lower * (1 - weight) + upper * weight
}

/**
 * Calculates quartiles (Q1, Q2, Q3) of an array of numbers
 *
 * Quartiles divide a sorted dataset into four equal parts. Returns the three cut points:
 * - **Q1 (25th percentile)**: 25% of data below, 75% above
 * - **Q2 (50th percentile)**: Median - 50% below, 50% above
 * - **Q3 (75th percentile)**: 75% below, 25% above
 *
 * Useful for:
 * - Box plot visualization
 * - Outlier detection (IQR method)
 * - Understanding data spread and skewness
 * - Five-number summary (min, Q1, Q2, Q3, max)
 *
 * @param values - Array of numbers to analyze
 * @returns Object with Q1, Q2 (median), Q3 values
 *
 * @example
 * ```typescript
 * // Basic quartiles
 * const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * calculateQuartiles(data)
 * // { Q1: 3.25, Q2: 5.5, Q3: 7.75 }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Salary distribution analysis
 * const salaries = [
 *   30000, 35000, 40000, 45000, 50000, 55000, 60000,
 *   65000, 70000, 80000, 90000, 120000
 * ]
 *
 * const { Q1, Q2, Q3 } = calculateQuartiles(salaries)
 *
 * console.log(`📊 Salary Distribution:`)
 * console.log(`  Q1 (25th): $${Q1.toLocaleString()}`)
 * console.log(`  Q2 (Median): $${Q2.toLocaleString()}`)
 * console.log(`  Q3 (75th): $${Q3.toLocaleString()}`)
 * console.log(`  IQR: $${(Q3 - Q1).toLocaleString()}`)
 * // Q1: $43,750, Q2: $57,500, Q3: $72,500, IQR: $28,750
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Performance monitoring box plot
 * function createBoxPlot(responseTimes: number[]): void {
 *   const { Q1, Q2, Q3 } = calculateQuartiles(responseTimes)
 *   const min = Math.min(...responseTimes)
 *   const max = Math.max(...responseTimes)
 *   const iqr = Q3 - Q1
 *
 *   console.log('📦 Response Time Box Plot:')
 *   console.log(`  Min: ${min}ms`)
 *   console.log(`  Q1:  ${Q1}ms  ├───┐`)
 *   console.log(`  Q2:  ${Q2}ms  │ █ │  (median)`)
 *   console.log(`  Q3:  ${Q3}ms  └───┤`)
 *   console.log(`  Max: ${max}ms`)
 *   console.log(`  IQR: ${iqr}ms  (middle 50%)`)
 * }
 *
 * const times = [120, 150, 180, 200, 220, 250, 300, 350, 400]
 * createBoxPlot(times)
 * ```
 *
 * @see {@link calculatePercentile} for calculating any percentile
 * @see {@link calculateIQR} for interquartile range (Q3 - Q1)
 * @see {@link detectOutliers} for outlier detection using quartiles
 * @see {@link calculateMedian} for Q2 specifically
 */
export const calculateQuartiles = (values: number[]): { Q1: number; Q2: number; Q3: number } => {
  return {
    Q1: calculatePercentile(values, 25),
    Q2: calculatePercentile(values, 50), // median
    Q3: calculatePercentile(values, 75),
  }
}

/**
 * Calculates the interquartile range (IQR) of an array of numbers
 *
 * IQR is the range of the middle 50% of data, calculated as Q3 - Q1.
 * It's a robust measure of statistical dispersion, resistant to outliers.
 *
 * IQR interpretation:
 * - **Small IQR**: Data tightly clustered around median (low variability)
 * - **Large IQR**: Data widely spread (high variability)
 * - **IQR = 0**: All middle 50% values identical
 *
 * Key uses:
 * - Outlier detection (values outside Q1 - 1.5×IQR to Q3 + 1.5×IQR)
 * - Box plot whiskers calculation
 * - Robust alternative to standard deviation (less affected by extremes)
 *
 * @param values - Array of numbers to analyze
 * @returns Interquartile range (Q3 - Q1)
 *
 * @example
 * ```typescript
 * // Basic IQR calculation
 * const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * calculateIQR(data)  // 4.5 (middle 50% spans 4.5 units)
 *
 * const tightData = [10, 10.5, 11, 11.5, 12]
 * calculateIQR(tightData)  // 1 (low variability)
 *
 * const spreadData = [10, 20, 30, 40, 50, 60, 70, 80, 90]
 * calculateIQR(spreadData)  // 40 (high variability)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Compare consistency between two groups
 * const teamA_responseTimes = [100, 110, 120, 130, 140, 150]
 * const teamB_responseTimes = [80, 120, 130, 140, 180, 250]
 *
 * const iqrA = calculateIQR(teamA_responseTimes)  // 30ms
 * const iqrB = calculateIQR(teamB_responseTimes)  // 60ms
 *
 * console.log(`Team A IQR: ${iqrA}ms (consistent)`)
 * console.log(`Team B IQR: ${iqrB}ms (inconsistent)`)
 *
 * if (iqrB > iqrA * 1.5) {
 *   console.log('⚠️ Team B shows high variability - investigate')
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Quality control tolerance check
 * function checkProductQuality(measurements: number[]): boolean {
 *   const iqr = calculateIQR(measurements)
 *   const maxAllowedIQR = 5  // mm tolerance
 *
 *   console.log(`IQR: ${iqr.toFixed(2)}mm`)
 *
 *   if (iqr <= maxAllowedIQR) {
 *     console.log('✅ Manufacturing process within tolerance')
 *     return true
 *   } else {
 *     console.log(`❌ IQR ${iqr}mm exceeds ${maxAllowedIQR}mm tolerance`)
 *     console.log('Action: Recalibrate machinery')
 *     return false
 *   }
 * }
 *
 * const partLengths = [99.8, 100.0, 100.1, 100.2, 100.3]
 * checkProductQuality(partLengths)
 * ```
 *
 * @see {@link calculateQuartiles} for Q1, Q2, Q3 values
 * @see {@link detectOutliers} for IQR-based outlier detection
 * @see {@link calculateStandardDeviation} for parametric dispersion measure
 */
export const calculateIQR = (values: number[]): number => {
  const quartiles = calculateQuartiles(values)
  return quartiles.Q3 - quartiles.Q1
}

/**
 * Detects outliers using the IQR (Interquartile Range) method
 *
 * Identifies values that fall outside the "normal" range defined by quartiles.
 * Uses Tukey's fences method, commonly used in box plots.
 *
 * Algorithm:
 * 1. Calculate Q1, Q3, and IQR (Q3 - Q1)
 * 2. Compute lower fence: Q1 - (multiplier × IQR)
 * 3. Compute upper fence: Q3 + (multiplier × IQR)
 * 4. Values outside fences are outliers
 *
 * Common multipliers:
 * - **1.5** (default): Standard outliers (Tukey's rule)
 * - **3.0**: Extreme outliers only (more conservative)
 *
 * @param values - Array of numbers to analyze
 * @param multiplier - IQR multiplier for fence calculation (default: 1.5)
 * @returns Array of outlier values
 *
 * @example
 * ```typescript
 * // Basic outlier detection
 * const data = [10, 12, 14, 15, 16, 18, 20, 22, 100]
 * detectOutliers(data)  // [100] (extreme high value)
 *
 * const normal = [10, 12, 14, 15, 16, 18, 20, 22, 24]
 * detectOutliers(normal)  // [] (no outliers)
 *
 * const withExtremes = [1, 10, 12, 14, 15, 16, 18, 20, 100]
 * detectOutliers(withExtremes)  // [1, 100] (both low and high outliers)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Detect anomalous response times
 * function analyzeResponseTimes(times: number[]): void {
 *   const outliers = detectOutliers(times)
 *
 *   if (outliers.length === 0) {
 *     console.log('✅ No anomalous response times detected')
 *     return
 *   }
 *
 *   const { Q1, Q3 } = calculateQuartiles(times)
 *   const iqr = Q3 - Q1
 *
 *   console.log(`⚠️ Found ${outliers.length} outliers:`)
 *   outliers.forEach(outlier => {
 *     const severity = outlier > Q3 + 3 * iqr ? 'EXTREME' : 'MODERATE'
 *     console.log(`  - ${outlier}ms (${severity})`)
 *   })
 *
 *   console.log('Recommendation: Investigate these requests')
 * }
 *
 * const apiTimes = [100, 120, 130, 140, 150, 160, 180, 200, 5000]
 * analyzeResponseTimes(apiTimes)
 * // ⚠️ Found 1 outliers:
 * //   - 5000ms (EXTREME)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Fraud detection in transaction amounts
 * interface Transaction {
 *   id: string
 *   amount: number
 *   userId: string
 * }
 *
 * function detectSuspiciousTransactions(
 *   transactions: Transaction[]
 * ): Transaction[] {
 *   const amounts = transactions.map(t => t.amount)
 *   const outlierAmounts = detectOutliers(amounts, 3)  // More conservative
 *
 *   const suspicious = transactions.filter(t =>
 *     outlierAmounts.includes(t.amount)
 *   )
 *
 *   if (suspicious.length > 0) {
 *     console.log(`🚨 ${suspicious.length} suspicious transactions:`)
 *     suspicious.forEach(t => {
 *       console.log(`  ID: ${t.id}, Amount: $${t.amount}, User: ${t.userId}`)
 *     })
 *     console.log('Action: Flag for manual review')
 *   }
 *
 *   return suspicious
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Sensor data cleaning
 * function cleanSensorReadings(readings: number[]): number[] {
 *   const outliers = detectOutliers(readings)
 *   const cleaned = readings.filter(r => !outliers.includes(r))
 *
 *   console.log(`Original readings: ${readings.length}`)
 *   console.log(`Outliers removed: ${outliers.length}`)
 *   console.log(`Cleaned readings: ${cleaned.length}`)
 *
 *   if (outliers.length > readings.length * 0.1) {
 *     console.log('⚠️ Warning: >10% outliers - sensor malfunction?')
 *   }
 *
 *   return cleaned
 * }
 *
 * const tempReadings = [20.1, 20.5, 20.8, 21.0, 85.0, 20.9, 21.2]
 * const clean = cleanSensorReadings(tempReadings)
 * // Original: 7, Outliers: 1 (85.0°C), Cleaned: 6
 * ```
 *
 * @example
 * ```typescript
 * // Comparing multipliers
 * const data = [1, 5, 10, 12, 14, 15, 16, 18, 20, 25, 100]
 *
 * detectOutliers(data, 1.5)  // [1, 100] (standard)
 * detectOutliers(data, 3.0)  // [100] (extreme only)
 * ```
 *
 * @see {@link calculateIQR} for IQR calculation
 * @see {@link calculateQuartiles} for quartile values
 * @see {@link calculateStandardDeviation} for parametric outlier detection (z-score method)
 */
export const detectOutliers = (values: number[], multiplier = 1.5): number[] => {
  const quartiles = calculateQuartiles(values)
  const iqr = quartiles.Q3 - quartiles.Q1
  const lowerBound = quartiles.Q1 - multiplier * iqr
  const upperBound = quartiles.Q3 + multiplier * iqr

  return values.filter(value => value < lowerBound || value > upperBound)
}

/**
 * Calculates Pearson correlation coefficient between two arrays of numbers
 *
 * Measures linear correlation between two variables. Returns value between -1 and +1:
 * - +1: Perfect positive correlation (as X increases, Y increases proportionally)
 * - 0: No linear correlation
 * - -1: Perfect negative correlation (as X increases, Y decreases proportionally)
 *
 * Formula (Pearson's r):
 * r = [n∑(xy) - ∑x∑y] / √{[n∑x² - (∑x)²][n∑y² - (∑y)²]}
 *
 * Use cases: A/B testing, feature selection, risk analysis, data validation
 *
 * ⚠️ NOTE: Measures LINEAR correlation only. May miss non-linear relationships.
 *
 * @param x - First array of numbers (must match length of y)
 * @param y - Second array of numbers (must match length of x)
 * @returns Correlation coefficient (-1 to +1), or 0 if arrays empty/mismatched/no variance
 *
 * @example
 * ```typescript
 * // Perfect positive correlation
 * calculateCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])
 * // 1.0 (perfect linear relationship: y = 2x)
 *
 * // Perfect negative correlation
 * calculateCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2])
 * // -1.0 (perfect inverse relationship)
 *
 * // No correlation
 * calculateCorrelation([1, 2, 3, 4, 5], [5, 3, 5, 3, 5])
 * // ~0 (no linear relationship)
 *
 * // Moderate positive correlation
 * calculateCorrelation([1, 2, 3, 4, 5], [2, 3, 5, 7, 9])
 * // ~0.98 (strong positive correlation)
 *
 * // Edge cases
 * calculateCorrelation([], [])              // 0
 * calculateCorrelation([1, 2], [1])         // 0 (length mismatch)
 * calculateCorrelation([5, 5, 5], [1, 2, 3]) // 0 (no variance in x)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Analyze relationship between ad spend and sales
 * const adSpend = [1000, 1500, 2000, 2500, 3000, 3500]      // $ thousands
 * const sales = [20, 28, 35, 42, 48, 55]                     // $ thousands
 *
 * const correlation = calculateCorrelation(adSpend, sales)
 * console.log(`Correlation: ${correlation.toFixed(3)}`)
 * // 0.998 (strong positive correlation - more ad spend → more sales)
 *
 * if (correlation > 0.7) {
 *   console.log('✅ Strong relationship: Ad spend drives sales')
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Website traffic vs conversion rate analysis
 * const dailyVisitors = [1200, 1500, 1800, 2000, 2200, 2500]
 * const conversionRate = [3.2, 3.0, 2.9, 2.7, 2.6, 2.4]
 *
 * const correlation = calculateCorrelation(dailyVisitors, conversionRate)
 * console.log(`Correlation: ${correlation.toFixed(3)}`)
 * // -0.995 (strong negative correlation - more traffic → lower conversion %)
 * // Suggests traffic quality decreasing or server overload
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Feature selection for ML model
 * interface DataPoint {
 *   temperature: number
 *   humidity: number
 *   windSpeed: number
 *   rainfall: number
 * }
 *
 * const weatherData: DataPoint[] = [
 *   { temperature: 25, humidity: 60, windSpeed: 10, rainfall: 0 },
 *   { temperature: 30, humidity: 50, windSpeed: 15, rainfall: 2 },
 *   { temperature: 20, humidity: 80, windSpeed: 5, rainfall: 10 },
 *   // ... more data
 * ]
 *
 * // Find which features correlate with rainfall
 * const temp = weatherData.map(d => d.temperature)
 * const humidity = weatherData.map(d => d.humidity)
 * const wind = weatherData.map(d => d.windSpeed)
 * const rain = weatherData.map(d => d.rainfall)
 *
 * const correlations = {
 *   temperature: calculateCorrelation(temp, rain),
 *   humidity: calculateCorrelation(humidity, rain),
 *   windSpeed: calculateCorrelation(wind, rain)
 * }
 *
 * console.log('Rainfall correlations:', correlations)
 * // { temperature: -0.45, humidity: 0.82, windSpeed: -0.23 }
 * // Humidity strongly predicts rainfall
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Portfolio diversification analysis
 * const stock1Returns = [2.3, -1.5, 4.2, 0.8, -2.1, 3.5]
 * const stock2Returns = [1.8, 2.1, -0.5, 1.2, 3.4, -1.8]
 *
 * const correlation = calculateCorrelation(stock1Returns, stock2Returns)
 * console.log(`Portfolio correlation: ${correlation.toFixed(3)}`)
 *
 * if (Math.abs(correlation) < 0.3) {
 *   console.log('✅ Good diversification: Stocks move independently')
 * } else if (correlation > 0.7) {
 *   console.log('⚠️ High correlation: Portfolio not diversified')
 * }
 * ```
 *
 * @see {@link calculateStandardDeviation} for measuring spread
 * @see {@link calculateTrendSlope} for linear regression slope
 * @see {@link https://en.wikipedia.org/wiki/Pearson_correlation_coefficient Pearson Correlation}
 */
export const calculateCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length === 0) return 0

  const n = x.length
  const sumX = sum(x)
  const sumY = sum(y)
  const sumXY = sum(map(x, (val, i) => val * y[i]))
  const sumX2 = sum(map(x, val => val * val))
  const sumY2 = sum(map(y, val => val * val))

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) return 0

  return numerator / denominator
}

// =============================================================================
// FINANCIAL FUNCTIONS
// =============================================================================

/**
 * Calculates Net Present Value (NPV) of cash flows using discounted cash flow method
 *
 * Evaluates investment profitability by discounting future cash flows to present value.
 * Formula: NPV = CF₀ + CF₁/(1+r) + CF₂/(1+r)² + ... + CFₙ/(1+r)ⁿ
 *
 * Decision rules:
 * - NPV > 0: Investment profitable, accept project
 * - NPV = 0: Break-even, neutral decision
 * - NPV < 0: Investment unprofitable, reject project
 *
 * @param cashFlows - Array of cash flows [initial investment (negative), period 1, period 2, ...]
 * @param discountRate - Discount rate as decimal (e.g., 0.1 for 10% WACC/hurdle rate)
 * @returns Net Present Value in currency units
 *
 * @example
 * ```typescript
 * // Investment: -10000€ initial, then +3000€/year for 4 years
 * const npv = calculateNPV([-10000, 3000, 3000, 3000, 3000], 0.10)
 * console.log(npv)  // 1509.67€ (profitable investment)
 *
 * // Real-world: Software project ROI analysis
 * const projectCashFlows = [
 *   -50000,  // Year 0: Development cost
 *   15000,   // Year 1: Revenue
 *   20000,   // Year 2: Revenue
 *   25000,   // Year 3: Revenue
 *   30000    // Year 4: Revenue
 * ]
 * const wacc = 0.12  // 12% weighted average cost of capital
 * const projectNPV = calculateNPV(projectCashFlows, wacc)
 * if (projectNPV > 0) {
 *   console.log(`✅ Project approved. NPV: ${projectNPV.toFixed(2)}€`)
 * }
 * ```
 *
 * @see {@link calculateIRR} for internal rate of return
 * @see {@link https://en.wikipedia.org/wiki/Net_present_value NPV Formula}
 */
export const calculateNPV = (cashFlows: number[], discountRate: number): number => {
  return cashFlows.reduce((npv, cashFlow, index) => {
    // Initial cash flow (usually investment) is not discounted
    // Subsequent cash flows are discounted by their period
    const discountFactor = index === 0 ? 1 : Math.pow(1 + discountRate, index)
    return npv + cashFlow / discountFactor
  }, 0)
}

/**
 * Calculates Internal Rate of Return (IRR) using Newton-Raphson iterative method
 *
 * Finds discount rate that makes NPV = 0. IRR represents the annualized effective return rate.
 * Uses Newton-Raphson numerical method with configurable tolerance and iterations.
 *
 * Decision rules:
 * - IRR > Required Rate: Accept project (returns exceed cost of capital)
 * - IRR < Required Rate: Reject project (insufficient returns)
 *
 * @param cashFlows - Array of cash flows [initial investment, period 1, period 2, ...]
 * @param initialGuess - Starting guess for IRR (default: 0.1 = 10%)
 * @param maxIterations - Maximum iterations for convergence (default: 100)
 * @param tolerance - Convergence tolerance (default: 1e-6)
 * @returns Internal Rate of Return as decimal (e.g., 0.15 = 15% annual return)
 *
 * @example
 * ```typescript
 * // Investment: -1000€, returns +400€, +500€, +300€
 * const irr = calculateIRR([-1000, 400, 500, 300])
 * console.log(`${(irr * 100).toFixed(2)}%`)  // ~16.17% annual return
 *
 * // Real-world: Compare to required return rate
 * const cashFlows = [-50000, 15000, 20000, 25000, 30000]
 * const irr = calculateIRR(cashFlows)
 * const requiredRate = 0.12  // 12% hurdle rate
 *
 * if (irr > requiredRate) {
 *   console.log(`✅ IRR ${(irr*100).toFixed(1)}% exceeds ${(requiredRate*100)}% requirement`)
 * } else {
 *   console.log(`❌ IRR ${(irr*100).toFixed(1)}% below ${(requiredRate*100)}% requirement`)
 * }
 * ```
 *
 * @see {@link calculateNPV} for net present value calculation
 * @see {@link https://en.wikipedia.org/wiki/Internal_rate_of_return IRR Formula}
 */
export const calculateIRR = (
  cashFlows: number[],
  initialGuess = 0.1,
  maxIterations = 100,
  tolerance = 1e-6
): number => {
  let rate = initialGuess

  for (let i = 0; i < maxIterations; i++) {
    const npv = calculateNPV(cashFlows, rate)
    const npvDerivative = cashFlows.reduce((sum, cashFlow, index) => {
      return sum - (index * cashFlow) / Math.pow(1 + rate, index + 1)
    }, 0)

    if (Math.abs(npv) < tolerance) return rate
    if (Math.abs(npvDerivative) < tolerance) break

    rate = rate - npv / npvDerivative
  }

  return rate
}

/**
 * Calculates future value (FV) with compound interest
 *
 * Formula: FV = PV × (1 + r)ⁿ
 *
 * @param presentValue - Initial investment amount
 * @param interestRate - Interest rate per period as decimal (e.g., 0.05 for 5%)
 * @param periods - Number of compounding periods
 * @returns Future value after n periods
 *
 * @example
 * ```typescript
 * // 1000€ at 5% annual interest for 10 years
 * const fv = calculateFutureValue(1000, 0.05, 10)  // 1628.89€
 *
 * // Retirement planning: 10000€ invested for 30 years at 7%
 * const retirement = calculateFutureValue(10000, 0.07, 30)  // 76,122.55€
 * ```
 *
 * @see {@link calculatePresentValue}
 */
export const calculateFutureValue = (
  presentValue: number,
  interestRate: number,
  periods: number
): number => {
  return presentValue * Math.pow(1 + interestRate, periods)
}

/**
 * Calculates present value (PV) of future amount
 *
 * Formula: PV = FV / (1 + r)ⁿ
 *
 * @param futureValue - Future amount to discount
 * @param interestRate - Discount rate as decimal (e.g., 0.05 for 5%)
 * @param periods - Number of periods
 * @returns Present value today
 *
 * @example
 * ```typescript
 * // What's 10000€ in 5 years worth today at 6% discount?
 * const pv = calculatePresentValue(10000, 0.06, 5)  // 7,472.58€
 * ```
 *
 * @see {@link calculateFutureValue}
 */
export const calculatePresentValue = (
  futureValue: number,
  interestRate: number,
  periods: number
): number => {
  return futureValue / Math.pow(1 + interestRate, periods)
}

/**
 * Calculates periodic payment for annuity (loans, mortgages)
 *
 * Formula: PMT = PV × [r(1+r)ⁿ] / [(1+r)ⁿ - 1]
 *
 * @param presentValue - Loan/mortgage principal amount
 * @param interestRate - Interest rate per period as decimal
 * @param periods - Total number of payment periods
 * @returns Periodic payment amount
 *
 * @example
 * ```typescript
 * // 200000€ mortgage at 3% annual for 30 years (360 months)
 * const monthlyRate = 0.03 / 12  // 0.0025
 * const payment = calculateAnnuityPayment(200000, monthlyRate, 360)  // 843.21€/month
 *
 * // Car loan: 25000€ at 5% for 5 years
 * const carPayment = calculateAnnuityPayment(25000, 0.05/12, 60)  // 471.78€/month
 * ```
 */
export const calculateAnnuityPayment = (
  presentValue: number,
  interestRate: number,
  periods: number
): number => {
  if (interestRate === 0) return presentValue / periods

  return (
    (presentValue * (interestRate * Math.pow(1 + interestRate, periods))) /
    (Math.pow(1 + interestRate, periods) - 1)
  )
}

// =============================================================================
// DATA VISUALIZATION UTILITIES
// =============================================================================

/**
 * Normalizes an array of numbers to [0, 1] range using min-max normalization
 *
 * Transforms values to a common scale where:
 * - Minimum value → 0
 * - Maximum value → 1
 * - Other values → proportional between 0 and 1
 *
 * Formula: normalized = (value - min) / (max - min)
 *
 * Use cases:
 * - Machine learning feature scaling
 * - Comparing datasets with different scales
 * - Data visualization (heatmaps, gradients)
 * - Neural network input preprocessing
 *
 * @param values - Array of numbers to normalize
 * @returns Array normalized to [0, 1] range (empty array returns [], all equal returns all 0s)
 *
 * @example
 * ```typescript
 * // Basic normalization
 * normalizeToRange([10, 20, 30, 40, 50])
 * // [0, 0.25, 0.5, 0.75, 1]
 *
 * normalizeToRange([100, 200, 150])
 * // [0, 1, 0.5]
 *
 * normalizeToRange([5, 5, 5])
 * // [0, 0, 0] (all equal, no range)
 *
 * normalizeToRange([])
 * // [] (empty array)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Student grade normalization for comparison
 * interface StudentScore {
 *   name: string
 *   rawScore: number
 * }
 *
 * function normalizeScores(students: StudentScore[]): void {
 *   const rawScores = students.map(s => s.rawScore)
 *   const normalized = normalizeToRange(rawScores)
 *
 *   students.forEach((student, i) => {
 *     const normalizedScore = (normalized[i] * 100).toFixed(1)
 *     console.log(`${student.name}: ${student.rawScore} → ${normalizedScore}%`)
 *   })
 * }
 *
 * normalizeScores([
 *   { name: 'Alice', rawScore: 85 },
 *   { name: 'Bob', rawScore: 72 },
 *   { name: 'Charlie', rawScore: 95 }
 * ])
 * // Alice: 85 → 56.5%
 * // Bob: 72 → 0.0%
 * // Charlie: 95 → 100.0%
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Sensor data visualization (temperature heatmap)
 * function generateHeatmapColors(temperatures: number[]): string[] {
 *   const normalized = normalizeToRange(temperatures)
 *
 *   return normalized.map(value => {
 *     const intensity = Math.round(value * 255)
 *     return `rgb(${intensity}, 0, ${255 - intensity})`
 *   })
 * }
 *
 * const temps = [18, 22, 25, 30, 35]
 * generateHeatmapColors(temps)
 * // ['rgb(0, 0, 255)', 'rgb(60, 0, 195)', ...]
 * // Blue (cold) → Red (hot)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: ML feature scaling for neural network
 * interface HouseData {
 *   sqft: number      // 500-5000
 *   price: number     // 100000-1000000
 *   bedrooms: number  // 1-6
 * }
 *
 * function prepareMLFeatures(houses: HouseData[]): number[][] {
 *   const sqfts = normalizeToRange(houses.map(h => h.sqft))
 *   const prices = normalizeToRange(houses.map(h => h.price))
 *   const bedrooms = normalizeToRange(houses.map(h => h.bedrooms))
 *
 *   return sqfts.map((_, i) => [sqfts[i], prices[i], bedrooms[i]])
 * }
 *
 * // All features now in [0, 1] range for training
 * ```
 *
 * @see {@link scaleToRange} for normalizing to custom [min, max] range
 * @see {@link calculateStandardDeviation} for z-score normalization alternative
 */
export const normalizeToRange = (values: number[]): number[] => {
  if (!values.length) return []

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  if (range === 0) return values.map(() => 0)

  return values.map(value => (value - min) / range)
}

/**
 * Scales an array of numbers to a custom [min, max] range
 *
 * Transforms values to specified range while preserving proportions.
 * Uses min-max normalization internally, then scales to target range.
 *
 * Formula:
 * 1. Normalize to [0, 1]: norm = (value - min) / (max - min)
 * 2. Scale to [minRange, maxRange]: scaled = minRange + norm × (maxRange - minRange)
 *
 * Use cases:
 * - Image pixel values (0-255)
 * - Audio amplitude (-1 to 1)
 * - Progress bars (0-100%)
 * - Rating systems (1-5 stars)
 *
 * @param values - Array of numbers to scale
 * @param minRange - Target minimum value
 * @param maxRange - Target maximum value
 * @returns Array scaled to [minRange, maxRange]
 *
 * @example
 * ```typescript
 * // Basic scaling
 * scaleToRange([10, 20, 30, 40, 50], 0, 100)
 * // [0, 25, 50, 75, 100]
 *
 * scaleToRange([1, 2, 3, 4, 5], 1, 5)
 * // [1, 2, 3, 4, 5] (already in range)
 *
 * scaleToRange([0, 0.5, 1], 0, 255)
 * // [0, 127.5, 255] (grayscale pixel values)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Convert arbitrary scores to 1-5 star rating
 * function convertToStarRating(scores: number[]): number[] {
 *   const stars = scaleToRange(scores, 1, 5)
 *   return stars.map(s => Math.round(s * 2) / 2)  // Round to 0.5
 * }
 *
 * const reviewScores = [45, 67, 89, 92, 100]
 * convertToStarRating(reviewScores)
 * // [1, 2.5, 4, 4.5, 5]
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Progress bar percentage
 * function calculateProgress(completedTasks: number[]): number[] {
 *   return scaleToRange(completedTasks, 0, 100).map(p => Math.round(p))
 * }
 *
 * const tasksCompleted = [2, 5, 8, 10]
 * calculateProgress(tasksCompleted)
 * // [0, 38, 75, 100] (percentage progress)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Audio normalization to [-1, 1] range
 * function normalizeAudioSamples(samples: number[]): Float32Array {
 *   const normalized = scaleToRange(samples, -1, 1)
 *   return new Float32Array(normalized)
 * }
 *
 * const audioData = [0, 1000, 2000, 3000, 4000]
 * normalizeAudioSamples(audioData)
 * // Float32Array [-1, -0.5, 0, 0.5, 1]
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Sensor calibration to voltage range
 * interface SensorReading {
 *   timestamp: Date
 *   rawValue: number
 * }
 *
 * function calibrateSensor(readings: SensorReading[]): number[] {
 *   const rawValues = readings.map(r => r.rawValue)
 *   // Calibrate to 0-5V range
 *   return scaleToRange(rawValues, 0, 5)
 * }
 *
 * const sensorData = [
 *   { timestamp: new Date(), rawValue: 100 },
 *   { timestamp: new Date(), rawValue: 300 },
 *   { timestamp: new Date(), rawValue: 500 }
 * ]
 * calibrateSensor(sensorData)
 * // [0, 2.5, 5] volts
 * ```
 *
 * @see {@link normalizeToRange} for [0, 1] normalization
 */
export const scaleToRange = (values: number[], minRange: number, maxRange: number): number[] => {
  const normalized = normalizeToRange(values)
  const scale = maxRange - minRange

  return normalized.map(value => minRange + value * scale)
}

/**
 * Calculates histogram by dividing data into equal-width bins
 *
 * Groups values into intervals (bins) and counts frequency in each bin.
 * Useful for understanding data distribution, finding patterns, and visualization.
 *
 * Algorithm:
 * 1. Find min/max values
 * 2. Calculate bin width: (max - min) / bins
 * 3. Create bins with ranges [start, end)
 * 4. Count values in each bin
 * 5. Last bin includes max value (closed interval)
 *
 * @param values - Array of numbers to analyze
 * @param bins - Number of bins/intervals to divide data into
 * @returns Array of objects with {range: [min, max], count: frequency}
 *
 * @example
 * ```typescript
 * // Basic histogram
 * const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * calculateHistogram(data, 5)
 * // [
 * //   { range: [1, 2.8], count: 2 },
 * //   { range: [2.8, 4.6], count: 2 },
 * //   { range: [4.6, 6.4], count: 2 },
 * //   { range: [6.4, 8.2], count: 2 },
 * //   { range: [8.2, 10], count: 2 }
 * // ]
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Response time distribution analysis
 * function analyzeResponseTimes(times: number[]): void {
 *   const histogram = calculateHistogram(times, 5)
 *
 *   console.log('📊 Response Time Distribution:')
 *   histogram.forEach(({ range, count }) => {
 *     const bar = '█'.repeat(count)
 *     console.log(`${range[0]}-${range[1]}ms: ${bar} (${count})`)
 *   })
 *
 *   // Identify slow requests
 *   const slowBin = histogram[histogram.length - 1]
 *   if (slowBin.count > histogram.length * 0.1) {
 *     console.log(`⚠️ Warning: ${slowBin.count} requests in slowest bin`)
 *   }
 * }
 *
 * const responseTimes = [
 *   120, 150, 180, 200, 220,
 *   250, 300, 350, 400, 5000
 * ]
 * analyzeResponseTimes(responseTimes)
 * // 120-1096ms: ████████ (8)
 * // ...
 * // 4024-5000ms: █ (1)
 * // ⚠️ Warning: 1 requests in slowest bin
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Salary distribution for HR analysis
 * interface Employee {
 *   name: string
 *   salary: number
 * }
 *
 * function analyzeSalaryDistribution(employees: Employee[]): void {
 *   const salaries = employees.map(e => e.salary)
 *   const histogram = calculateHistogram(salaries, 4)
 *
 *   console.log('💰 Salary Distribution:')
 *   histogram.forEach(({ range, count }, i) => {
 *     const percentage = ((count / employees.length) * 100).toFixed(1)
 *     console.log(`Band ${i + 1}: $${range[0].toLocaleString()}-$${range[1].toLocaleString()}`)
 *     console.log(`  Employees: ${count} (${percentage}%)`)
 *   })
 * }
 *
 * const employees = [
 *   { name: 'Alice', salary: 50000 },
 *   { name: 'Bob', salary: 60000 },
 *   { name: 'Charlie', salary: 75000 },
 *   { name: 'David', salary: 90000 },
 *   { name: 'Eve', salary: 120000 }
 * ]
 * analyzeSalaryDistribution(employees)
 * // Band 1: $50,000-$67,500 (2 employees - 40%)
 * // Band 2: $67,500-$85,000 (1 employee - 20%)
 * // ...
 * ```
 *
 * @see {@link calculatePercentile} for quantile analysis
 * @see {@link calculateQuartiles} for quartile-based binning
 */
export const calculateHistogram = (
  values: number[],
  bins: number
): Array<{ range: [number, number]; count: number }> => {
  if (!values.length || bins <= 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)
  const binWidth = (max - min) / bins

  const histogram: Array<{ range: [number, number]; count: number }> = []

  for (let i = 0; i < bins; i++) {
    const rangeStart = min + i * binWidth
    const rangeEnd = i === bins - 1 ? max : rangeStart + binWidth

    const count = values.filter(
      value => value >= rangeStart && (i === bins - 1 ? value <= rangeEnd : value < rangeEnd)
    ).length

    histogram.push({
      range: [roundToDecimals(rangeStart, 2), roundToDecimals(rangeEnd, 2)],
      count,
    })
  }

  return histogram
}

// =============================================================================
// BASIC MACHINE LEARNING UTILITIES
// =============================================================================

/**
 * Calculates Euclidean distance (straight-line distance) between two n-dimensional points
 *
 * Euclidean distance is the "ordinary" straight-line distance between two points.
 * Formula: √Σ(p1ᵢ - p2ᵢ)² for all dimensions
 *
 * Use cases:
 * - Machine learning (K-NN, K-Means clustering)
 * - Similarity measurement
 * - Computer vision (object detection)
 * - Geospatial calculations (2D/3D coordinates)
 *
 * @param point1 - First n-dimensional point [x, y, z, ...]
 * @param point2 - Second n-dimensional point [x, y, z, ...]
 * @returns Euclidean distance between the two points
 * @throws {Error} If points have different dimensions
 *
 * @example
 * ```typescript
 * // 2D distance (x, y coordinates)
 * calculateEuclideanDistance([0, 0], [3, 4])  // 5 (3-4-5 triangle)
 * calculateEuclideanDistance([1, 2], [4, 6])  // 5
 *
 * // 3D distance
 * calculateEuclideanDistance([0, 0, 0], [1, 1, 1])  // ~1.73 (√3)
 *
 * // High-dimensional (ML features)
 * calculateEuclideanDistance([1, 2, 3, 4], [2, 3, 4, 5])  // 2
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: K-Nearest Neighbors classification
 * interface User {
 *   age: number
 *   income: number
 * }
 *
 * function findNearestUsers(target: User, candidates: User[], k: number): User[] {
 *   const distances = candidates.map(candidate => ({
 *     user: candidate,
 *     distance: calculateEuclideanDistance(
 *       [target.age, target.income],
 *       [candidate.age, candidate.income]
 *     )
 *   }))
 *
 *   return distances
 *     .sort((a, b) => a.distance - b.distance)
 *     .slice(0, k)
 *     .map(d => d.user)
 * }
 *
 * const target = { age: 30, income: 50000 }
 * const users = [
 *   { age: 28, income: 48000 },
 *   { age: 45, income: 80000 },
 *   { age: 32, income: 52000 }
 * ]
 * findNearestUsers(target, users, 2)
 * // Returns 2 closest users by age/income
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Product recommendation similarity
 * interface Product {
 *   price: number
 *   rating: number
 *   reviews: number
 * }
 *
 * function findSimilarProducts(
 *   current: Product,
 *   catalog: Product[]
 * ): Product[] {
 *   const similarities = catalog.map(product => {
 *     const distance = calculateEuclideanDistance(
 *       [current.price, current.rating * 20, Math.log(current.reviews)],
 *       [product.price, product.rating * 20, Math.log(product.reviews)]
 *     )
 *     return { product, similarity: 1 / (1 + distance) }
 *   })
 *
 *   return similarities
 *     .sort((a, b) => b.similarity - a.similarity)
 *     .slice(0, 5)
 *     .map(s => s.product)
 * }
 * ```
 *
 * @see {@link calculateManhattanDistance} for taxicab distance (sum of absolute differences)
 * @see {@link simpleKMeans} for K-Means clustering using Euclidean distance
 */
export const calculateEuclideanDistance = (point1: number[], point2: number[]): number => {
  if (point1.length !== point2.length) {
    throw new Error('Points must have the same number of dimensions')
  }

  const squaredDiffs = point1.map((val, index) => Math.pow(val - point2[index], 2))
  return Math.sqrt(sum(squaredDiffs))
}

/**
 * Calculates Manhattan distance (taxicab/city block distance) between two n-dimensional points
 *
 * Manhattan distance is the sum of absolute differences in each dimension.
 * Formula: Σ|p1ᵢ - p2ᵢ| for all dimensions
 *
 * Named after Manhattan grid layout where you can only travel along streets (not diagonally).
 * Often more appropriate than Euclidean for grid-based movement or high-dimensional data.
 *
 * Use cases:
 * - Grid-based pathfinding (chess, robots)
 * - High-dimensional ML (less affected by curse of dimensionality)
 * - City distance calculations (street blocks)
 * - Outlier detection in sparse data
 *
 * @param point1 - First n-dimensional point [x, y, z, ...]
 * @param point2 - Second n-dimensional point [x, y, z, ...]
 * @returns Manhattan distance between the two points
 * @throws {Error} If points have different dimensions
 *
 * @example
 * ```typescript
 * // 2D Manhattan distance
 * calculateManhattanDistance([0, 0], [3, 4])  // 7 (3 + 4)
 * calculateManhattanDistance([1, 2], [4, 6])  // 7 (3 + 4)
 *
 * // Compare with Euclidean
 * calculateEuclideanDistance([0, 0], [3, 4])   // 5
 * calculateManhattanDistance([0, 0], [3, 4])   // 7
 *
 * // 3D distance
 * calculateManhattanDistance([0, 0, 0], [1, 1, 1])  // 3 (1+1+1)
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: City block distance (taxi routing)
 * interface Location {
 *   avenue: number  // East-West
 *   street: number  // North-South
 * }
 *
 * function calculateTaxiFare(from: Location, to: Location): number {
 *   const blocks = calculateManhattanDistance(
 *     [from.avenue, from.street],
 *     [to.avenue, to.street]
 *   )
 *   const baseFare = 3.50
 *   const perBlock = 0.70
 *   return baseFare + blocks * perBlock
 * }
 *
 * const start = { avenue: 5, street: 10 }
 * const end = { avenue: 12, street: 20 }
 * calculateTaxiFare(start, end)
 * // Blocks: 17, Fare: $15.40
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Chess king moves (Chebyshev) vs rook moves (Manhattan)
 * function calculateRookMoves(from: [number, number], to: [number, number]): number {
 *   // Rook can move straight, so Manhattan distance = moves needed
 *   return calculateManhattanDistance(from, to)
 * }
 *
 * calculateRookMoves([0, 0], [3, 4])  // 7 moves minimum
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: High-dimensional text similarity
 * function compareDocuments(doc1Vector: number[], doc2Vector: number[]): number {
 *   // Manhattan often works better than Euclidean for sparse high-dim data
 *   return calculateManhattanDistance(doc1Vector, doc2Vector)
 * }
 *
 * const doc1 = [0, 3, 0, 5, 0, 2]  // Word frequency vector
 * const doc2 = [1, 2, 0, 4, 0, 3]
 * compareDocuments(doc1, doc2)  // 5 (difference in word frequencies)
 * ```
 *
 * @see {@link calculateEuclideanDistance} for straight-line distance
 * @see {@link simpleKMeans} for clustering algorithm
 */
export const calculateManhattanDistance = (point1: number[], point2: number[]): number => {
  if (point1.length !== point2.length) {
    throw new Error('Points must have the same number of dimensions')
  }

  return sum(point1.map((val, index) => Math.abs(val - point2[index])))
}

/**
 * Implements simple K-Means clustering algorithm
 *
 * Groups data points into K clusters by minimizing within-cluster variance.
 * Uses Euclidean distance and iterative centroid updates until convergence.
 *
 * Algorithm:
 * 1. Initialize K centroids randomly from data points
 * 2. Assign each point to nearest centroid (Euclidean distance)
 * 3. Recalculate centroids as mean of assigned points
 * 4. Repeat steps 2-3 until convergence or max iterations
 *
 * Limitations:
 * - Requires knowing K in advance
 * - Sensitive to initial centroid placement (random)
 * - Assumes spherical clusters
 * - Can get stuck in local minima
 *
 * @param points - Array of n-dimensional points to cluster
 * @param k - Number of clusters to create
 * @param maxIterations - Maximum iterations before stopping (default: 100)
 * @returns Object with {centroids: K cluster centers, clusters: array mapping point index → cluster ID}
 *
 * @example
 * ```typescript
 * // Basic 2D clustering
 * const points = [
 *   [1, 1], [2, 1], [1, 2],      // Cluster 1 (bottom-left)
 *   [8, 8], [9, 8], [8, 9]       // Cluster 2 (top-right)
 * ]
 *
 * const { centroids, clusters } = simpleKMeans(points, 2)
 * console.log(centroids)  // [[1.33, 1.33], [8.33, 8.33]]
 * console.log(clusters)   // [0, 0, 0, 1, 1, 1]
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Customer segmentation
 * interface Customer {
 *   age: number
 *   income: number
 *   spendingScore: number
 * }
 *
 * function segmentCustomers(customers: Customer[], segments: number) {
 *   const points = customers.map(c => [c.age, c.income / 1000, c.spendingScore])
 *   const { centroids, clusters } = simpleKMeans(points, segments)
 *
 *   const segmented = customers.map((customer, i) => ({
 *     ...customer,
 *     segment: clusters[i]
 *   }))
 *
 *   console.log('📊 Customer Segments:')
 *   centroids.forEach((centroid, i) => {
 *     const count = clusters.filter(c => c === i).length
 *     console.log(`Segment ${i + 1}: ${count} customers`)
 *     console.log(`  Avg age: ${centroid[0].toFixed(1)}`)
 *     console.log(`  Avg income: $${(centroid[1] * 1000).toLocaleString()}`)
 *     console.log(`  Avg spending: ${centroid[2].toFixed(1)}/100`)
 *   })
 *
 *   return segmented
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Image color quantization (reduce colors)
 * function quantizeColors(pixels: [number, number, number][], colors: number) {
 *   // Each pixel is [R, G, B]
 *   const { centroids, clusters } = simpleKMeans(pixels, colors)
 *
 *   // Replace each pixel with its cluster centroid color
 *   return pixels.map((_, i) => {
 *     const cluster = clusters[i]
 *     return centroids[cluster].map(Math.round) as [number, number, number]
 *   })
 * }
 *
 * // Reduce 16M colors to 8 dominant colors
 * const pixels: [number, number, number][] = [
 *   [255, 100, 50], [250, 110, 55], // Similar reds
 *   [50, 200, 100], [55, 210, 105]  // Similar greens
 * ]
 * quantizeColors(pixels, 2)
 * // Groups similar colors into 2 clusters
 * ```
 *
 * @example
 * ```typescript
 * // Real-world: Anomaly detection in server metrics
 * interface ServerMetrics {
 *   cpuUsage: number      // 0-100%
 *   memoryUsage: number   // 0-100%
 *   responseTime: number  // ms
 * }
 *
 * function detectAnomalies(metrics: ServerMetrics[]): number[] {
 *   const points = metrics.map(m => [
 *     m.cpuUsage,
 *     m.memoryUsage,
 *     m.responseTime / 10  // Scale to similar range
 *   ])
 *
 *   const { centroids, clusters } = simpleKMeans(points, 3)
 *
 *   // Find cluster with highest avg response time
 *   const clusterAvgs = centroids.map(c => c[2] * 10)
 *   const anomalyCluster = clusterAvgs.indexOf(Math.max(...clusterAvgs))
 *
 *   // Return indices of anomalous metrics
 *   return clusters
 *     .map((cluster, i) => cluster === anomalyCluster ? i : -1)
 *     .filter(i => i !== -1)
 * }
 * ```
 *
 * @see {@link calculateEuclideanDistance} for distance metric used
 * @see {@link normalizeToRange} for feature scaling before clustering
 */
export const simpleKMeans = (
  points: number[][],
  k: number,
  maxIterations = 100
): { centroids: number[][]; clusters: number[] } => {
  if (points.length === 0 || k <= 0) {
    return { centroids: [], clusters: [] }
  }

  const dimensions = points[0].length

  // Initialize centroids randomly
  let centroids: number[][] = []
  for (let i = 0; i < k; i++) {
    const randomPoint = points[Math.floor(Math.random() * points.length)]
    centroids.push([...randomPoint])
  }

  const clusters: number[] = new Array(points.length)

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasChanged = false

    // Assign points to clusters
    for (let i = 0; i < points.length; i++) {
      let minDistance = Infinity
      let closestCentroid = 0

      for (let j = 0; j < centroids.length; j++) {
        const distance = calculateEuclideanDistance(points[i], centroids[j])
        if (distance < minDistance) {
          minDistance = distance
          closestCentroid = j
        }
      }

      if (clusters[i] !== closestCentroid) {
        hasChanged = true
        clusters[i] = closestCentroid
      }
    }

    // Update centroids
    const newCentroids: number[][] = new Array(k).fill(0).map(() => new Array(dimensions).fill(0))
    const clusterCounts: number[] = new Array(k).fill(0)

    for (let i = 0; i < points.length; i++) {
      const cluster = clusters[i]
      clusterCounts[cluster]++

      for (let dim = 0; dim < dimensions; dim++) {
        newCentroids[cluster][dim] += points[i][dim]
      }
    }

    for (let i = 0; i < k; i++) {
      if (clusterCounts[i] > 0) {
        for (let dim = 0; dim < dimensions; dim++) {
          newCentroids[i][dim] /= clusterCounts[i]
        }
      }
    }

    centroids = newCentroids

    if (!hasChanged) break
  }

  return { centroids, clusters }
}
