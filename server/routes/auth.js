import express from 'express';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

const router = express.Router();

// Initialize Shopify API for auth routes
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES?.split(',') || ['read_products', 'read_customers'],
  hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost:3000',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

/**
 * OAuth callback handler
 * This route handles the OAuth callback from Shopify after app installation
 */
router.get('/callback', async (req, res) => {
  try {
    const callbackResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callbackResponse;
    
    // Store session info
    req.session.shop = session.shop;
    req.session.accessToken = session.accessToken;
    
    // Redirect to app home
    const host = req.query.host;
    const redirectUrl = `https://${host}/apps/${process.env.SHOPIFY_API_KEY}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to complete OAuth flow', details: error.message });
  }
});

/**
 * Shopify OAuth callback (alternative route)
 */
router.get('/shopify/callback', async (req, res) => {
  try {
    const callbackResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callbackResponse;
    
    req.session.shop = session.shop;
    req.session.accessToken = session.accessToken;
    
    const host = req.query.host;
    const redirectUrl = `https://${host}/apps/${process.env.SHOPIFY_API_KEY}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to complete OAuth flow', details: error.message });
  }
});

/**
 * Begin OAuth flow
 */
router.get('/begin', async (req, res) => {
  try {
    const shop = req.query.shop;
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    const authRoute = await shopify.auth.begin({
      shop,
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });

    res.redirect(authRoute);
  } catch (error) {
    console.error('OAuth begin error:', error);
    res.status(500).json({ error: 'Failed to begin OAuth flow', details: error.message });
  }
});

export default router;

