# Quick Start Guide

## ✅ What's Implemented

### Backend API
- ✅ Company Registration with auto-admin creation
- ✅ Login with JWT authentication
- ✅ User management (Create, Read, Delete employees/managers)
- ✅ Protected routes with role-based access control
- ✅ Password hashing with bcrypt

### Frontend
- ✅ Company Registration Page
- ✅ Login Page
- ✅ Admin Dashboard with:
  - User listing
  - Create employees/managers
  - Assign managers to employees
  - Delete users
  - Role-based badges
  - Logout functionality

## 🚀 How to Run

### 1. Start Backend (Terminal 1)
```powershell
cd "d:\Repositories\Odoo hackathon 2025\Expense-Management\backend"
npm start
```
Backend runs on: `http://localhost:5000`

### 2. Start Frontend (Terminal 2)
```powershell
cd "d:\Repositories\Odoo hackathon 2025\Expense-Management\frontend"
npm run dev
```
Frontend runs on: `http://localhost:5173`

## 🧪 Testing the Application

### Step 1: Register a Company
1. Go to `http://localhost:5173`
2. You'll be redirected to `/login`
3. Click "Register your company"
4. Fill in the form:
   - Company Name: "Tech Corp"
   - Country: Select any (sets currency automatically)
   - Admin Name: "John Admin"
   - Admin Email: "admin@techcorp.com"
   - Password: "password123"
5. Click "Register"
6. On success, click "Login here"

### Step 2: Login as Admin
1. Use the email and password from registration:
   - Email: "admin@techcorp.com"
   - Password: "password123"
2. Click "Sign In"
3. You'll be redirected to `/admin/dashboard`

### Step 3: Create Employees and Managers
1. In the Admin Dashboard, click "+ Add Employee/Manager"
2. Fill in the form:
   - **Create a Manager first:**
     - Name: "Jane Manager"
     - Email: "jane@techcorp.com"
     - Password: "password123"
     - Role: "Manager"
   - Click "Create User"
   
3. **Create an Employee:**
   - Name: "Bob Employee"
   - Email: "bob@techcorp.com"
   - Password: "password123"
   - Role: "Employee"
   - Assign Manager: Select "Jane Manager"
   - Click "Create User"

### Step 4: View and Manage Users
- See all users in the table
- Each user shows:
  - Name, Email, Role (with colored badges)
  - Assigned Manager (for employees)
  - Delete button (except for admin)
- Delete users by clicking "Delete"

## 📊 Database Structure

### Collections Created:
1. **companies** - Stores company information
2. **users** - Stores all users (admin, managers, employees)

### Sample Data After Testing:
```
Company:
- Name: Tech Corp
- Currency: USD (or based on country selected)

Users:
1. Admin User (role: admin)
2. Jane Manager (role: manager)
3. Bob Employee (role: employee, manager: Jane Manager)
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register-company` - Register company + admin
- `POST /api/auth/login` - Login and get JWT token

### User Management (Protected - Admin Only)
- `GET /api/users` - Get all users in company
- `POST /api/users/create-user` - Create employee/manager
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🎯 Features Demonstrated

✅ **Authentication & Authorization**
- JWT token generation and validation
- Protected routes with middleware
- Role-based access control (Admin only routes)
- Token stored in localStorage

✅ **User Management**
- Create employees and managers
- Assign managers to employees
- View all users with details
- Delete users (except admin)
- Form validation

✅ **UI/UX**
- Responsive design with Tailwind CSS
- Success/Error notifications
- Loading states
- Colored role badges
- Intuitive navigation

✅ **Security**
- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Authorization checks

## 🐛 Troubleshooting

### Backend won't start
- Ensure MongoDB connection string is correct in `.env`
- Check if MongoDB Atlas allows your IP address
- Verify all dependencies are installed: `npm install`

### Frontend won't connect to backend
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify API URLs in frontend code are `http://localhost:5000`

### Can't login
- Ensure you registered successfully first
- Check email/password are correct
- Look at backend terminal for error messages

## 📋 Next Features to Implement

- [ ] Expense submission by employees
- [ ] Expense approval workflow
- [ ] Multi-level approval based on thresholds
- [ ] Expense history and filtering
- [ ] Dashboard for managers and employees
- [ ] Edit user functionality
- [ ] Change password feature
- [ ] Expense categories management

---

**Current Status**: ✅ Login and Admin Dashboard fully functional!
