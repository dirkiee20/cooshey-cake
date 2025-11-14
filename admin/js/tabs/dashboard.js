// Dashboard Tab Module
const DashboardTab = (function() {
    'use strict';

    // State
    let state = {
        products: [],
        users: [],
        orders: [],
        charts: {}
    };

    // Initialize dashboard
    function init() {
        console.log('Dashboard: Initializing dashboard');
        try {
            loadData();
            setupInteractiveElements();
            setupRealTimeUpdates();
            console.log('Dashboard: Initialization completed');
        } catch (error) {
            console.error('Dashboard: Initialization error:', error);
        }
    }

    // Load all dashboard data
    async function loadData() {
        try {
            console.log('Dashboard: Starting to load data');
            // Load stats
            await loadStats();

            // Load recent activity
            await loadRecentActivity();

            // Initialize charts
            initializeCharts();
            console.log('Dashboard: Data loading completed successfully');

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            window.AdminUtils.showToast('Failed to load dashboard data', 'error');
        }
    }

    // Load dashboard statistics
    async function loadStats() {
        try {
            console.log('Dashboard: Loading stats - calling APIs');
            const [products, users, orders] = await Promise.all([
                window.AdminAPI.getProducts(),
                window.AdminAPI.getUsers(),
                window.AdminAPI.getOrders()
            ]);

            console.log('Dashboard: API calls completed', { products: products?.length, users: users?.length, orders: orders?.length });
            state.products = products;
            state.users = users;
            state.orders = orders;

            // Calculate stats
            const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);
            const totalOrders = orders.length;
            const productsSold = orders.reduce((sum, order) =>
                sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0), 0);
            const totalCustomers = users.filter(user => !user.isAdmin).length;

            // Update UI
            updateStatCard('totalRevenue', window.AdminUtils.formatCurrency(totalRevenue));
            updateStatCard('totalOrders', totalOrders);
            updateStatCard('productsSold', productsSold);
            updateStatCard('totalCustomers', totalCustomers);

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // Update stat card values with animation
    function updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            const card = element.closest('.stat-card');
            const isCurrency = element.textContent.includes('₱');

            // Add update animation
            if (card) {
                card.classList.add('stat-updated');
                setTimeout(() => card.classList.remove('stat-updated'), 1000);
            }

            // Animate number change
            const targetValue = isCurrency ? parseFloat(value.replace(/[^\d.-]/g, '')) : parseInt(value);
            window.AdminUtils.animateNumber(element, targetValue);
        }
    }

    // Load recent activity
    async function loadRecentActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        // Mock data for now - replace with real API calls
        const activities = [
            { type: 'order', message: 'New order placed by John Doe', time: '2 hours ago' },
            { type: 'product', message: 'Chocolate Cake stock updated', time: '4 hours ago' },
            { type: 'user', message: 'New customer registered', time: '1 day ago' }
        ];

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${activity.type === 'order' ? 'shopping-cart' :
                                      activity.type === 'product' ? 'box' : 'user'}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    // Initialize charts
    function initializeCharts() {
        initializeSalesChart();
        initializeProductsChart();
    }

    // Initialize sales chart
    function initializeSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        state.charts.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Sales',
                    data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
                    borderColor: '#D4AF37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#D4AF37',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#B8951A',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                return '₱' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '₱' + value.toLocaleString();
                            },
                            color: '#6B7280'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6B7280'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    // Initialize products chart
    function initializeProductsChart() {
        const ctx = document.getElementById('productsChart');
        if (!ctx) return;

        state.charts.productsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Chocolate Cake', 'Vanilla Cake', 'Strawberry Cake', 'Red Velvet'],
                datasets: [{
                    data: [35, 25, 20, 20],
                    backgroundColor: [
                        '#D4AF37',
                        '#F59E0B',
                        '#10B981',
                        '#EF4444'
                    ],
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverBorderWidth: 5,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${percentage}% (${context.parsed})`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    // Setup interactive elements
    function setupInteractiveElements() {
        // Add hover effects to stat cards
        document.querySelectorAll('.stat-card').forEach(card => {
            window.AdminUtils.addHoverEffect(card);
        });

        // Add ripple effects to buttons
        document.querySelectorAll('.btn-primary, .btn-secondary').forEach(button => {
            window.AdminUtils.addRippleEffect(button);
        });

        // Add chart period switching
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                switchChartPeriod(period);
            });
        });
    }

    // Setup real-time updates
    function setupRealTimeUpdates() {
        // Update stats every 30 seconds
        setInterval(() => {
            loadStats();
        }, 30000);

        // Simulate real-time activity updates
        setInterval(() => {
            updateRecentActivity();
        }, 60000);
    }

    // Switch chart period
    function switchChartPeriod(period) {
        // Update button states
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');

        // Update chart data based on period
        updateChartData(period);
    }

    // Update chart data
    function updateChartData(period) {
        const periods = {
            '7d': { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data: [12000, 19000, 15000, 25000, 22000, 30000, 28000] },
            '30d': { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], data: [85000, 92000, 88000, 105000] },
            '90d': { labels: ['Month 1', 'Month 2', 'Month 3'], data: [280000, 320000, 295000] }
        };

        if (state.charts.salesChart) {
            state.charts.salesChart.data.labels = periods[period].labels;
            state.charts.salesChart.data.datasets[0].data = periods[period].data;
            state.charts.salesChart.update('active');
        }
    }

    // Update recent activity with new items
    function updateRecentActivity() {
        const activities = [
            { type: 'order', message: 'New order received', time: 'Just now' },
            { type: 'user', message: 'Customer signed up', time: '2 min ago' }
        ];

        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item fade-in';
            activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="fas fa-${activity.type === 'order' ? 'shopping-cart' : 'user'}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            `;

            activityList.insertBefore(activityItem, activityList.firstChild);

            // Remove oldest item if too many
            if (activityList.children.length > 10) {
                activityList.removeChild(activityList.lastChild);
            }
        });
    }

    // Export public API
    const publicAPI = {
        init: init,
        loadData: loadData,
        reloadStats: loadStats,
        switchChartPeriod: switchChartPeriod
    };

    return publicAPI;

})();

// Export as default for ES6 modules
export default DashboardTab;