import { Card, TextField, Checkbox, Stack, Select } from '@shopify/polaris';

const COUNTRY_OPTIONS = [
  { label: 'Select country...', value: '' },
  { label: 'United States', value: 'US' },
  { label: 'Canada', value: 'CA' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'Australia', value: 'AU' },
  { label: 'Germany', value: 'DE' },
  { label: 'France', value: 'FR' },
  { label: 'Japan', value: 'JP' },
  { label: 'China', value: 'CN' },
];

export default function FilterPanel({ filters, onFiltersChange }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <Card title="Search Filters">
      <Stack vertical spacing="loose">
        <TextField
          label="Minimum Price"
          type="number"
          value={filters.min_price}
          onChange={(value) => handleFilterChange('min_price', value)}
          prefix="$"
          placeholder="0.00"
          helpText="Filter products by minimum price"
        />

        <TextField
          label="Maximum Price"
          type="number"
          value={filters.max_price}
          onChange={(value) => handleFilterChange('max_price', value)}
          prefix="$"
          placeholder="1000.00"
          helpText="Filter products by maximum price"
        />

        <Select
          label="Shipping Location"
          options={COUNTRY_OPTIONS}
          value={filters.ships_to}
          onChange={(value) => handleFilterChange('ships_to', value)}
          helpText="Filter products that ship to this location"
        />

        <Checkbox
          label="Include Secondhand Products"
          checked={filters.include_secondhand}
          onChange={(value) => handleFilterChange('include_secondhand', value)}
          helpText="Include secondhand/pre-owned products in results"
        />
      </Stack>
    </Card>
  );
}

