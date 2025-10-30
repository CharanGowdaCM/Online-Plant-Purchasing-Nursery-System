# 🌿 Bleaf - Online Plant Nursery System

**Nature Knows the Way — Just Bleaf.**

A full-stack e-commerce platform for purchasing plants online, featuring comprehensive plant care information, AI-powered chatbot assistance, secure payment processing, and complete order management.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Team](#-team)

---

## ✨ Features

### Customer Features
- 🛒 **Product Browsing & Search** - Browse plants by category, search, and filter by price and care level
- 🛍️ **Shopping Cart** - Add products to cart, update quantities, and manage items
- 💳 **Secure Checkout** - Integrated Razorpay payment gateway for secure transactions
- 📦 **Order Management** - Track orders, view order history, and download invoices
- ⭐ **Product Reviews** - Rate and review purchased products
- 🤖 **AI Chatbot** - Get instant plant care advice using Google's Generative AI
- 👤 **User Profile** - Manage personal information and view order history
- 🎫 **Support Tickets** - Create and track support tickets
- 📚 **Plant Care Guide** - Access detailed plant care information
- ❓ **FAQ Section** - Find answers to common questions

### Admin Features
- 📊 **Dashboard** - Comprehensive analytics and sales overview
- 🌱 **Product Management** - Add, edit, and manage product catalog
- 📦 **Order Management** - Process orders, update status, and manage fulfillment
- 👥 **User Management** - Manage customer accounts and roles
- 📦 **Inventory Management** - Track stock levels and manage inventory
- 🎫 **Support Ticket Management** - Handle customer support requests
- 📝 **Content Management** - Manage FAQs and blog posts
- 📈 **Activity Logs** - Monitor system activities and user actions

### Security Features
- 🔐 JWT-based authentication with access and refresh tokens
- 🔒 Password encryption using bcrypt
- ✉️ Email OTP verification for signup
- 🔄 Password reset functionality
- 📝 Activity logging for audit trails

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **React Router v7** - Client-side routing
- **Vite** - Build tool and dev server
- **Bootstrap 5** - UI framework
- **Axios** - HTTP client
- **Chart.js** - Data visualization
- **jsPDF** - PDF generation

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **PostgreSQL** (via Supabase) - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Razorpay** - Payment gateway
- **Nodemailer** - Email service
- **Google Generative AI** - AI chatbot
- **PDFKit** - Invoice generation
- **Morgan** - HTTP request logger
- **Express Rate Limit** - API rate limiting

### Database & Services
- **Supabase** - PostgreSQL database and authentication
- **Razorpay** - Payment processing
- **Gmail SMTP** - Email delivery
- **Google Gemini AI** - Chatbot intelligence

---

## 📁 Project Structure

```
online-plant-purchasing-nursery-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files (Razorpay, Supabase)
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Authentication, CORS, error handling, logging
│   │   ├── utils/           # Validators, notifications, activity tracking
│   │   ├── events/          # Event emitters
│   │   └── listeners/       # Event listeners
│   ├── db/                  # Database initialization scripts
│   ├── assets/              # Static assets (logos for emails)
│   ├── scripts/             # Utility scripts
│   ├── server.js            # Main server file
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── products/    # Product-related components
│   │   │   ├── admin/       # Admin dashboard components
│   │   │   ├── common/      # Shared components
│   │   │   └── support/     # Support ticket components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service modules
│   │   ├── context/         # React context (Auth)
│   │   ├── utils/           # Utility functions
│   │   └── assets/          # Images, icons
│   ├── public/              # Static files
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── TestCases_*.csv          # Test case documentation
└── Readme.md
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** database (or Supabase account)
- **Git**

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Online-plant-purchasing-nursery-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

---

## 🔐 Environment Variables

### Backend (.env)
Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (Supabase)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_here
REFRESH_SECRET=your_refresh_token_secret_here

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Google Generative AI
GEMINI_API_KEY=your_gemini_api_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

---

## 🏃 Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
node server.js
```
The backend will run on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### Production Build

#### Build Frontend
```bash
cd frontend
npm run dev
```


## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /api/auth/signup/send-otp` - Send OTP for signup
- `POST /api/auth/signup/verify` - Verify OTP and create account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/token/refresh` - Refresh access token

### Product Endpoints
- `GET /api/products` - List all products (with filters)
- `GET /api/products/categories` - Get all categories
- `GET /api/products/:slug` - Get product details

### Cart Endpoints
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/items/:cartItemId` - Update cart item quantity
- `DELETE /api/cart/items/:cartItemId` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Order Endpoints
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:orderId` - Get order details
- `PUT /api/orders/:orderId/payment` - Update order payment status
- `POST /api/orders/:orderId/cancel` - Cancel order

### Review Endpoints
- `POST /api/products/:productId/reviews` - Add product review
- `GET /api/products/:productId/reviews` - Get product reviews
- `GET /api/reviews/user` - Get user's reviews

### Payment Endpoints
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `POST /api/users/profile` - Save/update profile
- `GET /api/users/:userId` - Get user details (admin)

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:userId/status` - Update user status
- `PUT /api/admin/users/:userId/role` - Update user role
- `GET /api/admin/orders` - List all orders
- `PUT /api/admin/orders/:orderId` - Update order status
- `POST /api/admin/products` - Add new product
- `PUT /api/admin/products/:productId` - Update product
- `DELETE /api/admin/products/:productId` - Delete product

---


## 👥 Team

- **K Akhilesh** - Authentication, User Management, Activity Logging
- **M Lakshya** - Cart, Orders, Payments, Invoice Generation
- **Charan Gowda C M** - Product Management, Reviews, Admin Dashboard

---

**Made with 🌿 by Team Bleaf**