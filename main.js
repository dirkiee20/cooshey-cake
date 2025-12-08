const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");
const menuBtnIcon = menuBtn.querySelector("i");

menuBtn.addEventListener("click", (e) => {
  navLinks.classList.toggle("open");

  const isOpen = navLinks.classList.contains("open");
  menuBtnIcon.setAttribute(
    "class",
    isOpen ? "ri-close-line" : "ri-menu-3-line"
  );
});

navLinks.addEventListener("click", (e) => {
  navLinks.classList.remove("open");
  menuBtnIcon.setAttribute("class", "ri-menu-3-line");
});

const scrollRevealOption = {
  distance: "50px",
  origin: "bottom",
  duration: 1000,
};

ScrollReveal().reveal(".header__image img", {
  duration: 1000,
});
ScrollReveal().reveal(".header__content h1", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".header__content .section__description", {
  ...scrollRevealOption,
  delay: 1000,
});
ScrollReveal().reveal(".header__btn", {
  ...scrollRevealOption,
  delay: 1500,
});
ScrollReveal().reveal(".header__content .socials", {
  ...scrollRevealOption,
  delay: 2000,
});

ScrollReveal().reveal(".popular__card", {
  ...scrollRevealOption,
  interval: 500,
});

ScrollReveal().reveal(".discover__card img", {
  ...scrollRevealOption,
  origin: "left",
});
ScrollReveal().reveal(".discover__card:nth-child(2) img", {
  ...scrollRevealOption,
  origin: "right",
});
ScrollReveal().reveal(".discover__card__content h4", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".discover__card__content .section__description", {
  ...scrollRevealOption,
  delay: 1000,
});
ScrollReveal().reveal(".discover__card__content h3", {
  ...scrollRevealOption,
  delay: 1500,
});
ScrollReveal().reveal(".discover__card__btn", {
  ...scrollRevealOption,
  delay: 2000,
});

ScrollReveal().reveal(".banner__content .section__header", {
  ...scrollRevealOption,
});
ScrollReveal().reveal(".banner__content .section__description", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".banner__card", {
  ...scrollRevealOption,
  delay: 1000,
  interval: 500,
});

ScrollReveal().reveal(".subscribe__content .section__header", {
  ...scrollRevealOption,
});
ScrollReveal().reveal(".subscribe__content .section__description", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".subscribe__content form", {
  ...scrollRevealOption,
  delay: 1000,
});

const SERVER_URL = 'http://localhost:3001';
const getFullImageUrl = (path) => {
    if (!path) return ''; // handle cases where imageUrl might be missing
    return path.startsWith('http') ? path : `${SERVER_URL}${path}`;
};

/**
 * Flash Notification System
 */
function showFlashMessage(message, type = 'info', duration = 5000) {
  // Remove existing notifications of the same type
  const existingNotifications = document.querySelectorAll(`.flash-notification.${type}`);
  existingNotifications.forEach(notification => notification.remove());

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `flash-notification ${type}`;

  // Icon based on type
  const icons = {
    success: 'ri-checkbox-circle-fill',
    error: 'ri-error-warning-fill',
    warning: 'ri-alert-fill',
    info: 'ri-information-fill'
  };

  notification.innerHTML = `
    <div class="icon">
      <i class="${icons[type] || icons.info}" aria-hidden="true"></i>
    </div>
    <div class="content">${message}</div>
    <button class="close-btn" aria-label="Close notification">
      <i class="ri-close-line" aria-hidden="true"></i>
    </button>
  `;

  // Add to page
  document.body.appendChild(notification);

  // Handle close button
  const closeBtn = notification.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => {
    removeNotification(notification);
  });

  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentNode) {
        removeNotification(notification);
      }
    }, duration);
  }

  // Announce to screen readers
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'assertive');

  return notification;
}

function removeNotification(notification) {
  notification.classList.add('fade-out');
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

document.addEventListener("DOMContentLoaded", function () {
  // --- Auth status check & User Dropdown ---
  const loginPopupBtn = document.getElementById('login-popup-btn');
  const userDropdown = document.getElementById('user-dropdown');
  const userDropdownToggle = document.getElementById('user-dropdown-toggle');
  const userDropdownMenu = document.getElementById('user-dropdown-menu');
  const userNameSpan = document.getElementById('user-name');
  const adminDashboardLink = document.getElementById('admin-dashboard-link');
  const logoutBtn = document.getElementById('logout-btn');

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  if (userInfo) {
    // User is logged in
    loginPopupBtn.style.display = 'none';
    userDropdown.style.display = 'inline-block';
    userNameSpan.textContent = userInfo.name;

    if (userInfo.isAdmin) {
      adminDashboardLink.style.display = 'block';

      // Hide the cart icon for admin users
      const cartIconLink = document.querySelector('a[href="cart.html"]');
      if (cartIconLink) {
          cartIconLink.style.display = 'none';
      }

      // Hide the notification button for admin users
      const notificationBtn = document.getElementById('notification-btn');
      if (notificationBtn) {
          notificationBtn.style.display = 'none';
      }
    }

    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      window.location.reload();
    });


    userDropdownToggle.addEventListener('click', () => {
      userDropdownMenu.classList.toggle('show');
    });

  } else {
    // User is logged out
    loginPopupBtn.style.display = 'inline-block';
    userDropdown.style.display = 'none';
    loginPopupBtn.addEventListener('click', () => {
        console.log('Sign-in button clicked');
        console.log('Modal element:', loginRegisterModal);
        if (loginRegisterModal) {
            loginRegisterModal.style.display = 'flex';
            console.log('Modal display set to flex');
        } else {
            console.log('Modal not found');
        }
    });
  }

  // Close dropdown if clicked outside
  window.addEventListener('click', function(event) {
    if (!userDropdown.contains(event.target)) {
        userDropdownMenu.classList.remove('show');
    }
  });

  // --- Login/Register Modal Logic ---
  const loginRegisterModal = document.getElementById('login-register-modal');
  const closeLoginRegisterModalBtn = loginRegisterModal.querySelector('.close-btn');
  const loginFormContainer = document.getElementById('login-form-container');
  const registerFormContainer = document.getElementById('register-form-container');
  const showRegisterFormLink = document.getElementById('show-register-form');
  const showLoginFormLink = document.getElementById('show-login-form');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  const closeLoginRegisterModal = () => {
    if (loginRegisterModal) loginRegisterModal.style.display = 'none';
  };

  if (closeLoginRegisterModalBtn) {
    closeLoginRegisterModalBtn.onclick = closeLoginRegisterModal;
  }

  showRegisterFormLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginFormContainer.style.display = 'none';
      registerFormContainer.style.display = 'block';
  });

  showLoginFormLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginFormContainer.style.display = 'block';
      registerFormContainer.style.display = 'none';
  });

  const API_URL = 'http://localhost:3001/api/users';

  loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Login form submitted');
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      console.log('Email:', email, 'Password length:', password.length);

      try {
          console.log('Sending login request to:', `${API_URL}/login`);
          const response = await fetch(`${API_URL}/login`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email, password })
          });
          console.log('Response status:', response.status);

          const data = await response.json();
          console.log('Response data:', data);

          if (!response.ok) {
              throw new Error(data.message || 'Failed to login');
          }

          // Store user info and token
          localStorage.setItem('userToken', data.token);
          localStorage.setItem('userInfo', JSON.stringify(data)); // Store the whole user object

          showFlashMessage('Login successful! Welcome back!', 'success');
          console.log('Login successful, reloading page');
          setTimeout(() => {
            window.location.reload();
          }, 1500);

      } catch (error) {
          console.error('Login error:', error);
          showFlashMessage(`Login failed: ${error.message}`, 'error');
      }
  });

  // Password strength checker
  const checkPasswordStrength = (password) => {
      let strength = 0;
      let feedback = [];

      if (password.length >= 8) strength++;
      else feedback.push('At least 8 characters');

      if (/[a-z]/.test(password)) strength++;
      else feedback.push('Lowercase letter');

      if (/[A-Z]/.test(password)) strength++;
      else feedback.push('Uppercase letter');

      if (/\d/.test(password)) strength++;
      else feedback.push('Number');

      if (/[@$!%*?&]/.test(password)) strength++;
      else feedback.push('Special character');

      return { strength, feedback };
  };

  // Update password strength indicator
  const updatePasswordStrength = () => {
      const password = document.getElementById('register-password').value;
      const strengthFill = document.getElementById('strength-fill');
      const strengthText = document.getElementById('strength-text');

      const { strength, feedback } = checkPasswordStrength(password);

      strengthFill.className = 'strength-fill';

      if (strength <= 2) {
          strengthFill.classList.add('weak');
          strengthText.textContent = 'Weak password';
          strengthText.style.color = '#dc3545';
      } else if (strength <= 4) {
          strengthFill.classList.add('medium');
          strengthText.textContent = 'Medium password';
          strengthText.style.color = '#ffc107';
      } else {
          strengthFill.classList.add('strong');
          strengthText.textContent = 'Strong password';
          strengthText.style.color = '#28a745';
      }
  };

  // Add event listener for password input
  document.getElementById('register-password').addEventListener('input', updatePasswordStrength);

  // Password visibility toggle functionality
  const togglePasswordVisibility = (inputId, toggleId) => {
      const input = document.getElementById(inputId);
      const toggle = document.getElementById(toggleId);
      const icon = toggle.querySelector('i');

      toggle.addEventListener('click', () => {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          icon.className = isPassword ? 'ri-eye-off-line' : 'ri-eye-line';
          toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      });
  };

  // Initialize password toggles
  togglePasswordVisibility('login-password', 'toggle-login-password');
  togglePasswordVisibility('register-password', 'toggle-password');
  togglePasswordVisibility('register-confirm-password', 'toggle-confirm-password');

  registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;

      // Client-side validation
      if (password !== confirmPassword) {
          showFlashMessage('Passwords do not match!', 'error');
          return;
      }

      const { strength } = checkPasswordStrength(password);
      if (strength < 3) {
          showFlashMessage('Password is too weak. Please ensure it meets the minimum requirements.', 'warning');
          return;
      }

      try {
          const response = await fetch(`${API_URL}/`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ name, email, password, confirmPassword })
          });

          const data = await response.json();

          if (!response.ok) {
              if (data.errors) {
                  showFlashMessage(`Registration failed: ${data.errors.join(', ')}`, 'error');
              } else {
                  throw new Error(data.message || 'Failed to register');
              }
              return;
          }

          localStorage.setItem('userToken', data.token);
          showFlashMessage('Registration successful! Welcome to Cooshey Cake!', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1500);

      } catch (error) {
          console.error('Registration error:', error);
          showFlashMessage(`Registration failed: ${error.message}`, 'error');
      }
  });


  // --- Notifications Logic ---

  const notificationBtn = document.getElementById("notification-btn");
  const subscribeModal = document.getElementById("notification-modal");
  const notificationsModal = document.getElementById("notifications-modal");
  const notificationsList = document.getElementById("notifications-list");
  const markAllReadBtn = document.getElementById("mark-all-read-btn");

  // Function to load and display notifications
  const loadNotifications = async () => {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) return;

    try {
      const response = await fetch('http://localhost:3001/api/notifications', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      if (response.ok) {
        const notifications = await response.json();
        displayNotifications(notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // Function to display notifications
  const displayNotifications = (notifications) => {
    if (!notificationsList) return;

    if (notifications.length === 0) {
      notificationsList.innerHTML = '<p>No notifications yet.</p>';
      markAllReadBtn.style.display = 'none';
      return;
    }

    notificationsList.innerHTML = notifications.map(notification => `
      <div class="notification-item ${notification.isRead ? 'read' : 'unread'}" data-id="${notification.id}">
        <div class="notification-content">
          <p>${notification.message}</p>
          <small>${new Date(notification.createdAt).toLocaleString()}</small>
        </div>
        ${!notification.isRead ? '<button class="mark-read-btn" data-id="' + notification.id + '">Mark as Read</button>' : ''}
      </div>
    `).join('');

    markAllReadBtn.style.display = 'block';

    // Add event listeners for mark as read buttons
    document.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const notificationId = e.target.dataset.id;
        await markNotificationAsRead(notificationId);
        loadNotifications();
      });
    });
  };

  // Function to mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) return;

    try {
      await fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Function to mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) return;

    try {
      await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Handle notification button click
  if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo) {
        // Logged in user - show notifications
        loadNotifications();
        if (notificationsModal) notificationsModal.classList.add("show-modal");
      } else {
        // Not logged in - show subscribe modal
        if (subscribeModal) subscribeModal.classList.add("show-modal");
      }
    });
  }

  // Handle mark all read button
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
  }

  // My Orders functionality
  const loadUserOrders = async () => {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      showFlashMessage('Please login to view your orders.', 'error');
      return;
    }

    const myOrdersModal = document.getElementById('my-orders-modal');
    const ordersList = document.getElementById('orders-list');

    if (!myOrdersModal || !ordersList) return;

    try {
      ordersList.innerHTML = '<div class="loading-spinner">Loading your orders...</div>';

      const response = await fetch('http://localhost:3001/api/orders/user', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load orders');
      }

      const orders = await response.json();

      if (orders.length === 0) {
         ordersList.innerHTML = '<li><p>You have no orders yet.</p></li>';
       } else {
         ordersList.innerHTML = orders.map(order => {
           const orderDate = new Date(order.createdAt).toLocaleDateString();
           const statusClass = order.status.toLowerCase();
           const itemsCount = order.items ? order.items.length : 0;

           return `
             <li class="order-card" role="listitem" aria-labelledby="order-${order.id}-title">
               <div class="order-header">
                 <h4 id="order-${order.id}-title">Order #${order.id}</h4>
                 <span class="order-status ${statusClass}" aria-label="Order status: ${order.status}">${order.status}</span>
               </div>
               <div class="order-details">
                 <p><strong>Date:</strong> <time datetime="${order.createdAt}">${orderDate}</time></p>
                 <p><strong>Total:</strong> ₱${parseFloat(order.totalAmount).toFixed(2)}</p>
                 <p><strong>Items:</strong> ${itemsCount}</p>
                 <p><strong>Shipping:</strong> ${order.shippingAddress}</p>
               </div>
               <div class="order-items" role="list" aria-label="Items in order ${order.id}">
                 ${order.items ? order.items.map(item => `
                   <div class="order-item" role="listitem">
                     <div class="order-item-details">
                       <h5 class="order-item-name">${item.product ? item.product.name : 'Unknown Product'}</h5>
                       <div class="order-item-meta">
                         <span class="order-item-quantity" aria-label="Quantity: ${item.quantity}">Qty: ${item.quantity}</span>
                         <span class="order-item-price" aria-label="Price: ₱${item.product ? parseFloat(item.product.price).toFixed(2) : '0.00'}">₱${item.product ? parseFloat(item.product.price).toFixed(2) : '0.00'}</span>
                       </div>
                     </div>
                   </div>
                 `).join('') : ''}
               </div>
             </li>
           `;
         }).join('');
       }

      myOrdersModal.classList.add('show-modal');

      // Focus management for accessibility
      myOrdersModal.focus();
      myOrdersModal.setAttribute('tabindex', '-1');

    } catch (error) {
      console.error('Failed to load orders:', error);
      ordersList.innerHTML = '<p>Failed to load orders. Please try again later.</p>';
      showFlashMessage('Failed to load orders. Please try again.', 'error');
    }
  };

  // Close modals
  const closeBtns = document.querySelectorAll(".close-btn");
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (subscribeModal) subscribeModal.classList.remove("show-modal");
      if (notificationsModal) notificationsModal.classList.remove("show-modal");
    });
  });

  // When the user clicks anywhere outside of the modal content, close it
  window.onclick = function (event) {
    if (event.target == loginRegisterModal) {
        closeLoginRegisterModal();
    }
    const viewProductModal = document.getElementById("view-product-modal");
    if (viewProductModal && event.target == viewProductModal) {
      viewProductModal.classList.remove("show-modal");
    }
  };

  // Also close the modal if the user presses the Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (loginRegisterModal && loginRegisterModal.style.display === 'flex') {
        closeLoginRegisterModal();
      }
      const viewProductModal = document.getElementById("view-product-modal");
      if (viewProductModal && viewProductModal.classList.contains("show-modal")) {
        viewProductModal.classList.remove("show-modal");
      }
    }
  });

  // --- View Product Modal Logic ---
  const viewProductModal = document.getElementById("view-product-modal");
  if (viewProductModal) {
    const viewProductCloseBtn = viewProductModal.querySelector(".close-btn");

    const closeViewProductModal = () => {
      if (viewProductModal) viewProductModal.classList.remove("show-modal");
    };

    // Quantity Stepper logic for View Product Modal
    const quantityInput = document.getElementById("view-product-quantity-input");
    const quantityMinusBtn = document.getElementById("view-product-quantity-minus");
    const quantityPlusBtn = document.getElementById("view-product-quantity-plus");

    const updateViewProductQuantity = (amount) => {
        let currentValue = parseInt(quantityInput.value, 10);
        if (isNaN(currentValue)) {
            currentValue = 1;
        }
        currentValue += amount;
        if (currentValue < 1) {
            currentValue = 1;
        }
        quantityInput.value = currentValue;
        quantityMinusBtn.disabled = currentValue === 1;
    };

    if (quantityMinusBtn) {
        quantityMinusBtn.addEventListener("click", () => updateViewProductQuantity(-1));
    }
    if (quantityPlusBtn) {
        quantityPlusBtn.addEventListener("click", () => updateViewProductQuantity(1));
    }

    if (viewProductCloseBtn) {
      viewProductCloseBtn.onclick = closeViewProductModal;
    }

    // Handle clicks on the action buttons inside this modal
    viewProductModal.addEventListener('click', (event) => {
      // We can reuse the existing handlers
      handleAddToCartClick(event);
      handleBuyNowOrReserveClick(event); // This will handle the "Reserve Now" button
      handlePreOrderClick(event);
    });
  }

  const populateAndShowViewModal = (product) => {
    const viewProductModal = document.getElementById("view-product-modal");
    if (!viewProductModal) return;

    // Populate common details
    document.getElementById("view-product-image").src = getFullImageUrl(product.imageUrl);
    document.getElementById("view-product-image").alt = product.name;
    document.getElementById("view-product-name").textContent = product.name;
    document.getElementById("view-product-description").textContent = product.description || 'A delicious treat.';
    document.getElementById("view-product-price").textContent = `₱${parseFloat(product.price).toFixed(2)}`;

    // Get elements for stock and actions
    const stockEl = document.getElementById("view-product-stock");
    const addToCartBtn = document.getElementById("view-product-add-to-cart");
    const reserveBtn = document.getElementById("view-product-reserve-now");
    const preOrderBtn = document.getElementById("view-product-pre-order");
    const quantityContainer = document.querySelector('.view-product__quantity');
    const quantityInput = document.getElementById("view-product-quantity-input");
    const quantityMinusBtn = document.getElementById("view-product-quantity-minus");

    // Handle stock status and button visibility
    if (product.stock > 0) {
      stockEl.textContent = `In Stock: ${product.stock} available`;
      stockEl.className = 'in-stock';

      // Show only Buy Now button and hide Add to Cart and pre-order
      addToCartBtn.style.display = 'none';
      reserveBtn.style.display = 'inline-block';
      reserveBtn.textContent = 'Buy Now'; // Change text from "Reserve Now" to "Buy Now"
      preOrderBtn.style.display = 'none';
      quantityContainer.style.display = 'block';

      // Reset quantity
      quantityInput.value = 1;
      quantityMinusBtn.disabled = true;

      // Set data attributes for actions
      reserveBtn.dataset.productId = product.id;
    } else {
      stockEl.textContent = 'Out of Stock';
      stockEl.className = 'out-of-stock';

      // Hide in-stock buttons and show pre-order
      addToCartBtn.style.display = 'none';
      reserveBtn.style.display = 'none';
      preOrderBtn.style.display = 'inline-block';
      quantityContainer.style.display = 'none';

      // Set data attributes for pre-order
      preOrderBtn.dataset.productId = product.id;
    }
    viewProductModal.classList.add("show-modal");
  };

  // A single, reusable function to handle "Buy Now" clicks
  const handleBuyNowOrReserveClick = async (event) => {
    const buyNowBtn = event.target.closest(".btn-buy-now");
    if (!buyNowBtn) return;
    event.preventDefault();

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.isAdmin) {
        alert('Please use a customer account to shop.');
        return;
    }

    // Check if the button is inside the detailed view modal (meaning it's a "Reserve Now" button)
    const isReserveButton = buyNowBtn.closest('#view-product-modal');

    if (isReserveButton) {
      // This is the "Buy Now" button. Create checkout item directly and go to checkout.
      const userToken = localStorage.getItem('userToken');
      if (!userToken) {
          alert('Please login to purchase items.');
          const loginRegisterModal = document.getElementById('login-register-modal');
          if (loginRegisterModal) loginRegisterModal.style.display = 'flex';
          return;
      }

      const productId = buyNowBtn.dataset.productId;
      const quantityInput = document.getElementById('view-product-quantity-input');
      const quantity = parseInt(quantityInput.value, 10);

      try {
        // Fetch the complete product details
        const productResponse = await fetch(`http://localhost:3001/api/products/${productId}`);
        if (!productResponse.ok) {
          throw new Error('Product not found');
        }
        const product = await productResponse.json();

        // Create checkout item directly (skip cart storage)
        const checkoutItem = {
          product: product,
          quantity: quantity
        };

        // Store for checkout page
        localStorage.setItem('checkoutItems', JSON.stringify([checkoutItem]));

        // Redirect directly to checkout
        window.location.href = 'checkout.html';

      } catch (error) {
        console.error('Buy now error:', error);
        showFlashMessage(`Error: ${error.message}`, 'error');
      }
    } else {
      // This is a "Buy Now" button on a product card. Open the detailed view modal.
      const productId = buyNowBtn.dataset.productId;
      if (productId) {
        try {
          const response = await fetch(`http://localhost:3001/api/products/${productId}`);
          if (!response.ok) throw new Error('Product not found.');
          const product = await response.json();
          populateAndShowViewModal(product);
        } catch (error) {
          console.error('Failed to fetch product details:', error);
          alert('Could not load product details. Please try again later.');
        }
      }
    }
  };

  // A new function to handle "Pre-order" clicks
  const handlePreOrderClick = async (event) => {
    const preOrderBtn = event.target.closest('.btn-pre-order');
    if (preOrderBtn) {
      event.preventDefault();
      const userToken = localStorage.getItem('userToken');
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));

      if (userInfo && userInfo.isAdmin) {
        alert('Please use a customer account to shop.');
        return;
      }

      if (!userToken) {
        alert('Please login to pre-order items.');
        openLoginRegisterModal(); // Assuming this function exists and opens the login modal
        return;
      }

      // For now, just show an alert. A real implementation would
      // involve a new API endpoint and maybe another modal for confirmation.
      alert(`Thank you for your pre-order! We will notify you when this product is back in stock.`);
      // Close the view modal after pre-ordering
      const viewProductModal = document.getElementById("view-product-modal");
      if (viewProductModal) viewProductModal.classList.remove("show-modal");
    }
  };

  const handleAddToCartClick = async (event) => {
    const addToCartBtn = event.target.closest('.add-to-cart-btn');
    if (addToCartBtn) {
      event.preventDefault();
      const productId = addToCartBtn.dataset.productId;
      const userToken = localStorage.getItem('userToken');
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));

      if (userInfo && userInfo.isAdmin) {
        alert('Please use a customer account to shop.');
        return;
      }

      if (!userToken) {
        alert('Please login to add items to your cart.');
        // Optionally, open the login modal
        const loginRegisterModal = document.getElementById('login-register-modal');
        if (loginRegisterModal) loginRegisterModal.style.display = 'flex';
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ productId, quantity: 1 })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add item to cart');
        }

        showFlashMessage('Item added to cart successfully!', 'success');

      } catch (error) {
        console.error('Add to cart error:', error);
        showFlashMessage(`Error: ${error.message}`, 'error');
      }
    }
  };

  // Add event listeners to all sections containing "Buy Now" and "Add to Cart" buttons
  const popularGrid = document.querySelector("#popular-cakes .popular__grid");
  const discoverContainer = document.querySelector("#most-selling .discover__grid");
  const mainProductsGrid = document.querySelector("#main-products .main-product__grid");

  const handleProductActions = (event) => {
    handleBuyNowOrReserveClick(event);
    handleAddToCartClick(event);
  };

  if (popularGrid) {
    popularGrid.addEventListener("click", handleProductActions);
  }
  if (discoverContainer) {
    discoverContainer.addEventListener("click", handleProductActions);
  }
  if (mainProductsGrid) {
    mainProductsGrid.addEventListener("click", handleProductActions);
  }

  // --- Fetch and Display Products from API ---
  const fetchAndDisplayPopularProducts = async () => {
    const popularGrid = document.querySelector("#popular-cakes .popular__grid");
    if (!popularGrid) return;

    try {
      // Fetch products from your backend API
      const response = await fetch(
        "http://localhost:3001/api/products?category=popular"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const products = await response.json();

      // Clear any placeholder content
      popularGrid.innerHTML = '';
      
      // Create and append a card for each product
      products.forEach((product) => {
        const card = document.createElement("div");
        card.className = 'popular__card';
        card.innerHTML = `
          <div class="popular__card__image">
            <img src="${getFullImageUrl(product.imageUrl)}" alt="${product.name}" />
            <div class="popular__card__ribbon">POPULAR</div>
          </div>
          <div class="popular__card__content">
            <div class="popular__card__ratings">
              <i class="ri-star-fill"></i>
              <i class="ri-star-fill"></i>
              <i class="ri-star-fill"></i>
              <i class="ri-star-half-fill"></i>
              <i class="ri-star-line"></i>
            </div>
            <h4>${product.name}</h4>
            <p>${product.description || 'A delicious treat.'}</p>
          </div>
          <div class="popular__card__footer">
            <h4>₱${parseFloat(product.price).toFixed(2)}</h4>
            <div class="action-btns">
              <button class="btn add-to-cart-btn" data-product-id="${product.id}" title="Add to Cart"><i class="ri-shopping-cart-line"></i></button>
                <button class="btn btn-buy-now" data-product-id="${product.id}" data-product-name="${
                  product.name
                }" data-product-price="${parseFloat(product.price).toFixed(2)}">Buy Now</button>
            </div>
          </div>
        `;
        popularGrid.appendChild(card);
      });

      // Re-initialize ScrollReveal for the newly added cards
      ScrollReveal().reveal("#popular-cakes .popular__card", {
        ...scrollRevealOption,
        interval: 500,
      });
    } catch (error) {
      console.error("Failed to fetch popular products:", error);
      popularGrid.innerHTML =
        '<p style="color: var(--text-dark);">Sorry, we couldn\'t load our flavours. Please try again later.</p>';
    }
  };

  const fetchAndDisplayBestSellers = async () => {
    const bestSellerGrid = document.querySelector("#most-selling .discover__grid");
    if (!bestSellerGrid) return;

    try {
      const response = await fetch(
        "http://localhost:3001/api/products?category=best-seller"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const products = await response.json();

      bestSellerGrid.innerHTML = "";

      products.forEach((product) => {
        const card = document.createElement("div");
        card.className = "discover__card";
        card.innerHTML = `
          <div class="discover__card__image">
            <img src="${getFullImageUrl(product.imageUrl)}" alt="${product.name}" />
          </div>
          <div class="discover__card__content">
            <h4>${product.name}</h4>
            <p class="section__description">${product.description || "A delicious treat."}</p>
            <h3>₱${parseFloat(product.price).toFixed(2)}</h3>
            <div class="discover__card__btn">
              <button class="btn add-to-cart-btn" data-product-id="${product.id}" title="Add to Cart"><i class="ri-shopping-cart-line"></i></button>
                <button class="btn btn-buy-now" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${parseFloat(product.price).toFixed(2)}">
                  Buy Now
                </button>
            </div>
          </div>
        `;
        bestSellerGrid.appendChild(card);
      });

      // Re-initialize ScrollReveal for the newly added cards
      ScrollReveal().reveal("#most-selling .discover__card", {
        ...scrollRevealOption,
        interval: 500,
      });
    } catch (error) {
      console.error("Failed to fetch best sellers:", error);
      bestSellerGrid.innerHTML =
        '<p style="color: var(--text-dark);">Sorry, we couldn\'t load our best sellers. Please try again later.</p>';
    }
  };

  const fetchAndDisplayMainProducts = async () => {
    const mainProductsGrid = document.querySelector("#main-products .main-product__grid");
    if (!mainProductsGrid) return;

    try {
      // Fetch main products from your backend API
      const response = await fetch(
        "http://localhost:3001/api/products?category=main-product"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const products = await response.json();

      // Clear any placeholder content
      mainProductsGrid.innerHTML = '';
      
      // Create and append a card for each product
      products.forEach((product) => {
        const card = document.createElement("div");
        card.className = 'main-product__card'; // New class for a unique style
        card.innerHTML = `
          <div class="main-product__image-container">
            <img src="${getFullImageUrl(product.imageUrl)}" alt="${product.name}" />
            <div class="main-product__actions">
              <button class="btn add-to-cart-btn" data-product-id="${product.id}" title="Add to Cart"><i class="ri-shopping-cart-line"></i></button>
              <button class="btn btn-buy-now" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${parseFloat(product.price).toFixed(2)}">Buy Now</button>
            </div>
          </div>
          <div class="main-product__content">
            <h4 class="main-product__name">${product.name}</h4>
            <p class="main-product__price">₱${parseFloat(product.price).toFixed(2)}</p>
          </div>
        `;
        mainProductsGrid.appendChild(card);
      });

      // Re-initialize ScrollReveal for the newly added cards
      ScrollReveal().reveal("#main-products .main-product__card", {
        ...scrollRevealOption,
        interval: 500,
      });
    } catch (error) {
      console.error("Failed to fetch all products:", error);
      mainProductsGrid.innerHTML = '<p style="color: var(--text-dark);">Sorry, we couldn\'t load our main products. Please try again later.</p>';
    }
  };

  // Call the function to load products when the page loads
  fetchAndDisplayPopularProducts();
  fetchAndDisplayBestSellers();
  fetchAndDisplayMainProducts();

  // Refresh products every 10 seconds to show newly added products
  setInterval(() => {
    console.log('Refreshing products from database...');
    fetchAndDisplayPopularProducts();
    fetchAndDisplayBestSellers();
    fetchAndDisplayMainProducts();
  }, 10000);
});