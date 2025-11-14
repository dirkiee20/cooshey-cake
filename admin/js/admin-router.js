// Admin Router - Handles navigation between admin tabs
(function() {
    'use strict';

    class AdminRouter {
        constructor() {
            this.currentTab = 'dashboard';
            this.loadedTabs = new Set();
            this.init();
        }

        init() {
            // Check authentication first
            if (!window.AdminAuth.checkAuth()) {
                return;
            }

            this.bindEvents();
            this.loadTab('dashboard'); // Load default tab
        }

        bindEvents() {
            // Sidebar navigation
            document.querySelectorAll('.nav-item[data-section]').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = item.dataset.section;
                    this.loadTab(section);
                });
            });

            // Mobile menu
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const sidebar = document.getElementById('sidebar');

            if (mobileMenuBtn && sidebar) {
                mobileMenuBtn.addEventListener('click', () => {
                    sidebar.classList.toggle('show');
                });
            }

            // Sidebar toggle
            const sidebarToggle = document.getElementById('sidebarToggle');
            if (sidebarToggle) {
                sidebarToggle.addEventListener('click', () => {
                    document.getElementById('sidebar').classList.toggle('collapsed');
                    document.getElementById('mainContent').classList.toggle('expanded');
                    document.querySelector('.top-navbar').classList.toggle('expanded');
                });
            }

            // Logout functionality
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Add confirmation dialog
                    if (confirm('Are you sure you want to logout?')) {
                        window.AdminAuth.logout();
                    }
                });
            }

            // Global search functionality
            const globalSearch = document.getElementById('globalSearch');
            if (globalSearch) {
                let searchTimeout;
                globalSearch.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        this.performGlobalSearch(e.target.value);
                    }, 300);
                });
            }

            // Notification button
            const notificationBtn = document.getElementById('notificationBtn');
            if (notificationBtn) {
                notificationBtn.addEventListener('click', () => {
                    this.toggleNotifications();
                });
            }
        }

        async loadTab(tabName) {
            try {
                // Update navigation
                this.updateNavigation(tabName);

                // Update page title
                this.updatePageTitle(tabName);

                // Hide all sections
                document.querySelectorAll('.content-area > section').forEach(section => {
                    section.classList.remove('active');
                });

                // Check if tab content is already loaded
                const tabContent = document.getElementById(`${tabName}Section`);
                if (tabContent) {
                    // Content already exists, just show it
                    tabContent.classList.add('active');
                    this.currentTab = tabName;
                    return;
                }

                // Load tab content dynamically
                await this.loadTabContent(tabName);

                this.currentTab = tabName;
                this.loadedTabs.add(tabName);

            } catch (error) {
                console.error(`Failed to load tab ${tabName}:`, error);
                window.AdminUtils.showToast(`Failed to load ${tabName} tab`, 'error');
            }
        }

        updateNavigation(tabName) {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });

            const activeNavItem = document.querySelector(`[data-section="${tabName}"]`);
            if (activeNavItem) {
                activeNavItem.classList.add('active');
            }
        }

        updatePageTitle(tabName) {
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                pageTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
            }
        }

        async loadTabContent(tabName) {
            const tabContentContainer = document.getElementById('tabContent');

            if (!tabContentContainer) {
                throw new Error('Tab content container not found');
            }

            // Show loading state
            tabContentContainer.innerHTML = '<div class="loading-spinner">Loading...</div>';

            try {
                // Load HTML content
                const htmlResponse = await fetch(`/admin/tabs/${tabName}.html`);
                if (!htmlResponse.ok) {
                    throw new Error(`Failed to load HTML for ${tabName}`);
                }
                const html = await htmlResponse.text();

                // Load CSS if not already loaded
                if (!document.querySelector(`link[href="/admin/css/tabs/${tabName}.css"]`)) {
                    const cssLink = document.createElement('link');
                    cssLink.rel = 'stylesheet';
                    cssLink.href = `/admin/css/tabs/${tabName}.css`;
                    document.head.appendChild(cssLink);
                }

                // Load and execute JavaScript module
                console.log(`Loading JS module for tab: ${tabName}`);
                let jsModule = null;
                let scriptLoaded = false;
                try {
                    jsModule = await import(`/admin/js/tabs/${tabName}.js`);
                    console.log(`JS module loaded for ${tabName}:`, jsModule);
                    console.log(`JS module keys:`, Object.keys(jsModule));
                    console.log(`JS module default:`, jsModule.default);
                    if (jsModule.default) {
                        console.log(`Default export type:`, typeof jsModule.default);
                        console.log(`Default export keys:`, Object.keys(jsModule.default || {}));
                    }
                } catch (importError) {
                    console.error(`Failed to import JS module for ${tabName}, trying script tag:`, importError);
                    // Load as script tag instead
                    try {
                        await new Promise((resolve, reject) => {
                            const script = document.createElement('script');
                            script.src = `/admin/js/tabs/${tabName}.js`;
                            script.onload = () => {
                                console.log(`Script loaded for ${tabName}`);
                                scriptLoaded = true;
                                resolve();
                            };
                            script.onerror = reject;
                            document.head.appendChild(script);
                        });
                    } catch (scriptError) {
                        console.error(`Failed to load script for ${tabName}:`, scriptError);
                    }
                    jsModule = null;
                }

                // Update content
                tabContentContainer.innerHTML = html;
                console.log(`HTML content loaded for ${tabName}`);

                // Initialize tab if init function exists
                if (jsModule && jsModule.default && jsModule.default.init) {
                    console.log(`Initializing ${tabName} tab (default export)`);
                    jsModule.default.init();
                } else if (jsModule && jsModule.init) {
                    console.log(`Initializing ${tabName} tab (named export)`);
                    jsModule.init();
                } else {
                    console.warn(`No init function found for ${tabName} tab in module, checking window object`);
                    const windowTabName = tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Tab';
                    console.log(`Checking window object for ${windowTabName}:`, window[windowTabName]);
                    if (window[windowTabName] && window[windowTabName].init) {
                        console.log(`Initializing ${tabName} tab from window object`);
                        window[windowTabName].init();
                    } else if (scriptLoaded) {
                        // Script was loaded, wait a bit and try again
                        console.log(`Script loaded for ${tabName}, waiting for initialization...`);
                        setTimeout(() => {
                            console.log(`Retrying window object check for ${windowTabName}:`, window[windowTabName]);
                            if (window[windowTabName] && window[windowTabName].init) {
                                console.log(`Initializing ${tabName} tab from window object (delayed)`);
                                window[windowTabName].init();
                            } else {
                                console.error(`Still no init function found for ${tabName} tab`);
                            }
                        }, 100);
                    } else {
                        console.error(`No init function found for ${tabName} tab anywhere`);
                    }
                }

                // Also attach to window for backward compatibility
                if (jsModule && jsModule.default) {
                    window[tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Tab'] = jsModule.default;
                }

            } catch (error) {
                tabContentContainer.innerHTML = `
                    <div class="error-state">
                        <h3>Failed to load ${tabName}</h3>
                        <p>Please try refreshing the page</p>
                        <button onclick="window.location.reload()">Refresh</button>
                    </div>
                `;
                throw error;
            }
        }

        // Utility method to reload current tab
        reloadCurrentTab() {
            return this.loadTab(this.currentTab);
        }

        // Get current tab
        getCurrentTab() {
            return this.currentTab;
        }

        // Perform global search
        performGlobalSearch(query) {
            if (!query.trim()) {
                // Clear search results
                this.clearSearchResults();
                return;
            }

            // Show loading state
            this.showSearchLoading();

            // Simulate search across different sections
            setTimeout(() => {
                const results = {
                    products: [],
                    customers: [],
                    orders: []
                };

                // Mock search results
                if (query.toLowerCase().includes('cake')) {
                    results.products = [
                        { id: 1, name: 'Chocolate Cake', type: 'product' },
                        { id: 2, name: 'Vanilla Cake', type: 'product' }
                    ];
                }

                if (query.toLowerCase().includes('john')) {
                    results.customers = [
                        { id: 1, name: 'John Doe', email: 'john@example.com', type: 'customer' }
                    ];
                }

                this.displaySearchResults(results);
            }, 500);
        }

        // Clear search results
        clearSearchResults() {
            const existingResults = document.querySelector('.search-results');
            if (existingResults) {
                existingResults.remove();
            }
        }

        // Show search loading
        showSearchLoading() {
            this.clearSearchResults();

            const searchBox = document.querySelector('.search-box');
            if (!searchBox) return;

            const results = document.createElement('div');
            results.className = 'search-results';
            results.innerHTML = '<div class="loading-spinner">Searching...</div>';

            searchBox.appendChild(results);
        }

        // Display search results
        displaySearchResults(results) {
            this.clearSearchResults();

            const searchBox = document.querySelector('.search-box');
            if (!searchBox) return;

            const resultsDiv = document.createElement('div');
            resultsDiv.className = 'search-results';

            let hasResults = false;

            // Products section
            if (results.products.length > 0) {
                hasResults = true;
                resultsDiv.innerHTML += `
                    <div class="search-section">
                        <h5>Products</h5>
                        ${results.products.map(product => `
                            <div class="search-item" data-type="product" data-id="${product.id}">
                                <div class="search-item-icon">
                                    <i class="fas fa-box"></i>
                                </div>
                                <div class="search-item-content">
                                    <h6>${product.name}</h6>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // Customers section
            if (results.customers.length > 0) {
                hasResults = true;
                resultsDiv.innerHTML += `
                    <div class="search-section">
                        <h5>Customers</h5>
                        ${results.customers.map(customer => `
                            <div class="search-item" data-type="customer" data-id="${customer.id}">
                                <div class="search-item-icon">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="search-item-content">
                                    <h6>${customer.name}</h6>
                                    <span>${customer.email}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            if (!hasResults) {
                resultsDiv.innerHTML = '<div class="search-section"><p>No results found</p></div>';
            }

            searchBox.appendChild(resultsDiv);

            // Add click handlers
            resultsDiv.addEventListener('click', (e) => {
                const item = e.target.closest('.search-item');
                if (item) {
                    const type = item.dataset.type;
                    const id = item.dataset.id;
                    this.navigateToResult(type, id);
                }
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!searchBox.contains(e.target)) {
                    this.clearSearchResults();
                }
            });
        }

        // Navigate to search result
        navigateToResult(type, id) {
            this.clearSearchResults();

            switch (type) {
                case 'product':
                    this.loadTab('inventory');
                    // Could scroll to specific product
                    break;
                case 'customer':
                    this.loadTab('customers');
                    // Could highlight specific customer
                    break;
                case 'order':
                    this.loadTab('orders');
                    // Could highlight specific order
                    break;
            }
        }

        // Toggle notifications panel
        toggleNotifications() {
            // Create or toggle notifications dropdown
            let notificationPanel = document.getElementById('notificationPanel');

            if (!notificationPanel) {
                notificationPanel = document.createElement('div');
                notificationPanel.id = 'notificationPanel';
                notificationPanel.className = 'notification-panel';
                notificationPanel.innerHTML = `
                    <div class="notification-header">
                        <h4>Notifications</h4>
                        <button class="mark-all-read">Mark all read</button>
                    </div>
                    <div class="notification-list">
                        <div class="notification-item unread">
                            <div class="notification-icon">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div class="notification-content">
                                <p>New order received</p>
                                <span class="notification-time">2 min ago</span>
                            </div>
                        </div>
                        <div class="notification-item">
                            <div class="notification-icon">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="notification-content">
                                <p>New customer registered</p>
                                <span class="notification-time">1 hour ago</span>
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(notificationPanel);

                // Position the panel
                const notificationBtn = document.getElementById('notificationBtn');
                const rect = notificationBtn.getBoundingClientRect();
                notificationPanel.style.top = (rect.bottom + 10) + 'px';
                notificationPanel.style.right = (window.innerWidth - rect.right) + 'px';

                // Add event listeners
                notificationPanel.addEventListener('click', (e) => {
                    if (e.target.classList.contains('mark-all-read')) {
                        this.markAllNotificationsRead();
                    }
                });

                // Close when clicking outside
                document.addEventListener('click', (e) => {
                    if (!notificationPanel.contains(e.target) && e.target !== notificationBtn) {
                        notificationPanel.remove();
                    }
                });
            } else {
                notificationPanel.remove();
            }
        }

        // Mark all notifications as read
        markAllNotificationsRead() {
            const unreadItems = document.querySelectorAll('.notification-item.unread');
            unreadItems.forEach(item => {
                item.classList.remove('unread');
            });

            // Update notification badge
            const badge = document.getElementById('notificationBadge');
            if (badge) {
                badge.style.display = 'none';
                badge.textContent = '0';
            }

            window.AdminUtils.showToast('All notifications marked as read', 'success');
        }
    }

    // Initialize router when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.AdminRouter = new AdminRouter();
        });
    } else {
        window.AdminRouter = new AdminRouter();
    }

})();