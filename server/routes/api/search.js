import express from 'express';
import { searchGlobalProducts } from '../../services/catalogService.js';
import { searchShopProducts } from '../../services/shopProductService.js';

const router = express.Router();

/**
 * POST /api/search
 * Main search endpoint that supports both global catalog and shop product search
 * 
 * Body:
 * - query: string (required) - Natural language search query
 * - context: string (optional) - Additional context for the search
 * - scope: string (optional) - 'global', 'shop', or 'both' (default: 'both')
 * - limit: number (optional) - Maximum results per source (default: 10)
 * - min_price: number (optional) - Minimum price filter
 * - max_price: number (optional) - Maximum price filter
 * - ships_to: string (optional) - ISO country code for shipping location
 * - include_secondhand: boolean (optional) - Include secondhand products
 */
router.post('/', async (req, res) => {
  try {
    const {
      query,
      context,
      scope = 'both',
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

    const results = {
      global: [],
      shop: [],
      combined: [],
    };

    // Search global catalog
    if (scope === 'global' || scope === 'both') {
      try {
        const globalResults = await searchGlobalProducts({
          query,
          context,
          limit,
          min_price,
          max_price,
          ships_to,
          include_secondhand,
        });
        results.global = globalResults.offers || [];
      } catch (error) {
        console.error('Global search error:', error);
        // Continue with shop search even if global fails
        results.global = [];
      }
    }

    // Search shop products
    if (scope === 'shop' || scope === 'both') {
      try {
        const shopResults = await searchShopProducts(req, {
          query,
          limit,
          min_price,
          max_price,
        });
        results.shop = shopResults || [];
      } catch (error) {
        console.error('Shop search error:', error);
        // Continue with global results even if shop search fails
        results.shop = [];
      }
    }

    // Combine results
    results.combined = [...results.global, ...results.shop];

    // Sort combined results (you could add relevance scoring here)
    results.combined.sort((a, b) => {
      // Prioritize available products
      if (a.availableForSale && !b.availableForSale) return -1;
      if (!a.availableForSale && b.availableForSale) return 1;
      return 0;
    });

    res.json({
      success: true,
      query,
      scope,
      results: {
        global: {
          count: results.global.length,
          products: results.global,
        },
        shop: {
          count: results.shop.length,
          products: results.shop,
        },
        combined: {
          count: results.combined.length,
          products: results.combined,
        },
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Failed to perform search',
      message: error.message,
    });
  }
});

export default router;

