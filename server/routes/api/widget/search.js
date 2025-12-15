import express from 'express';
import { searchGlobalProducts } from '../../services/catalogService.js';

const router = express.Router();

// Simple rate limiting (in production, use a proper rate limiter like express-rate-limit)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  const limit = requestCounts.get(ip);
  
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }

  if (limit.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  limit.count++;
  next();
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of requestCounts.entries()) {
    if (now > limit.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

/**
 * POST /api/widget/search
 * Public-facing search endpoint for storefront widget
 * Only searches global catalog (shop products require authentication)
 * 
 * Body:
 * - query: string (required) - Natural language search query
 * - context: string (optional) - Additional context
 * - limit: number (optional) - Maximum results (default: 10, max: 20)
 * - min_price: number (optional) - Minimum price filter
 * - max_price: number (optional) - Maximum price filter
 * - ships_to: string (optional) - ISO country code
 * - include_secondhand: boolean (optional)
 */
router.post('/', rateLimit, async (req, res) => {
  try {
    const {
      query,
      context,
      limit = 10,
      min_price,
      max_price,
      ships_to,
      include_secondhand,
    } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query is required and must be a non-empty string',
      });
    }

    // Limit results for public endpoint
    const searchLimit = Math.min(limit, 20);

    const results = await searchGlobalProducts({
      query,
      context,
      limit: searchLimit,
      min_price,
      max_price,
      ships_to,
      include_secondhand,
    });

    // Format response for widget consumption
    res.json({
      success: true,
      query,
      count: results.offers?.length || 0,
      products: results.offers || [],
      instructions: results.instructions || '',
    });
  } catch (error) {
    console.error('Widget search error:', error);
    res.status(500).json({
      error: 'Failed to perform search',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
    });
  }
});

export default router;

