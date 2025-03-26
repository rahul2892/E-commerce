class AdminDashboard {
    constructor() {
        this.salesChart = null;
        this.productsChart = null;
        this.init();
    }

    init() {
        this.setupRealTimeUpdates();
        this.initializeCharts();
        this.loadInitialData();
    }

    setupRealTimeUpdates() {
        // Subscribe to database changes
        db.subscribeToChanges('orders', () => this.updateOrderStats());
        db.subscribeToChanges('products', () => this.updateProductStats());
        db.subscribeToChanges('users', () => this.updateUserStats());
        db.subscribeToChanges('notifications', () => this.updateRecentActivity());
    }

    async loadInitialData() {
        await Promise.all([
            this.updateOrderStats(),
            this.updateProductStats(),
            this.updateUserStats(),
            this.updateRecentActivity()
        ]);
    }

    async updateOrderStats() {
        const orders = db.getCollection('orders');
        const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
        const recentOrders = orders.filter(order => 
            new Date(order.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );

        // Update stats card
        document.querySelector('.stat-card:nth-child(1) .value').textContent = 
            `$${totalSales.toFixed(2)}`;
        document.querySelector('.stat-card:nth-child(2) .value').textContent = 
            orders.length.toString();

        // Update sales chart
        this.updateSalesChart(orders);
    }

    async updateProductStats() {
        const products = db.getCollection('products');
        
        // Update stats card
        document.querySelector('.stat-card:nth-child(4) .value').textContent = 
            products.length.toString();

        // Update products chart
        this.updateProductsChart(products);
    }

    async updateUserStats() {
        const users = db.getCollection('users');
        const activeUsers = users.filter(user => 
            new Date(user.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );

        // Update stats card
        document.querySelector('.stat-card:nth-child(3) .value').textContent = 
            activeUsers.length.toString();
    }

    updateRecentActivity() {
        const notifications = db.getCollection('notifications');
        const activityList = document.getElementById('activityList');
        
        const recentActivity = notifications
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        activityList.innerHTML = recentActivity.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${this.getActivityColor(activity.type)}">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div class="activity-info">
                    <h4>${activity.title}</h4>
                    <p>${activity.message}</p>
                    <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    initializeCharts() {
        // Initialize Sales Chart
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        this.salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Daily Sales',
                    data: [],
                    borderColor: '#2d6a4f',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // Initialize Products Chart
        const productsCtx = document.getElementById('productsChart').getContext('2d');
        this.productsChart = new Chart(productsCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    updateSalesChart(orders) {
        // Group sales by date
        const salesByDate = orders.reduce((acc, order) => {
            const date = new Date(order.createdAt).toLocaleDateString();
            acc[date] = (acc[date] || 0) + order.total;
            return acc;
        }, {});

        // Update chart data
        this.salesChart.data.labels = Object.keys(salesByDate);
        this.salesChart.data.datasets[0].data = Object.values(salesByDate);
        this.salesChart.update();
    }

    updateProductsChart(products) {
        // Get top 5 products by sales
        const topProducts = products
            .sort((a, b) => (b.sales || 0) - (a.sales || 0))
            .slice(0, 5);

        // Update chart data
        this.productsChart.data.labels = topProducts.map(p => p.name);
        this.productsChart.data.datasets[0].data = topProducts.map(p => p.sales || 0);
        this.productsChart.update();
    }

    getActivityColor(type) {
        const colors = {
            new_order: 'var(--admin-primary)',
            low_stock: 'var(--admin-warning)',
            user_action: 'var(--admin-info)',
            product_update: 'var(--admin-success)',
            default: 'var(--admin-secondary)'
        };
        return colors[type] || colors.default;
    }

    getActivityIcon(type) {
        const icons = {
            new_order: '<i class="fas fa-shopping-bag"></i>',
            low_stock: '<i class="fas fa-exclamation-triangle"></i>',
            user_action: '<i class="fas fa-user"></i>',
            product_update: '<i class="fas fa-box"></i>',
            default: '<i class="fas fa-bell"></i>'
        };
        return icons[type] || icons.default;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
        return date.toLocaleDateString();
    }
}

// Initialize dashboard
const dashboard = new AdminDashboard(); 