class CheckoutManager {
    constructor() {
        this.currentStep = 1;
        this.cart = new ShoppingCart();
        this.init();
    }

    init() {
        // Enable all buttons
        document.querySelectorAll('.checkout-btn').forEach(btn => {
            btn.disabled = false;
        });

        // Check authentication first
        if (!auth.requireAuth()) {
            return;
        }

        this.bindEvents();
        this.updateOrderSummary();
        this.showCurrentStep();
        this.setupStepTransitions();
        this.setupStripe();
    }

    bindEvents() {
        document.getElementById('shippingForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateShipping()) {
                proceedToPayment();
            }
        });

        document.getElementById('paymentForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processPayment();
        });

        document.getElementById('placeOrderBtn')?.addEventListener('click', () => {
            this.placeOrder();
        });

        // Payment method toggle
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', () => {
                this.togglePaymentMethod(method.value);
            });
        });
    }

    goToStep(step) {
        // Hide all sections
        document.querySelectorAll('.checkout-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show current step
        document.getElementById(`${this.getStepName(step)}Section`)?.classList.remove('hidden');
        
        // Update step indicators
        document.querySelectorAll('.step').forEach((stepEl, index) => {
            index + 1 === step 
                ? stepEl.classList.add('active') 
                : stepEl.classList.remove('active');
        });
        
        this.currentStep = step;
    }

    getStepName(step) {
        return ['shipping', 'payment', 'review'][step - 1] || '';
    }

    showCurrentStep() {
        // Hide all sections
        document.querySelectorAll('.checkout-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show current step section
        const currentSection = document.getElementById(`${this.getStepName(this.currentStep)}Section`);
        if (currentSection) {
            currentSection.classList.remove('hidden');
        }
        
        this.updateStepIndicators();
    }

    updateStepIndicators() {
        document.querySelectorAll('.step').forEach((stepEl, index) => {
            if (index + 1 === this.currentStep) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        });
    }

    togglePaymentMethod(method) {
        const cardDetails = document.getElementById('cardDetails');
        if (method === 'card') {
            cardDetails.style.display = 'block';
        } else {
            cardDetails.style.display = 'none';
        }
    }

    updateOrderSummary() {
        const orderItems = document.querySelector('.order-items');
        const summaryTotals = document.querySelector('.summary-totals');
        
        if (!orderItems || !summaryTotals) return;

        // Update items
        orderItems.innerHTML = this.cart.items.map(item => `
            <div class="order-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>Quantity: ${item.quantity}</p>
                    <p class="item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                </div>
            </div>
        `).join('');

        // Calculate totals
        const subtotal = this.cart.calculateTotal();
        const shipping = subtotal > 50 ? 0 : 5.99;
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;

        // Update summary
        summaryTotals.innerHTML = `
            <div class="summary-row">
                <span>Subtotal</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>$${shipping.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Tax</span>
                <span>$${tax.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        `;
    }

    async placeOrder() {
        try {
            // Check authentication again before placing order
            if (!auth.requireAuth()) {
                return;
            }

            const orderBtn = document.getElementById('placeOrderBtn');
            orderBtn.disabled = true;
            orderBtn.innerHTML = '<span class="loading-spinner"></span>Processing...';

            // Get shipping details
            const shippingAddress = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zipCode: document.getElementById('zipCode').value
            };

            // Calculate totals
            const subtotal = this.cart.calculateTotal();
            const shipping = subtotal > 50 ? 0 : 5.99;
            const tax = subtotal * 0.08;
            const total = subtotal + shipping + tax;

            // Save order details
            const orderDetails = {
                orderId: `ORD-${Date.now()}`,
                userId: auth.currentUser.id,
                items: this.cart.items,
                shippingAddress,
                orderDate: new Date(),
                subtotal,
                shipping,
                tax,
                total,
                status: 'confirmed'
            };

            // Save to localStorage (in a real app, this would be saved to a database)
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push(orderDetails);
            localStorage.setItem('orders', JSON.stringify(orders));
            localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Clear cart
            this.cart.items = [];
            this.cart.saveCart();

            // Redirect to confirmation
            window.location.href = '../account/order-confirmation.html';
        } catch (error) {
            alert(error.message || 'There was an error processing your order. Please try again.');
            orderBtn.disabled = false;
            orderBtn.textContent = 'Place Order';
        }
    }

    validateShipping() {
        const requiredFields = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode'];
        let isValid = true;

        requiredFields.forEach(id => {
            const field = document.getElementById(id);
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });

        return isValid;
    }

    setupStepTransitions() {
        // Remove or comment out the existing shipping form handler
        // The handler is now in the HTML file
    }

    setupStripe() {
        this.stripe = Stripe('your_publishable_key_here');
        this.elements = this.stripe.elements();
        
        const style = {
            base: {
                fontSize: '16px',
                color: '#32325d',
            }
        };

        this.cardNumber = this.elements.create('cardNumber', { style });
        this.cardExpiry = this.elements.create('cardExpiry', { style });
        this.cardCvc = this.elements.create('cardCvc', { style });

        this.cardNumber.mount('#cardNumberElement');
        this.cardExpiry.mount('#cardExpiryElement');
        this.cardCvc.mount('#cardCvcElement');
    }

    async processPayment() {
        const { error, paymentMethod } = await this.stripe.createPaymentMethod({
            type: 'card',
            card: this.cardNumber,
            billing_details: {
                name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
                address: {
                    line1: document.getElementById('address').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    postal_code: document.getElementById('zipCode').value
                }
            }
        });

        if (error) {
            this.showPaymentMessage(error.message, 'error');
        } else {
            this.showPaymentMessage('Payment processed successfully!', 'success');
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.completeCheckout();
        }
    }

    showPaymentMessage(message, type = 'error') {
        const messageDiv = document.getElementById('paymentMessage');
        messageDiv.textContent = message;
        messageDiv.className = `payment-message ${type}`;
        messageDiv.style.display = 'block';
    }

    async completeCheckout() {
        // Handle order completion and redirect
        window.location.href = 'order-confirmation.html';
    }
}

// Initialize checkout
const checkout = new CheckoutManager(); 