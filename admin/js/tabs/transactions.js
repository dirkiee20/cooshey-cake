// Transactions Tab Module
const TransactionsTab = (function() {
    'use strict';

    console.log('TransactionsTab module loaded');

    // State
    let state = {
        transactions: [],
        products: [],
        currentFilter: 'all',
        searchTerm: '',
        currentPage: 1,
        itemsPerPage: 20,
        totalPages: 1
    };

    // Initialize transactions tab
    function init() {
        console.log('TransactionsTab: Initializing transactions tab');
        bindEvents();
        loadProducts();
        loadData();
    }

    // Bind event listeners
    function bindEvents() {
        // Add transaction button
        const addBtn = document.getElementById('addTransactionBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => openTransactionModal());
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

        // Modal events
        setupModalEvents();
    }

    // Setup modal events
    function setupModalEvents() {
        const modal = document.getElementById('transactionModal');
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = document.getElementById('cancelBtn');
        const form = document.getElementById('transactionForm');

        closeBtn.addEventListener('click', () => closeTransactionModal());
        cancelBtn.addEventListener('click', () => closeTransactionModal());

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeTransactionModal();
            }
        });

        // Form submission
        form.addEventListener('submit', handleTransactionSubmit);
    }

    // Load products for dropdown
    async function loadProducts() {
        try {
            const products = await window.AdminAPI.getProducts();
            state.products = products;
            populateProductSelect();
        } catch (error) {
            console.error('TransactionsTab: Error loading products:', error);
        }
    }

    // Populate product select dropdown
    function populateProductSelect() {
        const select = document.getElementById('productSelect');
        select.innerHTML = '<option value="">Select a product...</option>';

        state.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (Current stock: ${product.stock})`;
            select.appendChild(option);
        });
    }

    // Load transactions data
    async function loadData() {
        try {
            console.log('TransactionsTab: Loading transactions data');
            const transactions = await window.AdminAPI.getStockTransactions();
            console.log('TransactionsTab: Transactions received:', transactions?.length || 0);
            state.transactions = transactions || [];
            renderTransactions();
        } catch (error) {
            console.error('TransactionsTab: Error loading transactions:', error);
            window.AdminUtils.showToast('Failed to load transactions', 'error');
        }
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

        renderTransactions();
    }

    // Render transactions table
    function renderTransactions() {
        const tbody = document.getElementById('transactionsTableBody');
        if (!tbody) return;

        let filteredTransactions = state.transactions;

        // Apply type filter
        if (state.currentFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(transaction =>
                transaction.type === state.currentFilter
            );
        }

        // Apply search filter
        if (state.searchTerm) {
            filteredTransactions = filteredTransactions.filter(transaction =>
                transaction.product?.name.toLowerCase().includes(state.searchTerm) ||
                transaction.reference?.toLowerCase().includes(state.searchTerm) ||
                transaction.notes?.toLowerCase().includes(state.searchTerm)
            );
        }

        // Pagination
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

        if (paginatedTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fas fa-exchange-alt"></i>
                        <h3>No transactions found</h3>
                        <p>${state.searchTerm ? 'Try adjusting your search terms' : 'No transactions match the current filter'}</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = paginatedTransactions.map(transaction => `
            <tr>
                <td>${window.AdminUtils.formatDate(transaction.createdAt)}</td>
                <td>
                    <div class="product-info">
                        <strong>${transaction.product?.name || 'Unknown Product'}</strong>
                    </div>
                </td>
                <td>
                    <span class="transaction-type ${transaction.type}">
                        ${formatTransactionType(transaction.type)}
                    </span>
                </td>
                <td>${transaction.quantity}</td>
                <td>
                    <span class="stock-change ${getStockChangeClass(transaction.type)}">
                        ${getStockChangeSymbol(transaction.type)}${transaction.quantity}
                    </span>
                </td>
                <td>${transaction.reference || '-'}</td>
                <td>${transaction.admin?.name || 'System'}</td>
                <td>${transaction.notes || '-'}</td>
            </tr>
        `).join('');

        // Update pagination
        updatePagination(filteredTransactions.length);
    }

    // Format transaction type for display
    function formatTransactionType(type) {
        const types = {
            'stock_in': 'Stock In',
            'stock_out': 'Stock Out',
            'adjustment': 'Adjustment',
            'sale': 'Sale',
            'return': 'Return'
        };
        return types[type] || type;
    }

    // Get stock change class
    function getStockChangeClass(type) {
        if (type === 'stock_in' || type === 'return') {
            return 'positive';
        } else if (type === 'stock_out' || type === 'sale' || type === 'adjustment') {
            return 'negative';
        }
        return '';
    }

    // Get stock change symbol
    function getStockChangeSymbol(type) {
        if (type === 'stock_in' || type === 'return') {
            return '+';
        } else if (type === 'stock_out' || type === 'sale' || type === 'adjustment') {
            return '-';
        }
        return '';
    }

    // Update pagination
    function updatePagination(totalItems) {
        state.totalPages = Math.ceil(totalItems / state.itemsPerPage);

        const paginationContainer = document.getElementById('paginationContainer');
        const paginationInfo = document.getElementById('paginationInfo');
        const pageNumbers = document.getElementById('pageNumbers');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (state.totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        paginationInfo.textContent = `Showing ${Math.min(totalItems, state.itemsPerPage)} of ${totalItems} transactions`;

        // Update page numbers
        let pageHtml = '';
        for (let i = 1; i <= state.totalPages; i++) {
            pageHtml += `<button class="page-number ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        pageNumbers.innerHTML = pageHtml;

        // Update navigation buttons
        prevBtn.disabled = state.currentPage === 1;
        nextBtn.disabled = state.currentPage === state.totalPages;

        // Bind page number events
        pageNumbers.querySelectorAll('.page-number').forEach(btn => {
            btn.addEventListener('click', (e) => {
                state.currentPage = parseInt(e.target.dataset.page);
                renderTransactions();
            });
        });

        prevBtn.onclick = () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderTransactions();
            }
        };

        nextBtn.onclick = () => {
            if (state.currentPage < state.totalPages) {
                state.currentPage++;
                renderTransactions();
            }
        };
    }

    // Open transaction modal
    function openTransactionModal() {
        const modal = document.getElementById('transactionModal');
        const form = document.getElementById('transactionForm');

        // Reset form
        form.reset();
        document.getElementById('modalTitle').textContent = 'Add Stock Transaction';

        // Show modal
        modal.style.display = 'flex';
    }

    // Close transaction modal
    function closeTransactionModal() {
        const modal = document.getElementById('transactionModal');
        modal.style.display = 'none';
    }

    // Handle transaction form submission
    async function handleTransactionSubmit(e) {
        e.preventDefault();

        const formData = {
            productId: parseInt(document.getElementById('productSelect').value),
            type: document.getElementById('transactionType').value,
            quantity: parseInt(document.getElementById('quantity').value),
            reference: document.getElementById('reference').value.trim(),
            notes: document.getElementById('notes').value.trim()
        };

        try {
            await window.AdminAPI.createStockTransaction(formData);

            // Log the action
            try {
                const product = state.products.find(p => p.id === formData.productId);
                await window.AdminAPI.createLog({
                    action: 'create',
                    entityType: 'transaction',
                    entityId: null,
                    entityName: `${formatTransactionType(formData.type)} - ${product?.name || 'Unknown Product'}`,
                    details: `${formData.type} transaction: ${formData.quantity} units${formData.reference ? ` (Ref: ${formData.reference})` : ''}`,
                    adminName: 'Admin'
                });
            } catch (logError) {
                console.error('Failed to log transaction:', logError);
            }

            window.AdminUtils.showToast('Transaction added successfully', 'success');
            closeTransactionModal();
            await loadData();
            await loadProducts(); // Refresh product stock levels
        } catch (error) {
            console.error('Error creating transaction:', error);
            window.AdminUtils.showToast('Failed to add transaction', 'error');
        }
    }

    // Export public API
    const publicAPI = {
        init: init,
        loadData: loadData
    };

    return publicAPI;

})();

// Export as default for ES6 modules
export default TransactionsTab;