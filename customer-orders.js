const SERVER_URL = 'http://localhost:3001';
const getFullImageUrl = (path) => {
    if (!path) return '';
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

document.addEventListener('DOMContentLoaded', () => {
  const ordersList = document.querySelector('.orders__list');

  const loadUserOrders = async () => {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      showFlashMessage('Please login to view your orders.', 'error');
      window.location.href = 'index.html';
      return;
    }

    if (!ordersList) return;

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
                     ${item.product && item.product.imageUrl ? `<img src="${getFullImageUrl(item.product.imageUrl)}" alt="${item.product.name}" />` : ''}
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

     } catch (error) {
       console.error('Failed to load orders:', error);
       ordersList.innerHTML = '<p>Failed to load orders. Please try again later.</p>';
       showFlashMessage('Failed to load orders. Please try again.', 'error');
     }
   };

   loadUserOrders();
});