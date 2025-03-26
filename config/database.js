class LocalDatabase {
    constructor() {
        this.dbName = 'craftycommerce_db';
        this.subscribers = new Map();
        this.init();
        this.setupBroadcastChannel();
    }

    init() {
        // Initialize collections if empty
        const collections = {
            products: this.getExistingProducts(),
            orders: [],
            users: [],
            cart: [],
            notifications: []
        };

        Object.entries(collections).forEach(([key, defaultValue]) => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(defaultValue));
            }
        });
        
        // Add this block to preserve existing products
        const existingProducts = localStorage.getItem('products');
        if (!existingProducts || JSON.parse(existingProducts).length === 0) {
            localStorage.setItem('products', JSON.stringify(collections.products));
        }

        this.getExistingProducts();
    }

    setupBroadcastChannel() {
        this.channel = new BroadcastChannel('craftycommerce_channel');
        this.channel.onmessage = (event) => {
            const { type, collection, data } = event.data;
            this.handleRealtimeUpdate(collection, data);
        };
    }

    handleRealtimeUpdate(collection, data) {
        localStorage.setItem(collection, JSON.stringify(data));
        if (this.subscribers.has(collection)) {
            this.subscribers.get(collection).forEach(callback => callback(data));
        }
    }

    broadcastUpdate(collection, data) {
        this.channel.postMessage({ type: 'update', collection, data });
    }

    subscribeToChanges(collection, callback) {
        if (!this.subscribers.has(collection)) {
            this.subscribers.set(collection, new Set());
        }
        this.subscribers.get(collection).add(callback);
    }

    unsubscribeFromChanges(collection, callback) {
        if (this.subscribers.has(collection)) {
            this.subscribers.get(collection).delete(callback);
        }
    }

    handleNotification(notification) {
        const notifications = this.getCollection('notifications');
        notifications.push({
            ...notification,
            id: Date.now(),
            timestamp: new Date().toISOString()
        });
        this.saveCollection('notifications', notifications);
    }

    broadcastNotification(notification) {
        this.channel.postMessage({
            type: 'notification',
            data: notification
        });
    }

    getCollection(collectionName) {
        return JSON.parse(localStorage.getItem(collectionName) || '[]');
    }

    saveCollection(collectionName, data) {
        localStorage.setItem(collectionName, JSON.stringify(data));
        this.broadcastUpdate(collectionName, data);
    }

    notifySubscribers(collectionName, data) {
        if (this.subscribers.has(collectionName)) {
            this.subscribers.get(collectionName).forEach(callback => callback(data));
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Add new methods for real-time features
    createOrder(orderData) {
        const orders = this.getCollection('orders');
        const products = this.getCollection('products');
        
        // Update product stock
        orderData.items.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                product.stock -= item.quantity;
            }
        });

        // Save order
        orders.push({
            ...orderData,
            id: Date.now().toString(),
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        // Save updates
        this.saveCollection('orders', orders);
        this.saveCollection('products', products);

        // Notify admin
        this.broadcastNotification({
            type: 'new_order',
            title: 'New Order Received',
            message: `Order #${orderData.id} has been placed`
        });
    }

    updateProductStock(productId, newStock) {
        const products = this.getCollection('products');
        const product = products.find(p => p.id === productId);
        
        if (product) {
            product.stock = newStock;
            if (newStock <= product.lowStockThreshold) {
                this.broadcastNotification({
                    type: 'low_stock',
                    title: 'Low Stock Alert',
                    message: `${product.name} is running low on stock (${newStock} remaining)`
                });
            }
            this.saveCollection('products', products);
        }
    }

    updateOrderStatus(orderId, newStatus) {
        const orders = this.getCollection('orders');
        const order = orders.find(o => o.id === orderId);
        
        if (order) {
            order.status = newStatus;
            order.updatedAt = new Date().toISOString();
            
            this.saveCollection('orders', orders);
            
            // Notify customer
            this.broadcastNotification({
                type: 'order_update',
                title: 'Order Status Updated',
                message: `Order #${orderId} is now ${newStatus}`,
                userId: order.userId
            });
        }
    }

    getNotifications(userId = null, unreadOnly = false) {
        let notifications = this.getCollection('notifications');
        
        if (userId) {
            notifications = notifications.filter(n => 
                !n.userId || n.userId === userId
            );
        }
        
        if (unreadOnly) {
            notifications = notifications.filter(n => !n.read);
        }
        
        return notifications;
    }

    markNotificationRead(notificationId) {
        const notifications = this.getCollection('notifications');
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            this.saveCollection('notifications', notifications);
        }
    }

    // Analytics methods
    getAnalytics() {
        const orders = this.getCollection('orders');
        const products = this.getCollection('products');
        const users = this.getCollection('users');

        return {
            totalSales: this.calculateTotalSales(orders),
            recentOrders: this.getRecentOrders(orders),
            topProducts: this.getTopProducts(orders, products),
            activeUsers: this.getActiveUsers(users),
            lowStockProducts: this.getLowStockProducts(products),
            salesByPeriod: this.getSalesByPeriod(orders),
            userMetrics: this.getUserMetrics(users, orders)
        };
    }

    getSalesByPeriod(orders) {
        const now = new Date();
        const periods = {
            today: 0,
            thisWeek: 0,
            thisMonth: 0
        };

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            if (this.isToday(orderDate)) {
                periods.today += order.total;
            }
            if (this.isThisWeek(orderDate)) {
                periods.thisWeek += order.total;
            }
            if (this.isThisMonth(orderDate)) {
                periods.thisMonth += order.total;
            }
        });

        return periods;
    }

    getUserMetrics(users, orders) {
        return {
            total: users.length,
            new: users.filter(u => this.isThisWeek(new Date(u.createdAt))).length,
            active: users.filter(u => this.isThisMonth(new Date(u.lastActivity))).length,
            withOrders: new Set(orders.map(o => o.userId)).size
        };
    }

    // Helper methods for date comparisons
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isThisWeek(date) {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        return date >= weekStart;
    }

    isThisMonth(date) {
        const now = new Date();
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
    }

    getExistingProducts() {
        return [
            {
                id: "1",
                name: "Handcrafted Bohemian Necklace",
                price: 49.99,
                originalPrice: 69.99,
                image: "assets/images/products/handmade-necklace.jpg",
                category: "jewelry",
                stock: 10,
                rating: 4.5,
                reviews: [],
                createdAt: "2024-01-15",
                sales: 15,
                onSale: true
            },
            {
                id: "2",
                name: "Handmade Ceramic Flower Vase",
                price: 79.99,
                image: "assets/images/products/ceramic-vase.jpg",
                category: "home-decor",
                stock: 5,
                rating: 4.8,
                reviews: [],
                createdAt: "2024-02-01",
                sales: 8,
                onSale: false
            },
            // Add more products following the same structure
        ];
    }
}

// Initialize database
const db = new LocalDatabase();