import { Card, Stack, Text, Button, Badge } from '@shopify/polaris';
import { useState } from 'react';

export default function ProductCard({ product, onClick }) {
  const imageUrl = product.images?.[0]?.url || product.products?.[0]?.featuredImage?.url;
  const title = product.title || product.products?.[0]?.title || 'Untitled Product';
  const price = product.priceRange?.min?.amount || product.products?.[0]?.price?.amount;
  const currency = product.priceRange?.min?.currencyCode || product.products?.[0]?.price?.currencyCode || 'USD';
  const shopName = product.products?.[0]?.shop?.name || 'Unknown Shop';
  const available = product.availableForSale !== false;
  const scope = product.scope || 'global';

  return (
    <Card>
      <div
        style={{
          cursor: 'pointer',
          padding: '1rem',
        }}
        onClick={onClick}
      >
        <Stack vertical spacing="tight">
          {imageUrl && (
            <div
              style={{
                width: '100%',
                height: '200px',
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '8px',
                marginBottom: '0.5rem',
              }}
            />
          )}

          <Stack vertical spacing="extraTight">
            <Text variant="headingMd" as="h3">
              {title}
            </Text>

            <Stack distribution="equalSpacing" alignment="center">
              <Text variant="headingSm" as="p" tone="success">
                {currency} ${parseFloat(price || 0).toFixed(2)}
              </Text>
              <Badge status={available ? 'success' : 'attention'}>
                {available ? 'Available' : 'Unavailable'}
              </Badge>
            </Stack>

            <Text variant="bodySm" tone="subdued">
              {shopName}
            </Text>

            {scope === 'shop' && (
              <Badge>Your Shop</Badge>
            )}
          </Stack>
        </Stack>
      </div>
    </Card>
  );
}

