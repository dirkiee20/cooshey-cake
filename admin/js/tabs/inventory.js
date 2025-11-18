// Inventory Tab Module
const InventoryTab = (function() {
    'use strict';

    console.log('InventoryTab module loaded');

    // State
    let state = {
        products: [],
        currentFilter: 'all',
        searchTerm: ''
    };  

    // Initialize inventory tab
    function init() {
        console.log('InventoryTab: Initializing inventory tab');
        bindEvents();
        setFilter('all'); // Reset active state
        loadData();
    }

    // Bind event listeners
    function bindEvents() {

        // Add Product button
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                console.log('Add Product button clicked');
                showAddProductModal();
            });
        } else {
            console.error('Add Product button not found');
        }

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                setFilter(filter);
            });
        });

        // Search input
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchTerm = e.target.value.toLowerCase();
                renderProducts();
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                state.currentFilter = e.target.value || 'all';
                renderProducts();
            });
        }
    }

    // Load products data
    async function loadData() {
        try {
            const products = await window.AdminAPI.getProducts();
            state.products = products;
            renderProducts();
        } catch (error) {
            window.AdminUtils.showToast('Failed to load products', 'error');
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

        renderProducts();
    }

    // Render products grid
    function renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        let filteredProducts = state.products;

        // Apply category filter
        if (state.currentFilter !== 'all') {
            filteredProducts = filteredProducts.filter(product =>
                product.category === state.currentFilter
            );
        }

        // Apply search filter
        if (state.searchTerm) {
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(state.searchTerm) ||
                product.description.toLowerCase().includes(state.searchTerm)
            );
        }

        grid.innerHTML = filteredProducts.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.imageUrl || '../assets/placeholder.png'}" alt="${product.name}">
                    <div class="product-actions">
                        <button class="btn-icon edit-btn" onclick="InventoryTab.editProduct(${product.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-btn" onclick="InventoryTab.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${window.AdminUtils.sanitizeInput(product.name)}</h3>
                    <p class="product-price">${window.AdminUtils.formatCurrency(product.price)}</p>
                    <p class="product-stock">Stock: ${product.stock}</p>
                    <span class="product-category">${product.category}</span>
                </div>
            </div>
        `).join('');
    }

    // Show add product modal
    function showAddProductModal() {
        // Check if modal already exists and remove it
        const existingModal = document.querySelector('.modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modalTitle');

        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn" aria-label="Close modal">&times;</span>
                <h2 id="modalTitle">Add New Product</h2>
                <form id="addProductForm" novalidate>
                    <div class="form-group">
                        <label for="productName">Product Name *</label>
                        <input type="text" id="productName" placeholder="Enter product name" required aria-describedby="nameError">
                        <span id="nameError" class="error-message" aria-live="polite"></span>
                    </div>
                    <div class="form-group">
                        <label for="productDescription">Description *</label>
                        <textarea id="productDescription" placeholder="Enter product description" required aria-describedby="descriptionError"></textarea>
                        <span id="descriptionError" class="error-message" aria-live="polite"></span>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="productPrice">Price (₱) *</label>
                            <input type="number" id="productPrice" placeholder="0.00" step="0.01" min="0" required aria-describedby="priceError">
                            <span id="priceError" class="error-message" aria-live="polite"></span>
                        </div>
                        <div class="form-group">
                            <label for="productStock">Stock Quantity *</label>
                            <input type="number" id="productStock" placeholder="0" min="0" required aria-describedby="stockError">
                            <span id="stockError" class="error-message" aria-live="polite"></span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="productCategory">Category *</label>
                        <select id="productCategory" required aria-describedby="categoryError">
                            <option value="">Select Category</option>
                            <option value="popular">Popular</option>
                            <option value="best-seller">Best Seller</option>
                            <option value="main-product">Main Product</option>
                        </select>
                        <span id="categoryError" class="error-message" aria-live="polite"></span>
                    </div>
                    <div class="form-group">
                        <label for="productImage">Product Image *</label>
                        <input type="file" id="productImage" accept="image/*" required aria-describedby="imageError">
                        <small class="form-hint">Supported formats: JPG, PNG, GIF. Max size: 5MB</small>
                        <span id="imageError" class="error-message" aria-live="polite"></span>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="submitBtn" disabled>Add Product</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        console.log('InventoryTab: Modal appended to body');

        // Animate modal entrance
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Get form elements
        const form = modal.querySelector('#addProductForm');
        const submitBtn = modal.querySelector('#submitBtn');
        const cancelBtn = modal.querySelector('#cancelBtn');
        const imageInput = modal.querySelector('#productImage');

        // Close modal functions
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            window.AdminUtils.announceToScreenReader('Add product modal closed');
        };

        modal.querySelector('.close-btn').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        cancelBtn.onclick = closeModal;

        // Focus management
        const firstFocusableElement = modal.querySelector('#productName');
        if (firstFocusableElement) {
            firstFocusableElement.focus();
        }

        // Trap focus within modal
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });

        // Image preview
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    window.AdminUtils.showToast('File size must be less than 5MB', 'error');
                    this.value = '';
                    return;
                }

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    window.AdminUtils.showToast('Please select a valid image file', 'error');
                    this.value = '';
                    return;
                }
            }
        });

        // Enhanced form validation with accessibility
        const validateForm = (shouldFocus = false) => {
            const name = modal.querySelector('#productName').value.trim();
            const description = modal.querySelector('#productDescription').value.trim();
            const price = parseFloat(modal.querySelector('#productPrice').value);
            const stock = parseInt(modal.querySelector('#productStock').value);
            const category = modal.querySelector('#productCategory').value;
            const image = modal.querySelector('#productImage').files[0];

            let isValid = true;
            let firstError = null;

            // Name validation
            const nameError = modal.querySelector('#nameError');
            if (name.length < 2) {
                isValid = false;
                modal.querySelector('#productName').style.borderColor = 'var(--error, #dc3545)';
                nameError.textContent = 'Product name must be at least 2 characters long';
                if (!firstError) firstError = modal.querySelector('#productName');
            } else {
                modal.querySelector('#productName').style.borderColor = 'var(--gray-300)';
                nameError.textContent = '';
            }

            // Description validation
            const descriptionError = modal.querySelector('#descriptionError');
            if (description.length < 10) {
                isValid = false;
                modal.querySelector('#productDescription').style.borderColor = 'var(--error, #dc3545)';
                descriptionError.textContent = 'Description must be at least 10 characters long';
                if (!firstError) firstError = modal.querySelector('#productDescription');
            } else {
                modal.querySelector('#productDescription').style.borderColor = 'var(--gray-300)';
                descriptionError.textContent = '';
            }

            // Price validation
            const priceError = modal.querySelector('#priceError');
            if (isNaN(price) || price <= 0) {
                isValid = false;
                modal.querySelector('#productPrice').style.borderColor = 'var(--error, #dc3545)';
                priceError.textContent = 'Please enter a valid price greater than 0';
                if (!firstError) firstError = modal.querySelector('#productPrice');
            } else {
                modal.querySelector('#productPrice').style.borderColor = 'var(--gray-300)';
                priceError.textContent = '';
            }

            // Stock validation
            const stockError = modal.querySelector('#stockError');
            if (isNaN(stock) || stock < 0) {
                isValid = false;
                modal.querySelector('#productStock').style.borderColor = 'var(--error, #dc3545)';
                stockError.textContent = 'Stock quantity must be 0 or greater';
                if (!firstError) firstError = modal.querySelector('#productStock');
            } else {
                modal.querySelector('#productStock').style.borderColor = 'var(--gray-300)';
                stockError.textContent = '';
            }

            // Category validation
            const categoryError = modal.querySelector('#categoryError');
            if (!category) {
                isValid = false;
                modal.querySelector('#productCategory').style.borderColor = 'var(--error, #dc3545)';
                categoryError.textContent = 'Please select a category';
                if (!firstError) firstError = modal.querySelector('#productCategory');
            } else {
                modal.querySelector('#productCategory').style.borderColor = 'var(--gray-300)';
                categoryError.textContent = '';
            }

            // Image validation
            const imageError = modal.querySelector('#imageError');
            if (!image) {
                isValid = false;
                modal.querySelector('#productImage').style.borderColor = 'var(--error, #dc3545)';
                imageError.textContent = 'Please select a product image';
                if (!firstError) firstError = modal.querySelector('#productImage');
            } else {
                modal.querySelector('#productImage').style.borderColor = 'var(--gray-300)';
                imageError.textContent = '';
            }

            submitBtn.disabled = !isValid;

            // Only focus on first error when explicitly requested (e.g., on form submit)
            if (shouldFocus && !isValid && firstError) {
                firstError.focus();
            }

            return isValid;
        };

        // Add validation listeners - only validate on blur and change, not input
        ['blur', 'change'].forEach(event => {
            form.addEventListener(event, () => validateForm(false));
        });

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('InventoryTab: Form submitted');
            if (!validateForm(true)) { // Pass true to focus on first error
                console.log('InventoryTab: Form validation failed');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Adding...';
            submitBtn.classList.add('loading');

            try {
                console.log('InventoryTab: Calling addProduct function');
                await addProduct();
                console.log('InventoryTab: addProduct completed successfully');
                window.AdminUtils.announceToScreenReader('Product added successfully');
                closeModal();
            } catch (error) {
                console.error('InventoryTab: Error in form submission:', error);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add Product';
                submitBtn.classList.remove('loading');
                window.AdminUtils.announceToScreenReader('Failed to add product');
            }
        });
    }

    // Edit product
    function editProduct(productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h2>Edit Product</h2>
                <form id="editProductForm">
                    <div class="form-group">
                        <label for="editProductName">Product Name *</label>
                        <input type="text" id="editProductName" value="${window.AdminUtils.sanitizeInput(product.name)}" required>
                    </div>
                    <div class="form-group">
                        <label for="editProductDescription">Description *</label>
                        <textarea id="editProductDescription" required>${window.AdminUtils.sanitizeInput(product.description || '')}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editProductPrice">Price (₱) *</label>
                            <input type="number" id="editProductPrice" value="${product.price}" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label for="editProductStock">Stock Quantity *</label>
                            <input type="number" id="editProductStock" value="${product.stock}" min="0" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="editProductCategory">Category *</label>
                        <select id="editProductCategory" required>
                            <option value="popular" ${product.category === 'popular' ? 'selected' : ''}>Popular</option>
                            <option value="best-seller" ${product.category === 'best-seller' ? 'selected' : ''}>Best Seller</option>
                            <option value="main-product" ${product.category === 'main-product' ? 'selected' : ''}>Main Product</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editProductImage">Product Image (leave empty to keep current)</label>
                        <input type="file" id="editProductImage" accept="image/*">
                        <small class="form-hint">Supported formats: JPG, PNG, GIF. Max size: 5MB</small>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="editCancelBtn">Cancel</button>
                        <button type="submit" class="btn" id="editSubmitBtn">Update Product</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Animate modal entrance
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Get form elements
        const form = modal.querySelector('#editProductForm');
        const submitBtn = modal.querySelector('#editSubmitBtn');
        const cancelBtn = modal.querySelector('#editCancelBtn');
        const imageInput = modal.querySelector('#editProductImage');

        // Close modal functions
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };
        modal.querySelector('.close-btn').onclick = closeModal;
        // modal.onclick = (e) => { if (e.target === modal) closeModal(); }; // Removed to prevent accidental closing
        cancelBtn.onclick = closeModal;

        // Image validation
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    window.AdminUtils.showToast('File size must be less than 5MB', 'error');
                    this.value = '';
                    return;
                }
                if (!file.type.startsWith('image/')) {
                    window.AdminUtils.showToast('Please select a valid image file', 'error');
                    this.value = '';
                    return;
                }
            }
        });

        // Form validation
        const validateForm = () => {
            const name = modal.querySelector('#editProductName').value.trim();
            const description = modal.querySelector('#editProductDescription').value.trim();
            const price = parseFloat(modal.querySelector('#editProductPrice').value);
            const stock = parseInt(modal.querySelector('#editProductStock').value);
            const category = modal.querySelector('#editProductCategory').value;

            let isValid = true;

            if (name.length < 2) {
                isValid = false;
                modal.querySelector('#editProductName').style.borderColor = 'var(--error-color, #dc3545)';
            } else {
                modal.querySelector('#editProductName').style.borderColor = 'var(--gray-300)';
            }

            if (description.length < 10) {
                isValid = false;
                modal.querySelector('#editProductDescription').style.borderColor = 'var(--error-color, #dc3545)';
            } else {
                modal.querySelector('#editProductDescription').style.borderColor = 'var(--gray-300)';
            }

            if (isNaN(price) || price <= 0) {
                isValid = false;
                modal.querySelector('#editProductPrice').style.borderColor = 'var(--error-color, #dc3545)';
            } else {
                modal.querySelector('#editProductPrice').style.borderColor = 'var(--gray-300)';
            }

            if (isNaN(stock) || stock < 0) {
                isValid = false;
                modal.querySelector('#editProductStock').style.borderColor = 'var(--error-color, #dc3545)';
            } else {
                modal.querySelector('#editProductStock').style.borderColor = 'var(--gray-300)';
            }

            if (!category) {
                isValid = false;
                modal.querySelector('#editProductCategory').style.borderColor = 'var(--error-color, #dc3545)';
            } else {
                modal.querySelector('#editProductCategory').style.borderColor = 'var(--gray-300)';
            }

            submitBtn.disabled = !isValid;
            return isValid;
        };

        ['input', 'change'].forEach(event => {
            form.addEventListener(event, validateForm);
        });

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm()) return;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';

            try {
                await updateProduct(productId);
                closeModal();
            } catch (error) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update Product';
            }
        });
    }

    // Delete product
    async function deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        const product = state.products.find(p => p.id === productId);
        const productName = product ? product.name : 'Unknown Product';

        try {
            await window.AdminAPI.deleteProduct(productId);

            // Log the action
            try {
                await window.AdminAPI.createLog({
                    action: 'delete',
                    entityType: 'product',
                    entityId: productId,
                    entityName: productName,
                    details: `Deleted product`,
                    adminName: 'Admin'
                });
            } catch (logError) {
                console.error('Failed to log product deletion:', logError);
            }

            window.AdminUtils.showToast('Product deleted successfully', 'success');
            await loadData();
        } catch (error) {
            window.AdminUtils.showToast('Failed to delete product', 'error');
        }
    }

    // Add new product with enhanced error handling
    async function addProduct() {
        console.log('=== FRONTEND ADD PRODUCT START ===');
        const formData = new FormData();
        const name = document.getElementById('productName').value.trim();
        const description = document.getElementById('productDescription').value.trim();
        const price = document.getElementById('productPrice').value;
        const stock = document.getElementById('productStock').value;
        const category = document.getElementById('productCategory').value;
        const image = document.getElementById('productImage').files[0];

        console.log('Form data extracted:', { name, description, price, stock, category, hasImage: !!image });

        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('stock', stock);
        formData.append('category', category);
        if (image) {
            formData.append('image', image);
            console.log('Image file details:', { name: image.name, size: image.size, type: image.type });
        }

        const token = localStorage.getItem('userToken');
        console.log('Token present:', !!token);

        try {
            console.log('Sending request to backend...');
            const response = await fetch('http://localhost:3001/api/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Backend error response:', errorData);
                throw new Error(errorData.message || 'Failed to add product');
            }

            const result = await response.json();
            console.log('Success response:', result);

            // Log the action
            try {
                await window.AdminAPI.createLog({
                    action: 'create',
                    entityType: 'product',
                    entityId: result.id,
                    entityName: name,
                    details: `Created product with ${stock} stock at ₱${price}`,
                    adminName: 'Admin' // You can get this from user context
                });
            } catch (logError) {
                console.error('Failed to log product creation:', logError);
            }

            window.AdminUtils.showToast('Product added successfully', 'success');
            await loadData();

            // Add pulse animation to new product card
            setTimeout(() => {
                const newCard = document.querySelector(`[data-id="${result.id}"]`);
                if (newCard) {
                    newCard.classList.add('stat-updated');
                    setTimeout(() => newCard.classList.remove('stat-updated'), 1000);
                }
            }, 100);

        } catch (error) {
            console.error('Frontend addProduct error:', error);
            window.AdminUtils.showToast(error.message || 'Failed to add product', 'error');
            throw error; // Re-throw to handle in modal
        }
        console.log('=== FRONTEND ADD PRODUCT END ===');
    }

    // Update existing product
    async function updateProduct(productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        const formData = new FormData();
        const name = document.getElementById('editProductName').value.trim();
        const description = document.getElementById('editProductDescription').value.trim();
        const price = document.getElementById('editProductPrice').value;
        const stock = document.getElementById('editProductStock').value;
        const category = document.getElementById('editProductCategory').value;

        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('stock', stock);
        formData.append('category', category);

        const imageFile = document.getElementById('editProductImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const response = await fetch(`http://localhost:3001/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update product');
            }

            // Create detailed log based on changes
            const changes = [];
            if (name !== product.name) changes.push(`name to "${name}"`);
            if (price !== product.price.toString()) changes.push(`price to ₱${price}`);
            if (description !== (product.description || '')) changes.push(`description`);
            if (category !== product.category) changes.push(`category to "${category}"`);
            if (imageFile) changes.push(`image`);

            // Handle stock changes separately
            const oldStock = parseInt(product.stock);
            const newStock = parseInt(stock);
            const stockChanged = oldStock !== newStock;

            if (stockChanged) {
                // Create stock transaction log
                try {
                    const stockAction = newStock > oldStock ? 'stock-in' : 'stock-out';
                    const quantity = Math.abs(newStock - oldStock);

                    await window.AdminAPI.createLog({
                        action: stockAction,
                        entityType: stockAction,
                        entityId: productId,
                        entityName: name,
                        details: `Stock ${stockAction.replace('-', ' ')}: ${quantity} units (${oldStock} → ${newStock})`,
                        adminName: 'Admin'
                    });
                } catch (logError) {
                    console.error('Failed to log stock transaction:', logError);
                }
            }

            // Log other product updates (if any)
            if (changes.length > 0) {
                const details = `Updated ${changes.join(', ')}`;

                try {
                    await window.AdminAPI.createLog({
                        action: 'update',
                        entityType: 'product',
                        entityId: productId,
                        entityName: name,
                        details: details,
                        adminName: 'Admin'
                    });
                } catch (logError) {
                    console.error('Failed to log product update:', logError);
                }
            }

            window.AdminUtils.showToast('Product updated successfully', 'success');
            await loadData();
        } catch (error) {
            console.error('Error updating product:', error);
            window.AdminUtils.showToast(error.message || 'Failed to update product', 'error');
            throw error; // Re-throw to handle in modal
        }
    }

    // Export public API
    const publicAPI = {
        init,
        loadData,
        showAddProductModal,
        editProduct,
        deleteProduct,
        updateProduct
    };

    console.log('InventoryTab public API:', publicAPI);

    return publicAPI;

})();

// Export as default for ES6 modules
export default InventoryTab;