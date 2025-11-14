// Customers Tab Module
const CustomersTab = (function() {
    'use strict';

    // State
    let state = {
        customers: []
    };

    // Initialize customers tab
    function init() {
        loadData();
    }

    // Load customers data
    async function loadData() {
        try {
            const users = await window.AdminAPI.getUsers();
            console.log('All users:', users);
            state.customers = users.filter(user => !user.isAdmin);
            console.log('Filtered customers:', state.customers);
            renderCustomers(state.customers);
        } catch (error) {
            console.error('Error loading customers:', error);
            window.AdminUtils.showToast('Failed to load customers', 'error');
        }
    }

    // Render customers table
    function renderCustomers(customers) {
        const tbody = document.getElementById('customersTableBody');
        if (!tbody) return;

        tbody.innerHTML = customers.map(customer => `
            <tr>
                <td>${window.AdminUtils.sanitizeInput(customer.name || 'N/A')}</td>
                <td>${window.AdminUtils.sanitizeInput(customer.email || 'N/A')}</td>
                <td><span class="status-badge active">Active</span></td>
                <td>${window.AdminUtils.formatDate(customer.createdAt)}</td>
                <td>
                    <button class="btn-icon" onclick="CustomersTab.viewCustomer(${customer.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="CustomersTab.editCustomer(${customer.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // View customer details
    function viewCustomer(customerId) {
        const customer = state.customers.find(c => c.id === customerId);
        if (customer) {
            window.AdminUtils.showToast(`View customer: ${customer.name}`, 'info');
        }
    }

    // Edit customer
    function editCustomer(customerId) {
        const customer = state.customers.find(c => c.id === customerId);
        if (customer) {
            window.AdminUtils.showToast(`Edit customer: ${customer.name}`, 'info');
        }
    }

    // Export public API
    const publicAPI = {
        init: init,
        loadData: loadData,
        viewCustomer: viewCustomer,
        editCustomer: editCustomer
    };

    return publicAPI;

})();

// Export as default for ES6 modules
export default CustomersTab;