// Payments Tab Module
(function() {
    'use strict';

    // State
    let state = {
        payments: [],
        currentFilter: 'all',
        searchTerm: '',
        currentPage: 1,
        itemsPerPage: 12,
        totalPages: 1
    };

    // Initialize payments tab
    function init() {
        console.log('PaymentsTab: Initializing payments tab');
        console.log('PaymentsTab: Window object available:', !!window);
        console.log('PaymentsTab: AdminAPI available:', !!window.AdminAPI);
        bindEvents();
        setFilter('all'); // Reset active state
        loadData();
        bindModalCloseButtons();
    }

    // Bind event listeners
    function bindEvents() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                setFilter(filter);
            });
        });

        // Search input
        const searchInput = document.getElementById('paymentSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchTerm = e.target.value.toLowerCase();
                renderPayments();
            });
        }
    }

    // Bind close button functionality for modals
    function bindModalCloseButtons() {
        // Handle buttons with btn-close-modal class
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });

        // Handle buttons with data-dismiss="modal" attribute
        document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });

        // Also close modal if clicking outside modal content (modal overlay)
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    // Load payments data
    async function loadData() {
        try {
            console.log('PaymentsTab: Loading payments data');
            const payments = await window.AdminAPI.getPayments();
            console.log('PaymentsTab: Payments received:', payments?.length || 0);
            state.payments = payments || [];
            state.currentPage = 1;
            calculateTotalPages();
            updateStats();
            renderPayments();
        } catch (error) {
            console.error('PaymentsTab: Failed to load payments:', error);
            state.payments = [];
            state.currentPage = 1;
            calculateTotalPages();
            updateStats();
            renderPayments();
            window.AdminUtils.showToast('Failed to load payments', 'error');
        }
    }

    // Calculate total pages
    function calculateTotalPages() {
        const filteredPayments = getFilteredPayments();
        state.totalPages = Math.ceil(filteredPayments.length / state.itemsPerPage);
    }

    // Update statistics
    function updateStats() {
        const stats = {
            pending: state.payments.filter(p => p.status === 'pending').length,
            confirmed: state.payments.filter(p => p.status === 'confirmed').length,
            rejected: state.payments.filter(p => p.status === 'rejected').length
        };

        const pendingElem = document.getElementById('pendingCount');
        const confirmedElem = document.getElementById('confirmedCount');
        const rejectedElem = document.getElementById('rejectedCount');

        if (pendingElem) pendingElem.textContent = stats.pending;
        if (confirmedElem) confirmedElem.textContent = stats.confirmed;
        if (rejectedElem) rejectedElem.textContent = stats.rejected;
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
        renderPayments();
    }

    // Get filtered payments
    function getFilteredPayments() {
        let filtered = state.payments || [];

        // Apply status filter
        if (state.currentFilter !== 'all') {
            filtered = filtered.filter(payment =>
                payment.status === state.currentFilter
            );
        }

        // Apply search filter
        if (state.searchTerm) {
            filtered = filtered.filter(payment =>
                payment.orderId.toString().includes(state.searchTerm)
            );
        }

        return filtered;
    }

    // Render payments grid
    function renderPayments() {
        const grid = document.getElementById('paymentsGrid');
        if (!grid) return;

        const filteredPayments = getFilteredPayments();
        console.log('PaymentsTab: Rendering payments, filtered count:', filteredPayments.length);
        console.log('PaymentsTab: Current filter:', state.currentFilter);

        if (!filteredPayments || filteredPayments.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-credit-card"></i>
                    <h3>No payments found</h3>
                    <p>${state.searchTerm ? 'Try adjusting your search terms' : 'No payments match the current filter'}</p>
                </div>
            `;
            hidePagination();
            return;
        }

        // Paginate
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

        grid.innerHTML = paginatedPayments.map(payment => {
            const isPending = (payment.status === 'pending');

            return `
            <div class="payment-card" data-id="${payment.id}">
                <div class="payment-header">
                    <div class="payment-info">
                        <h3>Order #${payment.orderId}</h3>
                        <span class="payment-amount">${window.AdminUtils.formatCurrency(payment.amount)}</span>
                    </div>
                    <div class="payment-status status-${payment.status}">
                        <span class="status-badge ${payment.status}">
                            ${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                    </div>
                </div>

                <div class="payment-details">
                    <div class="detail-row">
                        <span class="label">Payment Method:</span>
                        <span class="value">${payment.paymentMethod.toUpperCase()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Submitted:</span>
                        <span class="value">${window.AdminUtils.formatDate(payment.createdAt)}</span>
                    </div>
                    ${payment.gcashReference ? `
                        <div class="detail-row">
                            <span class="label">Reference:</span>
                            <span class="value">${payment.gcashReference}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="payment-actions">
                    ${isPending ? `
                        <button class="btn btn-success" onclick="PaymentsTab.confirmPayment(${payment.id})">
                            <i class="fas fa-check"></i> Confirm
                        </button>
                        <button class="btn btn-danger" onclick="PaymentsTab.rejectPayment(${payment.id})">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="PaymentsTab.viewDetails(${payment.id})">
                        <i class="fas fa-eye"></i> Details
                    </button>
                </div>

                ${payment.notes ? `
                    <div class="payment-notes">
                        <strong>Notes:</strong> ${payment.notes}
                    </div>
                ` : ''}
            </div>
            `;
        }).join('');

        showPagination(filteredPayments.length);
    }

    // Show pagination
    function showPagination(totalItems) {
        const paginationContainer = document.getElementById('paymentsPaginationContainer');
        const paginationInfo = document.getElementById('paymentsPaginationInfo');
        const pageNumbers = document.getElementById('paymentsPageNumbers');
        const prevBtn = document.getElementById('paymentsPrevPageBtn');
        const nextBtn = document.getElementById('paymentsNextPageBtn');

        if (!paginationContainer || !paginationInfo || !pageNumbers || !prevBtn || !nextBtn) return;

        if (state.totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        const startItem = (state.currentPage - 1) * state.itemsPerPage + 1;
        const endItem = Math.min(state.currentPage * state.itemsPerPage, totalItems);
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} payments`;

        // Generate page numbers
        let pageHtml = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, state.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(state.totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageHtml += `<button class="page-number ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        pageNumbers.innerHTML = pageHtml;

        prevBtn.disabled = state.currentPage === 1;
        nextBtn.disabled = state.currentPage === state.totalPages;

        pageNumbers.querySelectorAll('.page-number').forEach(btn => {
            btn.addEventListener('click', (e) => {
                state.currentPage = parseInt(e.target.dataset.page);
                renderPayments();
            });
        });

        prevBtn.onclick = () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderPayments();
            }
        };

        nextBtn.onclick = () => {
            if (state.currentPage < state.totalPages) {
                state.currentPage++;
                renderPayments();
            }
        };
    }

    // Hide pagination
    function hidePagination() {
        const paginationContainer = document.getElementById('paymentsPaginationContainer');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
    }

    // Confirm payment
    async function confirmPayment(paymentId) {
        if (!confirm('Are you sure you want to confirm this payment?')) return;

        const payment = state.payments.find(p => p.id === paymentId);
        const paymentName = payment ? `Order #${payment.orderId}` : `Payment #${paymentId}`;

        try {
            await window.AdminAPI.updatePaymentStatus(paymentId, 'confirmed');
            await window.AdminAPI.updateOrderStatus(payment.orderId, 'Confirmed');

            try {
                await window.AdminAPI.createLog({
                    action: 'confirm',
                    entityType: 'payment',
                    entityId: paymentId,
                    entityName: paymentName,
                    details: `Confirmed payment for order #${payment?.orderId || 'unknown'} - inventory updated`,
                    adminName: 'Admin'
                });
            } catch (logError) {
                console.error('Failed to log payment confirmation:', logError);
            }

            // Clear dashboard cache to refresh stats (preserve auth token)
            localStorage.removeItem('dashboardStats');

            window.AdminUtils.showToast('Payment confirmed successfully - inventory updated', 'success');
            await loadData();
        } catch (error) {
            console.error('Failed to confirm payment:', error);
            window.AdminUtils.showToast('Failed to confirm payment', 'error');
        }
    }

    // Reject payment
    async function rejectPayment(paymentId) {
        const notes = prompt('Please provide a reason for rejection (optional):');
        if (notes === null) return;

        const payment = state.payments.find(p => p.id === paymentId);
        const paymentName = payment ? `Order #${payment.orderId}` : `Payment #${paymentId}`;

        try {
            await window.AdminAPI.updatePaymentStatus(paymentId, 'rejected', notes);

            try {
                await window.AdminAPI.createLog({
                    action: 'reject',
                    entityType: 'payment',
                    entityId: paymentId,
                    entityName: paymentName,
                    details: `Rejected payment for order #${payment?.orderId || 'unknown'}${notes ? `: ${notes}` : ''}`,
                    adminName: 'Admin'
                });
            } catch (logError) {
                console.error('Failed to log payment rejection:', logError);
            }

            window.AdminUtils.showToast('Payment rejected', 'success');
            await loadData();
        } catch (error) {
            console.error('Failed to reject payment:', error);
            window.AdminUtils.showToast('Failed to reject payment', 'error');
        }
    }

    // View payment details
    function viewDetails(paymentId) {
        const payment = state.payments.find(p => p.id === paymentId);
        if (!payment) return;

        document.getElementById('paymentDetailTitle').textContent = `Payment Proof Details - Order #${payment.orderId}`;
        document.getElementById('detailOrderId').textContent = payment.orderId;
        document.getElementById('detailCustomer').textContent = payment.order ? payment.order.userId : 'Unknown';
        document.getElementById('detailOrderAmount').textContent = window.AdminUtils.formatCurrency(payment.amount);
        document.getElementById('detailOrderDate').textContent = new Date(payment.createdAt).toLocaleDateString();
        document.getElementById('detailPaymentMethod').textContent = payment.paymentMethod.toUpperCase();
        document.getElementById('detailReference').textContent = payment.gcashReference || '-';
        document.getElementById('detailSubmitted').textContent = new Date(payment.createdAt).toLocaleString();
        document.getElementById('detailStatus').textContent = payment.status.charAt(0).toUpperCase() + payment.status.slice(1);
        document.getElementById('detailStatus').className = `status-badge ${payment.status}`;

        const notesRow = document.getElementById('detailNotesRow');
        if (payment.notes) {
            document.getElementById('detailNotes').textContent = payment.notes;
            notesRow.style.display = 'flex';
        } else {
            notesRow.style.display = 'none';
        }

        const receiptImage = document.getElementById('receiptImage');
        if (payment.receiptImageUrl) {
            receiptImage.src = `http://localhost:3001${payment.receiptImageUrl}`;
            receiptImage.style.display = 'block';
        } else {
            receiptImage.style.display = 'none';
        }

        const confirmBtn = document.getElementById('confirmPaymentBtn');
        const rejectBtn = document.getElementById('rejectPaymentBtn');

        if (payment.status === 'pending') {
            confirmBtn.style.display = 'block';
            rejectBtn.style.display = 'block';
        } else {
            confirmBtn.style.display = 'none';
            rejectBtn.style.display = 'none';
        }

        const modal = document.getElementById('paymentDetailModal');
        modal.style.display = 'flex';

        // Ensure modal close buttons are bound
        bindModalCloseButtons();

        // Add event listeners for modal buttons
        confirmBtn.onclick = () => {
            confirmPayment(paymentId);
            modal.style.display = 'none';
        };

        rejectBtn.onclick = () => {
            rejectPayment(paymentId);
            modal.style.display = 'none';
        };
    }

    // View receipt in modal
    function viewReceipt(imageUrl) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content receipt-modal">
                <span class="close-btn">&times;</span>
                <h2>Payment Receipt</h2>
                <div class="receipt-container">
                    <img src="http://localhost:3001${imageUrl}" alt="Payment receipt" style="max-width: 100%; max-height: 80vh;">
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        modal.querySelector('.close-btn').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    // Export public API
    window.PaymentsTab = {
        init,
        loadData,
        confirmPayment,
        rejectPayment,
        viewDetails,
        viewReceipt
    };

})();
