# 💰 Enterprise Expense Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Node](https://img.shields.io/badge/Node.js-18-green)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-brightgreen)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC)

A highly scalable, multi-tenant Expense Management System designed for enterprises. It features robust role-based access control, customizable multi-step approval workflows, and an elegant, stunning dark/light mode UI built with React and TailwindCSS.

---

## ✨ Features

- **Multi-Tenant Architecture**: Register entirely separate companies, each with their own isolated data, users, and workflows.
- **Dynamic Workflows**: Build custom approval chains (e.g., Employee ➔ Manager ➔ CFO) using an intuitive Workflow Builder. 
- **Role-Based Access Control**:
  - `Admin`: Full control over company settings, user provisioning, and workflows.
  - `Manager`: Approve/Reject expenses for direct reports, view team analytics.
  - `Approvers (e.g. CFO, Finance)`: Participate in custom workflow chains, view company-wide financials.
  - `Employee`: Submit expenses, attach receipts, and track approval status.
- **Stunning UI/UX**: Premium aesthetic with micro-animations, glassmorphism, and a meticulously crafted Semantic CSS Variable theming system (Light/Dark mode).
- **Analytics & Dashboards**: Beautiful, dynamic charts detailing expense trends, category breakdowns, and approval bottlenecks.

---

## 🏗️ Technology Stack

- **Frontend**: React (Vite), TailwindCSS, Axios, Chart.js
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB (Atlas or Local)
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **Containerization**: Docker, Docker Compose

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or Atlas cluster)

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory based on the provided `.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense_management
JWT_SECRET=your_super_secret_jwt_key
```
Start the backend server:
```bash
npm start
```
*(Optional)* Seed the database with robust mock data:
```bash
node seed.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```
Navigate to `http://localhost:5173`.

---

## 🐳 Docker Deployment (Production)

Deploying the entire stack (MongoDB, Node.js API, and Nginx React SPA) is a breeze using Docker Compose.

1. Ensure you have Docker and Docker Compose installed.
2. From the root of the project, simply run:
```bash
docker-compose up -d --build
```
3. The frontend will be available at `http://localhost:80`, and the backend API will run on `http://localhost:5000`.

**Note:** For a true production deployment, ensure you update the `VITE_API_URL` environment variables in your frontend build process to point to your live backend domain instead of `localhost`.

---

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to submit pull requests, formatting rules, and our code of conduct.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
