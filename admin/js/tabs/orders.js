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
                    <select class="status-select" data-order-id="${order.id}">
                        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('');

        // Add event listeners for status changes
        tbody.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', handleStatusChange);
        });

        showPagination(filteredOrders.length);
    }

    // Handle status change
    async function handleStatusChange(event) {
        const select = event.target;
        const orderId = select.dataset.orderId;
        const newStatus = select.value;

        try {
            // Update order status via API
            await window.AdminAPI.updateOrderStatus(orderId, newStatus);

            // Update the order in state
            const order = state.orders.find(o => o.id == orderId);
            if (order) {
                order.status = newStatus;
            }

            // Update the status badge
            const row = select.closest('tr');
            const statusCell = row.querySelector('td:nth-child(5)');
            statusCell.innerHTML = `<span class="status-badge ${newStatus.toLowerCase()}">${newStatus}</span>`;

            window.AdminUtils.showToast(`Order #${orderId} status updated to ${newStatus}`, 'success');
        } catch (error) {
            console.error('Error updating order status:', error);
            window.AdminUtils.showToast('Failed to update order status', 'error');
            // Revert the select to original value
            const order = state.orders.find(o => o.id == orderId);
            if (order) {
                select.value = order.status;
            }
        }
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

    // Export public API
    const publicAPI = {
        init: init,
        loadData: loadData
    };

    return publicAPI;

})();

// Export as default for ES6 modules
export default OrdersTab;