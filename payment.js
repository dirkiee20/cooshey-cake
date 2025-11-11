document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    if (!orderId) {
        window.location.href = 'index.html';
        return;
    }

    loadOrderDetails(orderId);
    setupPaymentForm(orderId);
});

async function loadOrderDetails(orderId) {
    try {
        console.log('Loading order details for order:', orderId);
        const token = localStorage.getItem('userToken');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Load order details from your existing order API
        const response = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
            headers: headers
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to load order details' }));
            throw new Error(errorData.message || 'Failed to load order details');
        }

        const order = await response.json();
        console.log('Order details loaded:', order);

        // Hide loading spinner
        const orderDetails = document.getElementById('orderDetails');
        
        if (!order) {
            orderDetails.innerHTML = '<div class="order-item"><span>Order not found</span><span></span></div>';
            return;
        }

        document.getElementById('orderId').textContent = orderId;
        const totalAmount = order.total || 0;
        document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
        document.getElementById('exactAmount').textContent = formatCurrency(totalAmount);
        document.getElementById('instructionAmount').textContent = formatCurrency(totalAmount);

        // Display order items
        if (order.items && order.items.length > 0) {
            orderDetails.innerHTML = order.items.map(item => `
                <div class="order-item">
                    <span>${item.name || item.product?.name || 'Unknown Item'}</span>
                    <span>${formatCurrency(item.price || item.product?.price || 0)} x ${item.quantity || 1}</span>
                </div>
            `).join('');
        } else {
            orderDetails.innerHTML = '<div class="order-item"><span>No items found</span><span></span></div>';
        }

    } catch (error) {
        console.error('Failed to load order details:', error);
        const orderDetails = document.getElementById('orderDetails');
        if (orderDetails) {
            orderDetails.innerHTML = `<div class="order-item" style="color: red;"><span>Error: ${error.message}</span><span></span></div>`;
        }
        showStatusMessage('error', `Failed to load order details: ${error.message}`);
    }
}

function setupPaymentForm(orderId) {
    const form = document.getElementById('paymentForm');
    const fileInput = document.getElementById('receipt');
    const filePreview = document.getElementById('filePreview');

    // File input handling - click to open file dialog
    const fileUploadArea = document.querySelector('.file-upload-area');

    // Make the upload area clickable
    fileUploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // Handle drag and drop
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
    });

    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                showStatusMessage('error', 'File size must be less than 5MB');
                this.value = '';
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                showStatusMessage('error', 'Please select a valid image file');
                this.value = '';
                return;
            }

            // Show preview
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewImage = document.getElementById('previewImage');
                previewImage.src = e.target.result;
                filePreview.style.display = 'block';
                fileUploadArea.style.display = 'none';
            };
            reader.readAsDataURL(file);
        } else {
            filePreview.style.display = 'none';
            fileUploadArea.style.display = 'block';
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Uploading...';
        submitBtn.disabled = true;

        try {
            console.log('Starting payment submission for order:', orderId);

            // First create payment record
            console.log('Creating payment record...');
            const paymentResponse = await fetch('http://localhost:3001/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: orderId,
                    amount: parseFloat(document.getElementById('totalAmount').textContent.replace(/[^\d.-]/g, ''))
                })
            });

            if (!paymentResponse.ok) {
                const errorData = await paymentResponse.json();
                throw new Error(errorData.message || 'Failed to create payment record');
            }

            const payment = await paymentResponse.json();
            console.log('Payment record created:', payment);

            // Upload payment proof
            console.log('Uploading payment proof...');
            const formData = new FormData();
            const receiptFile = document.getElementById('receipt').files[0];
            const reference = document.getElementById('reference').value;

            formData.append('receipt', receiptFile);
            if (reference) {
                formData.append('reference', reference);
            }

            const uploadResponse = await fetch(`http://localhost:3001/api/payments/${payment.id}/proof`, {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.message || 'Failed to upload payment proof');
            }

            console.log('Payment proof uploaded successfully');

            // Show success message
            showStatusMessage('success', 'Payment proof uploaded successfully! We will verify your payment within 24 hours.');

            // Hide form and show success state
            form.style.display = 'none';
            document.querySelector('.upload-card .card-header h3').textContent = 'Payment Submitted';

        } catch (error) {
            console.error('Payment submission error:', error);
            showStatusMessage('error', error.message || 'Failed to submit payment proof. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

function showStatusMessage(type, message) {
    // Remove existing status messages
    const existingMessages = document.querySelectorAll('.status-message');
    existingMessages.forEach(msg => msg.remove());

    const statusCard = document.getElementById('paymentStatus');
    const messageDiv = document.createElement('div');
    messageDiv.className = `status-message ${type}`;
    messageDiv.textContent = message;

    statusCard.insertBefore(messageDiv, statusCard.querySelector('.status-actions'));
    statusCard.style.display = 'block';

    // Scroll to status message
    statusCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function formatCurrency(amount) {
    return `₱${parseFloat(amount).toFixed(2)}`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showStatusMessage('success', 'GCash number copied to clipboard!');
    }).catch(function(err) {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showStatusMessage('success', 'GCash number copied to clipboard!');
    });
}

function removeFile() {
    document.getElementById('receipt').value = '';
    document.getElementById('filePreview').style.display = 'none';
    document.querySelector('.file-upload-area').style.display = 'block';
}

function goBack() {
    if (confirm('Are you sure you want to go back? Your progress will not be saved.')) {
        window.location.href = 'cart.html';
    }
}

function goToHome() {
    window.location.href = 'index.html';
}