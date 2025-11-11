// Payments Tab Module
(function() {
    'use strict';

    // State
    let state = {
        payments: [],
        currentFilter: 'all',
        searchTerm: ''
    };

    // Initialize payments tab
    function init() {
        console.log('PaymentsTab: Initializing payments tab');
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
            const payments = await window.AdminAPI.getPayments();
            state.payments = payments;
            updateStats();
            renderPayments();
        } catch (error) {
            console.error('Failed to load payments:', error);
            window.AdminUtils.showToast('Failed to load payments', 'error');
        }
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

        renderPayments();
    }

    // Render payments grid
    function renderPayments() {
        const grid = document.getElementById('paymentsGrid');
        if (!grid) return;

        let filteredPayments = state.payments;

        // Apply status filter
        if (state.currentFilter !== 'all') {
            filteredPayments = filteredPayments.filter(payment =>
                payment.status === state.currentFilter
            );
        }

        // Apply search filter
        if (state.searchTerm) {
            filteredPayments = filteredPayments.filter(payment =>
                payment.orderId.toString().includes(state.searchTerm)
            );
        }

        if (filteredPayments.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-credit-card"></i>
                    <h3>No payments found</h3>
                    <p>${state.searchTerm ? 'Try adjusting your search terms' : 'No payments match the current filter'}</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredPayments.map(payment => `
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
    }

    // Confirm payment
    async function confirmPayment(paymentId) {
        if (!confirm('Are you sure you want to confirm this payment?')) return;

        try {
            await window.AdminAPI.updatePaymentStatus(paymentId, 'confirmed');
            window.AdminUtils.showToast('Payment confirmed successfully', 'success');
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

        try {
            await window.AdminAPI.updatePaymentStatus(paymentId, 'rejected', notes);
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

                <div class="payment-detail-grid">
                    <div class="detail-section">
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

                    ${payment.receiptImageUrl ? `
                        <div class="detail-section">
                            <h3>Payment Proof</h3>
                            <div class="receipt-preview">
                                <img src="http://localhost:3001${payment.receiptImageUrl}"
                                     alt="Payment receipt"
                                     style="max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                            </div>
                        </div>
                    ` : ''}
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