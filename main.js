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
      // Hide customer-specific links like "My Orders" for admins
      const myOrdersLink = document.getElementById('my-orders-link');
      if (myOrdersLink) {
        myOrdersLink.style.display = 'none';
      }

      // Hide the cart icon for admin users
      const cartIconLink = document.querySelector('a[href="cart.html"]');
      if (cartIconLink) {
          cartIconLink.style.display = 'none';
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
        if (loginRegisterModal) loginRegisterModal.style.display = 'flex';
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
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
          const response = await fetch(`${API_URL}/login`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email, password })
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.message || 'Failed to login');
          }

          // Store user info and token
          localStorage.setItem('userToken', data.token);
          localStorage.setItem('userInfo', JSON.stringify(data)); // Store the whole user object

          alert('Login successful!');
          window.location.reload();

      } catch (error) {
          console.error('Login error:', error);
          alert(`Login failed: ${error.message}`);
      }
  });

  registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;

      try {
          const response = await fetch(`${API_URL}/`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ name, email, password })
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.message || 'Failed to register');
          }

          localStorage.setItem('userToken', data.token);
          alert('Registration successful!');
          window.location.reload();

      } catch (error) {
          console.error('Registration error:', error);
          alert(`Registration failed: ${error.message}`);
      }
  });


  // --- Floating Notification Modal Logic ---

  // Get the modal element
  const modal = document.getElementById("notification-modal");

  // Get the button that opens the modal
  const openBtn = document.getElementById("notification-btn");

  // Get the <span> element that closes the modal
  const closeBtn = document.querySelector(".close-btn");

  // Function to open the modal
  const openModal = () => {
    if (modal) modal.classList.add("show-modal");
  };

  // Function to close the modal
  const closeModal = () => {
    if (modal) modal.classList.remove("show-modal");
  };

  // When the user clicks the notification button, open the modal
  if (openBtn) {
    openBtn.onclick = openModal;
  }

  // When the user clicks on <span> (x), close the modal
  if (closeBtn) {
    closeBtn.onclick = closeModal;
  }

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

      // Show in-stock buttons and hide pre-order
      addToCartBtn.style.display = 'inline-block';
      reserveBtn.style.display = 'inline-block';
      preOrderBtn.style.display = 'none';
      quantityContainer.style.display = 'block';

      // Reset quantity
      quantityInput.value = 1;
      quantityMinusBtn.disabled = true;

      // Set data attributes for actions
      addToCartBtn.dataset.productId = product.id;
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
      // This is the "Reserve Now" button. Add item(s) to cart and go to checkout.
      const userToken = localStorage.getItem('userToken');
      if (!userToken) {
          alert('Please login to reserve items.');
          const loginRegisterModal = document.getElementById('login-register-modal');
          if (loginRegisterModal) loginRegisterModal.style.display = 'flex';
          return;
      }

      const productId = buyNowBtn.dataset.productId;
      const quantityInput = document.getElementById('view-product-quantity-input');
      const quantity = parseInt(quantityInput.value, 10);

      try {
        const response = await fetch('http://localhost:3001/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ productId, quantity })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add item to cart');
        }

        // On success, redirect to checkout
        window.location.href = 'checkout.html';

      } catch (error) {
        console.error('Reserve now error:', error);
        alert(`Error: ${error.message}`);
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

        alert('Item added to cart successfully!');

      } catch (error) {
        console.error('Add to cart error:', error);
        alert(`Error: ${error.message}`);
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