class AuthService {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.isAuthenticated = true;
            this.updateUI();
        }

        this.bindLoginForm();

        // Check if user just registered
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === 'true') {
            this.showSuccess('Account created successfully! Please log in.');
        }
    }

    bindLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                if (this.validateLoginForm(email, password)) {
                    this.login({ email, password });
                }
            });
        }
    }

    validateLoginForm(email, password) {
        let isValid = true;
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        // Reset previous errors
        this.clearErrors();

        // Validate email
        if (!email) {
            this.showFieldError(emailInput, 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError(emailInput, 'Please enter a valid email');
            isValid = false;
        }

        // Validate password
        if (!password) {
            this.showFieldError(passwordInput, 'Password is required');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    showFieldError(input, message) {
        input.classList.add('error');
        const errorSpan = input.nextElementSibling;
        if (errorSpan && errorSpan.classList.contains('error-message')) {
            errorSpan.textContent = message;
        }
    }

    clearErrors() {
        document.querySelectorAll('.error-message').forEach(span => span.textContent = '');
        document.querySelectorAll('.error').forEach(input => input.classList.remove('error'));
    }

    async login(credentials) {
        try {
            const button = document.getElementById('loginButton');
            const buttonText = button.querySelector('.button-text');
            button.disabled = true;
            buttonText.innerHTML = '<span class="loading-spinner"></span>Signing in...';

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if user exists in localStorage (for demo purposes)
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === credentials.email);

            if (!user) {
                throw new Error('No account found with this email');
            }

            // In a real app, you would hash and properly compare passwords
            if (user.password !== credentials.password) {
                throw new Error('Invalid password');
            }

            // Login successful
            this.isAuthenticated = true;
            this.currentUser = {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            };

            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            // Update UI immediately
            this.updateUI();

            // Show success message
            this.showSuccess('Login successful! Redirecting...');

            // Get return URL from query parameters
            const params = new URLSearchParams(window.location.search);
            const returnUrl = params.get('returnUrl');

            // Redirect after a short delay to show success message
            setTimeout(() => {
                if (returnUrl && !returnUrl.includes('login.html')) {
                    // If there's a valid return URL, use it
                    window.location.href = returnUrl;
                } else {
                    // Use relative path to go up two directories to reach index.html
                    window.location.href = '../../index.html';
                }
            }, 1000);

        } catch (error) {
            this.showError(error.message);
            const button = document.getElementById('loginButton');
            const buttonText = button.querySelector('.button-text');
            button.disabled = false;
            buttonText.textContent = 'Sign In';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert error';
        errorDiv.textContent = message;
        this.showAlert(errorDiv);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert success';
        successDiv.textContent = message;
        this.showAlert(successDiv);
    }

    showAlert(alertDiv) {
        const container = document.querySelector('.auth-box');
        const existingAlert = container.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        container.insertBefore(alertDiv, container.firstChild);
        setTimeout(() => alertDiv.remove(), 3000);
    }

    updateUI() {
        const accountSection = document.querySelector('.account-dropdown');
        
        if (accountSection && this.currentUser) {
            // Get the base path based on current page location
            const basePath = this.getBasePath();
            
            // Replace entire account section with profile section for logged-in user
            accountSection.innerHTML = `
                <button class="account-button profile">
                    <img src="${basePath}/assets/icons/profile-icon.svg" alt="Profile">
                    <span>Profile</span>
                </button>
                <div class="dropdown-content">
                    <div class="user-info">
                        <span class="user-name">${this.currentUser.fullName}</span>
                        <span class="user-email">${this.currentUser.email}</span>
                    </div>
                    <hr>
                    <a href="${basePath}/pages/account/profile.html">
                        <img src="${basePath}/assets/icons/user-profile-icon.svg" alt="">
                        My Profile
                    </a>
                    <a href="${basePath}/pages/account/orders.html">
                        <img src="${basePath}/assets/icons/orders-icon.svg" alt="">
                        My Orders
                    </a>
                    <a href="${basePath}/pages/account/wishlist.html">
                        <img src="${basePath}/assets/icons/heart-icon.svg" alt="">
                        Wishlist
                    </a>
                    ${this.currentUser.role === 'admin' ? `
                        <hr>
                        <a href="${basePath}/admin/index.html">
                            <img src="${basePath}/assets/icons/admin-icon.svg" alt="">
                            Admin Panel
                        </a>
                    ` : ''}
                    <hr>
                    <a href="#" onclick="auth.logout()" class="logout-btn">
                        <img src="${basePath}/assets/icons/logout-icon.svg" alt="">
                        Logout
                    </a>
                </div>
            `;
        } else if (accountSection) {
            const basePath = this.getBasePath();
            
            // Show default Account button for logged-out users
            accountSection.innerHTML = `
                <button class="account-button">
                    <img src="${basePath}/assets/icons/user-icon.svg" alt="Account">
                    <span>Account</span>
                </button>
                <div class="dropdown-content">
                    <div class="guest-view">
                        <a href="${basePath}/pages/account/login.html" class="login-btn">Sign In</a>
                        <a href="${basePath}/pages/account/register.html" class="register-btn">Register</a>
                    </div>
                </div>
            `;
        }
    }

    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        const basePath = this.getBasePath();
        window.location.href = `${basePath}/pages/account/login.html`;
    }

    requireAuth() {
        if (!this.isAuthenticated) {
            const currentPath = window.location.pathname;
            window.location.href = `pages/account/login.html?returnUrl=${encodeURIComponent(currentPath)}`;
            return false;
        }
        return true;
    }

    socialLogin(provider) {
        // This would be implemented with actual OAuth providers
        alert(`${provider} login not implemented in demo`);
    }

    getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/admin/')) {
            return '..';
        } else if (path.includes('/pages/')) {
            return '../..';
        }
        return '.';
    }
}

// Initialize auth service
const auth = new AuthService();

// Update UI when page loads
document.addEventListener('DOMContentLoaded', () => {
    auth.updateUI();
});