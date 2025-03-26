class OrdersManager {
    constructor() {
        this.orders = [];
        this.init();
    }

    init() {
        this.loadOrders();
        this.renderOrders();
    }

    loadOrders() {
        this.orders = db.getCollection('orders');
    }

    renderOrders() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        ordersList.innerHTML = this.orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">Order #${order.orderId}</div>
                    <div class="order-date">${new Date(order.orderDate).toLocaleDateString()}</div>
                    <div class="order-status ${order.status}">${order.status}</div>
                </div>
                <div class="order-details">
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <img src="${item.image}" alt="${item.name}">
                                <div class="item-info">
                                    <h4>${item.name}</h4>
                                    <div class="item-qty">Qty: ${item.quantity}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-total">
                        <span>Total:</span>
                        <span>$${order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Initialize orders manager
const ordersManager = new OrdersManager(); 