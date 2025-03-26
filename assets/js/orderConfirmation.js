class OrderConfirmation {
    constructor() {
        this.orderDetails = JSON.parse(localStorage.getItem('lastOrder')) || {};
        this.init();
    }

    init() {
        this.generateOrderNumber();
        this.setOrderDate();
        this.displayOrderDetails();
        this.setEstimatedDelivery();
        this.displayShippingAddress();
    }

    generateOrderNumber() {
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        document.getElementById('orderNumber').textContent = orderNumber;
    }

    setOrderDate() {
        const date = new Date();
        document.getElementById('orderDate').textContent = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    setEstimatedDelivery() {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5); // Estimate 5 days for delivery
        document.getElementById('estimatedDelivery').textContent = deliveryDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    displayOrderDetails() {
        const items = this.orderDetails.items || [];
        const confirmedItems = document.querySelector('.confirmed-items');

        confirmedItems.innerHTML = items.map(item => `
            <div class="confirmed-item">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="item-quantity">Quantity: ${item.quantity}</p>
                    <p class="item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                </div>
            </div>
        `).join('');

        // Update totals
        const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shipping = subtotal > 50 ? 0 : 5.99;
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;

        document.querySelector('.subtotal-amount').textContent = `$${subtotal.toFixed(2)}`;
        document.querySelector('.shipping-amount').textContent = `$${shipping.toFixed(2)}`;
        document.querySelector('.tax-amount').textContent = `$${tax.toFixed(2)}`;
        document.querySelector('.total-amount').textContent = `$${total.toFixed(2)}`;
    }

    displayShippingAddress() {
        const address = this.orderDetails.shippingAddress || {};
        document.getElementById('shippingAddress').innerHTML = `
            <p>${address.firstName} ${address.lastName}</p>
            <p>${address.address}</p>
            <p>${address.city}, ${address.state} ${address.zipCode}</p>
        `;
    }
}

// Initialize order confirmation
const orderConfirmation = new OrderConfirmation(); 