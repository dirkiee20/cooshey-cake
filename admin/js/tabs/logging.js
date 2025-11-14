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

    // Load logs data
    async function loadData() {
        try {
            console.log('LoggingTab: Loading logs data');
            const logs = await window.AdminAPI.getLogs();
            console.log('LoggingTab: Logs received:', logs?.length || 0);
            state.logs = logs;
            state.currentPage = 1;
            calculateTotalPages();
            renderLogs();
        } catch (error) {
            console.error('LoggingTab: Failed to load logs:', error);
            window.AdminUtils.showToast('Failed to load logs', 'error');
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
            filtered = filtered.filter(log => log.entityType === state.currentFilter);
        }

        // Apply action filter
        if (state.actionFilter) {
            filtered = filtered.filter(log => log.action === state.actionFilter);
        }

        // Apply search filter
        if (state.searchTerm) {
            filtered = filtered.filter(log =>
                log.entityName.toLowerCase().includes(state.searchTerm) ||
                log.adminName?.toLowerCase().includes(state.searchTerm) ||
                log.details?.toLowerCase().includes(state.searchTerm) ||
                log.id.toString().includes(state.searchTerm)
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