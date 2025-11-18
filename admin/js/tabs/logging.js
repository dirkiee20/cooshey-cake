// Logging Tab Module
const LoggingTab = (function() {
    'use strict';

    console.log('LoggingTab module loaded');

    // State
    let state = {
        logs: [],
        currentFilter: 'all',
        searchTerm: '',
        actionFilter: '',
        currentPage: 1,
        itemsPerPage: 20,
        totalPages: 1
    };

    // Initialize logging tab
    function init() {
        console.log('LoggingTab: Initializing logging tab');
        bindEvents();
        setFilter('all'); // Reset active state
        setupEventListeners();
        loadData();
    }

    // Bind event listeners
    function bindEvents() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshLogsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                loadData();
            });
        }

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                setFilter(filter);
            });
        });

        // Search input
        const searchInput = document.getElementById('logSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchTerm = e.target.value.toLowerCase();
                renderLogs();
            });
        }

        // Action filter
        const actionFilter = document.getElementById('actionFilter');
        if (actionFilter) {
            actionFilter.addEventListener('change', (e) => {
                state.actionFilter = e.target.value;
                renderLogs();
            });
        }

        // Pagination
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (state.currentPage > 1) {
                    state.currentPage--;
                    renderLogs();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (state.currentPage < state.totalPages) {
                    state.currentPage++;
                    renderLogs();
                }
            });
        }
    }

    // Setup event listeners for cross-tab communication
    function setupEventListeners() {
        // Check if AdminEvents is available
        if (!window.AdminEvents) {
            console.warn('AdminEvents not available, skipping event listeners setup');
            return;
        }

        // Listen for admin actions
        window.AdminEvents.on('productCreated', handleAdminAction);
        window.AdminEvents.on('productUpdated', handleAdminAction);
        window.AdminEvents.on('productDeleted', handleAdminAction);
        window.AdminEvents.on('paymentConfirmed', handleAdminAction);
        window.AdminEvents.on('paymentRejected', handleAdminAction);
        window.AdminEvents.on('orderUpdated', handleAdminAction);
    }

    // Handle admin actions
    function handleAdminAction(data) {
        console.log('LoggingTab: Admin action detected, refreshing data', data);
        loadData();
    }

    // Fetch stock transactions
    async function fetchStockTransactions() {
        try {
            const response = await fetch('/api/stock-transactions', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch stock transactions');
            }

            return await response.json();
        } catch (error) {
            console.error('LoggingTab: Failed to fetch stock transactions:', error);
            return [];
        }
    }

    // Combine logs and stock transactions into unified activities
    function combineActivities(logs, stockTransactions) {
        const activities = [];

        // Add logs
        logs.forEach(log => {
            // Check if this is a stock-in or stock-out log from product updates
            if (log.entityType === 'stock-in' || log.entityType === 'stock-out') {
                activities.push({
                    ...log,
                    type: 'stock',
                    activityType: log.entityType
                });
            } else {
                activities.push({
                    ...log,
                    type: 'log',
                    activityType: log.entityType
                });
            }
        });

        // Add stock transactions
        stockTransactions.forEach(transaction => {
            activities.push({
                id: `stock-${transaction.id}`,
                createdAt: transaction.createdAt,
                adminName: transaction.admin?.name || 'System',
                action: transaction.type.replace('_', '-'), // stock_in -> stock-in
                entityType: transaction.type.replace('_', '-'), // stock_in -> stock-in
                entityName: transaction.product?.name || `Product #${transaction.productId}`,
                details: `${transaction.type.replace('_', ' ').toUpperCase()}: ${transaction.quantity} units (${transaction.previousStock} → ${transaction.newStock})${transaction.reference ? ` - Ref: ${transaction.reference}` : ''}${transaction.notes ? ` - ${transaction.notes}` : ''}`,
                type: 'stock'
            });
        });

        // Sort by createdAt descending
        return activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Load logs data
    async function loadData() {
        try {
            console.log('LoggingTab: Loading logs and stock transactions data');

            // Fetch both logs and stock transactions
            const [logs, stockTransactions] = await Promise.all([
                window.AdminAPI.getLogs(),
                fetchStockTransactions()
            ]);

            console.log('LoggingTab: Logs received:', logs?.length || 0);
            console.log('LoggingTab: Stock transactions received:', stockTransactions?.length || 0);

            // Combine and format the data
            const combinedActivities = combineActivities(logs || [], stockTransactions || []);
            state.logs = combinedActivities;

            state.currentPage = 1;
            calculateTotalPages();
            renderLogs();
        } catch (error) {
            console.error('LoggingTab: Failed to load data:', error);
            window.AdminUtils.showToast('Failed to load activity logs', 'error');
            showEmptyState();
        }
    }

    // Calculate total pages
    function calculateTotalPages() {
        const filteredLogs = getFilteredLogs();
        state.totalPages = Math.ceil(filteredLogs.length / state.itemsPerPage);
    }

    // Set active filter
    function setFilter(filter) {
        state.currentFilter = filter;

        // Update UI
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        const activeTab = document.querySelector(`[data-filter="${filter}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        state.currentPage = 1;
        calculateTotalPages();
        renderLogs();
    }

    // Get filtered logs
    function getFilteredLogs() {
        let filtered = state.logs;

        // Apply entity type filter
        if (state.currentFilter !== 'all') {
            if (state.currentFilter === 'stock-in') {
                filtered = filtered.filter(activity => activity.type === 'stock' && activity.entityType === 'stock-in');
            } else if (state.currentFilter === 'stock-out') {
                filtered = filtered.filter(activity => activity.type === 'stock' && activity.entityType === 'stock-out');
            } else {
                // For other entity types (product, payment, order, user)
                filtered = filtered.filter(activity => activity.type === 'log' && activity.entityType === state.currentFilter);
            }
        }

        // Apply action filter (only for logs, not stock transactions)
        if (state.actionFilter) {
            filtered = filtered.filter(activity =>
                activity.type === 'log' && activity.action === state.actionFilter
            );
        }

        // Apply search filter
        if (state.searchTerm) {
            filtered = filtered.filter(activity =>
                activity.entityName.toLowerCase().includes(state.searchTerm) ||
                activity.adminName?.toLowerCase().includes(state.searchTerm) ||
                activity.details?.toLowerCase().includes(state.searchTerm) ||
                activity.id.toString().includes(state.searchTerm)
            );
        }

        return filtered;
    }

    // Render logs table
    function renderLogs() {
        const tableBody = document.getElementById('loggingTableBody');
        if (!tableBody) return;

        const filteredLogs = getFilteredLogs();

        if (filteredLogs.length === 0) {
            showEmptyState();
            hidePagination();
            return;
        }

        // Paginate
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

        tableBody.innerHTML = paginatedLogs.map(log => `
            <tr>
                <td>${formatDateTime(log.createdAt)}</td>
                <td>${log.adminName || 'System'}</td>
                <td><span class="log-action ${log.action}">${formatAction(log.action)}</span></td>
                <td><span class="log-entity-type ${log.entityType}">${formatEntityType(log.entityType)}</span></td>
                <td>
                    <div class="entity-details">
                        <div class="detail-item"><strong>${window.AdminUtils.sanitizeInput(log.entityName)}</strong></div>
                    </div>
                </td>
                <td>${log.details || '-'}</td>
            </tr>
        `).join('');

        showPagination(filteredLogs.length);
    }

    // Format date and time
    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // Format action
    function formatAction(action) {
        return action.charAt(0).toUpperCase() + action.slice(1);
    }

    // Format entity type
    function formatEntityType(entityType) {
        return entityType.charAt(0).toUpperCase() + entityType.slice(1);
    }

    // Show empty state
    function showEmptyState() {
        const tableBody = document.getElementById('loggingTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No activity logs found</h3>
                    <p>Admin activity logs will appear here when actions are performed.</p>
                </td>
            </tr>
        `;
    }

    // Show pagination
    function showPagination(totalItems) {
        const paginationContainer = document.getElementById('paginationContainer');
        const paginationInfo = document.getElementById('paginationInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageNumbers = document.getElementById('pageNumbers');

        if (!paginationContainer || !paginationInfo || !prevBtn || !nextBtn || !pageNumbers) return;

        // Update info
        const startItem = (state.currentPage - 1) * state.itemsPerPage + 1;
        const endItem = Math.min(state.currentPage * state.itemsPerPage, totalItems);
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} activities`;

        // Update buttons
        prevBtn.disabled = state.currentPage === 1;
        nextBtn.disabled = state.currentPage === state.totalPages;

        // Generate page numbers
        pageNumbers.innerHTML = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, state.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(state.totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === state.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                state.currentPage = i;
                renderLogs();
            });
            pageNumbers.appendChild(pageBtn);
        }

        paginationContainer.style.display = 'flex';
    }

    // Hide pagination
    function hidePagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
    }

    // Cleanup function to remove event listeners
    function cleanup() {
        if (!window.AdminEvents) return;

        window.AdminEvents.off('productCreated', handleAdminAction);
        window.AdminEvents.off('productUpdated', handleAdminAction);
        window.AdminEvents.off('productDeleted', handleAdminAction);
        window.AdminEvents.off('paymentConfirmed', handleAdminAction);
        window.AdminEvents.off('paymentRejected', handleAdminAction);
        window.AdminEvents.off('orderUpdated', handleAdminAction);
    }

    // Export public API
    const publicAPI = {
        init,
        loadData,
        cleanup
    };

    console.log('LoggingTab public API:', publicAPI);

    // Make it globally available
    window.LoggingTab = publicAPI;

    return publicAPI;

})();

// Export as default for ES6 modules
export default LoggingTab;