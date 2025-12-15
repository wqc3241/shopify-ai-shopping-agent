import {
  Modal,
  Stack,
  Text,
  Button,
  Card,
  Badge,
  List,
  Divider,
} from '@shopify/polaris';

export default function ProductDetails({ product, onClose }) {
  if (!product) return null;

  const title = product.title || product.products?.[0]?.title || 'Product Details';
  const description = product.description || product.products?.[0]?.description || '';
  const images = product.images || [];
  const priceRange = product.priceRange || product.products?.[0]?.price;
  const shop = product.products?.[0]?.shop;
  const variants = product.products?.[0]?.variants || [];
  const selectedVariant = product.products?.[0]?.selectedProductVariant;
  const onlineStoreUrl = product.products?.[0]?.onlineStoreUrl;
  const checkoutUrl = product.products?.[0]?.checkoutUrl;
  const available = product.availableForSale !== false;

  // Extract additional fields
  const uniqueSellingPoint = product.uniqueSellingPoint;
  const topFeatures = product.topFeatures || [];
  const techSpecs = product.techSpecs || [];
  const sharedAttributes = product.sharedAttributes || [];

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={title}
      primaryAction={{
        content: onlineStoreUrl ? 'View Product' : 'Close',
        url: onlineStoreUrl,
        external: true,
      }}
      secondaryActions={checkoutUrl ? [
        {
          content: 'Add to Cart',
          url: checkoutUrl,
          external: true,
        },
      ] : []}
      large
    >
      <Modal.Section>
        <Stack vertical spacing="loose">
          {/* Images */}
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
              {images.slice(0, 5).map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={image.altText || title}
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                />
              ))}
            </div>
          )}

          {/* Price and Availability */}
          <Stack distribution="equalSpacing" alignment="center">
            <Text variant="headingLg" as="h2">
              {priceRange?.min?.currencyCode || 'USD'} $
              {parseFloat(priceRange?.min?.amount || priceRange?.amount || 0).toFixed(2)}
              {priceRange?.max && priceRange.max.amount !== priceRange.min.amount && (
                <> - ${parseFloat(priceRange.max.amount).toFixed(2)}</>
              )}
            </Text>
            <Badge status={available ? 'success' : 'attention'}>
              {available ? 'Available' : 'Unavailable'}
            </Badge>
          </Stack>

          {/* Shop Info */}
          {shop && (
            <Text variant="bodyMd" tone="subdued">
              Shop: {shop.name}
            </Text>
          )}

          {/* Description */}
          {description && (
            <Card>
              <Text variant="bodyMd">{description}</Text>
            </Card>
          )}

          {/* Unique Selling Point */}
          {uniqueSellingPoint && (
            <Card>
              <Stack vertical spacing="tight">
                <Text variant="headingSm" as="h3">Unique Selling Point</Text>
                <Text variant="bodyMd">{uniqueSellingPoint}</Text>
              </Stack>
            </Card>
          )}

          {/* Top Features */}
          {topFeatures.length > 0 && (
            <Card>
              <Stack vertical spacing="tight">
                <Text variant="headingSm" as="h3">Top Features</Text>
                <List type="bullet">
                  {topFeatures.map((feature, index) => (
                    <List.Item key={index}>{feature}</List.Item>
                  ))}
                </List>
              </Stack>
            </Card>
          )}

          {/* Technical Specs */}
          {techSpecs.length > 0 && (
            <Card>
              <Stack vertical spacing="tight">
                <Text variant="headingSm" as="h3">Technical Specifications</Text>
                <List>
                  {techSpecs.map((spec, index) => (
                    <List.Item key={index}>{spec}</List.Item>
                  ))}
                </List>
              </Stack>
            </Card>
          )}

          {/* Shared Attributes */}
          {sharedAttributes.length > 0 && (
            <Card>
              <Stack vertical spacing="tight">
                <Text variant="headingSm" as="h3">Attributes</Text>
                {sharedAttributes.map((attr, index) => (
                  <div key={index}>
                    <Text variant="bodyMd" fontWeight="semibold">
                      {attr.name}:
                    </Text>
                    <Text variant="bodyMd">
                      {attr.values.join(', ')}
                    </Text>
                  </div>
                ))}
              </Stack>
            </Card>
          )}

          {/* Variants */}
          {variants.length > 0 && (
            <Card>
              <Stack vertical spacing="tight">
                <Text variant="headingSm" as="h3">Available Variants</Text>
                {variants.slice(0, 10).map((variant, index) => (
                  <div key={index} style={{ padding: '0.5rem 0' }}>
                    <Stack distribution="equalSpacing" alignment="center">
                      <Text variant="bodyMd">
                        {variant.title || variant.options?.map(opt => `${opt.name}: ${opt.value}`).join(', ')}
                      </Text>
                      <Stack spacing="tight">
                        <Text variant="bodyMd">
                          ${parseFloat(variant.price || 0).toFixed(2)}
                        </Text>
                        <Badge status={variant.availableForSale ? 'success' : 'attention'}>
                          {variant.availableForSale ? 'Available' : 'Unavailable'}
                        </Badge>
                      </Stack>
                    </Stack>
                    {index < variants.length - 1 && <Divider />}
                  </div>
                ))}
                {variants.length > 10 && (
                  <Text variant="bodySm" tone="subdued">
                    ... and {variants.length - 10} more variants
                  </Text>
                )}
              </Stack>
            </Card>
          )}

          {/* Links */}
          <Stack>
            {onlineStoreUrl && (
              <Button url={onlineStoreUrl} external>
                View on Store
              </Button>
            )}
            {checkoutUrl && (
              <Button url={checkoutUrl} external primary>
                Add to Cart
              </Button>
            )}
          </Stack>
        </Stack>
      </Modal.Section>
    </Modal>
  );
}

