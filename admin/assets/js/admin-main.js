class AdminDashboard {
    constructor() {
        this.orders = [];
        this.currentTab = 'all';
        this.analytics = {};
        this.init();
    }

    init() {
        this.loadData();
        this.setupRealTimeUpdates();
        this.bindEvents();
        this.startAutoRefresh();
    }

    loadData() {
        this.orders = db.getCollection('orders');
        this.analytics = db.getAnalytics();
        this.renderDashboard();
    }

    setupRealTimeUpdates() {
        // Listen for order updates
        db.subscribeToChanges('orders', (updatedOrders) => {
            this.orders = updatedOrders;
            this.analytics = db.getAnalytics();
            this.renderDashboard();
        });

        // Listen for product updates
        db.subscribeToChanges('products', () => {
            this.analytics = db.getAnalytics();
            this.renderDashboard();
        });

        // Listen for user updates
        db.subscribeToChanges('users', () => {
            this.analytics = db.getAnalytics();
            this.renderDashboard();
        });
    }

    startAutoRefresh() {
        // Refresh analytics every minute
        setInterval(() => {
            this.analytics = db.getAnalytics();
            this.renderDashboard();
        }, 60000);
    }

    renderDashboard() {
        this.renderAnalytics();
        this.renderOrders();
        this.renderLowStockAlerts();
    }

    renderAnalytics() {
        const statsContainer = document.getElementById('dashboardStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <h3>Total Sales</h3>
                <div class="stat-value">$${this.analytics.totalSales.toFixed(2)}</div>
            </div>
            <div class="stat-card">
                <h3>Active Users</h3>
                <div class="stat-value">${this.analytics.activeUsers.length}</div>
            </div>
            <div class="stat-card">
                <h3>Pending Orders</h3>
                <div class="stat-value">${this.orders.filter(o => o.status === 'pending').length}</div>
            </div>
            <div class="stat-card">
                <h3>Low Stock Items</h3>
                <div class="stat-value">${this.analytics.lowStockProducts.length}</div>
            </div>
        `;
    }

    renderOrders() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        const filteredOrders = this.getFilteredOrders();
        ordersList.innerHTML = filteredOrders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customer.name}</td>
                <td>${order.customer.phone}</td>
                <td>${order.items.length} items</td>
                <td>$${order.total.toFixed(2)}</td>
                <td>
                    <span class="status-badge ${order.status.toLowerCase()}">
                        ${order.status}
                    </span>
                </td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>
                    <div class="table-actions">
                        <button onclick="adminDashboard.viewOrder('${order.id}')" class="view-btn">
                            View
                        </button>
                        <button onclick="adminDashboard.updateOrderStatus('${order.id}')" class="status-btn">
                            Update
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderLowStockAlerts() {
        const alertsContainer = document.getElementById('lowStockAlerts');
        if (!alertsContainer) return;

        const lowStockProducts = this.analytics.lowStockProducts;
        alertsContainer.innerHTML = lowStockProducts.map(product => `
            <div class="alert-item">
                <span class="alert-badge">Low Stock</span>
                <span class="product-name">${product.name}</span>
                <span class="stock-count">${product.stock} left</span>
            </div>
        `).join('');
    }

    updateOrderStatus(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const newStatus = prompt('Update order status (pending/processing/shipped/delivered):', order.status);
        if (newStatus && this.isValidStatus(newStatus)) {
            order.status = newStatus.toLowerCase();
            order.lastUpdated = new Date().toISOString();
            db.saveCollection('orders', this.orders);
        }
    }

    isValidStatus(status) {
        return ['pending', 'processing', 'shipped', 'delivered'].includes(status.toLowerCase());
    }

    getFilteredOrders() {
        if (this.currentTab === 'all') {
            return this.orders;
        }
        return this.orders.filter(order => 
            order.status.toLowerCase() === this.currentTab
        );
    }

    viewOrder(orderId) {
        // Implement view order functionality
        window.location.href = `pages/orders/view-order.html?id=${orderId}`;
    }
}

const adminDashboard = new AdminDashboard(); 