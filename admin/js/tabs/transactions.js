// Transactions Tab Module
const TransactionsTab = (function() {
    'use strict';

    console.log('TransactionsTab module loaded');

    // State
    let state = {
        transactions: [],
        currentFilter: 'all',
        searchTerm: '',
        actionFilter: '',
        currentPage: 1,
        itemsPerPage: 20,
        totalPages: 1
    };

    // Initialize transactions tab
    function init() {
        console.log('TransactionsTab: Initializing transactions tab');
        bindEvents();
        setupEventListeners();
        loadData();
    }

    // Bind event listeners
    function bindEvents() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshTransactionsBtn');
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
        const searchInput = document.getElementById('transactionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchTerm = e.target.value.toLowerCase();
                renderTransactions();
            });
        }

        // Action filter
        const actionFilter = document.getElementById('actionFilter');
        if (actionFilter) {
            actionFilter.addEventListener('change', (e) => {
                state.actionFilter = e.target.value;
                renderTransactions();
            });
        }

        // Pagination
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (state.currentPage > 1) {
                    state.currentPage--;
                    renderTransactions();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (state.currentPage < state.totalPages) {
                    state.currentPage++;
                    renderTransactions();
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

        // Listen for inventory changes
        window.AdminEvents.on('productAdded', handleProductChange);
        window.AdminEvents.on('productUpdated', handleProductChange);
        window.AdminEvents.on('productDeleted', handleProductChange);
    }

    // Handle product changes
    function handleProductChange(data) {
        console.log('TransactionsTab: Product change detected, refreshing data', data);
        loadData();
    }

    // Load transactions data
    async function loadData() {
        try {
            console.log('TransactionsTab: Loading transactions data');
            const transactions = await window.AdminAPI.getTransactions();
            console.log('TransactionsTab: Transactions received:', transactions?.length || 0);
            state.transactions = transactions;
            state.currentPage = 1;
            calculateTotalPages();
            renderTransactions();
        } catch (error) {
            console.error('TransactionsTab: Failed to load transactions:', error);
            window.AdminUtils.showToast('Failed to load transactions', 'error');
            showEmptyState();
        }
    }

    // Calculate total pages
    function calculateTotalPages() {
        const filteredTransactions = getFilteredTransactions();
        state.totalPages = Math.ceil(filteredTransactions.length / state.itemsPerPage);
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
        renderTransactions();
    }

    // Get filtered transactions
    function getFilteredTransactions() {
        let filtered = state.transactions;

        // Apply type filter
        if (state.currentFilter !== 'all') {
            filtered = filtered.filter(transaction => transaction.type === state.currentFilter);
        }

        // Apply action filter
        if (state.actionFilter) {
            filtered = filtered.filter(transaction => transaction.action === state.actionFilter);
        }

        // Apply search filter
        if (state.searchTerm) {
            filtered = filtered.filter(transaction =>
                transaction.productName.toLowerCase().includes(state.searchTerm) ||
                transaction.productDetails.toLowerCase().includes(state.searchTerm) ||
                transaction.id.toString().includes(state.searchTerm)
            );
        }

        return filtered;
    }

    // Render transactions table
    function renderTransactions() {
        const tableBody = document.getElementById('transactionsTableBody');
        if (!tableBody) return;

        const filteredTransactions = getFilteredTransactions();

        if (filteredTransactions.length === 0) {
            showEmptyState();
            hidePagination();
            return;
        }

        // Paginate
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

        tableBody.innerHTML = paginatedTransactions.map(transaction => `
            <tr>
                <td>${formatDateTime(transaction.createdAt)}</td>
                <td>#${transaction.id}</td>
                <td><span class="transaction-action ${transaction.action}">${transaction.action}</span></td>
                <td><span class="transaction-type ${transaction.type}">${formatType(transaction.type)}</span></td>
                <td>
                    <div class="product-details">
                        <div class="detail-item"><strong>${window.AdminUtils.sanitizeInput(transaction.productName)}</strong></div>
                        <div class="detail-item">${transaction.productDetails}</div>
                    </div>
                </td>
                <td>${formatStockChange(transaction)}</td>
            </tr>
        `).join('');

        showPagination(filteredTransactions.length);
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

    // Format transaction type
    function formatType(type) {
        return type === 'stock_in' ? 'Stock In' : 'Stock Out';
    }

    // Format stock change
    function formatStockChange(transaction) {
        if (!transaction.quantityChange) return '-';

        const sign = transaction.quantityChange > 0 ? '+' : '';
        const className = transaction.quantityChange > 0 ? 'positive' :
                         transaction.quantityChange < 0 ? 'negative' : 'zero';

        return `<span class="stock-change ${className}">${sign}${transaction.quantityChange}</span>`;
    }

    // Show empty state
    function showEmptyState() {
        const tableBody = document.getElementById('transactionsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No transactions found</h3>
                    <p>Transaction history will appear here when admin actions are performed on inventory.</p>
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
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} transactions`;

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
                renderTransactions();
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

        window.AdminEvents.off('productAdded', handleProductChange);
        window.AdminEvents.off('productUpdated', handleProductChange);
        window.AdminEvents.off('productDeleted', handleProductChange);
    }

    // Export public API
    const publicAPI = {
        init,
        loadData,
        cleanup
    };

    console.log('TransactionsTab public API:', publicAPI);

    // Make it globally available
    window.TransactionsTab = publicAPI;

    return publicAPI;

})();

// Export as default for ES6 modules
export default TransactionsTab;