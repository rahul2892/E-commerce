class PaymentManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.updatePaymentAmount();
    }

    bindEvents() {
        const cardForm = document.getElementById('cardForm');
        cardForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processCardPayment();
        });

        const upiForm = document.getElementById('upiForm');
        upiForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processUPIPayment();
        });
    }

    processCardPayment() {
        const cardNumber = document.getElementById('cardNumber').value.trim();
        const expiryDate = document.getElementById('expiryDate').value.trim();
        const cvv = document.getElementById('cvv').value.trim();

        // Validate card details
        if (cardNumber === '4111111111111111' && expiryDate === '12/34' && cvv === '123') {
            alert('Payment successful!');
            window.location.href = 'order-confirmation.html'; // Redirect to confirmation page
        } else {
            alert('Invalid card details. Please use the test card details provided.');
        }
    }

    processUPIPayment() {
        alert('UPI Payment processed successfully!');
        window.location.href = 'order-confirmation.html'; // Redirect to confirmation page
    }

    updatePaymentAmount() {
        const amount = this.getPaymentAmount();
        document.getElementById('cardPaymentAmount').textContent = amount.toFixed(2);
    }

    getPaymentAmount() {
        // Replace with actual cart total calculation
        return 49.99; // Example amount
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PaymentManager();
});