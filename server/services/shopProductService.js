import { getShopSession } from '../middleware/auth.js';

/**
 * Search products in the shop using Shopify Admin API
 * @param {Object} req - Express request object
 * @param {Object} options - Search options
 * @param {string} options.query - Search query (searches title, description, tags)
 * @param {number} [options.limit] - Maximum number of results (default: 10)
 * @param {number} [options.min_price] - Minimum price filter
 * @param {number} [options.max_price] - Maximum price filter
 * @returns {Promise<Array>} Array of product objects
 */
export async function searchShopProducts(req, options = {}) {
  const { query, limit = 10, min_price, max_price } = options;

  try {
    const session = await getShopSession(req);
    if (!session) {
      throw new Error('Shop session not found');
    }

    const client = new req.shopify.clients.Graphql({ session });

    // Build the GraphQL query
    let searchQuery = query || '';
    
    // GraphQL query to search products
    const graphqlQuery = `
      query searchProducts($query: String!, $first: Int!) {
        products(first: $first, query: $query) {
          edges {
            node {
              id
              title
              description
              handle
              status
              featuredImage {
                url
                altText
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    availableForSale
                    selectedOptions {
                      name
                      value
                    }
                    image {
                      url
                      altText
                    }
                  }
                }
              }
              onlineStoreUrl
              tags
            }
          }
        }
      }
    `;

    // Build query string for Shopify search
    let shopifyQuery = `title:*${searchQuery}* OR description:*${searchQuery}* OR tags:*${searchQuery}*`;
    if (min_price !== undefined || max_price !== undefined) {
      // Price filtering is done after fetching
      shopifyQuery = `title:*${searchQuery}* OR description:*${searchQuery}* OR tags:*${searchQuery}*`;
    }

    const variables = {
      query: shopifyQuery,
      first: Math.min(limit, 50),
    };

    const response = await client.query({
      data: {
        query: graphqlQuery,
        variables,
      },
    });

    let products = response.body.data.products.edges.map(edge => edge.node);

    // Apply price filters if specified
    if (min_price !== undefined || max_price !== undefined) {
      products = products.filter(product => {
        const minPrice = parseFloat(product.priceRange.minVariantPrice.amount);
        const maxPrice = parseFloat(product.priceRange.maxVariantPrice.amount);
        
        if (min_price !== undefined && maxPrice < min_price) return false;
        if (max_price !== undefined && minPrice > max_price) return false;
        
        return true;
      });
    }

    // Transform to match catalog API format for consistency
    return products.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description || '',
      images: product.images.edges.map(edge => ({
        url: edge.node.url,
        altText: edge.node.altText || product.title,
        product: {
          id: product.id,
          title: product.title,
          onlineStoreUrl: product.onlineStoreUrl,
          shop: {
            name: session.shop,
            onlineStoreUrl: `https://${session.shop}`,
          },
        },
      })),
      priceRange: {
        min: {
          amount: product.priceRange.minVariantPrice.amount,
          currencyCode: product.priceRange.minVariantPrice.currencyCode,
        },
        max: {
          amount: product.priceRange.maxVariantPrice.amount,
          currencyCode: product.priceRange.maxVariantPrice.currencyCode,
        },
      },
      products: [{
        id: product.id,
        title: product.title,
        description: product.description || '',
        featuredImage: product.featuredImage ? {
          url: product.featuredImage.url,
          altText: product.featuredImage.altText || product.title,
        } : null,
        onlineStoreUrl: product.onlineStoreUrl,
        price: {
          amount: product.priceRange.minVariantPrice.amount,
          currencyCode: product.priceRange.minVariantPrice.currencyCode,
        },
        availableForSale: product.variants.edges.some(edge => edge.node.availableForSale),
        shop: {
          name: session.shop,
          onlineStoreUrl: `https://${session.shop}`,
          id: `gid://shopify/Shop/${session.shop}`,
        },
        selectedProductVariant: product.variants.edges[0]?.node ? {
          id: product.variants.edges[0].node.id,
          availableForSale: product.variants.edges[0].node.availableForSale,
          options: product.variants.edges[0].node.selectedOptions,
          price: {
            amount: product.variants.edges[0].node.price,
            currencyCode: product.priceRange.minVariantPrice.currencyCode,
          },
          image: product.variants.edges[0].node.image ? {
            url: product.variants.edges[0].node.image.url,
            altText: product.variants.edges[0].node.image.altText || product.title,
          } : null,
        } : null,
        variants: product.variants.edges.map(edge => ({
          id: edge.node.id,
          title: edge.node.title,
          price: edge.node.price,
          availableForSale: edge.node.availableForSale,
          options: edge.node.selectedOptions,
          image: edge.node.image ? {
            url: edge.node.image.url,
            altText: edge.node.image.altText || product.title,
          } : null,
        })),
      }],
      availableForSale: product.variants.edges.some(edge => edge.node.availableForSale),
      tags: product.tags,
      scope: 'shop', // Mark as shop product
    }));
  } catch (error) {
    console.error('Error searching shop products:', error);
    throw new Error(`Failed to search shop products: ${error.message}`);
  }
}

/**
 * Get detailed product information from shop
 * @param {Object} req - Express request object
 * @param {string} productId - Shopify product ID (GID)
 * @returns {Promise<Object>} Detailed product information
 */
export async function getShopProductDetails(req, productId) {
  try {
    const session = await getShopSession(req);
    if (!session) {
      throw new Error('Shop session not found');
    }

    const client = new req.shopify.clients.Graphql({ session });

    const graphqlQuery = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          description
          handle
          status
          featuredImage {
            url
            altText
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 50) {
            edges {
              node {
                id
                title
                price
                availableForSale
                selectedOptions {
                  name
                  value
                }
                image {
                  url
                  altText
                }
              }
            }
          }
          onlineStoreUrl
          tags
          options {
            name
            values
          }
        }
      }
    `;

    const response = await client.query({
      data: {
        query: graphqlQuery,
        variables: { id: productId },
      },
    });

    const product = response.body.data.product;
    if (!product) {
      throw new Error('Product not found');
    }

    // Transform to match catalog API format
    return {
      id: product.id,
      title: product.title,
      description: product.description || '',
      images: product.images.edges.map(edge => ({
        url: edge.node.url,
        altText: edge.node.altText || product.title,
        product: {
          id: product.id,
          title: product.title,
          onlineStoreUrl: product.onlineStoreUrl,
          shop: {
            name: session.shop,
            onlineStoreUrl: `https://${session.shop}`,
          },
        },
      })),
      options: product.options.map(option => ({
        name: option.name,
        values: option.values.map(value => ({
          value,
          availableForSale: true,
          exists: true,
        })),
      })),
      priceRange: {
        min: {
          amount: product.priceRange.minVariantPrice.amount,
          currencyCode: product.priceRange.minVariantPrice.currencyCode,
        },
        max: {
          amount: product.priceRange.maxVariantPrice.amount,
          currencyCode: product.priceRange.maxVariantPrice.currencyCode,
        },
      },
      products: [{
        id: product.id,
        title: product.title,
        description: product.description || '',
        featuredImage: product.featuredImage ? {
          url: product.featuredImage.url,
          altText: product.featuredImage.altText || product.title,
        } : null,
        onlineStoreUrl: product.onlineStoreUrl,
        price: {
          amount: product.priceRange.minVariantPrice.amount,
          currencyCode: product.priceRange.minVariantPrice.currencyCode,
        },
        availableForSale: product.variants.edges.some(edge => edge.node.availableForSale),
        shop: {
          name: session.shop,
          onlineStoreUrl: `https://${session.shop}`,
          id: `gid://shopify/Shop/${session.shop}`,
        },
        variants: product.variants.edges.map(edge => ({
          id: edge.node.id,
          title: edge.node.title,
          price: edge.node.price,
          availableForSale: edge.node.availableForSale,
          options: edge.node.selectedOptions,
          image: edge.node.image ? {
            url: edge.node.image.url,
            altText: edge.node.image.altText || product.title,
          } : null,
        })),
      }],
      availableForSale: product.variants.edges.some(edge => edge.node.availableForSale),
      tags: product.tags,
      scope: 'shop',
    };
  } catch (error) {
    console.error('Error getting shop product details:', error);
    throw new Error(`Failed to get shop product details: ${error.message}`);
  }
}

