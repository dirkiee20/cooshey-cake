// Admin Dashboard Shared Utilities and API
(function() {
    'use strict';

    console.log('Admin shared JS file loaded');

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
        },

        // Custom styled confirm dialog
        showConfirmDialog: (message, onConfirm, onCancel) => {
            // Create modal elements
            const backdrop = document.createElement('div');
            backdrop.className = 'confirm-modal-backdrop';

            const modal = document.createElement('div');
            modal.className = 'confirm-modal';

            modal.innerHTML = `
                <div class="confirm-modal-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Confirm Action</h3>
                </div>
                <div class="confirm-modal-body">
                    <p>${message}</p>
                </div>
                <div class="confirm-modal-actions">
                    <button class="btn btn-cancel" id="confirmCancel">Cancel</button>
                    <button class="btn btn-confirm" id="confirmOk">Confirm</button>
                </div>
            `;

            backdrop.appendChild(modal);
            document.body.appendChild(backdrop);

            // Focus management
            const cancelBtn = modal.querySelector('#confirmCancel');
            const confirmBtn = modal.querySelector('#confirmOk');

            // Handle button clicks
            const handleCancel = () => {
                document.body.removeChild(backdrop);
                if (onCancel) onCancel();
            };

            const handleConfirm = () => {
                document.body.removeChild(backdrop);
                if (onConfirm) onConfirm();
            };

            cancelBtn.addEventListener('click', handleCancel);
            confirmBtn.addEventListener('click', handleConfirm);

            // Handle escape key
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                } else if (e.key === 'Enter') {
                    handleConfirm();
                }
            };

            document.addEventListener('keydown', handleKeydown);

            // Remove event listener when modal is removed
            const observer = new MutationObserver(() => {
                if (!document.body.contains(backdrop)) {
                    document.removeEventListener('keydown', handleKeydown);
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true });

            // Focus the cancel button initially
            setTimeout(() => cancelBtn.focus(), 100);
        },
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

        async getOrderById(orderId) {
            return await this.request(`/orders/${orderId}`);
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

        async makeUserAdmin(userId) {
            return await this.request(`/users/${userId}/admin`, {
                method: 'PUT'
            });
        },

        async makeCurrentUserAdmin() {
            return await this.request('/users/make-admin', {
                method: 'POST'
            });
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
            window.location.href = '../index.html';
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

    // Admin Notifications
    const adminNotifications = {
        panel: null,
        badge: null,
        button: null,
        isLoading: false,

        init() {
            console.log('AdminNotifications: Initializing');
            this.button = document.getElementById('adminNotificationBtn');
            this.badge = document.getElementById('notificationBadge');

            console.log('AdminNotifications: Button element:', this.button);
            console.log('AdminNotifications: Badge element:', this.badge);
            console.log('AdminNotifications: Auth headers present:', !!localStorage.getItem(CONFIG.TOKEN_KEY));

            if (this.button) {
                this.button.addEventListener('click', (e) => {
                    console.log('AdminNotifications: Bell button clicked');
                    e.preventDefault();
                    e.stopPropagation();
                    this.togglePanel();
                });
                console.log('AdminNotifications: Button event listener added');
            } else {
                console.error('AdminNotifications: Button not found');
            }

            // Create notification panel
            this.createPanel();

            // Load initial count
            this.loadUnreadCount();

            // Set up periodic refresh
            setInterval(() => this.loadUnreadCount(), 30000); // Refresh every 30 seconds
        },

        createPanel() {
            this.panel = document.createElement('div');
            this.panel.className = 'notification-panel';
            this.panel.id = 'adminNotificationPanel';

            this.panel.innerHTML = `
                <div class="notification-header">
                    <h3>Notifications</h3>
                    <button class="mark-all-read" id="markAllReadBtn">Mark All Read</button>
                </div>
                <div class="notification-list" id="notificationList">
                    <div class="notification-empty">
                        <i class="fas fa-bell-slash"></i>
                        <p>No notifications yet</p>
                    </div>
                </div>
            `;

            document.body.appendChild(this.panel);

            // Add event listeners
            const markAllReadBtn = this.panel.querySelector('#markAllReadBtn');
            if (markAllReadBtn) {
                markAllReadBtn.addEventListener('click', () => this.markAllAsRead());
            }

            // Close panel when clicking outside
            document.addEventListener('click', (e) => {
                if ((this.button && !this.button.contains(e.target)) && !this.panel.contains(e.target)) {
                    this.hidePanel();
                }
            });
        },

        async loadUnreadCount() {
            if (this.isLoading) return;

            console.log('AdminNotifications: Starting loadUnreadCount');
            try {
                this.isLoading = true;
                console.log('AdminNotifications: Making fetch request to unread-count');
                const response = await fetch(`${CONFIG.API_BASE}/admin/notifications/unread-count`, {
                    headers: utils.getAuthHeaders()
                });

                console.log('AdminNotifications: Unread count response status:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log('AdminNotifications: Unread count data:', data);
                    this.updateBadge(data.count);
                } else {
                    console.error('AdminNotifications: Failed to load unread count, status:', response.status);
                    const errorText = await response.text();
                    console.error('AdminNotifications: Error response:', errorText);
                }
            } catch (error) {
                console.error('AdminNotifications: Error loading unread count:', error);
            } finally {
                this.isLoading = false;
                console.log('AdminNotifications: loadUnreadCount completed');
            }
        },

        updateBadge(count) {
            if (!this.badge) return;

            if (count > 0) {
                this.badge.textContent = count > 99 ? '99+' : count;
                this.badge.style.display = 'flex';
            } else {
                this.badge.style.display = 'none';
            }
        },

        togglePanel() {
            console.log('AdminNotifications: togglePanel called');
            console.log('AdminNotifications: Panel has show class:', this.panel.classList.contains('show'));
            if (this.panel.classList.contains('show')) {
                this.hidePanel();
            } else {
                this.showPanel();
            }
        },

        showPanel() {
            console.log('AdminNotifications: showPanel called, adding show class');
            this.panel.classList.add('show');
            this.loadNotifications();
        },

        hidePanel() {
            this.panel.classList.remove('show');
        },

        async loadNotifications() {
            console.log('AdminNotifications: loadNotifications called');
            const listElement = this.panel.querySelector('#notificationList');
            if (!listElement) {
                console.error('AdminNotifications: notificationList element not found');
                return;
            }

            console.log('AdminNotifications: Setting loading spinner');
            listElement.innerHTML = '<div class="loading-spinner">Loading notifications...</div>';

            try {
                console.log('AdminNotifications: Making fetch request for notifications');
                const response = await fetch(`${CONFIG.API_BASE}/admin/notifications?limit=20`, {
                    headers: utils.getAuthHeaders()
                });

                console.log('AdminNotifications: Notifications response status:', response.status);
                if (response.ok) {
                    const notifications = await response.json();
                    console.log('AdminNotifications: Received notifications:', notifications.length, 'items');
                    this.displayNotifications(notifications);
                } else {
                    console.error('AdminNotifications: Failed to load notifications, status:', response.status);
                    const errorText = await response.text();
                    console.error('AdminNotifications: Error response:', errorText);
                    listElement.innerHTML = '<div class="notification-empty"><i class="fas fa-exclamation-triangle"></i><p>Failed to load notifications</p></div>';
                }
            } catch (error) {
                console.error('AdminNotifications: Error loading notifications:', error);
                listElement.innerHTML = '<div class="notification-empty"><i class="fas fa-exclamation-triangle"></i><p>Error loading notifications</p></div>';
            }
        },

        displayNotifications(notifications) {
            const listElement = this.panel.querySelector('#notificationList');

            if (notifications.length === 0) {
                listElement.innerHTML = '<div class="notification-empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>';
                return;
            }

            listElement.innerHTML = notifications.map(notification => `
                <div class="notification-item ${!notification.isRead ? 'unread' : ''}" data-id="${notification.id}">
                    <div class="notification-icon">
                        <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <h4>${notification.title}</h4>
                        <p>${notification.message}</p>
                        <div class="notification-time">${utils.formatDate(notification.createdAt)}</div>
                    </div>
                </div>
            `).join('');

            // Add click handlers
            listElement.querySelectorAll('.notification-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    this.markAsRead(id);
                    this.navigateToRelatedItem(item, notifications.find(n => n.id == id));
                });
            });
        },

        getNotificationIcon(type) {
            const icons = {
                new_order: 'shopping-cart',
                new_user: 'user-plus',
                payment_issue: 'exclamation-triangle',
                low_inventory: 'box',
                system_error: 'exclamation-circle',
                general: 'bell'
            };
            return icons[type] || 'bell';
        },

        async markAsRead(notificationId) {
            try {
                const response = await fetch(`${CONFIG.API_BASE}/admin/notifications/${notificationId}/read`, {
                    method: 'PUT',
                    headers: utils.getAuthHeaders()
                });

                if (response.ok) {
                    // Update UI
                    const item = this.panel.querySelector(`[data-id="${notificationId}"]`);
                    if (item) {
                        item.classList.remove('unread');
                    }
                    // Refresh count
                    this.loadUnreadCount();
                }
            } catch (error) {
                console.error('AdminNotifications: Error marking as read:', error);
            }
        },

        async markAllAsRead() {
            try {
                const response = await fetch(`${CONFIG.API_BASE}/admin/notifications/read-all`, {
                    method: 'PUT',
                    headers: utils.getAuthHeaders()
                });

                if (response.ok) {
                    // Update UI
                    this.panel.querySelectorAll('.notification-item.unread').forEach(item => {
                        item.classList.remove('unread');
                    });
                    // Refresh count
                    this.loadUnreadCount();
                    utils.showToast('All notifications marked as read', 'success');
                }
            } catch (error) {
                console.error('AdminNotifications: Error marking all as read:', error);
                utils.showToast('Failed to mark notifications as read', 'error');
            }
        },

        navigateToRelatedItem(item, notification) {
            this.hidePanel();

            // Navigate based on notification type and related data
            if (notification.relatedType && notification.relatedId) {
                switch (notification.relatedType) {
                    case 'order':
                        window.AdminRouter.loadTab('orders');
                        break;
                    case 'user':
                        window.AdminRouter.loadTab('customers');
                        break;
                    case 'product':
                        window.AdminRouter.loadTab('inventory');
                        break;
                    case 'payment':
                        window.AdminRouter.loadTab('payments');
                        break;
                }
            }
        }
    };

    // Expose makeCurrentUserAdmin globally for console access
    window.makeMeAdmin = async function() {
        try {
            const result = await api.makeCurrentUserAdmin();
            console.log('Admin status granted:', result);
            alert('You are now an admin! Admin status is checked from database on every request.');
            // No need to refresh - admin status is checked from database, not cached in token
            return result;
        } catch (error) {
            console.error('Failed to make admin:', error);
            alert('Failed to make admin. Check console for details.');
            throw error;
        }
    };

    // Initialize admin notifications when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Admin shared JS loaded, initializing notifications');
        adminNotifications.init();
    });

    // Make globally available
    window.AdminUtils = { ...utils, ...performanceUtils, ...accessibilityUtils };
    window.AdminAPI = api;
    window.AdminAuth = auth;
    window.AdminNotifications = adminNotifications;

})();