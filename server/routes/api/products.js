import express from 'express';
import { getGlobalProductDetails, extractUpid } from '../../services/catalogService.js';
import { getShopProductDetails } from '../../services/shopProductService.js';

const router = express.Router();

/**
 * GET /api/products/:upid
 * Get detailed product information by Universal Product ID
 * 
 * Params:
 * - upid: Universal Product ID (with or without gid://shopify/p/ prefix)
 * 
 * Query:
 * - scope: 'global' or 'shop' (default: 'global')
 */
router.get('/:upid', async (req, res) => {
  try {
    const { upid } = req.params;
    const { scope = 'global' } = req.query;

    if (!upid) {
      return res.status(400).json({
        error: 'Product ID is required',
      });
    }

    let productDetails;

    if (scope === 'shop') {
      // Get product from shop
      productDetails = await getShopProductDetails(req, upid);
    } else {
      // Get product from global catalog
      const cleanUpid = extractUpid(upid);
      productDetails = await getGlobalProductDetails(cleanUpid);
    }

    res.json({
      success: true,
      product: productDetails,
    });
  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json({
      error: 'Failed to get product details',
      message: error.message,
    });
  }
});

/**
 * POST /api/products/details
 * Get detailed product information with specific options
 * 
 * Body:
 * - upid: string (required) - Universal Product ID
 * - product_options: array (optional) - Array of {key: string, values: string[]}
 * - scope: string (optional) - 'global' or 'shop' (default: 'global')
 */
router.post('/details', async (req, res) => {
  try {
    const { upid, product_options = [], scope = 'global' } = req.body;

    if (!upid) {
      return res.status(400).json({
        error: 'Product ID is required',
      });
    }

    let productDetails;

    if (scope === 'shop') {
      // For shop products, we can filter variants based on options
      const baseProduct = await getShopProductDetails(req, upid);
      
      // Filter variants based on product_options
      if (product_options.length > 0 && baseProduct.products?.[0]?.variants) {
        const filteredVariants = baseProduct.products[0].variants.filter(variant => {
          return product_options.every(option => {
            const variantOption = variant.options?.find(opt => opt.name === option.key);
            return variantOption && option.values.includes(variantOption.value);
          });
        });

        if (filteredVariants.length > 0) {
          baseProduct.products[0].selectedProductVariant = {
            ...filteredVariants[0],
            selectionState: {
              type: 'match',
              requestedFilters: product_options,
            },
          };
        }
      }

      productDetails = baseProduct;
    } else {
      // Get product from global catalog with options
      const cleanUpid = extractUpid(upid);
      productDetails = await getGlobalProductDetails(cleanUpid, product_options);
    }

    res.json({
      success: true,
      product: productDetails,
    });
  } catch (error) {
    console.error('Get product details with options error:', error);
    res.status(500).json({
      error: 'Failed to get product details',
      message: error.message,
    });
  }
});

export default router;

