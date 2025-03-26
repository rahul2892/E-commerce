class CartManager {
    constructor() {
        this.cart = [];
        this.init();
    }

    init() {
        this.loadCart();
        this.bindCartEvents();
        this.renderCartItems();
        this.bindCheckoutButton();
    }

    loadCart() {
        this.cart = db.getCollection('cart');
        this.updateCartUI();
    }

    bindCartEvents() {
        document.body.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart')) {
                const productId = e.target.dataset.productId;
                this.addToCart(productId);
            }
            if (e.target.closest('.remove-item-btn')) {
                const productId = e.target.dataset.id;
                this.removeItem(productId);
            }
        });
    }

    addToCart(productId) {
        const product = db.getCollection('products').find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.cart.push({
                ...product,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }

        db.saveCollection('cart', this.cart);
        this.showNotification(`${product.name} added to cart`);
        this.updateCartUI();
        this.renderCartItems();
    }

    updateCartUI() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        }
        
        const totalAmount = document.querySelector('.total-amount');
        if (totalAmount) {
            totalAmount.textContent = `$${this.getCartTotal().toFixed(2)}`;
        }
    }

    renderCartItems() {
        const cartItemsContainer = document.querySelector('#cartItems') || 
                                 document.querySelector('.cart-items');
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = this.cart.map(item => `
            <div class="cart-page-item" data-id="${item.id}">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <div class="item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn" data-action="decrease">-</button>
                    <input type="number" value="${item.quantity}" min="1">
                    <button class="quantity-btn" data-action="increase">+</button>
                </div>
                <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
                <button class="remove-item-btn" data-id="${item.id}">&times;</button>
            </div>
        `).join('');

        this.addCartItemListeners();
        this.updateCartTotals();
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    addCartItemListeners() {
        document.querySelectorAll('.cart-page-item').forEach(item => {
            const input = item.querySelector('input');
            const removeBtn = item.querySelector('.remove-item-btn');
            
            input.addEventListener('change', (e) => {
                this.updateQuantity(item.dataset.id, parseInt(e.target.value));
            });

            item.querySelectorAll('.quantity-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    const newValue = action === 'increase' 
                        ? parseInt(input.value) + 1
                        : Math.max(1, parseInt(input.value) - 1);
                    input.value = newValue;
                    this.updateQuantity(item.dataset.id, newValue);
                });
            });

            removeBtn.addEventListener('click', () => {
                this.removeItem(item.dataset.id);
            });
        });
    }

    updateQuantity(productId, newQuantity) {
        const item = this.cart.find(i => i.id === productId);
        if (item) {
            item.quantity = newQuantity;
            db.saveCollection('cart', this.cart);
            this.updateCartUI();
        }
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        db.saveCollection('cart', this.cart);
        this.renderCartItems();
        this.updateCartUI();
        this.showNotification('Item removed from cart', 'warning');
    }

    showNotification(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }

    renderCartPage() {
        this.renderCartItems();
        this.updateCartTotals();
    }

    updateCartTotals() {
        const subtotal = this.getCartTotal();
        const shipping = 5.00; // Flat rate shipping
        const total = subtotal + shipping;

        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    }

    bindCheckoutButton() {
        document.getElementById('checkoutButton')?.addEventListener('click', () => {
            this.handleCheckout();
        });
    }

    handleCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty', 'warning');
            return;
        }
        window.location.href = 'checkout.html';
    }

    renderCheckoutPage() {
        const checkoutItems = document.getElementById('checkoutItems');
        if (checkoutItems) {
            checkoutItems.innerHTML = this.cart.map(item => `
                <div class="checkout-item">
                    <div class="item-name">${item.name}</div>
                    <div class="item-quantity">${item.quantity}x</div>
                    <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            `).join('');
            
            document.getElementById('checkoutTotal').textContent = 
                `$${this.getCartTotal().toFixed(2)}`;
        }
    }

    renderOrderConfirmation() {
        const orderItems = document.getElementById('orderItems');
        if (orderItems) {
            orderItems.innerHTML = this.cart.map(item => `
                <div class="order-item">
                    <img src="${item.image}" alt="${item.name}" class="order-item-image">
                    <div class="order-item-info">
                        <h4>${item.name}</h4>
                        <div class="order-item-qty">Quantity: ${item.quantity}</div>
                        <div class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('orderTotal').textContent = 
                `$${this.getCartTotal().toFixed(2)}`;
            
            // Clear cart after showing confirmation
            this.clearCart();
        }
    }

    clearCart() {
        this.cart = [];
        db.saveCollection('cart', this.cart);
        this.updateCartUI();
    }

    renderCheckoutSummary() {
        const orderItems = document.getElementById('orderItems');
        if (!orderItems) return;

        orderItems.innerHTML = this.cart.map(item => `
            <div class="order-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <div class="item-quantity">Quantity: ${item.quantity}</div>
                    <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            </div>
        `).join('');

        // Update totals
        const subtotal = this.getCartTotal();
        const shipping = subtotal > 50 ? 0 : 5.99;
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;

        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
        document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    }
}

// Initialize cart manager
const cartManager = new CartManager();