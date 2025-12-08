// Customers Tab Module
const CustomersTab = (function() {
    'use strict';

    // State
    let state = {
        customers: [],
        currentPage: 1,
        itemsPerPage: 15,
        totalPages: 1
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
            state.currentPage = 1;
            calculateTotalPages();
            renderCustomers();
        } catch (error) {
            console.error('Error loading customers:', error);
            window.AdminUtils.showToast('Failed to load customers', 'error');
        }
    }

    // Calculate total pages
    function calculateTotalPages() {
        state.totalPages = Math.ceil(state.customers.length / state.itemsPerPage);
    }

    // Render customers table
    function renderCustomers() {
        const tbody = document.getElementById('customersTableBody');
        if (!tbody) return;

        if (state.customers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No customers found</h3>
                        <p>No customer data available.</p>
                    </td>
                </tr>
            `;
            hidePagination();
            return;
        }

        // Paginate
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const paginatedCustomers = state.customers.slice(startIndex, endIndex);

        tbody.innerHTML = paginatedCustomers.map(customer => `
            <tr>
                <td>${window.AdminUtils.sanitizeInput(customer.name || 'N/A')}</td>
                <td>${window.AdminUtils.sanitizeInput(customer.email || 'N/A')}</td>
                <td><span class="status-badge active">Active</span></td>
                <td>${window.AdminUtils.formatDate(customer.createdAt)}</td>
                <td>
                    ${!customer.isAdmin ? `<button class="btn-icon" onclick="CustomersTab.promoteCustomer(${customer.id})" title="Promote to Admin">
                        <i class="fas fa-user-shield"></i>
                    </button>` : '<span class="status-badge admin">Admin</span>'}
                </td>
            </tr>
        `).join('');

        showPagination(state.customers.length);
    }

    // Show pagination
    function showPagination(totalItems) {
        const paginationContainer = document.getElementById('customersPaginationContainer');
        const paginationInfo = document.getElementById('customersPaginationInfo');
        const pageNumbers = document.getElementById('customersPageNumbers');
        const prevBtn = document.getElementById('customersPrevPageBtn');
        const nextBtn = document.getElementById('customersNextPageBtn');

        if (!paginationContainer || !paginationInfo || !pageNumbers || !prevBtn || !nextBtn) return;

        if (state.totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        const startItem = (state.currentPage - 1) * state.itemsPerPage + 1;
        const endItem = Math.min(state.currentPage * state.itemsPerPage, totalItems);
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} customers`;

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
                renderCustomers();
            });
        });

        prevBtn.onclick = () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderCustomers();
            }
        };

        nextBtn.onclick = () => {
            if (state.currentPage < state.totalPages) {
                state.currentPage++;
                renderCustomers();
            }
        };
    }

    // Hide pagination
    function hidePagination() {
        const paginationContainer = document.getElementById('customersPaginationContainer');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
    }

    // Promote customer to admin
    async function promoteCustomer(customerId) {
        const customer = state.customers.find(c => c.id === customerId);
        if (!customer) return;

        const confirmed = await window.AdminUtils.showConfirmDialog(
            `Are you sure you want to promote ${customer.name} to admin? This action cannot be undone.`,
            async () => {
                try {
                    await window.AdminAPI.makeUserAdmin(customerId);

                    // Log the action
                    try {
                        await window.AdminAPI.createLog({
                            action: 'promote',
                            entityType: 'user',
                            entityId: customerId,
                            entityName: customer.name,
                            details: `Promoted user ${customer.name} to admin`,
                            adminName: 'Admin'
                        });
                    } catch (logError) {
                        console.error('Failed to log promotion:', logError);
                    }

                    window.AdminUtils.showToast(`${customer.name} has been promoted to admin`, 'success');
                    await loadData(); // Refresh the data
                } catch (error) {
                    console.error('Error promoting customer:', error);
                    window.AdminUtils.showToast('Failed to promote user to admin', 'error');
                }
            },
            () => {} // Cancel callback
        );
    }

    // Export public API
    const publicAPI = {
        init: init,
        loadData: loadData,
        promoteCustomer: promoteCustomer
    };

    return publicAPI;

})();

// Export as default for ES6 modules
export default CustomersTab;