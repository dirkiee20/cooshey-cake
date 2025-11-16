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

    // Load all dashboard data progressively
    async function loadData() {
        try {
            console.log('Dashboard: Starting to load data progressively');

            // Load stats first (most important)
            await loadStats();

            // Load recent activity
            await loadRecentActivity();

            // Initialize charts with lazy loading
            setupLazyCharts();

            console.log('Dashboard: Data loading completed successfully');

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            window.AdminUtils.showToast('Failed to load dashboard data', 'error');
        }
    }

    // Load dashboard statistics with caching
    async function loadStats() {
        try {
            console.log('Dashboard: Loading stats');

            // Check cache first
            const cached = getCachedStats();
            if (cached && isCacheValid(cached.timestamp)) {
                console.log('Dashboard: Using cached stats');
                updateStatsUI(cached.stats);
                return;
            }

            // Show loading state
            showStatsLoading(true);

            console.log('Dashboard: Fetching fresh data from dashboard API');
            const stats = await window.AdminAPI.request('/dashboard/stats');

            console.log('Dashboard: Stats received', stats);

            // Cache the results
            cacheStats(stats);

            // Update UI
            updateStatsUI(stats);

            // Hide loading
            showStatsLoading(false);

        } catch (error) {
            console.error('Error loading stats:', error);
            showStatsLoading(false);
        }
    }


    // Update stats UI
    function updateStatsUI(stats) {
        updateStatCard('totalRevenue', window.AdminUtils.formatCurrency(stats.totalRevenue));
        updateStatCard('totalOrders', stats.totalOrders);
        updateStatCard('productsSold', stats.productsSold);
        updateStatCard('totalCustomers', stats.totalCustomers);
    }

    // Show/hide loading state for stats
    function showStatsLoading(show) {
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            if (show) {
                statsGrid.classList.add('loading');
            } else {
                statsGrid.classList.remove('loading');
            }
        }
    }

    // Cache management
    function cacheStats(stats) {
        const cacheData = {
            stats,
            timestamp: Date.now()
        };
        localStorage.setItem('dashboardStats', JSON.stringify(cacheData));
    }

    function getCachedStats() {
        const cached = localStorage.getItem('dashboardStats');
        return cached ? JSON.parse(cached) : null;
    }

    function isCacheValid(timestamp) {
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        return (Date.now() - timestamp) < CACHE_DURATION;
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

        try {
            const activities = await window.AdminAPI.request('/dashboard/activity');

            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-${getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${activity.message}</p>
                        <span class="activity-time">${formatActivityTime(activity.time)}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading recent activity:', error);
            // Fallback to empty state
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-content">
                        <p>No recent activity</p>
                        <span class="activity-time">-</span>
                    </div>
                </div>
            `;
        }
    }

    // Helper function to get activity icon
    function getActivityIcon(type) {
        const iconMap = {
            'order': 'shopping-cart',
            'payment': 'credit-card',
            'product': 'box',
            'user': 'user',
            'log': 'clipboard-list'
        };
        return iconMap[type] || 'circle';
    }

    // Helper function to format activity time
    function formatActivityTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    }

    // Setup lazy loading for charts
    function setupLazyCharts() {
        const chartContainers = document.querySelectorAll('.chart-container');

        if (chartContainers.length === 0) {
            // Fallback: initialize immediately if no containers found
            setTimeout(() => {
                initializeCharts();
            }, 100);
            return;
        }

        const observer = new IntersectionObserver(async (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    console.log('Dashboard: Charts container visible, initializing charts');
                    await initializeCharts();
                    observer.disconnect(); // Only initialize once
                    break;
                }
            }
        }, {
            threshold: 0.1 // Trigger when 10% visible
        });

        chartContainers.forEach(container => {
            observer.observe(container);
        });

        // Fallback timeout in case intersection doesn't trigger
        setTimeout(async () => {
            if (!state.charts.salesChart) {
                console.log('Dashboard: Fallback chart initialization');
                await initializeCharts();
            }
        }, 3000);
    }

    // Initialize charts
    async function initializeCharts() {
        await initializeSalesChart();
        await initializeProductsChart();
    }

    // Initialize sales chart
    async function initializeSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        try {
            // Load initial 7-day data
            const chartData = await window.AdminAPI.request('/dashboard/sales-chart?period=7d');

            state.charts.salesChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Sales',
                        data: chartData.data,
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
            } catch (error) {
                console.error('Error initializing sales chart:', error);
                // Show empty chart instead of mock data
                state.charts.salesChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Sales',
                            data: [0, 0, 0, 0, 0, 0, 0],
                            borderColor: '#D4AF37',
                            backgroundColor: 'rgba(212, 175, 55, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '₱' + value.toLocaleString();
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

    // Initialize products chart
    async function initializeProductsChart() {
        const ctx = document.getElementById('productsChart');
        if (!ctx) return;

        try {
            const chartData = await window.AdminAPI.request('/dashboard/products-chart');

            state.charts.productsChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        data: chartData.data,
                        backgroundColor: [
                            '#D4AF37',
                            '#F59E0B',
                            '#10B981',
                            '#EF4444',
                            '#8B5CF6',
                            '#06B6D4'
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
        } catch (error) {
            console.error('Error initializing products chart:', error);
            // Show empty chart instead of mock data
            state.charts.productsChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No data available'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
                        borderColor: '#fff',
                        borderWidth: 3
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
                            callbacks: {
                                label: function(context) {
                                    return 'No sales data available';
                                }
                            }
                        }
                    }
                }
            });
        }
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

    // Setup real-time updates (less frequent to reduce load)
    function setupRealTimeUpdates() {
        // Update stats every 60 seconds
        setInterval(() => {
            loadStats();
        }, 60000);

        // Simulate real-time activity updates every 2 minutes
        setInterval(() => {
            updateRecentActivity();
        }, 120000);
    }

    // Switch chart period
    async function switchChartPeriod(period) {
        // Update button states
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');

        // Update chart data based on period
        await updateChartData(period);
    }

    // Update chart data
    async function updateChartData(period) {
        try {
            const chartData = await window.AdminAPI.request(`/dashboard/sales-chart?period=${period}`);

            if (state.charts.salesChart) {
                state.charts.salesChart.data.labels = chartData.labels;
                state.charts.salesChart.data.datasets[0].data = chartData.data;
                state.charts.salesChart.update('active');
            }
        } catch (error) {
            console.error('Error updating chart data:', error);
            // Keep existing data on error
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