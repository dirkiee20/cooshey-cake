document.addEventListener('DOMContentLoaded', () => {
    const ordersTableBody = document.getElementById('orders-table-body');
    const orderDetailsModal = document.getElementById('order-details-modal');
    const closeBtn = orderDetailsModal.querySelector('.close-btn');
    const orderDetailsContent = document.getElementById('order-details-content');

    // Placeholder for orders data
    const orders = [
        {
            orderId: '12345',
            customer: 'John Doe',
            items: 'Chocolate Cake x1',
            total: '$25.00',
            payment: 'Paid',
            date: '2025-08-28',
            status: 'Delivered',
            details: {
                items: [
                    { name: 'Chocolate Cake', quantity: 1, price: '$25.00' },
                ],
                shippingAddress: '123 Main St, Anytown, USA',
                specialInstructions: 'No nuts, please.',
            },
        },
        {
            orderId: '67890',
            customer: 'Jane Smith',
            items: 'Vanilla Cake x2',
            total: '$40.00',
            payment: 'Pending',
            date: '2025-08-29',
            status: 'Processing',
            details: {
                items: [
                    { name: 'Vanilla Cake', quantity: 2, price: '$20.00' },
                ],
                shippingAddress: '456 Oak Ave, Othertown, USA',
                specialInstructions: '',
            },
        },
    ];

    function renderOrders() {
        ordersTableBody.innerHTML = '';
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.orderId}</td>
                <td>${order.customer}</td>
                <td>${order.items}</td>
                <td>${order.total}</td>
                <td>${order.payment}</td>
                <td>${order.date}</td>
                <td>${order.status}</td>
                <td>
                    <button class="view-details-btn" data-order-id="${order.orderId}">View</button>
                </td>
            `;
            ordersTableBody.appendChild(row);
        });
    }

    function showOrderDetails(orderId) {
        const order = orders.find(o => o.orderId === orderId);
        if (order) {
            let itemsHtml = '<ul>';
            order.details.items.forEach(item => {
                itemsHtml += `<li>${item.name} (x${item.quantity}) - ${item.price}</li>`;
            });
            itemsHtml += '</ul>';

            orderDetailsContent.innerHTML = `
                <p><strong>Order ID:</strong> ${order.orderId}</p>
                <p><strong>Customer:</strong> ${order.customer}</p>
                <p><strong>Total:</strong> ${order.total}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Shipping Address:</strong> ${order.details.shippingAddress}</p>
                <p><strong>Special Instructions:</strong> ${order.details.specialInstructions}</p>
                <p><strong>Items:</strong></p>
                ${itemsHtml}
            `;
            orderDetailsModal.style.display = 'block';
        }
    }

    ordersTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-details-btn')) {
            const orderId = e.target.getAttribute('data-order-id');
            showOrderDetails(orderId);
        }
    });

    closeBtn.addEventListener('click', () => {
        orderDetailsModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === orderDetailsModal) {
            orderDetailsModal.style.display = 'none';
        }
    });

    renderOrders();
});
