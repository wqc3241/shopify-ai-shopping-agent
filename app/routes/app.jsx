import { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  Banner,
  Spinner,
  Stack,
  Grid,
} from '@shopify/polaris';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import FilterPanel from '../components/FilterPanel';
import ProductDetails from '../components/ProductDetails';

export default function App() {
  const [query, setQuery] = useState('');
  const [context, setContext] = useState('');
  const [scope, setScope] = useState('both');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    ships_to: '',
    include_secondhand: false,
  });

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          query: query.trim(),
          context: context.trim() || undefined,
          scope,
          limit: 20,
          min_price: filters.min_price ? parseFloat(filters.min_price) : undefined,
          max_price: filters.max_price ? parseFloat(filters.max_price) : undefined,
          ships_to: filters.ships_to || undefined,
          include_secondhand: filters.include_secondhand || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Search failed');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err.message || 'An error occurred during search');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product) => {
    try {
      const upid = product.id || product.products?.[0]?.id;
      if (!upid) {
        setSelectedProduct(product);
        return;
      }

      const response = await fetch(`/api/products/${encodeURIComponent(upid)}?scope=${product.scope || 'global'}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedProduct(data.product);
      } else {
        setSelectedProduct(product);
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setSelectedProduct(product);
    }
  };

  return (
    <Page
      title="AI Product Search"
      primaryAction={{
        content: 'Search',
        onAction: handleSearch,
        loading,
      }}
    >
      <Layout>
        <Layout.Section>
          {error && (
            <Banner status="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}

          <Card>
            <SearchBar
              query={query}
              context={context}
              scope={scope}
              onQueryChange={setQuery}
              onContextChange={setContext}
              onScopeChange={setScope}
              onSearch={handleSearch}
              loading={loading}
            />
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
          />
        </Layout.Section>

        <Layout.Section>
          {loading && (
            <Card>
              <Stack alignment="center">
                <Spinner size="large" />
                <p>Searching products...</p>
              </Stack>
            </Card>
          )}

          {results && !loading && (
            <Card>
              <Stack vertical spacing="loose">
                <div>
                  <h2>Search Results</h2>
                  <p>
                    Found {results.combined.count} products
                    {scope === 'both' && (
                      <> ({results.global.count} global, {results.shop.count} from your shop)</>
                    )}
                  </p>
                </div>

                {results.combined.products.length === 0 ? (
                  <Banner status="info">
                    No products found. Try adjusting your search query or filters.
                  </Banner>
                ) : (
                  <Grid>
                    {results.combined.products.map((product, index) => (
                      <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 3, lg: 3 }} key={product.id || index}>
                        <ProductCard
                          product={product}
                          onClick={() => handleProductClick(product)}
                        />
                      </Grid.Cell>
                    ))}
                  </Grid>
                )}
              </Stack>
            </Card>
          )}
        </Layout.Section>
      </Layout>

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </Page>
  );
}

