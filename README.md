# Cooshey Cake eCommerce

A full-stack eCommerce website for a cake shop built with HTML, CSS, JavaScript, Node.js, Express, and MongoDB.

## Features

- 🛍️ Product browsing and shopping cart functionality
- 👤 User authentication (login/register)
- 🛒 Cart management
- 📱 Responsive design for all devices
- 🔧 Admin dashboard for product management
- 🌟 Popular and best-selling products sections
- 🔔 Notification system
- 💳 Checkout process

## Project Structure

```
cooshey-cake-eccomerce/
├── frontend/
│   ├── index.html          # Main shopping page
│   ├── cart.html          # Shopping cart page
│   ├── admin.html         # Admin dashboard
│   ├── styles.css         # Main styles
│   ├── admin.css         # Admin dashboard styles
│   ├── main.js           # Main frontend logic
│   ├── cart.js          # Cart functionality
│   ├── admin.js         # Admin dashboard logic
│   └── assets/          # Images and media files
└── backend/
    ├── server.js        # Express server setup
    ├── models/          # MongoDB models
    ├── controllers/     # Route controllers
    ├── routes/         # API routes
    ├── middleware/     # Custom middleware
    └── .env           # Environment variables (create this)
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Web browser
- npm (Node Package Manager)

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
cd cooshey-cake-eccomerce
```

2. Set up the backend:
```bash
cd backend
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```
PORT=3001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

4. Start the backend server:
```bash
npm start
```

5. Open the frontend:
- Navigate to the project root directory
- Open `index.html` in your web browser
- For admin access, open `admin.html`

## How to Use

### As a Customer

1.  **Register:** Click on the "Register" button and fill out the form to create a new account.
2.  **Login:** Once registered, log in with your credentials.
3.  **Browse Products:** View the available cakes on the main page.
4.  **Add to Cart:** Click the "Add to Cart" button on a product to add it to your shopping cart.
5.  **View Cart:** Click on the cart icon to view the items in your cart.
6.  **Checkout:** From the cart page, proceed to checkout and follow the payment instructions.

### As an Admin

1.  **Admin Login:** To access the admin dashboard, you first need to register a user and then manually set the `isAdmin` flag to `true` for that user in the MongoDB database.
2.  **Access Dashboard:** Open the `admin.html` file in your browser and log in with your admin credentials.
3.  **Manage Products:** From the dashboard, you can add, edit, and delete products.
4.  **View Orders:** View and manage customer orders.
5.  **View Customers:** View a list of all registered users.

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Users
- `POST /api/users/` - Register new user
- `POST /api/users/login` - Login user

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:productId` - Update cart item
- `DELETE /api/cart/:productId` - Remove item from cart

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design inspired by modern eCommerce platforms
- Built with love for cake enthusiasts 🎂