# Expense Management System

A full-stack MERN application for managing company expenses with multi-level approval workflows.

## Tech Stack

- **Frontend**: Vite + React (JSX), TailwindCSS
- **Backend**: Node.js, Express.js, MongoDB
- **Database**: MongoDB

## Features (Current Phase)

- ✅ Company registration with automatic admin user creation
- ✅ Country-based currency auto-selection (195+ countries)
- ✅ Secure password hashing with bcrypt
- ✅ RESTful API architecture
- ✅ **Forgot Password with Email Verification** (6-digit code, 10-min expiry)
- ✅ Receipt upload for expenses (images & PDFs)
- ✅ CSV export functionality
- ✅ Advanced filtering and search
- ✅ Change password feature
- ✅ Multi-role dashboards (Admin/Manager/Employee)

## Project Structure

```
Expense-Management/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── models/   # Mongoose schemas
│   │   ├── routes/   # API endpoints
│   │   └── utils/    # DB connection
│   └── package.json
└── frontend/         # Vite + React app
    ├── src/
    │   ├── pages/    # React pages
    │   └── App.jsx
    └── package.json
```

## Setup Instructions (Windows PowerShell)

### Prerequisites

- Node.js (v18+)
- MongoDB (running locally or MongoDB Atlas)
- Git

### Backend Setup

1. Navigate to backend folder:
```powershell
cd backend
```

2. Install dependencies:
```powershell
npm install
```

3. Create `.env` file:
```powershell
Copy-Item .env.example .env
```

4. Update `.env` with your MongoDB connection string if needed.

5. Start the backend server:
```powershell
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Open a new terminal and navigate to frontend folder:
```powershell
cd frontend
```

2. Install dependencies:
```powershell
npm install
```

3. Start the development server:
```powershell
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### POST `/api/auth/register-company`

Register a new company with an admin user.

**Request Body:**
```json
{
  "companyName": "Acme Corp",
  "country": "US",
  "adminName": "John Doe",
  "adminEmail": "john@acme.com",
  "adminPassword": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Company and admin created",
  "company": {
    "id": "...",
    "name": "Acme Corp",
    "currency": "USD"
  },
  "admin": {
    "id": "...",
    "email": "john@acme.com",
    "name": "John Doe"
  }
}
```

## Supported Countries & Currencies

- US → USD
- IN → INR
- GB → GBP
- EU → EUR

## Next Steps

- [ ] Implement authentication (JWT)
- [ ] Add employee and manager management
- [ ] Implement expense submission workflow
- [ ] Add multi-level approval system
- [ ] Create dashboard views

## License

MIT
