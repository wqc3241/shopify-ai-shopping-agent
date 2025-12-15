import { verifyRequest as shopifyVerifyRequest } from '@shopify/shopify-api/express';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

// Initialize Shopify API for middleware
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES?.split(',') || ['read_products', 'read_customers'],
  hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost:3000',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

/**
 * Verify Shopify OAuth request
 * This middleware ensures the request is authenticated and has a valid session
 */
export const verifyRequest = shopifyVerifyRequest({
  returnHeader: true,
});

/**
 * Extract shop domain from request
 */
export const getShopDomain = (req) => {
  return req.query.shop || req.body.shop || req.session?.shop;
};

/**
 * Get shop session
 */
export const getShopSession = async (req) => {
  if (!req.shopify) {
    throw new Error('Shopify API not initialized');
  }
  
  const shop = getShopDomain(req);
  if (!shop) {
    throw new Error('Shop domain not found in request');
  }

  const session = await req.shopify.session.customAppSession(shop);
  return session;
};

