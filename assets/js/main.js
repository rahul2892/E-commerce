class UIManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupSearchFunctionality();
        this.setupCategoryMenu();
        this.setupFeaturedSections();
        this.setupHeaderInteractions();
    }

    setupSearchFunctionality() {
        const searchInput = document.getElementById('searchInput');
        const categorySelect = document.getElementById('categorySelect');
        const searchButton = document.querySelector('.search-button');

        if (searchButton) {
            searchButton.addEventListener('click', () => {
                const query = searchInput.value;
                const category = categorySelect.value;
                this.performSearch(query, category);
            });
        }

        // Enable search on Enter key
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value;
                    const category = categorySelect.value;
                    this.performSearch(query, category);
                }
            });
        }
    }

    performSearch(query, category) {
        const searchParams = new URLSearchParams();
        if (query) searchParams.set('q', query);
        if (category && category !== 'all') searchParams.set('category', category);
        
        window.location.href = `pages/product-listing.html?${searchParams.toString()}`;
    }

    setupCategoryMenu() {
        const categoryItems = document.querySelectorAll('.category-item-wrapper');
        
        categoryItems.forEach(item => {
            const link = item.querySelector('.category-item');
            const submenu = item.querySelector('.subcategory-menu');
            
            if (link && submenu) {
                item.addEventListener('mouseenter', () => {
                    submenu.classList.add('show');
                });
                
                item.addEventListener('mouseleave', () => {
                    submenu.classList.remove('show');
                });
            }
        });
    }

    setupFeaturedSections() {
        // Load featured products
        this.loadFeaturedProducts();
        
        // Load new arrivals
        this.loadNewArrivals();
        
        // Load deals
        this.loadDeals();
    }

    async loadFeaturedProducts() {
        const products = db.getCollection('products');
        const featuredProducts = products.filter(p => p.featured);
        const container = document.querySelector('.featured-products .product-grid');
        
        if (container) {
            container.innerHTML = featuredProducts.map(product => this.createProductCard(product)).join('');
        }
    }

    async loadNewArrivals() {
        const products = db.getCollection('products');
        const newArrivals = products
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4);
        
        const container = document.querySelector('.new-arrivals .product-grid');
        if (container) {
            container.innerHTML = newArrivals.map(product => this.createProductCard(product)).join('');
        }
    }

    async loadDeals() {
        const products = db.getCollection('products');
        const deals = products.filter(p => p.discount > 0);
        const container = document.querySelector('.deals-section .product-grid');
        
        if (container) {
            container.innerHTML = deals.map(product => this.createProductCard(product)).join('');
        }
    }

    createProductCard(product) {
        const discountedPrice = product.discount 
            ? product.price * (1 - product.discount/100) 
            : product.price;
            
        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-actions">
                        <button class="wishlist-btn" onclick="wishlist.toggleWishlist('${product.id}')">
                            <img src="assets/icons/heart-icon.svg" alt="Add to Wishlist">
                        </button>
                        <button class="quick-view-btn" onclick="ui.showQuickView('${product.id}')">
                            Quick View
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-rating">
                        ${this.createRatingStars(product.rating)}
                        <span class="rating-count">(${product.ratingCount})</span>
                    </div>
                    <div class="product-price">
                        <span class="current-price">$${discountedPrice.toFixed(2)}</span>
                        ${product.discount ? `<span class="original-price">$${product.price.toFixed(2)}</span>` : ''}
                    </div>
                    <button class="add-to-cart" onclick="cart.addItem('${product.id}')">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    }

    createRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return `
            ${'★'.repeat(fullStars)}
            ${hasHalfStar ? '½' : ''}
            ${'☆'.repeat(emptyStars)}
        `;
    }

    showQuickView(productId) {
        const product = db.getCollection('products').find(p => p.id === productId);
        if (!product) return;

        const quickView = document.createElement('div');
        quickView.className = 'quick-view-modal';
        quickView.innerHTML = `
            <div class="quick-view-content">
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
                <div class="product-details">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h2>${product.name}</h2>
                        <div class="product-rating">
                            ${this.createRatingStars(product.rating)}
                            <span class="rating-count">(${product.ratingCount} reviews)</span>
                        </div>
                        <div class="product-price">
                            <span class="current-price">$${product.price.toFixed(2)}</span>
                            ${product.discount ? `
                                <span class="discount-badge">-${product.discount}%</span>
                                <span class="original-price">$${(product.price * (1 + product.discount/100)).toFixed(2)}</span>
                            ` : ''}
                        </div>
                        <p class="product-description">${product.description}</p>
                        <div class="product-actions">
                            <div class="quantity-selector">
                                <button onclick="this.parentElement.querySelector('input').stepDown()">-</button>
                                <input type="number" value="1" min="1" max="${product.stock}">
                                <button onclick="this.parentElement.querySelector('input').stepUp()">+</button>
                            </div>
                            <button class="add-to-cart" onclick="cart.addItem('${product.id}', this.parentElement.querySelector('input').value)">
                                Add to Cart
                            </button>
                        </div>
                        <div class="product-meta">
                            <span>Category: ${product.category}</span>
                            <span>Stock: ${product.stock} units</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(quickView);
    }

    setupHeaderInteractions() {
        // Setup category dropdown
        const categoryButton = document.querySelector('.all-categories');
        const categoryDropdown = document.querySelector('.category-dropdown');
        
        if (categoryButton && categoryDropdown) {
            categoryButton.addEventListener('mouseenter', () => {
                categoryDropdown.classList.add('show');
            });
            
            categoryDropdown.addEventListener('mouseleave', () => {
                categoryDropdown.classList.remove('show');
            });
        }

        // Setup mobile menu
        const menuButton = document.querySelector('.mobile-menu-button');
        const mobileMenu = document.querySelector('.mobile-menu');
        
        if (menuButton && mobileMenu) {
            menuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('show');
            });
        }
    }
}

// Initialize UI Manager
const ui = new UIManager(); 