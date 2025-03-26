class CategoryManager {
    constructor() {
        this.categories = [
            {
                id: 'jewelry',
                name: 'Jewelry',
                icon: 'jewelry-icon.svg',
                subcategories: [
                    { id: 'necklaces', name: 'Necklaces' },
                    { id: 'bracelets', name: 'Bracelets' },
                    { id: 'earrings', name: 'Earrings' },
                    { id: 'rings', name: 'Rings' }
                ]
            },
            {
                id: 'home-decor',
                name: 'Home Decor',
                icon: 'home-icon.svg',
                subcategories: [
                    { id: 'wall-art', name: 'Wall Art' },
                    { id: 'vases', name: 'Vases & Containers' },
                    { id: 'textiles', name: 'Textiles' },
                    { id: 'lighting', name: 'Lighting' }
                ]
            },
            {
                id: 'clothing',
                name: 'Clothing',
                icon: 'clothing-icon.svg',
                subcategories: [
                    { id: 'sweaters', name: 'Sweaters & Cardigans' },
                    { id: 'dresses', name: 'Dresses' },
                    { id: 'accessories', name: 'Accessories' },
                    { id: 'tops', name: 'Tops' }
                ]
            },
            {
                id: 'art',
                name: 'Art',
                icon: 'art-icon.svg',
                subcategories: [
                    { id: 'paintings', name: 'Paintings' },
                    { id: 'prints', name: 'Prints' },
                    { id: 'sculptures', name: 'Sculptures' },
                    { id: 'photography', name: 'Photography' }
                ]
            },
            {
                id: 'accessories',
                name: 'Accessories',
                icon: 'accessories-icon.svg',
                subcategories: [
                    { id: 'bags', name: 'Bags & Purses' },
                    { id: 'scarves', name: 'Scarves & Wraps' },
                    { id: 'hats', name: 'Hats' },
                    { id: 'other', name: 'Other Accessories' }
                ]
            }
        ];
        this.init();
    }

    init() {
        this.renderCategoryMenu();
        this.renderFeaturedCategories();
        this.setupCategoryEvents();
    }

    renderCategoryMenu() {
        const dropdown = document.querySelector('.category-dropdown');
        if (dropdown) {
            dropdown.innerHTML = this.categories.map(category => `
                <div class="category-item-wrapper">
                    <a href="/pages/product-listing.html?category=${category.id}" class="category-item">
                        <img src="/assets/icons/${category.icon}" alt="${category.name}">
                        <span>${category.name}</span>
                        ${category.subcategories ? '<i class="arrow-icon">›</i>' : ''}
                    </a>
                    ${this.renderSubcategories(category)}
                </div>
            `).join('');
        }
    }

    renderSubcategories(category) {
        if (!category.subcategories) return '';
        
        return `
            <div class="subcategory-menu">
                <h3>${category.name}</h3>
                <ul>
                    ${category.subcategories.map(sub => `
                        <li>
                            <a href="/pages/product-listing.html?category=${category.id}&subcategory=${sub.id}">
                                ${sub.name}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    renderFeaturedCategories() {
        const categoryGrid = document.querySelector('.category-grid');
        if (categoryGrid) {
            categoryGrid.innerHTML = this.categories.map(category => `
                <a href="/pages/product-listing.html?category=${category.id}" class="category-card">
                    <div class="category-image">
                        <img src="/assets/images/categories/${category.id}-featured.jpg" alt="${category.name}">
                    </div>
                    <div class="category-info">
                        <h3>${category.name}</h3>
                        <span class="item-count">${this.getCategoryItemCount(category.id)} items</span>
                    </div>
                </a>
            `).join('');
        }
    }

    setupCategoryEvents() {
        // Handle category hover events
        document.querySelectorAll('.category-item-wrapper').forEach(wrapper => {
            wrapper.addEventListener('mouseenter', () => {
                wrapper.querySelector('.subcategory-menu')?.classList.add('show');
            });
            wrapper.addEventListener('mouseleave', () => {
                wrapper.querySelector('.subcategory-menu')?.classList.remove('show');
            });
        });

        // Handle mobile touch events
        if ('ontouchstart' in window) {
            document.querySelectorAll('.category-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const wrapper = item.closest('.category-item-wrapper');
                    const submenu = wrapper.querySelector('.subcategory-menu');
                    if (submenu && !submenu.classList.contains('show')) {
                        e.preventDefault();
                        document.querySelectorAll('.subcategory-menu.show')
                            .forEach(menu => menu.classList.remove('show'));
                        submenu.classList.add('show');
                    }
                });
            });
        }
    }

    getCategoryItemCount(categoryId) {
        // This would normally come from an API/database
        const counts = {
            'jewelry': 156,
            'home-decor': 243,
            'clothing': 189,
            'art': 312,
            'accessories': 178
        };
        return counts[categoryId] || 0;
    }
}

// Initialize categories
const categories = new CategoryManager(); 