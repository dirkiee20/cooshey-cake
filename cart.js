document.addEventListener('DOMContentLoaded', () => {
    const cartGrid = document.querySelector('.cart__grid');
    const subtotalEl = document.getElementById('subtotal');
    const taxesEl = document.getElementById('taxes');
    const totalEl = document.getElementById('total');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');

    const API_URL = 'http://localhost:3001/api/cart';

    let allCartItems = []; // To store all items fetched from the server

    // Function to get the auth token from wherever it's stored
    const getToken = () => {
        return localStorage.getItem('userToken'); 
    };

    // 1. Fetch cart items from the backend
    const fetchCart = async () => {
        cartGrid.innerHTML = '<p>Loading your cart...</p>';
        const token = getToken();
        if (!token) {
            cartGrid.innerHTML = '<p>Please log in to see your cart.</p>';
            return;
        }

        try {
            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch cart');
            }

            const cart = await response.json();
            allCartItems = cart.items; // Store all items
            renderCart(allCartItems);
            updateSummary(); // Calculate summary based on selection

        } catch (error) {
            console.error('Error fetching cart:', error);
            cartGrid.innerHTML = '<p>Error loading your cart. Please try again later.</p>';
        }
    };

    // 2. Render cart items in the DOM
    const renderCart = (items, selectedIds = []) => {
        cartGrid.innerHTML = ''; // Clear existing items

        if (!items || items.length === 0) {
            cartGrid.innerHTML = '<p>Your cart is currently empty.</p>';
            return;
        }

        items.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart__item';
            cartItem.dataset.productId = item.product.id;
            
            // Check if this item should be selected
            const isSelected = selectedIds.includes(String(item.product.id));
            
            cartItem.innerHTML = `
                <div class="cart__item__selector">
                    <input type="checkbox" class="item-checkbox" data-product-id="${item.product.id}" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="cart__item__image">
                    <img src="${item.product.imageUrl}" alt="${item.product.name}" />
                </div>
                <div class="cart__item__details">
                    <h4>${item.product.name}</h4>
                    <p class="cart__item__price">₱${parseFloat(item.product.price).toFixed(2)}</p>
                    <div class="cart__item__quantity">
                        <button class="quantity-btn minus-btn">-</button>
                        <input type="number" value="${item.quantity}" min="1" class="quantity-input" />
                        <button class="quantity-btn plus-btn">+</button>
                    </div>
                </div>
                <div class="cart__item__remove">
                    <button class="btn btn--remove"><i class="ri-delete-bin-6-line"></i></button>
                </div>
            `;
            cartGrid.appendChild(cartItem);
        });
    };

    // 3. Get selected items and update the summary
    const getSelectedItems = () => {
        if (!cartGrid) return [];
        const selectedProductIds = [...cartGrid.querySelectorAll('.item-checkbox:checked')].map(cb => cb.dataset.productId);
        return allCartItems.filter(item => item.product && selectedProductIds.includes(String(item.product.id)));
    };

    const updateSummary = () => {
        const selectedItems = getSelectedItems();
        calculateSummary(selectedItems);
    };

    // 4. Calculate and display the summary for given items
    const calculateSummary = (items) => {
        if (!items || items.length === 0) {
            subtotalEl.textContent = '₱0.00';
            taxesEl.textContent = '₱0.00';
            totalEl.textContent = '₱0.00';
            return;
        }

        const subtotal = items
            .filter(item => item.product) // Ensure product exists before reducing
            .reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
        const taxes = subtotal * 0.10; // 10% tax
        const total = subtotal + taxes;

        subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
        taxesEl.textContent = `₱${taxes.toFixed(2)}`;
        totalEl.textContent = `₱${total.toFixed(2)}`;
    };

    // 5. Handle quantity changes, item deletions, and selection
    cartGrid.addEventListener('click', async (e) => {
        const target = e.target;
        const cartItem = target.closest('.cart__item');
        if (!cartItem) return;

        const productId = cartItem.dataset.productId;

        // Delete item
        if (target.closest('.btn--remove')) {
            await updateCart(productId, 0); // Sending quantity 0 to signify deletion
        }

        // Update quantity
        const quantityInput = cartItem.querySelector('.quantity-input');
        let quantity = parseInt(quantityInput.value);

        if (target.classList.contains('minus-btn')) {
            quantity = Math.max(1, quantity - 1);
            await updateCart(productId, quantity);
        } else if (target.classList.contains('plus-btn')) {
            quantity += 1;
            await updateCart(productId, quantity);
        }
    });

    cartGrid.addEventListener('change', (e) => {
        if (e.target.classList.contains('item-checkbox')) {
            updateSummary();
            // Update the "Select All" checkbox state
            if (selectAllCheckbox) {
                const allCheckboxes = cartGrid.querySelectorAll('.item-checkbox');
                const allChecked = [...allCheckboxes].every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
            }
        } else if (e.target.classList.contains('quantity-input')) {
            // Handle manual input change on the 'change' event (when focus is lost)
            const cartItem = e.target.closest('.cart__item');
            if (!cartItem) return;

            const productId = cartItem.dataset.productId;
            let quantity = parseInt(e.target.value, 10);

            if (isNaN(quantity) || quantity < 1) {
                quantity = 1; // Reset to 1 if input is invalid
            }
            // The updateCart function will re-render with the correct value from the server
            updateCart(productId, quantity);
        }
    });

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            cartGrid.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = isChecked);
            updateSummary();
        });
    }


    // 6. Function to send updates to the backend
    const updateCart = async (productId, quantity) => {
        const token = getToken();
        const method = quantity === 0 ? 'DELETE' : 'PUT';
        const url = `${API_URL}/${productId}`;

        // Store selected IDs before re-rendering
        const selectedIds = getSelectedItems().map(item => String(item.product.id));

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity })
            });

            if (!response.ok) {
                throw new Error('Failed to update cart');
            }

            const updatedCart = await response.json();
            allCartItems = updatedCart.items; // Update the master list
            renderCart(allCartItems, selectedIds);
            updateSummary(); // Recalculate summary based on selections

        } catch (error) {
            console.error('Error updating cart:', error);
            alert('Could not update the cart. Please try again.');
            // If the update fails, refresh the cart from the server to revert the changes
            fetchCart();
        }
    };

    // Initial fetch of the cart
    fetchCart();

    const checkoutBtn = document.querySelector('.btn--checkout');
    if(checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const selectedItems = getSelectedItems();
            if (selectedItems.length === 0) {
                alert('Please select at least one item to check out.');
                return;
            }
            // Store selected items for the checkout page
            localStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
            window.location.href = 'checkout.html';
        });
    }
});
