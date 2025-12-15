# Shopify AI Shopping Agent

An AI-powered shopping assistant app for Shopify that helps users quickly find products using natural language queries. The app integrates with the Shopify Catalog MCP API to search both the global catalog and individual shop products.

## Features

- **Natural Language Search**: Search products using conversational queries (e.g., "I need a blue sweater")
- **Dual Search Scope**: Search both the global Shopify catalog and your shop's products
- **Advanced Filtering**: Filter by price range, shipping location, and secondhand products
- **Product Details**: View detailed product information including variants, specs, and features
- **Admin Interface**: Embedded admin app for testing and configuration
- **Storefront Widget**: Customer-facing search widget for the storefront

## Prerequisites

- Node.js 18+ installed
- Shopify Partner account
- Catalog API credentials from [Dev Dashboard](https://dev.shopify.com/dashboard/)
- Shopify CLI installed (`npm install -g @shopify/cli`)

## Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   # Shopify App Credentials (from Partner Dashboard)
   SHOPIFY_API_KEY=your_api_key_here
   SHOPIFY_API_SECRET=your_api_secret_here
   SCOPES=read_products,read_customers
   HOST=https://localhost:3000

   # Catalog MCP API Credentials (from Dev Dashboard - Catalogs section)
   CATALOG_CLIENT_ID=your_catalog_client_id_here
   CATALOG_CLIENT_SECRET=your_catalog_client_secret_here

   # Session Secret (generate a random string)
   SESSION_SECRET=your_random_session_secret_here
   ```

3. **Get Catalog API credentials:**
   - Go to [Dev Dashboard](https://dev.shopify.com/dashboard/)
   - Navigate to the **Catalogs** section
   - Generate API credentials (client_id and client_secret)
   - Add them to your `.env` file

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   This will:
   - Start the Express server
   - Launch the Shopify CLI development server
   - Open the app installation flow

5. **Install the app on your dev store:**
   - Follow the OAuth flow when prompted
   - The app will be installed and accessible in your Shopify admin

## Project Structure

```
├── app/                    # Remix admin app
│   ├── components/        # React components
│   └── routes/            # Remix routes
├── server/                 # Express backend
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API routes
│   │   ├── api/          # Main API endpoints
│   │   └── auth.js       # OAuth routes
│   └── services/          # Business logic
│       ├── catalogService.js    # Catalog MCP API client
│       └── shopProductService.js # Shopify Admin API client
├── extensions/            # Shopify app extensions
│   └── widget/           # Storefront widget
└── shopify.app.toml      # Shopify app configuration
```

## API Endpoints

### Search Products
- **POST** `/api/search` - Search products (requires authentication)
  - Body: `{ query, context?, scope?, limit?, min_price?, max_price?, ships_to?, include_secondhand? }`

### Product Details
- **GET** `/api/products/:upid` - Get product details by UPID
- **POST** `/api/products/details` - Get product details with options

### Widget Search
- **POST** `/api/widget/search` - Public search endpoint for storefront widget (rate limited)

## Usage

### Admin App

1. Navigate to the app in your Shopify admin
2. Enter a natural language search query (e.g., "I need a crewneck sweater")
3. Optionally add context (e.g., "buyer looking for sustainable fashion")
4. Select search scope (Global, Shop, or Both)
5. Apply filters as needed
6. Click "Search Products" to see results
7. Click on any product card to view detailed information

### Storefront Widget

The widget appears as a floating search button on your storefront. Customers can:
- Click the search icon to open the widget
- Enter natural language queries
- View product results with images and prices
- Click products to view them on the store

## Development

- **Start dev server**: `npm run dev`
- **Build**: `npm run build`
- **Deploy**: `npm run deploy`

## Troubleshooting

### OAuth Issues
- Ensure `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are correct
- Check that redirect URLs in `shopify.app.toml` match your setup
- Verify scopes are properly configured

### Catalog API Issues
- Verify `CATALOG_CLIENT_ID` and `CATALOG_CLIENT_SECRET` are correct
- Check that credentials are from the Dev Dashboard Catalogs section
- Ensure bearer token is being generated correctly

### Search Not Working
- Check browser console for errors
- Verify API endpoints are accessible
- Ensure environment variables are set correctly

## License

MIT

