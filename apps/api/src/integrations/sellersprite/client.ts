/**
 * SellerSprite REST API client adapter.
 *
 * Gateway: https://api.sellersprite.com
 * Auth:    secret-key header
 *
 * Only the endpoints needed by the ASIN-opportunities analysis pipeline
 * are implemented here.  Additional endpoints (keyword research, market
 * analysis, etc.) can be added incrementally.
 */

import { getAppConfig } from '../../config/app.config.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getSellerSpriteConfig() {
  const cfg = getAppConfig();
  return cfg.sellerSprite;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SellerSpriteAsinDetail {
  asin: string;
  title: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: number | null;
  rating: number | null;
  ratings: number | null;
  reviews: number | null;
  bsrRank: number | null;
  bsrLabel: string | null;
  nodeIdPath: string | null;
  nodeLabelPath: string | null;
  dimensions: string | null;
  weight: string | null;
  sellers: number | null;
  fulfillment: string | null;
  variations: number | null;
  features: string[] | null;
  overviews: string | null;
  lqs: number | null;
  questions: number | null;
  availableDate: number | null;
  badge: {
    bestSeller: string;
    amazonChoice: string;
    newRelease: string;
    ebc: string;
    video: string;
  } | null;
}

export interface SellerSpriteMonthlyPrediction {
  date: string; // "2026-04"
  sales: number;
  amount: number;
  price: number;
}

export interface SellerSpriteDailyPrediction {
  date: string; // "2026-04-22"
  bsr: number;
  sales: number;
  amount: number;
  price: number;
}

export interface SellerSpriteAsinPrediction {
  asin: string;
  title: string | null;
  brand: string | null;
  imageUrl: string | null;
  rating: number | null;
  ratings: number | null;
  categoryId: string | null;
  dailyItemList: SellerSpriteDailyPrediction[];
  monthItemList: SellerSpriteMonthlyPrediction[];
}

export interface SellerSpriteKeywordItem {
  searchRank: number;
  searchRankGrowthValue: number | null;
  searchRankGrowthRate: number | null;
  keyword: string;
  clicks: number | null;
  conversionRate: number | null;
  sumClickRate: number | null;
}

export interface SellerSpriteKeywordOrderResult {
  total: number;
  items: SellerSpriteKeywordItem[];
}

// ---------------------------------------------------------------------------
// Generic request helper
// ---------------------------------------------------------------------------

async function ssRequest<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const cfg = getSellerSpriteConfig();
  if (!cfg.apiKey) {
    throw new Error('SELLERSPRITE_API_KEY is not configured');
  }

  const qs = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

  const url = `${cfg.baseUrl}${path}${qs ? '?' + qs : ''}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'secret-key': cfg.apiKey,
        'content-type': 'application/json;charset=UTF-8',
      },
      signal: controller.signal,
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`SellerSprite API ${resp.status}: ${body.slice(0, 200)}`);
    }

    const json: any = await resp.json();

    // SellerSprite wraps responses in { code, message, data }
    if (json.code !== 'OK' && json.code !== 0) {
      throw new Error(`SellerSprite API error: ${json.message || json.code}`);
    }

    return json.data as T;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch ASIN detail from SellerSprite.
 * Endpoint: GET /v1/asins/detail
 */
export async function fetchAsinDetail(asin: string, marketplace: string): Promise<SellerSpriteAsinDetail | null> {
  try {
    const data = await ssRequest<SellerSpriteAsinDetail>('/v1/asins/detail', {
      asin,
      marketplace,
    });
    return data;
  } catch (err) {
    console.error('[sellersprite] fetchAsinDetail error:', (err as Error).message);
    return null;
  }
}

/**
 * Fetch ASIN sales prediction from SellerSprite.
 * Endpoint: GET /v1/asins/prediction
 */
export async function fetchAsinPrediction(asin: string, marketplace: string): Promise<SellerSpriteAsinPrediction | null> {
  try {
    const data = await ssRequest<SellerSpriteAsinPrediction>('/v1/asins/prediction', {
      asin,
      marketplace,
    });
    return data;
  } catch (err) {
    console.error('[sellersprite] fetchAsinPrediction error:', (err as Error).message);
    return null;
  }
}

/**
 * Fetch keyword order (reverse lookup) for an ASIN.
 * Endpoint: GET /v1/keyword/order
 */
export async function fetchKeywordOrder(
  asin: string,
  marketplace: string,
  date: string, // yyyyMM for monthly
  page: number = 1,
  size: number = 20,
): Promise<SellerSpriteKeywordOrderResult | null> {
  try {
    const data = await ssRequest<SellerSpriteKeywordOrderResult>('/v1/keyword/order', {
      asin,
      marketplace,
      date,
      page,
      size,
      reverseType: 'M',
    });
    return data;
  } catch (err) {
    console.error('[sellersprite] fetchKeywordOrder error:', (err as Error).message);
    return null;
  }
}

/**
 * Check if SellerSprite integration is configured and available.
 */
export function isSellerSpriteConfigured(): boolean {
  return !!getSellerSpriteConfig().apiKey;
}
