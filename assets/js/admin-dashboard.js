class AdminDashboard {
    constructor() {
        this.orders = [];
        this.products = [];
        this.users = [];
    }

    async loadDashboardData() {
        // Fetch data from the database
        this.orders = db.getCollection('orders') || [];
        this.products = db.getCollection('products') || [];
        this.users = db.getCollection('users') || [];

        // Update dashboard stats
        this.updateOrdersData(this.orders);
        this.updateStats();
        this.setupRealTimeUpdates();
    }

    updateOrdersData(orders) {
        this.orders = orders; // Update the local orders array
        const ordersElement = document.querySelector('.dashboard-stats .stat-card:nth-child(2) .value');
        if (ordersElement) {
            ordersElement.textContent = orders.length; // Display the total number of orders
        }

        // Update recent activity section
        const activityList = document.getElementById('activityList');
        if (activityList) {
            activityList.innerHTML = orders
                .slice(-5) // Show the last 5 orders
                .map(order => `
                    <div class="activity-item">
                        <p>Order #${order.id} - <strong>${order.status}</strong></p>
                        <span>${new Date(order.date).toLocaleString()}</span>
                    </div>
                `).join('');
        }
    }

    updateStats() {
        // Calculate total sales
        const totalSales = this.orders
            .filter(order => order.status === 'Confirmed') // Only include confirmed orders
            .reduce((sum, order) => sum + (order.total || 0), 0);

        const totalSalesElement = document.querySelector('.dashboard-stats .stat-card:nth-child(1) .value');
        if (totalSalesElement) {
            totalSalesElement.textContent = `$${totalSales.toFixed(2)}`;
        }

        // Display total number of active users
        const activeUsers = this.users.filter(user => user.status === 'active').length;
        const activeUsersElement = document.querySelector('.dashboard-stats .stat-card:nth-child(3) .value');
        if (activeUsersElement) {
            activeUsersElement.textContent = activeUsers;
        }

        // Display total number of products
        const productsElement = document.querySelector('.dashboard-stats .stat-card:nth-child(4) .value');
        if (productsElement) {
            productsElement.textContent = this.products.length;
        }
    }

    setupRealTimeUpdates() {
        db.subscribeToChanges('orders', (updatedOrders) => {
            this.updateOrdersData(updatedOrders);
            this.updateStats(); // Ensure stats are updated in real-time
        });
    }
}

const adminDashboard = new AdminDashboard();
adminDashboard.loadDashboardData();
