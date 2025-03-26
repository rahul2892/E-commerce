class RegisterForm {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.inputs = {
            fullName: document.getElementById('fullName'),
            email: document.getElementById('email'),
            password: document.getElementById('password'),
            confirmPassword: document.getElementById('confirmPassword'),
            terms: document.getElementById('terms')
        };
        this.button = document.getElementById('registerButton');
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupPasswordValidation();
    }

    bindEvents() {
        // Real-time validation
        Object.values(this.inputs).forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.validateField(input);
                    this.updateSubmitButton();
                });
            }
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                this.handleRegistration();
            }
        });
    }

    setupPasswordValidation() {
        const password = this.inputs.password;
        const requirements = {
            length: document.getElementById('length'),
            uppercase: document.getElementById('uppercase'),
            number: document.getElementById('number')
        };

        password.addEventListener('input', () => {
            const value = password.value;
            
            // Check length
            if (value.length >= 6) {
                requirements.length.classList.add('valid');
            } else {
                requirements.length.classList.remove('valid');
            }

            // Check uppercase
            if (/[A-Z]/.test(value)) {
                requirements.uppercase.classList.add('valid');
            } else {
                requirements.uppercase.classList.remove('valid');
            }

            // Check number
            if (/[0-9]/.test(value)) {
                requirements.number.classList.add('valid');
            } else {
                requirements.number.classList.remove('valid');
            }
        });
    }

    validateField(input) {
        const errorElement = input.nextElementSibling;
        let isValid = true;
        let errorMessage = '';

        switch (input.id) {
            case 'fullName':
                if (!input.value.trim()) {
                    errorMessage = 'Name is required';
                    isValid = false;
                } else if (input.value.length < 2) {
                    errorMessage = 'Name must be at least 2 characters';
                    isValid = false;
                }
                break;

            case 'email':
                if (!input.value.trim()) {
                    errorMessage = 'Email is required';
                    isValid = false;
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
                    errorMessage = 'Please enter a valid email address';
                    isValid = false;
                }
                break;

            case 'password':
                if (!input.value) {
                    errorMessage = 'Password is required';
                    isValid = false;
                } else if (input.value.length < 6) {
                    errorMessage = 'Password must be at least 6 characters';
                    isValid = false;
                } else if (!/[A-Z]/.test(input.value)) {
                    errorMessage = 'Password must contain an uppercase letter';
                    isValid = false;
                } else if (!/[0-9]/.test(input.value)) {
                    errorMessage = 'Password must contain a number';
                    isValid = false;
                }
                break;

            case 'confirmPassword':
                if (!input.value) {
                    errorMessage = 'Please confirm your password';
                    isValid = false;
                } else if (input.value !== this.inputs.password.value) {
                    errorMessage = 'Passwords do not match';
                    isValid = false;
                }
                break;

            case 'terms':
                if (!input.checked) {
                    errorMessage = 'You must accept the Terms & Conditions';
                    isValid = false;
                }
                break;
        }

        if (errorElement) {
            errorElement.textContent = errorMessage;
        }
        input.classList.toggle('error', !isValid);
        return isValid;
    }

    validateForm() {
        let isValid = true;
        Object.values(this.inputs).forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        return isValid;
    }

    updateSubmitButton() {
        const isValid = Object.values(this.inputs).every(input => !input.classList.contains('error'));
        this.button.disabled = !isValid;
    }

    async handleRegistration() {
        try {
            const button = document.querySelector('button[type="submit"]');
            button.disabled = true;
            button.innerHTML = '<span class="loading-spinner"></span>Creating account...';

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get existing users or initialize empty array
            const users = JSON.parse(localStorage.getItem('users') || '[]');

            // Check if email already exists
            if (users.some(user => user.email === this.inputs.email.value)) {
                throw new Error('Email already registered');
            }

            // Create new user object
            const newUser = {
                id: Date.now().toString(),
                fullName: this.inputs.fullName.value,
                email: this.inputs.email.value,
                password: this.inputs.password.value, // In real app, hash password
                role: 'customer',
                status: 'active',
                createdAt: new Date().toISOString()
            };

            // Add user to array and save
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            // Show success message
            this.showSuccess('Registration successful! Redirecting to login...');

            // Redirect to login page after a short delay
            setTimeout(() => {
                const basePath = window.location.pathname.includes('/pages/') ? '../..' : '.';
                window.location.href = `${basePath}/pages/account/login.html?registered=true`;
            }, 1500);

        } catch (error) {
            this.showError(this.inputs.email, error.message);
            const button = document.querySelector('button[type="submit"]');
            button.disabled = false;
            button.textContent = 'Create Account';
        }
    }

    showError(input, message) {
        input.classList.add('error');
        const errorSpan = input.nextElementSibling;
        if (errorSpan && errorSpan.classList.contains('error-message')) {
            errorSpan.textContent = message;
        }
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert success';
        successDiv.textContent = message;
        
        const container = document.querySelector('.auth-box');
        const existingAlert = container.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        container.insertBefore(successDiv, container.firstChild);
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

// Initialize registration form
const registerForm = new RegisterForm(); 