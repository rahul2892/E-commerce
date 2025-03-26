class ProductManager {
    constructor() {
        this.products = [];
        this.currentFilter = {
            category: '',
            stock: '',
            search: ''
        };
        this.init();
    }

    init() {
        this.loadProducts();
        this.setupRealTimeUpdates();
        this.bindEvents();
    }

    loadProducts() {
        this.products = db.getCollection('products');
        this.renderProducts();
    }

    setupRealTimeUpdates() {
        db.subscribeToChanges('products', (updatedProducts) => {
            this.products = updatedProducts;
            this.renderProducts();
        });
    }

    bindEvents() {
        // Search input
        const searchInput = document.getElementById('productSearch');
        searchInput?.addEventListener('input', (e) => {
            this.currentFilter.search = e.target.value;
            this.renderProducts();
        });

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter?.addEventListener('change', (e) => {
            this.currentFilter.category = e.target.value;
            this.renderProducts();
        });

        // Stock filter
        const stockFilter = document.getElementById('stockFilter');
        stockFilter?.addEventListener('change', (e) => {
            this.currentFilter.stock = e.target.value;
            this.renderProducts();
        });
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        const filteredProducts = this.getFilteredProducts();

        grid.innerHTML = filteredProducts.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    ${this.getStockBadge(product.stock)}
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-category">${product.category}</p>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="stock-info">Stock: ${product.stock}</div>
                </div>
                <div class="product-actions">
                    <button onclick="productManager.editProduct('${product.id}')" class="edit-btn">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="productManager.deleteProduct('${product.id}')" class="delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    getStockBadge(stock) {
        if (stock <= 0) {
            return '<span class="stock-badge out">Out of Stock</span>';
        }
        if (stock <= 10) {
            return '<span class="stock-badge low">Low Stock</span>';
        }
        return '';
    }

    getFilteredProducts() {
        return this.products.filter(product => {
            // Category filter
            if (this.currentFilter.category && product.category !== this.currentFilter.category) {
                return false;
            }

            // Stock filter
            if (this.currentFilter.stock) {
                switch (this.currentFilter.stock) {
                    case 'out-of-stock':
                        if (product.stock > 0) return false;
                        break;
                    case 'low-stock':
                        if (product.stock <= 0 || product.stock > 10) return false;
                        break;
                    case 'in-stock':
                        if (product.stock <= 10) return false;
                        break;
                }
            }

            // Search filter
            if (this.currentFilter.search) {
                const search = this.currentFilter.search.toLowerCase();
                return product.name.toLowerCase().includes(search) ||
                       product.description.toLowerCase().includes(search);
            }

            return true;
        });
    }

    showAddModal() {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('modalTitle');
        const imagePreview = document.getElementById('imagePreview');

        form.reset();
        form.removeAttribute('data-edit-id');
        imagePreview.style.display = 'none';
        imagePreview.src = '#';
        document.getElementById('productImage').value = '';
        title.textContent = 'Add Product';
        modal.style.display = 'flex';
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('modalTitle');

        form.dataset.editId = productId;
        title.textContent = 'Edit Product';

        // Fill form with product data
        form.productName.value = product.name;
        form.productPrice.value = product.price;
        form.productStock.value = product.stock;
        form.productCategory.value = product.category;
        form.productDescription.value = product.description;
        form.productImage.value = product.image;

        modal.style.display = 'flex';
    }

    handleSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const productData = {
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            stock: parseInt(formData.get('stock')),
            category: formData.get('category'),
            description: formData.get('description'),
            image: document.getElementById('productImage').value || document.getElementById('imagePreview').src
        };

        if (form.dataset.editId) {
            this.updateProduct(form.dataset.editId, productData);
        } else {
            this.addProduct(productData);
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                document.getElementById('productImage').value = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    validateProduct(productData) {
        const errors = [];
        
        if (!productData.name || productData.name.trim().length < 3) {
            errors.push('Product name must be at least 3 characters long');
        }
        
        if (!productData.price || isNaN(productData.price) || productData.price <= 0) {
            errors.push('Price must be a valid number greater than 0');
        }
        
        if (!productData.stock || isNaN(productData.stock) || productData.stock < 0) {
            errors.push('Stock must be a valid number (0 or greater)');
        }
        
        if (!productData.category || productData.category.trim() === '') {
            errors.push('Please select a category');
        }
        
        if (!productData.description || productData.description.trim().length < 10) {
            errors.push('Description must be at least 10 characters long');
        }
        
        if (!productData.image) {
            errors.push('Please upload a product image');
        }
        
        return errors;
    }

    addProduct(productData) {
        try {
            const errors = this.validateProduct(productData);
            if (errors.length > 0) {
                this.showNotification(errors.join('\n'), 'error');
                return;
            }

            const newProduct = {
                id: Date.now().toString(), // Simple ID generation
                ...productData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                rating: 0,
                ratingCount: 0,
                reviews: [],
                originalPrice: null,
                badge: 'new'
            };

            // Get existing products
            const existingProducts = db.getCollection('products') || [];
            
            // Add new product
            existingProducts.push(newProduct);
            
            // Save to database
            db.saveCollection('products', existingProducts);
            
            // Update local products
            this.products = existingProducts;
            
            // Show success message
            this.showNotification('Product added successfully', 'success');
            
            // Close modal and refresh display
            this.closeModal();
            this.renderProducts();
        } catch (error) {
            console.error('Error adding product:', error);
            this.showNotification('Error adding product: ' + error.message, 'error');
        }
    }

    updateProduct(productId, productData) {
        const errors = this.validateProduct(productData);
        if (errors.length > 0) {
            this.showNotification(errors.join('\n'), 'error');
            return;
        }

        const index = this.products.findIndex(p => p.id === productId);
        if (index !== -1) {
            this.products[index] = {
                ...this.products[index],
                ...productData,
                updatedAt: new Date().toISOString()
            };
            db.saveCollection('products', this.products);
            this.showNotification('Product updated successfully');
            this.closeModal();
        }
    }

    deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            // Check if product is in any orders
            const orders = db.getCollection('orders');
            const isInOrders = orders.some(order => 
                order.items.some(item => item.id === productId)
            );

            if (isInOrders) {
                if (!confirm('This product exists in orders. Deleting it may affect order history. Continue?')) {
                    return;
                }
            }

            this.products = this.products.filter(p => p.id !== productId);
            db.saveCollection('products', this.products);
            this.showNotification('Product deleted successfully', 'warning');
        }
    }

    closeModal() {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const imagePreview = document.getElementById('imagePreview');

        form.reset();
        imagePreview.style.display = 'none';
        imagePreview.src = '#';
        document.getElementById('productImage').value = '';
        modal.style.display = 'none';
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    importProducts() {
        // Implement CSV import functionality
        alert('Import functionality coming soon!');
    }

    exportProducts() {
        const csv = this.convertToCSV(this.products);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    convertToCSV(products) {
        const headers = ['ID', 'Name', 'Price', 'Stock', 'Category', 'Description'];
        const rows = products.map(product => [
            product.id,
            product.name,
            product.price,
            product.stock,
            product.category,
            product.description
        ]);

        return [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
    }
}

const productManager = new ProductManager(); 