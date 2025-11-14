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
        }
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
                renderOrders();
            });
        }

        // Date filters
        const dateFrom = document.getElementById('orderDateFrom');
        const dateTo = document.getElementById('orderDateTo');

        if (dateFrom) {
            dateFrom.addEventListener('change', (e) => {
                state.filters.dateFrom = e.target.value;
                renderOrders();
            });
        }

        if (dateTo) {
            dateTo.addEventListener('change', (e) => {
                state.filters.dateTo = e.target.value;
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
            renderOrders();
        } catch (error) {
            console.error('OrdersTab: Error loading orders:', error);
            window.AdminUtils.showToast('Failed to load orders', 'error');
        }
    }

    // Render orders table
    function renderOrders() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        let filteredOrders = state.orders;

        // Apply status filter
        if (state.filters.status) {
            filteredOrders = filteredOrders.filter(order =>
                order.status === state.filters.status
            );
        }

        // Apply date filters
        if (state.filters.dateFrom) {
            const fromDate = new Date(state.filters.dateFrom);
            filteredOrders = filteredOrders.filter(order =>
                new Date(order.createdAt) >= fromDate
            );
        }

        if (state.filters.dateTo) {
            const toDate = new Date(state.filters.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of day
            filteredOrders = filteredOrders.filter(order =>
                new Date(order.createdAt) <= toDate
            );
        }

        tbody.innerHTML = filteredOrders.map(order => `
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

        try {
            await window.AdminAPI.updateOrderStatus(orderId, newStatus);
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