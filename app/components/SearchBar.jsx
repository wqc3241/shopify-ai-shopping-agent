import { TextField, Select, Stack, Button } from '@shopify/polaris';
import { useState } from 'react';

export default function SearchBar({
  query,
  context,
  scope,
  onQueryChange,
  onContextChange,
  onScopeChange,
  onSearch,
  loading,
}) {
  const scopeOptions = [
    { label: 'Both (Global + Shop)', value: 'both' },
    { label: 'Global Catalog Only', value: 'global' },
    { label: 'Shop Products Only', value: 'shop' },
  ];

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      onSearch();
    }
  };

  return (
    <Stack vertical spacing="loose">
      <TextField
        label="Search Query"
        value={query}
        onChange={onQueryChange}
        placeholder="e.g., I need a crewneck sweater"
        helpText="Enter a natural language description of what you're looking for"
        onKeyPress={handleKeyPress}
        autoComplete="off"
      />

      <TextField
        label="Additional Context (Optional)"
        value={context}
        onChange={onContextChange}
        placeholder="e.g., buyer looking for sustainable fashion"
        helpText="Provide additional context to help refine search results"
        onKeyPress={handleKeyPress}
        autoComplete="off"
      />

      <Select
        label="Search Scope"
        options={scopeOptions}
        value={scope}
        onChange={onScopeChange}
        helpText="Choose where to search for products"
      />

      <Button
        primary
        onClick={onSearch}
        loading={loading}
        disabled={!query.trim()}
      >
        Search Products
      </Button>
    </Stack>
  );
}

