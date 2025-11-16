// Orders Tab Module
const OrdersTab = (function() {
    'use strict';

    // State
    let state = {
        orders: [],
        filters: {
            status: '',
            dateFrom: '',
            dateTo: ''
        },
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1
    };

    // Initialize orders tab
    function init() {
        bindEvents();
        loadData();
    }

    // Bind event listeners
    function bindEvents() {
        // Status filter
        const statusFilter = document.getElementById('orderStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                state.filters.status = e.target.value;
                state.currentPage = 1;
                calculateTotalPages();
                renderOrders();
            });
        }

        // Date filters
        const dateFrom = document.getElementById('orderDateFrom');
        const dateTo = document.getElementById('orderDateTo');

        if (dateFrom) {
            dateFrom.addEventListener('change', (e) => {
                state.filters.dateFrom = e.target.value;
                state.currentPage = 1;
                calculateTotalPages();
                renderOrders();
            });
        }

        if (dateTo) {
            dateTo.addEventListener('change', (e) => {
                state.filters.dateTo = e.target.value;
                state.currentPage = 1;
                calculateTotalPages();
                renderOrders();
            });
        }
    }

    // Load orders data
    async function loadData() {
        try {
            console.log('OrdersTab: Loading orders data');
            const orders = await window.AdminAPI.getOrders();
            console.log('OrdersTab: Orders received:', orders?.length || 0);
            state.orders = orders;
            state.currentPage = 1;
            calculateTotalPages();
            renderOrders();
        } catch (error) {
            console.error('OrdersTab: Error loading orders:', error);
            window.AdminUtils.showToast('Failed to load orders', 'error');
        }
    }

    // Calculate total pages
    function calculateTotalPages() {
        const filteredOrders = getFilteredOrders();
        state.totalPages = Math.ceil(filteredOrders.length / state.itemsPerPage);
    }

    // Get filtered orders
    function getFilteredOrders() {
        let filtered = state.orders;

        // Apply status filter
        if (state.filters.status) {
            filtered = filtered.filter(order =>
                order.status === state.filters.status
            );
        }

        // Apply date filters
        if (state.filters.dateFrom) {
            const fromDate = new Date(state.filters.dateFrom);
            filtered = filtered.filter(order =>
                new Date(order.createdAt) >= fromDate
            );
        }

        if (state.filters.dateTo) {
            const toDate = new Date(state.filters.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of day
            filtered = filtered.filter(order =>
                new Date(order.createdAt) <= toDate
            );
        }

        return filtered;
    }

    // Render orders table
    function renderOrders() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        const filteredOrders = getFilteredOrders();

        if (filteredOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>No orders found</h3>
                        <p>No orders match the current filters.</p>
                    </td>
                </tr>
            `;
            hidePagination();
            return;
        }

        // Paginate
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

        tbody.innerHTML = paginatedOrders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.user ? window.AdminUtils.sanitizeInput(order.user.name) : 'N/A'}</td>
                <td>${order.items ? order.items.length : 0} items</td>
                <td>${window.AdminUtils.formatCurrency(order.totalAmount)}</td>
                <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
                <td>${window.AdminUtils.formatDate(order.createdAt)}</td>
                <td>
                    <button class="btn-icon" onclick="OrdersTab.viewOrderDetails(${order.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="OrdersTab.updateOrderStatus(${order.id}, '${order.status}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        showPagination(filteredOrders.length);
    }

    // Show pagination
    function showPagination(totalItems) {
        const paginationContainer = document.getElementById('ordersPaginationContainer');
        const paginationInfo = document.getElementById('ordersPaginationInfo');
        const pageNumbers = document.getElementById('ordersPageNumbers');
        const prevBtn = document.getElementById('ordersPrevPageBtn');
        const nextBtn = document.getElementById('ordersNextPageBtn');

        if (!paginationContainer || !paginationInfo || !pageNumbers || !prevBtn || !nextBtn) return;

        if (state.totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        const startItem = (state.currentPage - 1) * state.itemsPerPage + 1;
        const endItem = Math.min(state.currentPage * state.itemsPerPage, totalItems);
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} orders`;

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
                renderOrders();
            });
        });

        prevBtn.onclick = () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderOrders();
            }
        };

        nextBtn.onclick = () => {
            if (state.currentPage < state.totalPages) {
                state.currentPage++;
                renderOrders();
            }
        };
    }

    // Hide pagination
    function hidePagination() {
        const paginationContainer = document.getElementById('ordersPaginationContainer');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
    }

    // View order details
    function viewOrderDetails(orderId) {
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return;

        // Create modal content
        const modalContent = `
            <div class="order-header">
                <h3>Order #${order.id}</h3>
                <span class="order-status ${order.status.toLowerCase()}">${order.status}</span>
            </div>

            <div class="order-info">
                <div class="info-section">
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> ${order.user ? window.AdminUtils.sanitizeInput(order.user.name) : 'N/A'}</p>
                    <p><strong>Email:</strong> ${order.user ? window.AdminUtils.sanitizeInput(order.user.email) : 'N/A'}</p>
                </div>

                <div class="info-section">
                    <h4>Order Details</h4>
                    <p><strong>Date:</strong> ${window.AdminUtils.formatDate(order.createdAt)}</p>
                    <p><strong>Payment:</strong> ${order.paymentMethod || 'N/A'}</p>
                    <p><strong>Shipping:</strong> ${order.shippingAddress || 'N/A'}</p>
                </div>
            </div>

            <div class="order-items">
                <h4>Items Ordered</h4>
                <div class="items-list">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <img src="${item.product ? item.product.imageUrl : ''}" alt="${item.product ? item.product.name : ''}" class="item-image">
                            <div class="item-details">
                                <h5>${item.product ? window.AdminUtils.sanitizeInput(item.product.name) : 'Unknown Product'}</h5>
                                <p>Quantity: ${item.quantity}</p>
                                <p>Price: ${window.AdminUtils.formatCurrency(item.product ? item.product.price : 0)}</p>
                            </div>
                            <div class="item-total">
                                ${window.AdminUtils.formatCurrency((item.product ? item.product.price : 0) * item.quantity)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="order-total">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>${window.AdminUtils.formatCurrency(order.totalAmount)}</span>
                </div>
                <div class="total-row final">
                    <span><strong>Total:</strong></span>
                    <span><strong>${window.AdminUtils.formatCurrency(order.totalAmount)}</strong></span>
                </div>
            </div>
        `;

        // Show modal (this would need a modal system)
        window.AdminUtils.showToast('Order details modal coming soon', 'info');
        console.log('Order details:', modalContent);
    }

    // Update order status
    async function updateOrderStatus(orderId, currentStatus) {
        const newStatus = prompt('Enter new status:', currentStatus);
        if (!newStatus || newStatus === currentStatus) return;

        const order = state.orders.find(o => o.id === orderId);
        const orderName = order ? `Order #${orderId}` : `Order #${orderId}`;

        try {
            await window.AdminAPI.updateOrderStatus(orderId, newStatus);

            // Log the action
            try {
                await window.AdminAPI.createLog({
                    action: 'update',
                    entityType: 'order',
                    entityId: orderId,
                    entityName: orderName,
                    details: `Changed status from ${currentStatus} to ${newStatus}`,
                    adminName: 'Admin'
                });
            } catch (logError) {
                console.error('Failed to log order status update:', logError);
            }

            window.AdminUtils.showToast('Order status updated successfully', 'success');
            await loadData();
        } catch (error) {
            window.AdminUtils.showToast('Failed to update order status', 'error');
        }
    }

    // Export public API
    const publicAPI = {
        init: init,
        loadData: loadData,
        viewOrderDetails: viewOrderDetails,
        updateOrderStatus: updateOrderStatus
    };

    return publicAPI;

})();

// Export as default for ES6 modules
export default OrdersTab;