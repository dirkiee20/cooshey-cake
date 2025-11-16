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
        loadData();
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
            // Show empty state on error
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

        document.getElementById('pendingCount').textContent = stats.pending;
        document.getElementById('confirmedCount').textContent = stats.confirmed;
        document.getElementById('rejectedCount').textContent = stats.rejected;
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

        if (!filteredPayments || filteredPayments.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-credit-card"></i>
                    <h3>No payments found</h3>
                    <p>${state.searchTerm ? 'Try adjusting your search terms' : 'No payments match the current filter'}</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = paginatedPayments.map(payment => `
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

                ${payment.receiptImageUrl ? `
                    <div class="payment-proof">
                        <img src="http://localhost:3001${payment.receiptImageUrl}"
                              alt="Payment proof"
                              onclick="PaymentsTab.viewReceipt('${payment.receiptImageUrl}')"
                              style="cursor: pointer; max-width: 100px; max-height: 100px; border-radius: 8px;">
                    </div>
                ` : ''}

                <div class="payment-actions">
                    ${payment.status === 'pending' ? `
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
        `).join('');

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

        // Update navigation buttons
        prevBtn.disabled = state.currentPage === 1;
        nextBtn.disabled = state.currentPage === state.totalPages;

        // Bind page number events
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
            // First update payment status
            await window.AdminAPI.updatePaymentStatus(paymentId, 'confirmed');

            // Update order status to Processing when payment is confirmed
            await window.AdminAPI.updateOrderStatus(payment.orderId, 'Processing');

            // Get order details to create stock transactions
            const orderDetails = await window.AdminAPI.getOrderById(payment.orderId);

            // Create stock transactions for each item in the order (sale type)
            if (orderDetails && orderDetails.items) {
                for (const item of orderDetails.items) {
                    if (item.product && item.quantity > 0) {
                        try {
                            await window.AdminAPI.createStockTransaction({
                                productId: item.product.id,
                                type: 'sale',
                                quantity: item.quantity,
                                reference: `Order #${payment.orderId}`,
                                notes: `Payment confirmed - Order #${payment.orderId}`
                            });
                        } catch (stockError) {
                            console.error('Failed to create stock transaction for product:', item.product.id, stockError);
                            // Continue with other items even if one fails
                        }
                    }
                }
            }

            // Log the action
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
        if (notes === null) return; // User cancelled

        const payment = state.payments.find(p => p.id === paymentId);
        const paymentName = payment ? `Order #${payment.orderId}` : `Payment #${paymentId}`;

        try {
            await window.AdminAPI.updatePaymentStatus(paymentId, 'rejected', notes);

            // Log the action
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

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content large-modal">
                <span class="close-btn">&times;</span>
                <h2>Payment Details - Order #${payment.orderId}</h2>

                <div class="payment-detail-grid horizontal-layout">
                            <div class="detail-section payment-proof-section">
                                <h3>Payment Proof</h3>
                                ${payment.receiptImageUrl ? `
                                    <div class="receipt-preview">
                                        <img src="http://localhost:3001${payment.receiptImageUrl}"
                                             alt="Payment receipt"
                                             style="max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                                    </div>
                                ` : `
                                    <div class="no-proof">
                                        <i class="fas fa-image" style="font-size: 48px; color: #ccc; margin-bottom: 10px;"></i>
                                        <p>No payment proof uploaded yet</p>
                                    </div>
                                `}
                            </div>
        
                            <div class="detail-section payment-info-section">
                                <h3>Payment Information</h3>
                                <div class="detail-row">
                                    <span class="label">Payment ID:</span>
                                    <span class="value">${payment.id}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Order ID:</span>
                                    <span class="value">${payment.orderId}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Amount:</span>
                                    <span class="value">${window.AdminUtils.formatCurrency(payment.amount)}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Method:</span>
                                    <span class="value">${payment.paymentMethod.toUpperCase()}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Status:</span>
                                    <span class="value">
                                        <span class="status-badge ${payment.status}">${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</span>
                                    </span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Submitted:</span>
                                    <span class="value">${new Date(payment.createdAt).toLocaleString()}</span>
                                </div>
                                ${payment.gcashReference ? `
                                    <div class="detail-row">
                                        <span class="label">GCash Reference:</span>
                                        <span class="value">${payment.gcashReference}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                ${payment.notes ? `
                    <div class="detail-section">
                        <h3>Admin Notes</h3>
                        <p>${payment.notes}</p>
                    </div>
                ` : ''}

                <div class="modal-actions">
                    ${payment.status === 'pending' ? `
                        <button class="btn btn-success" onclick="PaymentsTab.confirmPayment(${payment.id}); this.closest('.modal').remove();">
                            <i class="fas fa-check"></i> Confirm Payment
                        </button>
                        <button class="btn btn-danger" onclick="PaymentsTab.rejectPayment(${payment.id}); this.closest('.modal').remove();">
                            <i class="fas fa-times"></i> Reject Payment
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove();">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Close modal functionality
        modal.querySelector('.close-btn').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
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