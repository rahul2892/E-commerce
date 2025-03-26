class LocalDatabase {
    constructor() {
        this.dbName = 'craftycommerce_db';
        this.subscribers = new Map();
        this.init();
        this.setupStorageListener();
    }

    init() {
        // Initialize collections with existing e-commerce data
        const collections = {
            products: this.getExistingProducts(),
            orders: this.getExistingOrders(),
            users: this.getExistingUsers(),
            cart: this.getExistingCart()
        };

        // Save initialized collections
        Object.entries(collections).forEach(([key, value]) => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        });
    }

    getExistingProducts() {
        return JSON.parse(localStorage.getItem('products')) || [];
    }

    getExistingOrders() {
        return JSON.parse(localStorage.getItem('orders')) || [];
    }

    getExistingUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }

    getExistingCart() {
        return JSON.parse(localStorage.getItem('cart')) || [];
    }

    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (this.subscribers.has(e.key)) {
                const callbacks = this.subscribers.get(e.key);
                callbacks.forEach(callback => callback(JSON.parse(e.newValue)));
            }
        });
    }

    subscribeToChanges(collectionName, callback) {
        if (!this.subscribers.has(collectionName)) {
            this.subscribers.set(collectionName, new Set());
        }
        this.subscribers.get(collectionName).add(callback);
    }

    unsubscribeFromChanges(collectionName, callback) {
        if (this.subscribers.has(collectionName)) {
            this.subscribers.get(collectionName).delete(callback);
        }
    }

    getCollection(collectionName) {
        return JSON.parse(localStorage.getItem(collectionName) || '[]');
    }

    saveCollection(collectionName, data) {
        localStorage.setItem(collectionName, JSON.stringify(data));
        this.notifySubscribers(collectionName, data);
    }

    notifySubscribers(collectionName, data) {
        if (this.subscribers.has(collectionName)) {
            this.subscribers.get(collectionName).forEach(callback => callback(data));
        }
        // Dispatch storage event for cross-tab communication
        window.dispatchEvent(new StorageEvent('storage', {
            key: collectionName,
            newValue: JSON.stringify(data)
        }));
    }

    // Real-time analytics methods
    getAnalytics() {
        const orders = this.getCollection('orders');
        const products = this.getCollection('products');
        const users = this.getCollection('users');

        return {
            totalSales: this.calculateTotalSales(orders),
            recentOrders: this.getRecentOrders(orders),
            topProducts: this.getTopProducts(orders, products),
            activeUsers: this.getActiveUsers(users),
            lowStockProducts: this.getLowStockProducts(products)
        };
    }

    calculateTotalSales(orders) {
        return orders.reduce((total, order) => total + order.total, 0);
    }

    getRecentOrders(orders, limit = 5) {
        return [...orders]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    getTopProducts(orders, products) {
        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                productSales[item.id] = (productSales[item.id] || 0) + item.quantity;
            });
        });

        return Object.entries(productSales)
            .map(([id, quantity]) => ({
                product: products.find(p => p.id === id),
                quantity
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }

    getActiveUsers(users) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return users.filter(user => 
            new Date(user.lastActivity) > thirtyDaysAgo
        );
    }

    getLowStockProducts(products, threshold = 10) {
        return products.filter(product => product.stock <= threshold);
    }
}

const db = new LocalDatabase(); 