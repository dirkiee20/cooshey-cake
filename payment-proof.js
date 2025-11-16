// Payment Proof Upload Handler
document.addEventListener('DOMContentLoaded', function() {
  // Get form elements
  const form = document.getElementById('paymentProofForm');
  const fileInput = document.getElementById('receipt');
  const fileUploadArea = document.getElementById('fileUploadArea');
  const filePreview = document.getElementById('filePreview');
  const previewImage = document.getElementById('previewImage');
  const removeFileBtn = document.getElementById('removeFileBtn');
  const uploadStatus = document.getElementById('uploadStatus');
  const submitBtn = document.getElementById('submitBtn');
  const notesTextarea = document.getElementById('notes');
  const charCount = document.getElementById('charCount');
  const copyAccountBtn = document.getElementById('copyAccountBtn');
  const successModal = document.getElementById('successModal');

  // Load order data from localStorage or URL parameters
  loadOrderData();

  // Character counter for notes
  if (notesTextarea && charCount) {
    notesTextarea.addEventListener('input', function() {
      charCount.textContent = this.value.length;
    });
  }

  // File input change handler
  fileInput.addEventListener('change', handleFileSelect);

  // Drag and drop handlers
  fileUploadArea.addEventListener('dragover', handleDragOver);
  fileUploadArea.addEventListener('dragleave', handleDragLeave);
  fileUploadArea.addEventListener('drop', handleDrop);

  // Remove file button
  removeFileBtn.addEventListener('click', removeFile);

  // Copy account number
  copyAccountBtn.addEventListener('click', copyAccountNumber);

  // Form submission
  form.addEventListener('submit', handleSubmit);

  // File handling functions
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      validateAndPreviewFile(file);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file) {
      fileInput.files = e.dataTransfer.files;
      validateAndPreviewFile(file);
    }
  }

  function validateAndPreviewFile(file) {
    const errorMessage = document.getElementById('receipt-error');
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      showError('receipt', 'Please upload a JPG or PNG image file');
      removeFile();
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      showError('receipt', 'File size must be less than 5MB');
      removeFile();
      return;
    }

    // Clear any errors
    clearError('receipt');

    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImage.src = e.target.result;
      document.querySelector('.file-upload-label').style.display = 'none';
      filePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  function removeFile() {
    fileInput.value = '';
    previewImage.src = '';
    filePreview.style.display = 'none';
    document.querySelector('.file-upload-label').style.display = 'flex';
    clearError('receipt');
  }

  function copyAccountNumber() {
    const accountNumber = document.getElementById('accountNumber').textContent;
    
    navigator.clipboard.writeText(accountNumber).then(() => {
      // Show feedback
      const originalText = copyAccountBtn.innerHTML;
      copyAccountBtn.innerHTML = '<i class="ri-check-line" aria-hidden="true"></i>';
      copyAccountBtn.disabled = true;
      
      setTimeout(() => {
        copyAccountBtn.innerHTML = originalText;
        copyAccountBtn.disabled = false;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  // Form validation and submission
  async function handleSubmit(e) {
    e.preventDefault();

    // Clear previous status
    uploadStatus.style.display = 'none';
    uploadStatus.className = '';

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const orderData = JSON.parse(localStorage.getItem('currentOrder') || '{}');
      const orderId = orderData.orderId;
      const totalAmount = orderData.totals ? orderData.totals.total : 0;

      if (!orderId) {
        throw new Error('Order information not found. Please go back to checkout.');
      }

      // Get form data
      const paymentMethod = document.getElementById('payment-method').value;
      const reference = document.getElementById('reference').value;
      const notes = document.getElementById('notes').value;

      // Step 1: Create payment record
      console.log('Creating payment record...');
      const paymentResponse = await fetch('http://localhost:3001/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          amount: totalAmount,
          paymentMethod: paymentMethod,
          notes: notes
        })
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Failed to create payment record');
      }

      const payment = await paymentResponse.json();
      console.log('Payment record created:', payment);

      // Step 2: Upload payment proof
      console.log('Uploading payment proof...');
      const formData = new FormData();
      formData.append('receipt', fileInput.files[0]);
      if (reference) {
        formData.append('reference', reference);
      }
      if (paymentMethod) {
        formData.append('payment_method', paymentMethod);
      }
      if (notes) {
        formData.append('notes', notes);
      }

      const uploadResponse = await fetch(`http://localhost:3001/api/payments/${payment.id}/proof`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('Upload failed:', errorData);
        throw new Error(errorData.message || 'Failed to upload payment proof');
      }

      const uploadResult = await uploadResponse.json();
      console.log('Payment proof uploaded successfully:', uploadResult);
      showSuccess();

    } catch (error) {
      console.error('Payment submission error:', error);
      showUploadError(error.message);
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }

  function validateForm() {
    let isValid = true;

    // Validate receipt upload
    if (!fileInput.files || fileInput.files.length === 0) {
      showError('receipt', 'Please upload a payment receipt');
      isValid = false;
    }

    // Validate payment method
    const paymentMethod = document.getElementById('payment-method');
    if (!paymentMethod.value) {
      showError('payment-method', 'Please select a payment method');
      isValid = false;
    }

    return isValid;
  }

  function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
    if (input && errorElement) {
      input.setAttribute('aria-invalid', 'true');
      errorElement.textContent = message;
      input.focus();
    }
  }

  function clearError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
    if (input && errorElement) {
      input.setAttribute('aria-invalid', 'false');
      errorElement.textContent = '';
    }
  }

  function showUploadError(message) {
    uploadStatus.textContent = message;
    uploadStatus.className = 'error';
    uploadStatus.style.display = 'block';
    uploadStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showSuccess() {
    const orderNumber = document.getElementById('orderNumber').textContent;
    document.getElementById('modalOrderNumber').textContent = orderNumber;
    successModal.style.display = 'flex';
    
    // Update progress
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach(step => step.classList.add('completed'));
  }

  // Load order data from localStorage or session
  function loadOrderData() {
    // This should load actual order data from your backend or localStorage
    const orderData = JSON.parse(localStorage.getItem('currentOrder') || '{}');

    console.log('Loading order data:', orderData);

    if (!orderData || Object.keys(orderData).length === 0) {
      console.error('No order data found in localStorage');
      showUploadError('Order information not found. Please go back to checkout and try again.');
      return;
    }

    if (orderData.orderId) {
      document.getElementById('orderNumber').textContent = orderData.orderId;
      document.getElementById('order_id').value = orderData.orderId;
    } else {
      console.error('No orderId found in order data');
      showUploadError('Order ID not found. Please contact support.');
      return;
    }

    if (orderData.items && orderData.items.length > 0) {
      displayOrderItems(orderData.items);
    } else {
      console.warn('No items found in order data:', orderData.items);
      displayOrderItems([]);
      showUploadError('No items found in this order. Please contact support.');
    }

    if (orderData.shipping) {
      displayShippingInfo(orderData.shipping);
    } else {
      console.warn('No shipping info found in order data');
    }

    if (orderData.totals) {
      displayTotals(orderData.totals);
    } else {
      console.warn('No totals found in order data');
    }
  }

  function displayOrderItems(items) {
    const itemList = document.querySelector('.item-list');
    if (!items || items.length === 0) {
      itemList.innerHTML = '<p>No items found in this order.</p>';
      return;
    }

    itemList.innerHTML = items.map(item => {
      // Handle both structures: direct item properties or nested product property
      const product = item.product || item;
      const image = product.imageUrl || product.image || '';
      const name = product.name || 'Unknown Product';
      const price = parseFloat(product.price || 0);
      const quantity = item.quantity || 1;

      return `
        <div class="order-item" role="listitem">
          <img src="${image}" alt="${name}" class="order-item__image" />
          <div class="order-item__details">
            <div class="order-item__name">${name}</div>
            <div class="order-item__quantity">Qty: ${quantity}</div>
          </div>
          <div class="order-item__price">₱${(price * quantity).toFixed(2)}</div>
        </div>
      `;
    }).join('');
  }

  function displayShippingInfo(shipping) {
    document.getElementById('shippingAddress').textContent = shipping.address;
    document.getElementById('contactNumber').textContent = shipping.contact;
  }

  function displayTotals(totals) {
    document.getElementById('subtotalAmount').textContent = `₱${totals.subtotal.toFixed(2)}`;
    document.getElementById('taxAmount').textContent = `₱${totals.tax.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `₱${totals.total.toFixed(2)}`;
  }
});
