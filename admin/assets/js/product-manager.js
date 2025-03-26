class ProductManager {
    constructor() {
        this.products = [];
        this.init();
    }

    init() {
        this.loadProducts();
        this.setupEventListeners();
        db.subscribeToChanges('products', (products) => {
            this.products = products;
            this.renderProducts();
        });
    }

    loadProducts() {
        this.products = db.getCollection('products');
        this.renderProducts();
    }

    setupEventListeners() {
        const productList = document.getElementById('productList');
        if (productList) {
            productList.addEventListener('click', (e) => {
                const deleteBtn = e.target.closest('.delete-product');
                const editBtn = e.target.closest('.edit-product');
                
                if (deleteBtn) {
                    const productId = deleteBtn.dataset.productId;
                    this.confirmDelete(productId);
                } else if (editBtn) {
                    const productId = editBtn.dataset.productId;
                    this.showEditForm(productId);
                }
            });
        }
    }

    renderProducts() {
        const productList = document.getElementById('productList');
        if (!productList) return;

        productList.innerHTML = this.products.map(product => `
            <tr>
                <td>
                    <div class="product-info">
                        <img src="${product.image}" alt="${product.name}">
                        <span>${product.name}</span>
                    </div>
                </td>
                <td>${product.category}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>${product.status || 'Active'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-product" data-product-id="${product.id}">
                            <img src="../assets/icons/edit-icon.svg" alt="Edit">
                        </button>
                        <button class="delete-product" data-product-id="${product.id}">
                            <img src="../assets/icons/delete-icon.svg" alt="Delete">
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    confirmDelete(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Confirm Delete</h2>
                <p>Are you sure you want to delete "${product.name}"?</p>
                <div class="modal-actions">
                    <button class="cancel-btn">Cancel</button>
                    <button class="delete-btn">Delete</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle modal actions
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.delete-btn').addEventListener('click', () => {
            this.deleteProduct(productId);
            modal.remove();
        });
    }

    async deleteProduct(productId) {
        try {
            // Remove product from array
            this.products = this.products.filter(p => p.id !== productId);
            
            // Save to database
            db.saveCollection('products', this.products);

            // Show success notification
            this.showNotification('Product deleted successfully', 'success');

            // Notify admin panel
            db.broadcastNotification({
                type: 'product_deleted',
                title: 'Product Deleted',
                message: 'A product has been removed from the catalog'
            });

        } catch (error) {
            this.showNotification('Failed to delete product', 'error');
            console.error('Error deleting product:', error);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize product manager
const productManager = new ProductManager(); 