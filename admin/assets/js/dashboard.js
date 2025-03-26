class DashboardManager {
    constructor() {
        this.init();
        this.setupRealtimeUpdates();
    }

    init() {
        this.loadDashboardData();
        this.setupCharts();
        this.setupEventListeners();
    }

    loadDashboardData() {
        const analytics = db.getAnalytics();
        this.updateOverviewCards(analytics);
        this.updateCharts(analytics);
        this.updateRecentOrders(analytics.recentOrders);
        this.updateLowStockProducts(analytics.lowStockProducts);
    }

    updateOverviewCards(data) {
        // Update total sales
        document.getElementById('totalSales').textContent = 
            `$${data.salesByPeriod.thisMonth.toFixed(2)}`;
        document.getElementById('salesGrowth').textContent = 
            this.calculateGrowth(data.salesByPeriod.thisMonth, data.salesByPeriod.lastMonth) + '%';

        // Update orders
        document.getElementById('totalOrders').textContent = 
            data.recentOrders.length.toString();
        
        // Update customers
        document.getElementById('totalCustomers').textContent = 
            data.userMetrics.total.toString();
        document.getElementById('newCustomers').textContent = 
            `+${data.userMetrics.new}`;

        // Update revenue
        document.getElementById('todayRevenue').textContent = 
            `$${data.salesByPeriod.today.toFixed(2)}`;
        document.getElementById('weekRevenue').textContent = 
            `$${data.salesByPeriod.thisWeek.toFixed(2)}`;
    }

    setupCharts() {
        // Sales Chart
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        this.salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Sales',
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

        // Products Chart
        const productsCtx = document.getElementById('productsChart').getContext('2d');
        this.productsChart = new Chart(productsCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#2d6a4f',
                        '#40916c',
                        '#52b788',
                        '#74c69d',
                        '#95d5b2'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    updateCharts(data) {
        // Update Sales Chart
        const salesData = this.prepareSalesData(data.salesByPeriod);
        this.salesChart.data.labels = salesData.labels;
        this.salesChart.data.datasets[0].data = salesData.values;
        this.salesChart.update();

        // Update Products Chart
        const productData = this.prepareProductData(data.topProducts);
        this.productsChart.data.labels = productData.labels;
        this.productsChart.data.datasets[0].data = productData.values;
        this.productsChart.update();
    }

    prepareSalesData(salesData) {
        const dates = this.getLast7Days();
        const values = dates.map(date => {
            return salesData[date] || 0;
        });

        return {
            labels: dates.map(date => this.formatDate(date)),
            values
        };
    }

    prepareProductData(topProducts) {
        return {
            labels: topProducts.map(p => p.product.name),
            values: topProducts.map(p => p.quantity)
        };
    }

    updateRecentOrders(orders) {
        const container = document.getElementById('recentOrders');
        if (!container) return;

        container.innerHTML = orders.map(order => `
            <div class="order-item">
                <div class="order-info">
                    <h4>Order #${order.orderId}</h4>
                    <span class="order-date">${this.formatDate(order.date)}</span>
                </div>
                <div class="order-status ${order.status}">${order.status}</div>
                <div class="order-amount">$${order.amount.toFixed(2)}</div>
            </div>
        `).join('');
    }

    updateLowStockProducts(products) {
        const container = document.getElementById('lowStockProducts');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="product-item">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <div class="stock-level ${this.getStockLevelClass(product.stock)}">
                        ${product.stock} in stock
                    </div>
                </div>
                <button class="restock-btn" data-id="${product.id}">
                    Restock
                </button>
            </div>
        `).join('');
    }

    setupRealtimeUpdates() {
        // Subscribe to relevant collections
        db.subscribeToChanges('orders', () => this.loadDashboardData());
        db.subscribeToChanges('products', () => this.loadDashboardData());
        db.subscribeToChanges('users', () => this.loadDashboardData());
    }

    setupEventListeners() {
        // Date range selector
        document.getElementById('dateRange')?.addEventListener('change', (e) => {
            this.updateDateRange(e.target.value);
        });

        // Restock buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('restock-btn')) {
                this.handleRestock(e.target.dataset.id);
            }
        });
    }

    // Utility methods
    calculateGrowth(current, previous) {
        if (!previous) return 100;
        return (((current - previous) / previous) * 100).toFixed(1);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    getLast7Days() {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    }

    getStockLevelClass(stock) {
        if (stock <= 5) return 'critical';
        if (stock <= 10) return 'warning';
        return 'normal';
    }

    async handleRestock(productId) {
        const quantity = prompt('Enter restock quantity:');
        if (quantity && !isNaN(quantity)) {
            const products = db.getCollection('products');
            const product = products.find(p => p.id === productId);
            if (product) {
                product.stock += parseInt(quantity);
                db.saveCollection('products', products);
                this.loadDashboardData();
            }
        }
    }
}

// Initialize dashboard
const dashboard = new DashboardManager(); 