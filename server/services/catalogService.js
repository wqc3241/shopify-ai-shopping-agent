import 'dotenv/config';

const CATALOG_API_BASE = 'https://discover.shopifyapps.com/global';
const TOKEN_ENDPOINT = 'https://api.shopify.com/auth/access_token';

let bearerToken = null;
let tokenExpiry = null;

/**
 * Generate or retrieve bearer token for Catalog MCP API
 */
async function getBearerToken() {
  // Return cached token if still valid (with 5 minute buffer)
  if (bearerToken && tokenExpiry && Date.now() < tokenExpiry - 5 * 60 * 1000) {
    return bearerToken;
  }

  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.CATALOG_CLIENT_ID,
        client_secret: process.env.CATALOG_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    bearerToken = data.access_token;
    // Tokens typically expire in 1 hour, cache for 55 minutes
    tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;

    return bearerToken;
  } catch (error) {
    console.error('Error getting bearer token:', error);
    throw new Error(`Failed to get Catalog API token: ${error.message}`);
  }
}

/**
 * Make a request to the Catalog MCP API
 */
async function callCatalogMCP(method, params) {
  const token = await getBearerToken();

  try {
    const response = await fetch(`${CATALOG_API_BASE}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        id: Date.now(),
        params: {
          name: method,
          arguments: params,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Catalog API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Catalog API error: ${JSON.stringify(data.error)}`);
    }

    return data;
  } catch (error) {
    console.error('Catalog MCP API error:', error);
    throw error;
  }
}

/**
 * Search global products in the Catalog
 * @param {Object} options - Search options
 * @param {string} options.query - Natural language search query
 * @param {string} [options.context] - Additional context for the search
 * @param {number} [options.limit] - Maximum number of results (default: 10)
 * @param {number} [options.min_price] - Minimum price filter
 * @param {number} [options.max_price] - Maximum price filter
 * @param {string} [options.ships_to] - Shipping location (ISO country code)
 * @param {boolean} [options.include_secondhand] - Include secondhand products
 * @returns {Promise<Object>} Search results with offers array
 */
export async function searchGlobalProducts(options = {}) {
  const {
    query,
    context,
    limit = 10,
    min_price,
    max_price,
    ships_to,
    include_secondhand,
  } = options;

  if (!query) {
    throw new Error('Search query is required');
  }

  const params = {
    query,
    limit: Math.min(limit, 50), // Cap at 50 results
  };

  if (context) params.context = context;
  if (min_price !== undefined) params.min_price = min_price;
  if (max_price !== undefined) params.max_price = max_price;
  if (ships_to) params.ships_to = ships_to;
  if (include_secondhand !== undefined) params.include_secondhand = include_secondhand;

  try {
    const response = await callCatalogMCP('search_global_products', params);

    // Parse the response
    if (response.result && response.result.content && response.result.content[0]) {
      const textContent = response.result.content[0].text;
      let offersData;

      // Handle both string and object responses
      if (typeof textContent === 'string') {
        offersData = JSON.parse(textContent);
      } else {
        offersData = textContent;
      }

      return {
        offers: offersData.offers || [],
        instructions: offersData.instructions || '',
      };
    }

    return { offers: [], instructions: '' };
  } catch (error) {
    console.error('Error searching global products:', error);
    throw error;
  }
}

/**
 * Get detailed product information by Universal Product ID (UPID)
 * @param {string} upid - Universal Product ID (without gid://shopify/p/ prefix)
 * @param {Array} [product_options] - Product options to filter variants
 * @returns {Promise<Object>} Detailed product information
 */
export async function getGlobalProductDetails(upid, product_options = []) {
  if (!upid) {
    throw new Error('UPID is required');
  }

  // Remove gid://shopify/p/ prefix if present
  const cleanUpid = upid.replace('gid://shopify/p/', '');

  const params = {
    upid: cleanUpid,
  };

  if (product_options && product_options.length > 0) {
    params.product_options = product_options;
  }

  try {
    const response = await callCatalogMCP('get_global_product_details', params);

    // Parse the response
    if (response.result && response.result.content && response.result.content[0]) {
      const textContent = response.result.content[0].text;
      let productData;

      // Handle both string and object responses
      if (typeof textContent === 'string') {
        productData = JSON.parse(textContent);
      } else {
        productData = textContent;
      }

      return productData;
    }

    throw new Error('No product data returned from API');
  } catch (error) {
    console.error('Error getting product details:', error);
    throw error;
  }
}

/**
 * Extract UPID from full GID
 */
export function extractUpid(gid) {
  if (!gid) return null;
  const match = gid.match(/gid:\/\/shopify\/p\/(.+)/);
  return match ? match[1] : gid;
}

