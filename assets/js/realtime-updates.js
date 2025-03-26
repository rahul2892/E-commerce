class RealtimeManager {
    constructor() {
        this.init();
    }

    init() {
        // Subscribe to product updates
        db.subscribeToChanges('products', (products) => {
            this.handleProductUpdate(products);
        });

        // Subscribe to user updates
        db.subscribeToChanges('users', (users) => {
            this.handleUserUpdate(users);
        });
    }

    handleProductUpdate(products) {
        // Update product listings if on product page
        const productList = document.querySelector('.product-grid');
        if (productList) {
            // Refresh product display
            productManager.renderProducts(products);
        }

        // Update cart if products in cart are modified
        if (window.cart) {
            cart.refreshCart();
        }
    }

    handleUserUpdate(users) {
        // Update user management in admin panel
        if (window.userManager) {
            userManager.refreshUsers();
        }

        // Update current user's profile if needed
        const currentUser = auth.currentUser;
        if (currentUser) {
            const updatedUser = users.find(u => u.id === currentUser.id);
            if (updatedUser) {
                auth.currentUser = updatedUser;
                auth.updateUI();
            }
        }
    }
}

const realtimeManager = new RealtimeManager();