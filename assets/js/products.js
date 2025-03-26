class ProductManager {
    constructor() {
        this.products = [];
        this.filters = {
            category: '',
            subcategory: '',
            minPrice: 0,
            maxPrice: Infinity,
            search: ''
        };
        this.currentSort = 'newest';
        this.init();
    }

    init() {
        this.loadProducts();
        this.setupUrlParams();
        this.setupFilters();
        this.setupRealTimeUpdates();
        this.bindEvents();
    }

    loadProducts() {
        this.products = db.getCollection('products') || [];
        this.sortProducts();
        this.renderProducts();
    }

    setupUrlParams() {
        const params = new URLSearchParams(window.location.search);
        if (params.has('category')) {
            this.filters.category = params.get('category');
        }
        if (params.has('subcategory')) {
            this.filters.subcategory = params.get('subcategory');
        }
        if (params.has('q')) {
            this.filters.search = params.get('q');
        }
    }

    setupFilters() {
        const categoryFilters = document.getElementById('categoryFilters');
        if (categoryFilters) {
            categoryFilters.innerHTML = `
                <label>
                    <input type="checkbox" value="electronics" 
                           ${this.filters.category === 'electronics' ? 'checked' : ''}>
                    Electronics
                </label>
                <label>
                    <input type="checkbox" value="smartphones" 
                           ${this.filters.subcategory === 'smartphones' ? 'checked' : ''}>
                    Smartphones
                </label>
            `;
        }

        // Setup price filter inputs
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');
        if (minPrice && maxPrice) {
            minPrice.value = this.filters.minPrice || '';
            maxPrice.value = this.filters.maxPrice === Infinity ? '' : this.filters.maxPrice;
        }
    }

    bindEvents() {
        // Category filter events
        document.querySelectorAll('#categoryFilters input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.filters.category = checkbox.checked ? checkbox.value : '';
                this.renderProducts();
            });
        });

        // Price filter event
        document.getElementById('applyPrice')?.addEventListener('click', () => {
            const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
            const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
            this.filters.minPrice = minPrice;
            this.filters.maxPrice = maxPrice;
            this.renderProducts();
        });
    }

    filterProducts() {
        return this.products.filter(product => {
            const matchesCategory = !this.filters.category || product.category === this.filters.category;
            const matchesSubcategory = !this.filters.subcategory || product.subcategory === this.filters.subcategory;
            const matchesPrice = product.price >= this.filters.minPrice && product.price <= this.filters.maxPrice;
            const matchesSearch = !this.filters.search || 
                product.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                product.description.toLowerCase().includes(this.filters.search.toLowerCase());

            return matchesCategory && matchesSubcategory && matchesPrice && matchesSearch;
        });
    }

    sortProducts() {
        const sortValue = document.getElementById('sortProducts').value;
        switch(sortValue) {
            case 'priceLow':
                this.products.sort((a, b) => a.price - b.price);
                break;
            case 'priceHigh':
                this.products.sort((a, b) => b.price - a.price);
                break;
            case 'popular':
                this.products.sort((a, b) => b.sales - a.sales);
                break;
            default:
                this.products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        this.renderProducts();
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        const filteredProducts = this.filterProducts();

        if (filteredProducts.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <h3>No products found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredProducts.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                ${product.stock <= 0 ? '<div class="product-badge out-of-stock">Out of Stock</div>' : 
                 product.onSale ? '<div class="product-badge sale">Sale</div>' : ''}
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-actions">
                        <button class="wishlist-btn" onclick="productManager.toggleWishlist('${product.id}')">
                            <img src="../assets/icons/heart-icon.svg" alt="Add to Wishlist">
                        </button>
                        <button class="quick-view-btn" onclick="productManager.showQuickView('${product.id}')">
                            Quick View
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-rating">
                        ${this.generateRatingStars(product.rating)}
                        <span class="rating-count">(${product.reviews.length})</span>
                    </div>
                    <div class="product-price">
                        ${product.originalPrice ? 
                            `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
                        <span class="current-price">$${product.price.toFixed(2)}</span>
                    </div>
                    <button class="add-to-cart" 
                            data-product-id="${product.id}"
                            ${product.stock <= 0 ? 'disabled' : ''}>
                        ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    generateRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        
        return '★'.repeat(fullStars) + 
               (halfStar ? '½' : '') + 
               '☆'.repeat(emptyStars);
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).replace(/-/g, ' ');
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            cart.addItem(product);
        }
    }

    toggleWishlist(productId) {
        // Implement wishlist functionality
        alert('Wishlist feature coming soon!');
    }

    showQuickView(productId) {
        // Implement quick view functionality
        alert('Quick view feature coming soon!');
    }

    setupRealTimeUpdates() {
        db.subscribeToChanges('products', (updatedProducts) => {
            this.products = updatedProducts;
            this.renderProducts();
        });
    }
}

// Initialize product manager
const productManager = new ProductManager();

document.addEventListener('DOMContentLoaded', () => {
    productManager.loadProducts();
});