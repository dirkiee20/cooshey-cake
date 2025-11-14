// Admin Dashboard Shared Utilities and API
(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        API_BASE: 'http://localhost:3001/api',
        TOKEN_KEY: 'userToken'
    };

    // Utility Functions
    const utils = {
        // Enhanced toast with animations
        showToast: (message, type = 'info', duration = 5000) => {
            const toastContainer = document.getElementById('toastContainer');
            if (!toastContainer) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;

            const icons = {
                success: 'check-circle',
                error: 'exclamation-circle',
                warning: 'exclamation-triangle',
                info: 'info-circle'
            };

            toast.innerHTML = `
                <div class="toast-icon">
                    <i class="fas fa-${icons[type] || 'info-circle'}"></i>
                </div>
                <div class="toast-content">
                    <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close">
                    <i class="fas fa-times"></i>
                </button>
            `;

            toastContainer.appendChild(toast);

            // Add entrance animation
            setTimeout(() => {
                toast.classList.add('show');
            }, 10);

            // Auto remove after duration
            const timeoutId = setTimeout(() => {
                if (toast.parentNode) {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }
            }, duration);

            // Click to close with animation
            toast.querySelector('.toast-close').addEventListener('click', () => {
                clearTimeout(timeoutId);
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            });

            // Add progress bar for timed toasts
            if (duration > 0) {
                const progressBar = document.createElement('div');
                progressBar.className = 'toast-progress';
                progressBar.style.animationDuration = `${duration}ms`;
                toast.appendChild(progressBar);
            }
        },

        showLoading: (element, show = true) => {
            if (show) {
                element.classList.add('loading');
            } else {
                element.classList.remove('loading');
            }
        },

        formatCurrency: (amount) => {
            return `₱${parseFloat(amount).toFixed(2)}`;
        },

        formatDate: (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        getAuthHeaders: () => {
            const token = localStorage.getItem(CONFIG.TOKEN_KEY);
            return token ? { 'Authorization': `Bearer ${token}` } : {};
        },

        sanitizeInput: (input) => {
            if (typeof input !== 'string') return input;
            return input.replace(/[<>]/g, '').trim();
        },

        // Add interactive animations
        animateNumber: (element, targetValue, duration = 1000) => {
            if (!element) return;

            const startValue = parseFloat(element.textContent.replace(/[^\d.-]/g, '')) || 0;
            const startTime = performance.now();
            const isCurrency = element.textContent.includes('₱');

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function for smooth animation
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const currentValue = startValue + (targetValue - startValue) * easeOutQuart;

                if (isCurrency) {
                    element.textContent = utils.formatCurrency(currentValue);
                } else {
                    element.textContent = Math.round(currentValue);
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        },

        // Add hover effects and interactions
        addHoverEffect: (element, options = {}) => {
            if (!element) return;

            const defaultOptions = {
                scale: 1.02,
                duration: '0.2s',
                ...options
            };

            element.style.transition = `transform ${defaultOptions.duration} ease, box-shadow ${defaultOptions.duration} ease`;

            element.addEventListener('mouseenter', () => {
                element.style.transform = `scale(${defaultOptions.scale})`;
                element.style.boxShadow = 'var(--shadow-xl)';
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'scale(1)';
                element.style.boxShadow = 'var(--shadow-md)';
            });
        },

        // Create ripple effect for buttons
        addRippleEffect: (button) => {
            if (!button) return;

            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple-effect');

                this.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        }
    };

    // API Service
    const api = {
        async request(endpoint, options = {}) {
            const url = `${CONFIG.API_BASE}${endpoint}`;
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    ...utils.getAuthHeaders()
                }
            };

            try {
                const response = await fetch(url, { ...defaultOptions, ...options });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }

                return data;
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        },

        // Products
        async getProducts(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/products${queryString ? '?' + queryString : ''}`);
        },

        async createProduct(productData) {
            return await this.request('/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
        },

        async updateProduct(id, productData) {
            return await this.request(`/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
        },

        async deleteProduct(id) {
            return await this.request(`/products/${id}`, {
                method: 'DELETE'
            });
        },

        async deleteProducts(productIds) {
            return await this.request('/products', {
                method: 'DELETE',
                body: JSON.stringify({ productIds })
            });
        },

        // Users/Customers
        async getUsers() {
            return await this.request('/users');
        },

        // Orders
        async getOrders() {
            return await this.request('/orders');
        },

        async updateOrderStatus(orderId, status) {
            return await this.request(`/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
        },

        // Payments
        async getPayments() {
            return await this.request('/payments');
        },

        async updatePaymentStatus(paymentId, status, notes = '') {
            return await this.request(`/payments/${paymentId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status, notes })
            });
        },

        // Logs
        async getLogs() {
            return await this.request('/logs');
        },

        async createLog(logData) {
            return await this.request('/logs', {
                method: 'POST',
                body: JSON.stringify(logData)
            });
        },

        // Stock Transactions
        async getStockTransactions() {
            return await this.request('/stock-transactions');
        },

        async createStockTransaction(transactionData) {
            return await this.request('/stock-transactions', {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });
        },

        async getProductStockTransactions(productId) {
            return await this.request(`/stock-transactions/product/${productId}`);
        }
    };

    // Authentication
    const auth = {
        isAuthenticated() {
            return !!localStorage.getItem(CONFIG.TOKEN_KEY);
        },

        logout() {
            localStorage.removeItem(CONFIG.TOKEN_KEY);
            window.location.href = '/';
        },

        checkAuth() {
            if (!this.isAuthenticated()) {
                window.location.href = '/';
                return false;
            }
            return true;
        }
    };

    // Performance optimizations
    const performanceUtils = {
        // Debounce function for performance
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Throttle function for performance
        throttle: (func, limit) => {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Lazy loading for images
        lazyLoadImages: () => {
            const images = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        },

        // Optimize scroll performance
        optimizeScroll: (callback) => {
            let ticking = false;
            return () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        callback();
                        ticking = false;
                    });
                    ticking = true;
                }
            };
        }
    };

    // Enhanced accessibility features
    const accessibilityUtils = {
        // Announce content to screen readers
        announceToScreenReader: (message, priority = 'polite') => {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', priority);
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = message;

            document.body.appendChild(announcement);

            setTimeout(() => {
                document.body.removeChild(announcement);
            }, 1000);
        },

        // Trap focus within modal dialogs
        trapFocus: (element) => {
            const focusableElements = element.querySelectorAll(
                'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
            );

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            const handleTabKey = (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            lastElement.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            firstElement.focus();
                            e.preventDefault();
                        }
                    }
                }
            };

            element.addEventListener('keydown', handleTabKey);

            return () => {
                element.removeEventListener('keydown', handleTabKey);
            };
        },

        // Handle keyboard navigation
        handleKeyboardNavigation: () => {
            document.addEventListener('keydown', (e) => {
                // Alt + H: Go to dashboard
                if (e.altKey && e.key === 'h') {
                    e.preventDefault();
                    window.AdminRouter.loadTab('dashboard');
                    accessibilityUtils.announceToScreenReader('Navigated to Dashboard');
                }

                // Alt + I: Go to inventory
                if (e.altKey && e.key === 'i') {
                    e.preventDefault();
                    window.AdminRouter.loadTab('inventory');
                    accessibilityUtils.announceToScreenReader('Navigated to Inventory');
                }

                // Alt + C: Go to customers
                if (e.altKey && e.key === 'c') {
                    e.preventDefault();
                    window.AdminRouter.loadTab('customers');
                    accessibilityUtils.announceToScreenReader('Navigated to Customers');
                }

                // Alt + O: Go to orders
                if (e.altKey && e.key === 'o') {
                    e.preventDefault();
                    window.AdminRouter.loadTab('orders');
                    accessibilityUtils.announceToScreenReader('Navigated to Orders');
                }
            });
        }
    };

    // Initialize performance and accessibility features
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Admin shared JS loaded');
        performanceUtils.lazyLoadImages();
        accessibilityUtils.handleKeyboardNavigation();
    });

    // Make globally available
    window.AdminUtils = { ...utils, ...performanceUtils, ...accessibilityUtils };
    window.AdminAPI = api;
    window.AdminAuth = auth;

})();