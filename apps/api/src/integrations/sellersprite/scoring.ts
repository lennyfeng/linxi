/**
 * SellerSprite-powered ASIN scoring engine.
 *
 * Replaces the pseudo-random `scoreItem()` with real Amazon data
 * sourced from the SellerSprite API.
 *
 * Scoring model:
 *   marketScore      = f(monthlySales, monthlyRevenue, BSR trend)
 *   competitionScore = f(sellers, brand concentration, review density)
 *   designScore      = f(rating gap, feature coverage, A+/video presence)
 *   riskScore        = f(review volatility, BSR volatility, price instability)
 *   opportunityScore = weighted composite
 */

import type {
  SellerSpriteAsinDetail,
  SellerSpriteAsinPrediction,
  SellerSpriteKeywordOrderResult,
} from './client.js';
import { fetchAsinDetail, fetchAsinPrediction, fetchKeywordOrder, isSellerSpriteConfigured } from './client.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SellerSpriteAnalysisResult {
  // Product info (filled from asin_detail)
  productTitle: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: number | null;
  rating: number | null;
  reviewCount: number | null;
  bsr: number | null;
  category: string | null;
  sellers: number | null;
  variations: number | null;
  lqs: number | null;
  hasAPlus: boolean;
  hasVideo: boolean;

  // Sales data (filled from asin_prediction)
  monthlySales: number | null;
  monthlyRevenue: number | null;
  bsrTrend: 'up' | 'down' | 'stable' | 'unknown';

  // Keyword data (filled from keyword_order)
  keywordCount: number;
  topKeywordRank: number | null;

  // Scores (calculated from real data)
  marketScore: number;
  competitionScore: number;
  designScore: number;
  riskScore: number;
  opportunityScore: number;
  recommendation: 'recommend_next_round' | 'manual_review' | 'reject';
  recommendationReason: string;

  // Raw data for snapshot storage
  rawDetail: SellerSpriteAsinDetail | null;
  rawPrediction: SellerSpriteAsinPrediction | null;
  rawKeywords: SellerSpriteKeywordOrderResult | null;
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function calcMarketScore(params: {
  monthlySales: number | null;
  monthlyRevenue: number | null;
  bsr: number | null;
  bsrTrend: string;
  keywordCount: number;
  topKeywordRank: number | null;
}): number {
  let score = 50; // baseline

  // Monthly sales contribution (0-25)
  if (params.monthlySales != null) {
    if (params.monthlySales >= 300) score += 25;
    else if (params.monthlySales >= 100) score += 18;
    else if (params.monthlySales >= 30) score += 12;
    else if (params.monthlySales >= 10) score += 6;
    else score += 2;
  }

  // Revenue contribution (0-10)
  if (params.monthlyRevenue != null) {
    if (params.monthlyRevenue >= 10000) score += 10;
    else if (params.monthlyRevenue >= 3000) score += 7;
    else if (params.monthlyRevenue >= 500) score += 4;
    else score += 1;
  }

  // BSR contribution (0-10) — lower BSR = better
  if (params.bsr != null) {
    if (params.bsr <= 1000) score += 10;
    else if (params.bsr <= 5000) score += 8;
    else if (params.bsr <= 20000) score += 5;
    else if (params.bsr <= 50000) score += 3;
    else score += 1;
  }

  // BSR trend bonus (0-5)
  if (params.bsrTrend === 'up') score += 5;
  else if (params.bsrTrend === 'stable') score += 2;

  return clamp(score, 0, 100);
}

function calcCompetitionScore(params: {
  sellers: number | null;
  reviewCount: number | null;
  rating: number | null;
  variations: number | null;
  keywordCount: number;
  topKeywordRank: number | null;
}): number {
  // Higher score = easier to enter (less competition)
  let score = 50;

  // Fewer sellers = easier (0-15)
  if (params.sellers != null) {
    if (params.sellers <= 2) score += 15;
    else if (params.sellers <= 5) score += 10;
    else if (params.sellers <= 10) score += 5;
    else score -= 5;
  }

  // Fewer reviews = easier to catch up (0-15)
  if (params.reviewCount != null) {
    if (params.reviewCount < 50) score += 15;
    else if (params.reviewCount < 200) score += 10;
    else if (params.reviewCount < 500) score += 5;
    else if (params.reviewCount < 1000) score -= 2;
    else score -= 8;
  }

  // Lower rating = room for improvement (0-10)
  if (params.rating != null) {
    if (params.rating < 3.5) score += 10;
    else if (params.rating < 4.0) score += 7;
    else if (params.rating < 4.3) score += 3;
    else score -= 3;
  }

  // Fewer variations = less entrenched (0-10)
  if (params.variations != null) {
    if (params.variations <= 3) score += 10;
    else if (params.variations <= 8) score += 5;
    else score -= 3;
  }

  return clamp(score, 0, 100);
}

function calcDesignScore(params: {
  rating: number | null;
  lqs: number | null;
  hasAPlus: boolean;
  hasVideo: boolean;
  reviewCount: number | null;
}): number {
  // Higher score = more design differentiation opportunity
  let score = 50;

  // Low rating = design improvement opportunity (0-20)
  if (params.rating != null) {
    if (params.rating < 3.5) score += 20;
    else if (params.rating < 4.0) score += 12;
    else if (params.rating < 4.3) score += 5;
    else score -= 5;
  }

  // Low LQS = listing quality gap (0-15)
  if (params.lqs != null) {
    if (params.lqs < 40) score += 15;
    else if (params.lqs < 60) score += 10;
    else if (params.lqs < 80) score += 3;
    else score -= 5;
  }

  // No A+ = content gap (0-10)
  if (!params.hasAPlus) score += 10;

  // No video = content gap (0-5)
  if (!params.hasVideo) score += 5;

  return clamp(score, 0, 100);
}

function calcRiskScore(params: {
  rating: number | null;
  reviewCount: number | null;
  sellers: number | null;
  price: number | null;
  bsr: number | null;
}): number {
  // Higher score = higher risk
  let score = 20; // baseline low risk

  // Very high reviews = hard to compete (0-20)
  if (params.reviewCount != null) {
    if (params.reviewCount >= 5000) score += 20;
    else if (params.reviewCount >= 1000) score += 12;
    else if (params.reviewCount >= 500) score += 5;
  }

  // Very high rating = hard to beat (0-15)
  if (params.rating != null) {
    if (params.rating >= 4.5) score += 15;
    else if (params.rating >= 4.3) score += 8;
    else if (params.rating >= 4.0) score += 3;
  }

  // Many sellers = price war risk (0-15)
  if (params.sellers != null) {
    if (params.sellers >= 20) score += 15;
    else if (params.sellers >= 10) score += 8;
  }

  // Very low price = margin risk (0-10)
  if (params.price != null) {
    if (params.price < 15) score += 10;
    else if (params.price < 25) score += 5;
  }

  return clamp(score, 0, 100);
}

function determineBsrTrend(prediction: SellerSpriteAsinPrediction | null): 'up' | 'down' | 'stable' | 'unknown' {
  if (!prediction?.dailyItemList || prediction.dailyItemList.length < 14) return 'unknown';
  const recent = prediction.dailyItemList.slice(-14);
  const firstHalf = recent.slice(0, 7);
  const secondHalf = recent.slice(7);
  const avgFirst = firstHalf.reduce((s, d) => s + d.bsr, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, d) => s + d.bsr, 0) / secondHalf.length;
  // Lower BSR = better rank = "up" trend
  const change = (avgSecond - avgFirst) / avgFirst;
  if (change < -0.1) return 'up'; // BSR decreasing = improving
  if (change > 0.1) return 'down'; // BSR increasing = declining
  return 'stable';
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

export async function analyzeAsinWithSellerSprite(
  asin: string,
  marketplace: string,
): Promise<SellerSpriteAnalysisResult> {
  // Fetch all data in parallel
  const [detail, prediction, keywords] = await Promise.all([
    fetchAsinDetail(asin, marketplace),
    fetchAsinPrediction(asin, marketplace),
    fetchKeywordOrder(asin, marketplace, getCurrentMonthStr()),
  ]);

  // Extract product info from detail
  const productTitle = detail?.title ?? null;
  const brand = detail?.brand ?? null;
  const imageUrl = detail?.imageUrl ?? null;
  const price = detail?.price != null && detail.price > 0 ? detail.price : null;
  const rating = detail?.rating ?? null;
  const reviewCount = detail?.ratings ?? detail?.reviews ?? null;
  const bsr = detail?.bsrRank ?? null;
  const category = detail?.nodeLabelPath ?? null;
  const sellers = detail?.sellers ?? null;
  const variations = detail?.variations ?? null;
  const lqs = detail?.lqs ?? null;
  const hasAPlus = detail?.badge?.ebc === 'Y';
  const hasVideo = detail?.badge?.video === 'Y';

  // Extract sales data from prediction
  const monthList = prediction?.monthItemList ?? [];
  const latestMonth = monthList.length > 0 ? monthList[monthList.length - 1] : null;
  const monthlySales = latestMonth?.sales ?? null;
  const monthlyRevenue = latestMonth?.amount ?? null;
  const bsrTrend = determineBsrTrend(prediction);

  // Extract keyword data
  const keywordCount = keywords?.total ?? 0;
  const topKeywordRank = keywords?.items?.[0]?.searchRank ?? null;

  // Calculate scores from real data
  const marketScore = calcMarketScore({ monthlySales, monthlyRevenue, bsr, bsrTrend, keywordCount, topKeywordRank });
  const competitionScore = calcCompetitionScore({ sellers, reviewCount, rating, variations, keywordCount, topKeywordRank });
  const designScore = calcDesignScore({ rating, lqs, hasAPlus, hasVideo, reviewCount });
  const riskScore = calcRiskScore({ rating, reviewCount, sellers, price, bsr });

  // Composite opportunity score
  const opportunityScore = clamp(
    marketScore * 0.35 + competitionScore * 0.2 + designScore * 0.3 - riskScore * 0.15,
    0,
    100,
  );

  // Recommendation
  let recommendation: 'recommend_next_round' | 'manual_review' | 'reject' = 'manual_review';
  let recommendationReason = 'manual_review';

  if (opportunityScore >= 55 && riskScore < 35) {
    recommendation = 'recommend_next_round';
    recommendationReason = `high_opportunity(${opportunityScore.toFixed(0)})_low_risk(${riskScore.toFixed(0)})`;
  } else if (opportunityScore < 40 || riskScore >= 70) {
    recommendation = 'reject';
    recommendationReason = `low_opportunity(${opportunityScore.toFixed(0)})_high_risk(${riskScore.toFixed(0)})`;
  } else {
    recommendationReason = `moderate_opportunity(${opportunityScore.toFixed(0)})_risk(${riskScore.toFixed(0)})`;
  }

  return {
    productTitle,
    brand,
    imageUrl,
    price,
    rating,
    reviewCount,
    bsr,
    category,
    sellers,
    variations,
    lqs,
    hasAPlus,
    hasVideo,
    monthlySales,
    monthlyRevenue,
    bsrTrend,
    keywordCount,
    topKeywordRank,
    marketScore,
    competitionScore,
    designScore,
    riskScore,
    opportunityScore,
    recommendation,
    recommendationReason,
    rawDetail: detail,
    rawPrediction: prediction,
    rawKeywords: keywords,
  };
}

/**
 * Check if SellerSprite integration is available.
 * Falls back to mock scoring when not configured.
 */
export function isRealAnalysisAvailable(): boolean {
  return isSellerSpriteConfigured();
}

function getCurrentMonthStr(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yyyy}${mm}`;
}
