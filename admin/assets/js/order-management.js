class OrderManager {
    constructor() {
        this.orders = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadOrders();
        this.setupRealTimeUpdates();
        this.bindEvents();
    }

    loadOrders() {
        this.orders = db.getCollection('orders');
        this.renderOrders();
    }

    setupRealTimeUpdates() {
        db.subscribeToChanges('orders', (updatedOrders) => {
            this.orders = updatedOrders;
            this.renderOrders();
        });
    }

    bindEvents() {
        // Status tab clicks
        document.querySelectorAll('.status-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelector('.status-tab.active').classList.remove('active');
                tab.classList.add('active');
                this.currentFilter = tab.dataset.status;
                this.renderOrders();
            });
        });

        // Search input
        const searchInput = document.getElementById('orderSearch');
        searchInput?.addEventListener('input', (e) => {
            this.filterOrders(e.target.value);
        });

        // Date filter
        const dateFilter = document.getElementById('dateFilter');
        dateFilter?.addEventListener('change', (e) => {
            this.filterByDate(e.target.value);
        });
    }

    renderOrders() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        const filteredOrders = this.getFilteredOrders();

        ordersList.innerHTML = filteredOrders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customer.name}</td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>$${order.total.toFixed(2)}</td>
                <td>
                    <span class="status-badge ${order.status.toLowerCase()}">
                        ${order.status}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button onclick="orderManager.viewOrder('${order.id}')" class="view-btn">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="orderManager.updateStatus('${order.id}')" class="status-btn">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${order.status === 'Pending' ? `
                            <button onclick="orderManager.cancelOrder('${order.id}')" class="cancel-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.getElementById('orderModal');
        const details = document.getElementById('orderDetails');

        details.innerHTML = `
            <div class="order-info">
                <div class="order-header">
                    <h3>Order #${order.id}</h3>
                    <span class="status-badge ${order.status.toLowerCase()}">
                        ${order.status}
                    </span>
                </div>
                <div class="customer-info">
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> ${order.customer.name}</p>
                    <p><strong>Email:</strong> ${order.customer.email}</p>
                    <p><strong>Phone:</strong> ${order.customer.phone}</p>
                </div>
                <div class="shipping-info">
                    <h4>Shipping Address</h4>
                    <p>${order.shipping.address}</p>
                    <p>${order.shipping.city}, ${order.shipping.state} ${order.shipping.zip}</p>
                </div>
                <div class="order-items">
                    <h4>Order Items</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${item.price.toFixed(2)}</td>
                                    <td>$${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="order-summary">
                    <div class="summary-row">
                        <span>Subtotal</span>
                        <span>$${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Shipping</span>
                        <span>$${order.shipping.cost.toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Tax</span>
                        <span>$${order.tax.toFixed(2)}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total</span>
                        <span>$${order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    }

    updateStatus(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const newStatus = prompt('Enter new status (Pending, Processing, Shipped, Delivered, Cancelled):', order.status);
        if (newStatus && this.isValidStatus(newStatus)) {
            order.status = newStatus;
            order.updatedAt = new Date().toISOString();
            db.saveCollection('orders', this.orders);
            this.showNotification('Order status updated successfully');
        }
    }

    isValidStatus(status) {
        return ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status);
    }

    cancelOrder(orderId) {
        if (confirm('Are you sure you want to cancel this order?')) {
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = 'Cancelled';
                order.updatedAt = new Date().toISOString();
                db.saveCollection('orders', this.orders);
                this.showNotification('Order cancelled successfully', 'warning');
            }
        }
    }

    getFilteredOrders() {
        let filtered = [...this.orders];
        
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(order => 
                order.status.toLowerCase() === this.currentFilter
            );
        }

        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    exportOrders() {
        const csv = this.convertToCSV(this.orders);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'orders.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    convertToCSV(orders) {
        const headers = ['Order ID', 'Customer', 'Date', 'Status', 'Total'];
        const rows = orders.map(order => [
            order.id,
            order.customer.name,
            new Date(order.date).toLocaleDateString(),
            order.status,
            order.total.toFixed(2)
        ]);

        return [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    closeModal() {
        document.getElementById('orderModal').style.display = 'none';
    }
}

const orderManager = new OrderManager(); 