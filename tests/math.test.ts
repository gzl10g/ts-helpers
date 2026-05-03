/**
 * Test suite for math module
 * Tests for mathematical calculations, statistics, financial utilities and machine learning functions
 */

import { describe, test, expect } from 'vitest'
import {
  // Complex aggregations
  calculateAggregations,
  calculateTrendSlope,

  // Statistical functions
  calculateMedian,
  calculateMode,
  calculateStandardDeviation,
  calculateVariance,
  calculatePercentile,
  calculateQuartiles,
  calculateIQR,
  detectOutliers,
  calculateCorrelation,

  // Financial functions
  calculateNPV,
  calculateIRR,
  calculateFutureValue,
  calculatePresentValue,
  calculateAnnuityPayment,

  // Data visualization utilities
  normalizeToRange,
  scaleToRange,
  calculateHistogram,

  // Machine learning utilities
  calculateEuclideanDistance,
  calculateManhattanDistance,
  simpleKMeans,
} from '../src/math'

describe('Complex Aggregations', () => {
  const testData = [
    { category: 'A', value: 10, score: 5, active: true },
    { category: 'A', value: 20, score: 8, active: true },
    { category: 'B', value: 15, score: 6, active: false },
    { category: 'B', value: 25, score: 9, active: true },
  ]

  test('calculateAggregations should perform grouped aggregations', () => {
    const operations = {
      $sum: ['value'],
      $avg: ['score'],
      $count: ['category'],
      $max: ['value'],
      $min: ['score'],
    }

    const result = calculateAggregations(operations, ['category'], testData)

    expect(result).toHaveLength(2)

    const categoryA = result.find((r: any) => r.category === 'A')
    const categoryB = result.find((r: any) => r.category === 'B')

    expect(categoryA.value$sum).toBe(30) // 10 + 20
    expect(categoryA.score$avg).toBe(6.5) // (5 + 8) / 2
    expect(categoryA.category$count).toBe(2)
    expect(categoryA.value$max).toBe(20)
    expect(categoryA.score$min).toBe(5)

    expect(categoryB.value$sum).toBe(40) // 15 + 25
    expect(categoryB.score$avg).toBe(7.5) // (6 + 9) / 2
    expect(categoryB.category$count).toBe(2)
    expect(categoryB.value$max).toBe(25)
    expect(categoryB.score$min).toBe(6)
  })

  test('calculateAggregations should perform ungrouped aggregations', () => {
    const operations = {
      $sum: ['value'],
      $avg: ['score'],
      $count: ['category'],
      $countUniq: ['category'],
    }

    const result = calculateAggregations(operations, [], testData)

    expect(result.value$sum).toBe(70) // 10 + 20 + 15 + 25
    expect(result.score$avg).toBe(7) // (5 + 8 + 6 + 9) / 4
    expect(result.category$count).toBe(4)
    expect(result.category$countUniq).toBe(2) // A and B
  })

  test('calculateTrendSlope should calculate linear regression slope', () => {
    const yValues = [1, 2, 3, 4, 5]
    const xValues = [1, 2, 3, 4, 5]

    const slope = calculateTrendSlope(yValues, xValues)
    expect(slope).toBe(1) // Perfect positive correlation

    const flatValues = [5, 5, 5, 5, 5]
    const flatSlope = calculateTrendSlope(flatValues, xValues)
    expect(flatSlope).toBe(0) // No trend

    // Test with zero denominator
    const sameX = [1, 1, 1, 1, 1]
    const zeroSlope = calculateTrendSlope(yValues, sameX)
    expect(zeroSlope).toBe(0)
  })
})

describe('Statistical Functions', () => {
  const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  test('calculateMedian should find middle value', () => {
    expect(calculateMedian([1, 2, 3, 4, 5])).toBe(3)
    expect(calculateMedian([1, 2, 3, 4])).toBe(2.5) // (2 + 3) / 2
    expect(calculateMedian([5, 1, 3, 2, 4])).toBe(3) // Should sort first
    expect(calculateMedian([])).toBe(0)
  })

  test('calculateMode should find most frequent value', () => {
    expect(calculateMode([1, 2, 2, 3, 4])).toBe(2)
    expect(calculateMode([1, 1, 2, 2, 3])).toBeNull() // Multiple modes
    expect(calculateMode([1])).toBe(1)
    expect(calculateMode([])).toBeNull()
  })

  test('calculateStandardDeviation should calculate spread', () => {
    const result = calculateStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9])
    expect(result).toBeCloseTo(2, 0) // approximately 2

    // Test sample vs population
    const sampleResult = calculateStandardDeviation([1, 2, 3], true)
    const populationResult = calculateStandardDeviation([1, 2, 3], false)
    expect(sampleResult).toBeGreaterThan(populationResult)

    expect(calculateStandardDeviation([])).toBe(0)
  })

  test('calculateVariance should calculate variance', () => {
    const result = calculateVariance([2, 4, 4, 4, 5, 5, 7, 9])
    expect(result).toBeCloseTo(4, 0) // approximately 4 (std dev squared)

    expect(calculateVariance([])).toBe(0)
  })

  test('calculatePercentile should find percentile values', () => {
    expect(calculatePercentile(testData, 50)).toBe(5.5) // median
    expect(calculatePercentile(testData, 0)).toBe(1) // minimum
    expect(calculatePercentile(testData, 100)).toBe(10) // maximum
    expect(calculatePercentile(testData, 25)).toBe(3.25) // Q1

    expect(calculatePercentile([], 50)).toBe(0)
    expect(() => calculatePercentile(testData, -1)).toThrow()
    expect(() => calculatePercentile(testData, 101)).toThrow()
  })

  test('calculateQuartiles should return Q1, Q2, Q3', () => {
    const quartiles = calculateQuartiles(testData)

    expect(quartiles.Q1).toBe(3.25)
    expect(quartiles.Q2).toBe(5.5) // median
    expect(quartiles.Q3).toBe(7.75)
  })

  test('calculateIQR should return interquartile range', () => {
    const iqr = calculateIQR(testData)
    expect(iqr).toBe(4.5) // Q3 - Q1 = 7.75 - 3.25
  })

  test('detectOutliers should find outliers using IQR method', () => {
    const dataWithOutliers = [1, 2, 3, 4, 5, 100] // 100 is an outlier
    const outliers = detectOutliers(dataWithOutliers)

    expect(outliers).toContain(100)
    expect(outliers.length).toBeGreaterThanOrEqual(1)

    // Test with custom multiplier
    const strictOutliers = detectOutliers(dataWithOutliers, 1.0)
    const lenientOutliers = detectOutliers(dataWithOutliers, 3.0)
    expect(strictOutliers.length).toBeGreaterThanOrEqual(lenientOutliers.length)
  })

  test('calculateCorrelation should calculate Pearson correlation', () => {
    const x = [1, 2, 3, 4, 5]
    const y = [2, 4, 6, 8, 10] // Perfect positive correlation
    const negY = [10, 8, 6, 4, 2] // Perfect negative correlation
    const randomY = [3, 1, 4, 1, 5] // Weak correlation

    expect(calculateCorrelation(x, y)).toBeCloseTo(1, 2) // Perfect positive
    expect(calculateCorrelation(x, negY)).toBeCloseTo(-1, 2) // Perfect negative
    expect(Math.abs(calculateCorrelation(x, randomY))).toBeLessThan(1) // Not perfect

    expect(calculateCorrelation([], [])).toBe(0)
    expect(calculateCorrelation([1], [2, 3])).toBe(0) // Different lengths
  })
})

describe('Financial Functions', () => {
  test('calculateNPV should calculate net present value', () => {
    const cashFlows = [-1000, 300, 400, 500, 600] // Initial investment + returns
    const discountRate = 0.1 // 10%

    const npv = calculateNPV(cashFlows, discountRate)
    expect(npv).toBeCloseTo(388.77, 1) // Expected NPV: -1000 + 300/1.1 + 400/1.21 + 500/1.331 + 600/1.4641

    // Zero discount rate should sum all cash flows
    const zeroRate = calculateNPV(cashFlows, 0)
    expect(zeroRate).toBe(800) // -1000 + 300 + 400 + 500 + 600
  })

  test('calculateIRR should find internal rate of return', () => {
    const cashFlows = [-1000, 300, 400, 500, 600]

    const irr = calculateIRR(cashFlows)
    expect(irr).toBeGreaterThan(0) // Should be positive for profitable investment
    expect(irr).toBeLessThan(1) // Should be reasonable percentage

    // Verify IRR by checking NPV at that rate is close to 0
    const npvAtIRR = calculateNPV(cashFlows, irr)
    expect(Math.abs(npvAtIRR)).toBeLessThan(0.01) // Should be very close to 0
  })

  test('calculateFutureValue should calculate compound interest', () => {
    const presentValue = 1000
    const interestRate = 0.05 // 5%
    const periods = 10

    const futureValue = calculateFutureValue(presentValue, interestRate, periods)
    expect(futureValue).toBeCloseTo(1628.89, 1) // 1000 * (1.05)^10
  })

  test('calculatePresentValue should calculate present value', () => {
    const futureValue = 1628.89
    const interestRate = 0.05
    const periods = 10

    const presentValue = calculatePresentValue(futureValue, interestRate, periods)
    expect(presentValue).toBeCloseTo(1000, 1) // Should be inverse of future value
  })

  test('calculateAnnuityPayment should calculate payment amount', () => {
    const presentValue = 10000 // Loan amount
    const interestRate = 0.005 // 0.5% monthly
    const periods = 60 // 5 years of monthly payments

    const payment = calculateAnnuityPayment(presentValue, interestRate, periods)
    expect(payment).toBeGreaterThan(0)
    expect(payment).toBeCloseTo(193.33, 1) // Expected monthly payment (corrected)

    // Zero interest rate should divide evenly
    const zeroInterestPayment = calculateAnnuityPayment(1000, 0, 10)
    expect(zeroInterestPayment).toBe(100) // 1000 / 10
  })
})

describe('Data Visualization Utilities', () => {
  test('normalizeToRange should normalize to [0, 1]', () => {
    const values = [10, 20, 30, 40, 50]
    const normalized = normalizeToRange(values)

    expect(normalized[0]).toBe(0) // Min value becomes 0
    expect(normalized[4]).toBe(1) // Max value becomes 1
    expect(normalized[2]).toBe(0.5) // Middle value becomes 0.5

    // Test edge cases
    expect(normalizeToRange([])).toEqual([])
    expect(normalizeToRange([5, 5, 5])).toEqual([0, 0, 0]) // All same values
  })

  test('scaleToRange should scale to custom range', () => {
    const values = [1, 2, 3, 4, 5]
    const scaled = scaleToRange(values, 0, 100)

    expect(scaled[0]).toBe(0) // Min scaled to 0
    expect(scaled[4]).toBe(100) // Max scaled to 100
    expect(scaled[2]).toBe(50) // Middle scaled to 50

    // Test negative range
    const negativeScaled = scaleToRange(values, -10, 10)
    expect(negativeScaled[0]).toBe(-10)
    expect(negativeScaled[4]).toBe(10)
  })

  test('calculateHistogram should create histogram bins', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const histogram = calculateHistogram(values, 5)

    expect(histogram).toHaveLength(5)

    // Each bin should have range and count
    histogram.forEach(bin => {
      expect(bin).toHaveProperty('range')
      expect(bin).toHaveProperty('count')
      expect(bin.range).toHaveLength(2)
      expect(bin.count).toBeGreaterThanOrEqual(0)
    })

    // Total count should equal input length
    const totalCount = histogram.reduce((sum, bin) => sum + bin.count, 0)
    expect(totalCount).toBe(values.length)

    // Test edge cases
    expect(calculateHistogram([], 5)).toEqual([])
    expect(calculateHistogram(values, 0)).toEqual([])
  })
})

describe('Machine Learning Utilities', () => {
  test('calculateEuclideanDistance should calculate distance between points', () => {
    const point1 = [0, 0]
    const point2 = [3, 4]

    expect(calculateEuclideanDistance(point1, point2)).toBe(5) // 3-4-5 triangle

    const point3 = [1, 1, 1]
    const point4 = [2, 2, 2]
    expect(calculateEuclideanDistance(point3, point4)).toBeCloseTo(Math.sqrt(3), 5)

    // Same points should have zero distance
    expect(calculateEuclideanDistance(point1, point1)).toBe(0)

    // Different dimensions should throw error
    expect(() => calculateEuclideanDistance([1, 2], [1, 2, 3])).toThrow()
  })

  test('calculateManhattanDistance should calculate Manhattan distance', () => {
    const point1 = [0, 0]
    const point2 = [3, 4]

    expect(calculateManhattanDistance(point1, point2)).toBe(7) // |3-0| + |4-0|

    const point3 = [1, 1, 1]
    const point4 = [2, 2, 2]
    expect(calculateManhattanDistance(point3, point4)).toBe(3) // |2-1| + |2-1| + |2-1|

    // Same points should have zero distance
    expect(calculateManhattanDistance(point1, point1)).toBe(0)

    // Different dimensions should throw error
    expect(() => calculateManhattanDistance([1, 2], [1, 2, 3])).toThrow()
  })

  test('simpleKMeans should cluster points', () => {
    // Create two distinct clusters
    const points = [
      [1, 1],
      [2, 1],
      [1, 2], // Cluster 1
      [8, 8],
      [9, 8],
      [8, 9], // Cluster 2
    ]

    const result = simpleKMeans(points, 2)

    expect(result.centroids).toHaveLength(2)
    expect(result.clusters).toHaveLength(6)

    // Each point should be assigned to a cluster
    result.clusters.forEach(cluster => {
      expect(cluster).toBeGreaterThanOrEqual(0)
      expect(cluster).toBeLessThan(2)
    })

    // Centroids should be close to cluster centers
    result.centroids.forEach(centroid => {
      expect(centroid).toHaveLength(2) // 2D points
      expect(typeof centroid[0]).toBe('number')
      expect(typeof centroid[1]).toBe('number')
    })

    // Test edge cases
    expect(simpleKMeans([], 2)).toEqual({ centroids: [], clusters: [] })
    expect(simpleKMeans(points, 0)).toEqual({ centroids: [], clusters: [] })
  })

  test('simpleKMeans should handle single cluster', () => {
    const points = [
      [1, 1],
      [2, 2],
      [3, 3],
    ]
    const result = simpleKMeans(points, 1)

    expect(result.centroids).toHaveLength(1)
    expect(result.clusters).toEqual([0, 0, 0]) // All points in cluster 0

    // Centroid should be near the center of all points
    const centroid = result.centroids[0]
    expect(centroid[0]).toBeCloseTo(2, 0) // Average x
    expect(centroid[1]).toBeCloseTo(2, 0) // Average y
  })
})

describe('Edge Cases and Error Handling', () => {
  test('statistical functions should handle empty arrays', () => {
    expect(calculateMedian([])).toBe(0)
    expect(calculateMode([])).toBeNull()
    expect(calculateStandardDeviation([])).toBe(0)
    expect(calculateVariance([])).toBe(0)
    expect(calculatePercentile([], 50)).toBe(0)
  })

  test('financial functions should handle edge cases', () => {
    expect(calculateNPV([0, 0, 0], 0.1)).toBe(0)
    expect(calculateFutureValue(0, 0.05, 10)).toBe(0)
    expect(calculatePresentValue(0, 0.05, 10)).toBe(0)
    expect(calculateAnnuityPayment(1000, 0, 10)).toBe(100) // Zero interest
  })

  test('data visualization functions should handle edge cases', () => {
    expect(normalizeToRange([])).toEqual([])
    expect(scaleToRange([], 0, 100)).toEqual([])
    expect(calculateHistogram([], 5)).toEqual([])
    expect(calculateHistogram([1, 2, 3], 0)).toEqual([])
  })

  test('distance functions should validate input dimensions', () => {
    expect(() => calculateEuclideanDistance([], [1])).toThrow()
    expect(() => calculateManhattanDistance([1, 2], [1])).toThrow()
  })

  test('complex aggregations should handle empty data', () => {
    const operations = { $sum: ['value'], $count: ['id'] }
    const result = calculateAggregations(operations, [], [])

    expect(result.value$sum).toBe(0)
    expect(result.id$count).toBe(0)
  })

  test('percentile calculation should handle edge cases', () => {
    // Single value
    expect(calculatePercentile([5], 50)).toBe(5)

    // Two values
    expect(calculatePercentile([1, 9], 50)).toBe(5) // Average

    // Invalid percentiles should throw
    expect(() => calculatePercentile([1, 2, 3], -1)).toThrow()
    expect(() => calculatePercentile([1, 2, 3], 101)).toThrow()
  })
})
