document.addEventListener('DOMContentLoaded', () => {
    const orderSummaryItemsEl = document.getElementById('order-summary-items');
    const subtotalEl = document.getElementById('subtotal');
    const taxesEl = document.getElementById('taxes');
    const totalEl = document.getElementById('total');
    const placeOrderButton = document.getElementById('place-order-button');

    let currentTotal = 0;
    let checkoutItems = []; // Store items for payment

    const getToken = () => {
        return localStorage.getItem('userToken');
    };

    const loadCheckoutData = () => {
        const itemsJSON = localStorage.getItem('checkoutItems');

        // If no items are passed for checkout, redirect back to cart
        if (!itemsJSON) {
            alert('No items selected for checkout. Redirecting to your cart.');
            window.location.href = 'cart.html';
            return;
        }

        const items = JSON.parse(itemsJSON);
        checkoutItems = items; // Save for payment handler

        if (items.length === 0) {
            orderSummaryItemsEl.innerHTML = '<p>Your checkout is empty.</p>';
            calculateSummary([]);
            return;
        }

        renderOrderSummary(items);
        calculateSummary(items);
        
        // It's good practice to clean up localStorage, but we'll leave it for now
        // in case the user refreshes the page. It will be overwritten on the next
        // trip from the cart page.
    };

    const renderOrderSummary = (items) => {
        orderSummaryItemsEl.innerHTML = ''; // Clear existing items

        if (!items || items.length === 0) {
            orderSummaryItemsEl.innerHTML = '<p>Your cart is empty.</p>';
            return;
        }

        items.forEach(item => {
            const summaryItem = document.createElement('div');
            summaryItem.className = 'summary-item';
            // Defensive check in case a product was deleted
            if (!item.product) {
                return;
            }
            summaryItem.innerHTML = `
                <img src="${item.product.imageUrl}" alt="${item.product.name}" class="summary-item__image">
                <div class="summary-item__details">
                    <span>${item.product.name} (x${item.quantity})</span>
                    <span class="summary-item__price">₱${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
                </div>
            `;
            orderSummaryItemsEl.appendChild(summaryItem);
        });
    };

    const calculateSummary = (items) => {
        if (!items || items.length === 0) {
            subtotalEl.textContent = '₱0.00';
            taxesEl.textContent = '₱0.00';
            totalEl.textContent = '₱0.00';
            return;
        }

        const subtotal = items
            .filter(item => item.product) // Ensure product exists
            .reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
        const taxes = subtotal * 0.10; // 10% tax
        const total = subtotal + taxes;

        subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
        taxesEl.textContent = `₱${taxes.toFixed(2)}`;
        totalEl.textContent = `₱${total.toFixed(2)}`;
        currentTotal = total;
    };

    const handlePlaceOrder = async () => {
        const token = getToken();
        if (!token) {
            alert('You must be logged in to place an order.');
            return;
        }

        const street = document.getElementById('street').value;
        const city = document.getElementById('city').value;
        const province = document.getElementById('province').value;
        const postal = document.getElementById('postal').value;
        const contact = document.getElementById('contact').value;

        if (!street || !city || !province || !postal || !contact) {
            alert('Please fill out all shipping information.');
            return;
        }

        const address = `${street}, ${city}, ${province} ${postal}`;

        if (currentTotal <= 0) {
            alert('Your cart is empty.');
            return;
        }

        // Disable button during processing
        placeOrderButton.disabled = true;
        placeOrderButton.textContent = 'Creating Order...';

        try {
            // First create the order
            console.log('Creating order...');
            const orderResponse = await fetch('http://localhost:3001/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: checkoutItems,
                    total: currentTotal,
                    shippingInfo: { address, contact }
                })
            });

            if (!orderResponse.ok) {
                const errorData = await orderResponse.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create order.');
            }

            const orderData = await orderResponse.json();
            console.log('Order created:', orderData);

            // Clear checkout items from localStorage after successful order
            localStorage.removeItem('checkoutItems');

            // Get order ID
            const orderId = orderData.order.id || orderData.id;

            // Calculate totals for payment proof page
            const subtotal = checkoutItems
                .filter(item => item.product)
                .reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
            const taxes = subtotal * 0.10;
            const total = subtotal + taxes;

            // Store order data for payment proof page
            const orderDataForProof = {
                orderId: orderId,
                items: checkoutItems,
                shipping: { address, contact },
                totals: { subtotal, tax: taxes, total }
            };

            console.log('Storing order data for payment proof:', orderDataForProof);
            localStorage.setItem('currentOrder', JSON.stringify(orderDataForProof));

            // Clear checkout items from localStorage
            localStorage.removeItem('checkoutItems');

            // Small delay to ensure localStorage is set before redirect
            setTimeout(() => {
                window.location.href = 'payment-proof.html';
            }, 100);

        } catch (error) {
            console.error('Error processing order:', error);
            const errorMessage = error.message || 'There was an issue processing your order. Please try again.';
            alert(errorMessage);
            placeOrderButton.disabled = false;
            placeOrderButton.textContent = 'Place Order & Upload Receipt';
        }
    };

    // Copy account number function
    window.copyAccountNumber = function() {
        const accountNumber = document.getElementById('account-number').textContent;
        navigator.clipboard.writeText(accountNumber).then(function() {
            alert('Account number copied to clipboard!');
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = accountNumber;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Account number copied to clipboard!');
        });
    };

    if (placeOrderButton) {
        placeOrderButton.addEventListener('click', handlePlaceOrder);
    }

    // Initial fetch of the cart summary
    loadCheckoutData();
});

