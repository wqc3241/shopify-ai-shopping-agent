// AI Product Search Widget
// This widget allows customers to search for products using natural language

(function() {
  'use strict';

  // Configuration
  // Get API endpoint from data attribute or use relative path
  const widgetContainer = document.getElementById('ai-product-search-widget-container');
  const API_BASE = widgetContainer?.dataset?.apiBase || '';
  const API_ENDPOINT = `${API_BASE}/api/widget/search`;
  const WIDGET_ID = 'ai-product-search-widget';

  // Create widget container
  function createWidget() {
    const container = document.createElement('div');
    container.id = WIDGET_ID;
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      max-width: 90vw;
      max-height: 80vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Widget header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      background: #2563eb;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
    `;
    header.innerHTML = `
      <h3 style="margin: 0; font-size: 18px; font-weight: 600;">AI Product Search</h3>
      <button id="${WIDGET_ID}-close" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px;">&times;</button>
    `;

    // Search input
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'padding: 16px; border-bottom: 1px solid #e5e7eb;';
    searchContainer.innerHTML = `
      <input 
        type="text" 
        id="${WIDGET_ID}-input" 
        placeholder="Search for products... (e.g., 'I need a blue sweater')"
        style="
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
        "
      />
      <button 
        id="${WIDGET_ID}-search-btn" 
        style="
          width: 100%;
          margin-top: 8px;
          padding: 12px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        "
      >Search</button>
    `;

    // Results container
    const resultsContainer = document.createElement('div');
    resultsContainer.id = `${WIDGET_ID}-results`;
    resultsContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      max-height: 400px;
    `;

    // Loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = `${WIDGET_ID}-loading`;
    loadingIndicator.style.cssText = `
      display: none;
      text-align: center;
      padding: 20px;
      color: #6b7280;
    `;
    loadingIndicator.textContent = 'Searching...';

    // Error message
    const errorMessage = document.createElement('div');
    errorMessage.id = `${WIDGET_ID}-error`;
    errorMessage.style.cssText = `
      display: none;
      padding: 16px;
      background: #fee2e2;
      color: #991b1b;
      border-radius: 8px;
      margin: 8px 0;
    `;

    container.appendChild(header);
    container.appendChild(searchContainer);
    container.appendChild(loadingIndicator);
    container.appendChild(errorMessage);
    container.appendChild(resultsContainer);

    document.body.appendChild(container);

    // Event listeners
    const closeBtn = document.getElementById(`${WIDGET_ID}-close`);
    const searchBtn = document.getElementById(`${WIDGET_ID}-search-btn`);
    const searchInput = document.getElementById(`${WIDGET_ID}-input`);

    closeBtn.addEventListener('click', () => {
      container.style.display = 'none';
    });

    const performSearch = async () => {
      const query = searchInput.value.trim();
      if (!query) {
        showError('Please enter a search query');
        return;
      }

      showLoading(true);
      hideError();
      clearResults();

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            limit: 5,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Search failed');
        }

        const data = await response.json();
        displayResults(data.products || []);
      } catch (error) {
        console.error('Search error:', error);
        showError(error.message || 'An error occurred during search');
      } finally {
        showLoading(false);
      }
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  function showLoading(show) {
    const loading = document.getElementById(`${WIDGET_ID}-loading`);
    loading.style.display = show ? 'block' : 'none';
  }

  function showError(message) {
    const error = document.getElementById(`${WIDGET_ID}-error`);
    error.textContent = message;
    error.style.display = 'block';
  }

  function hideError() {
    const error = document.getElementById(`${WIDGET_ID}-error`);
    error.style.display = 'none';
  }

  function clearResults() {
    const results = document.getElementById(`${WIDGET_ID}-results`);
    results.innerHTML = '';
  }

  function displayResults(products) {
    const results = document.getElementById(`${WIDGET_ID}-results`);
    results.innerHTML = '';

    if (products.length === 0) {
      results.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No products found. Try a different search.</p>';
      return;
    }

    products.forEach(product => {
      const productCard = createProductCard(product);
      results.appendChild(productCard);
    });
  }

  function createProductCard(product) {
    const card = document.createElement('div');
    card.style.cssText = `
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: box-shadow 0.2s;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = 'none';
    });

    const imageUrl = product.images?.[0]?.url || product.products?.[0]?.featuredImage?.url;
    const title = product.title || product.products?.[0]?.title || 'Product';
    const price = product.priceRange?.min?.amount || product.products?.[0]?.price?.amount || '0';
    const currency = product.priceRange?.min?.currencyCode || product.products?.[0]?.price?.currencyCode || 'USD';
    const url = product.url || product.products?.[0]?.onlineStoreUrl;

    card.innerHTML = `
      <div style="display: flex; gap: 12px;">
        ${imageUrl ? `
          <img 
            src="${imageUrl}" 
            alt="${title}"
            style="
              width: 80px;
              height: 80px;
              object-fit: cover;
              border-radius: 6px;
            "
          />
        ` : ''}
        <div style="flex: 1; min-width: 0;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">
            ${title}
          </h4>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #2563eb;">
            ${currency} $${parseFloat(price).toFixed(2)}
          </p>
          ${url ? `
            <a 
              href="${url}" 
              target="_blank"
              style="
                display: inline-block;
                margin-top: 8px;
                padding: 6px 12px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-size: 12px;
              "
            >View Product</a>
          ` : ''}
        </div>
      </div>
    `;

    if (url) {
      card.addEventListener('click', () => {
        window.open(url, '_blank');
      });
    }

    return card;
  }

  // Toggle button to show/hide widget
  function createToggleButton() {
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '🔍';
    toggleBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      transition: transform 0.2s;
    `;

    toggleBtn.addEventListener('click', () => {
      const widget = document.getElementById(WIDGET_ID);
      if (widget) {
        widget.style.display = widget.style.display === 'none' ? 'flex' : 'none';
      }
    });

    toggleBtn.addEventListener('mouseenter', () => {
      toggleBtn.style.transform = 'scale(1.1)';
    });

    toggleBtn.addEventListener('mouseleave', () => {
      toggleBtn.style.transform = 'scale(1)';
    });

    document.body.appendChild(toggleBtn);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createWidget();
      createToggleButton();
    });
  } else {
    createWidget();
    createToggleButton();
  }
})();

