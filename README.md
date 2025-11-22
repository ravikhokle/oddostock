
# **StockMaster – Inventory Management System**

A simple and complete inventory management system built with **React**, **Node.js**, **Express**, **MongoDB**, and **Socket.io**.

---

## 🚀 **Features**

### **🔐 Authentication**

* User sign up and login
* OTP-based password reset

### **📊 Dashboard**

* Total products count
* Low-stock alerts
* Sales & purchase charts
* Basic inventory summary

### **📦 Product Management**

* Add, update, delete products
* Add SKU / Product Code
* Add categories
* Check stock availability

### **📥 Incoming Stock – Receipts**

* Create receipts from suppliers
* Compare expected vs received quantity
* Validate to update stock

### **📤 Outgoing Stock – Deliveries**

* Create delivery orders
* Pick, pack and validate
* Automatic stock decrease

### **🔄 Internal Transfers**

* Move stock between warehouses

  * Warehouse 1
  * Warehouse 2

### **🛠 Stock Adjustments**

* Fix stock errors
* Add damaged / lost / found items
* Update stock counts

### **📜 Move History**

* Full stock movement record
* Filters for product, warehouse, type
* Running balance
* User activity log

### **⚙️ Settings**

* Manage warehouses
* Manage locations
* Manage categories
* Manage user profiles

### **⚡ Real-time Updates**

* Live stock changes
* Live operation updates
* Powered by Socket.io

---

## 📋 **Prerequisites**

Make sure you have installed:

* **Node.js v18+**
* **MongoDB v6+**
* **npm or yarn**

---

## 🛠️ **Installation Steps**

### **1. Clone the Project**

```bash
git clone <your-repo-url>
cd odoostock
```

---

## **Backend Setup**

### **2. Install Backend Packages**

```bash
cd backend
npm install
```

### **3. Add Environment File**

```bash
cp .env.example .env
```

Update your `.env` file:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stockmaster
JWT_SECRET=your-secret
CLIENT_URL=http://localhost:5173

# Email for OTP
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## **Frontend Setup**

### **4. Install Frontend Packages**

```bash
cd ../frontend
npm install
```

### **5. Create Frontend .env File**

```bash
cp .env.example .env
```

Defaults (no changes needed):

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🗄️ **Start MongoDB**

### **Windows**

```bash
net start MongoDB
```

Or:

```bash
mongod --dbpath C:\data\db
```

### **Linux/Mac**

```bash
sudo systemctl start mongod
```

---

## 🚀 **Run the Application**

### **Start Backend**

```bash
cd backend
npm run dev
```

Backend runs at: **[http://localhost:5000](http://localhost:5000)**

### **Start Frontend**

```bash
cd frontend
npm run dev
```

Frontend runs at: **[http://localhost:5173](http://localhost:5173)**

---

## 🌐 **Open App**

Go to your browser:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🔧 **Simple Tech Stack**

### **Backend**

* Node.js
* Express
* MongoDB + Mongoose
* JWT Authentication
* Socket.io (real-time updates)
* Nodemailer (OTP Email)

### **Frontend**

* React
* Vite
* Tailwind CSS
* React Router
* Axios
* Recharts
* Socket.io Client

---

## 🔐 **Security**

* JWT authentication
* Password hashing
* Input validation
* Protected API routes
* Socket authentication

---
