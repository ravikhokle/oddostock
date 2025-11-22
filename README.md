# StockMaster - Inventory Management System

A comprehensive full-stack inventory management system built with React, Node.js, Express, MongoDB, and Socket.io.

## 🚀 Features

### Authentication
- User registration and login
- OTP-based password reset
- JWT authentication
- Role-based access control (Admin, Manager, Warehouse Staff)

### Dashboard
- Real-time KPIs
- Total products, low stock alerts, pending operations
- Sales & Purchase overview with charts
- Inventory summary statistics
- Recent activity feed

### Product Management
- Create, read, update, delete products
- SKU management
- Product categories
- Stock availability per location
- Reordering rules
- Low stock alerts

### Operations

#### Receipts (Incoming Stock)
- Create receipts from suppliers
- Track expected vs received quantities
- Validate receipts to update stock
- Status workflow: Draft → Waiting → Ready → Done

#### Deliveries (Outgoing Stock)
- Create delivery orders for customers
- Pick, pack, and validate workflow
- Automatic stock reduction
- Status tracking: Draft → Picking → Packing → Ready → Done

#### Internal Transfers
- Move stock between warehouses/locations
- Track transfer status
- Automatic stock updates on both ends
- Status workflow: Draft → Waiting → In Transit → Done

#### Stock Adjustments
- Fix stock mismatches
- Record damaged/lost/found items
- Multiple adjustment reasons
- Complete audit trail

### Move History
- Complete stock movement ledger
- Filter by product, warehouse, location, transaction type
- Running balance tracking
- User audit trail

### Settings
- Warehouse management
- Location management
- Category management
- User profile management

### Real-time Updates
- Socket.io integration
- Live notifications for stock changes
- Real-time operation updates

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher) - Running locally
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd odoostock
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/stockmaster
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

OTP_EXPIRE_MINUTES=10
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```bash
cp .env.example .env
```

The default values should work:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🗄️ Database Setup

### Start MongoDB

**Windows:**
```bash
# Using MongoDB as a Windows Service (if installed as service)
net start MongoDB

# Or run mongod directly
mongod --dbpath C:\data\db
```

**Linux/Mac:**
```bash
# Using systemd
sudo systemctl start mongod

# Or run mongod directly
mongod --dbpath /data/db
```

### Seed the Database

Run the seed script to populate sample data:

```bash
cd backend
npm run seed
```

This will create:
- 2 users (admin and manager)
- 3 product categories
- 2 warehouses with locations
- 5 sample products
- Initial stock entries

**Login Credentials:**
- Admin: `admin@stockmaster.com` / `password123`
- Manager: `manager@stockmaster.com` / `password123`

## 🚀 Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 📁 Project Structure

```
odoostock/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── receipt.controller.js
│   │   ├── delivery.controller.js
│   │   ├── transfer.controller.js
│   │   ├── adjustment.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── warehouse.controller.js
│   │   ├── category.controller.js
│   │   └── moveHistory.controller.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── socketAuth.js
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Product.model.js
│   │   ├── Category.model.js
│   │   ├── Warehouse.model.js
│   │   ├── Location.model.js
│   │   ├── Receipt.model.js
│   │   ├── Delivery.model.js
│   │   ├── InternalTransfer.model.js
│   │   ├── StockAdjustment.model.js
│   │   └── StockLedger.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   ├── receipt.routes.js
│   │   ├── delivery.routes.js
│   │   ├── transfer.routes.js
│   │   ├── adjustment.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── warehouse.routes.js
│   │   ├── category.routes.js
│   │   └── moveHistory.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── email.service.js
│   │   ├── product.service.js
│   │   ├── receipt.service.js
│   │   ├── delivery.service.js
│   │   ├── transfer.service.js
│   │   ├── adjustment.service.js
│   │   └── dashboard.service.js
│   ├── validators/
│   │   └── auth.validator.js
│   ├── scripts/
│   │   └── seed.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── SignUp.jsx
│   │   │   │   └── ForgotPassword.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Receipts.jsx
│   │   │   ├── Deliveries.jsx
│   │   │   ├── Transfers.jsx
│   │   │   ├── Adjustments.jsx
│   │   │   ├── MoveHistory.jsx
│   │   │   ├── Warehouses.jsx
│   │   │   └── Profile.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## 🔧 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Joi** - Validation
- **Socket.io** - Real-time communication
- **Nodemailer** - Email service

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates
- **Recharts** - Charts and graphs
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **date-fns** - Date formatting

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Protected API routes
- Socket.io authentication
- CORS configuration
- Helmet for security headers
- Input validation with Joi

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/low-stock` - Get low stock products

### Receipts
- `GET /api/receipts` - Get all receipts
- `POST /api/receipts` - Create receipt
- `GET /api/receipts/:id` - Get receipt by ID
- `PUT /api/receipts/:id` - Update receipt
- `POST /api/receipts/:id/validate` - Validate receipt
- `POST /api/receipts/:id/cancel` - Cancel receipt

### Deliveries
- `GET /api/deliveries` - Get all deliveries
- `POST /api/deliveries` - Create delivery
- `GET /api/deliveries/:id` - Get delivery by ID
- `PUT /api/deliveries/:id` - Update delivery
- `POST /api/deliveries/:id/validate` - Validate delivery
- `POST /api/deliveries/:id/cancel` - Cancel delivery

### Transfers
- `GET /api/transfers` - Get all transfers
- `POST /api/transfers` - Create transfer
- `GET /api/transfers/:id` - Get transfer by ID
- `PUT /api/transfers/:id` - Update transfer
- `POST /api/transfers/:id/validate` - Validate transfer
- `POST /api/transfers/:id/cancel` - Cancel transfer

### Adjustments
- `GET /api/adjustments` - Get all adjustments
- `POST /api/adjustments` - Create adjustment
- `GET /api/adjustments/:id` - Get adjustment by ID
- `PUT /api/adjustments/:id` - Update adjustment
- `POST /api/adjustments/:id/validate` - Validate adjustment
- `POST /api/adjustments/:id/cancel` - Cancel adjustment

### Dashboard
- `GET /api/dashboard/kpis` - Get dashboard KPIs
- `GET /api/dashboard/inventory-summary` - Get inventory summary
- `GET /api/dashboard/sales-purchase-chart` - Get chart data

## 🚧 Production Recommendations

### Backend
- [ ] Use httpOnly cookies for JWT tokens
- [ ] Implement rate limiting
- [ ] Add request logging (Winston/Morgan)
- [ ] Set up proper error monitoring (Sentry)
- [ ] Use environment-specific configs
- [ ] Enable MongoDB replica set
- [ ] Implement caching (Redis)
- [ ] Add API documentation (Swagger)

### Frontend
- [ ] Enable production build optimizations
- [ ] Implement code splitting
- [ ] Add error boundary components
- [ ] Set up analytics
- [ ] Implement PWA features
- [ ] Add E2E tests (Cypress/Playwright)

### Infrastructure
- [ ] Use HTTPS in production
- [ ] Set up CI/CD pipeline
- [ ] Configure load balancing
- [ ] Implement backup strategy
- [ ] Monitor application performance
- [ ] Use CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For support, email support@stockmaster.com or create an issue in the repository.
