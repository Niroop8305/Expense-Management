# Expense Management System

A full-stack MERN application for managing company expenses with multi-level approval workflows.

## Tech Stack

### Frontend

- **Build Tool**: Vite 5.0
- **Framework**: React 18.2 (JSX)
- **Styling**: TailwindCSS 3.4
- **Routing**: React Router DOM 6.20
- **HTTP Client**: Axios 1.5
- **Charts**: Chart.js 4.x + react-chartjs-2 5.x

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js 4.18
- **Database**: MongoDB with Mongoose 7.5
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs 2.4
- **File Upload**: Multer
- **Email**: Nodemailer

## Features (Current Phase)

### Core Features

- ✅ Company registration with automatic admin user creation
- ✅ Country-based currency auto-selection (195+ countries)
- ✅ Secure password hashing with bcrypt
- ✅ RESTful API architecture
- ✅ Multi-role dashboards (Admin/Manager/Employee)
- ✅ Advanced filtering and search
- ✅ Change password feature

### Security & Authentication

- ✅ **Forgot Password with Email Verification** (6-digit code, 10-min expiry)
- ✅ JWT authentication (7-day expiry)
- ✅ Role-based access control (Admin/Manager/Employee)

### Expense Management

- ✅ **Receipt upload** for expenses (images & PDFs, 5MB limit)
- ✅ **CSV export** functionality with role-based filtering
- ✅ Multi-level expense approval workflow
- ✅ Rejection reasons tracking

### Email Notifications 📧

- ✅ **Password reset** emails with verification code
- ✅ **Expense submission** notifications to managers
- ✅ **Expense approval** confirmations to employees
- ✅ **Expense rejection** notifications with reasons
- ✅ **Welcome emails** for new users with credentials
- ✅ Professional HTML email templates (responsive design)

### Data Visualization 📊

- ✅ **Interactive Charts** with Chart.js
- ✅ **Expense by Category** - Pie/Doughnut chart
- ✅ **Expense Trends** - Line chart over time
- ✅ **Status Distribution** - Bar chart (Pending/Approved/Rejected)
- ✅ **Top Categories** - Horizontal bar chart
- ✅ Real-time data updates
- ✅ Responsive chart design

### UI/UX Enhancements

- ✅ **Dark Mode** 🌙 (System preference detection, localStorage persistence)
- ✅ Comprehensive animations (fadeIn, slideIn, scaleIn, shake, pulse)
- ✅ Smooth transitions and hover effects
- ✅ Mobile-responsive design
- ✅ Color-coded status badges
- ✅ Loading states and spinners
- ✅ Toast notifications

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

## Visual Charts & Analytics 📊

The application features comprehensive data visualization using Chart.js to help users understand their expense patterns:

### Available Charts

1. **Expense by Category (Pie/Doughnut Chart)**

   - Visual breakdown of expenses by category
   - Interactive legends
   - Percentage distribution
   - Color-coded categories

2. **Expense Trends Over Time (Line Chart)**

   - Track spending patterns over months
   - Multiple datasets for different categories
   - Smooth curves with tension
   - Responsive tooltips

3. **Status Distribution (Bar Chart)**

   - Compare pending, approved, and rejected expenses
   - Count and amount visualizations
   - Color-coded by status (yellow/green/red)

4. **Top Spending Categories (Horizontal Bar)**
   - Identify highest expense categories
   - Sorted by amount
   - Easy comparison across categories

### Chart Features

- ✅ **Real-time updates** - Charts refresh with data changes
- ✅ **Interactive tooltips** - Hover for detailed information
- ✅ **Responsive design** - Adapts to screen size
- ✅ **Smooth animations** - Professional transitions
- ✅ **Role-based data** - Each role sees relevant data
- ✅ **Custom colors** - Brand-consistent color palette
- ✅ **Export-ready** - Charts can be exported as images

### Viewing Charts

- **Employee Dashboard**: Personal expense analytics
- **Manager Dashboard**: Team expense overview
- **Admin Dashboard**: Company-wide analytics

## Dark Mode 🌙

The application features a complete dark mode implementation for comfortable viewing in low-light conditions:

### Features

- **🎨 Complete UI Coverage**: All pages, components, and charts support dark mode
- **💾 Persistent Preference**: Your theme choice is saved in localStorage
- **🔄 System Sync**: Automatically detects your system's dark mode preference
- **⚡ Instant Toggle**: Switch between light and dark themes with one click
- **📊 Chart Compatibility**: All Chart.js visualizations adapt to dark mode
- **🎯 Consistent Design**: Carefully crafted dark color palette for optimal readability

### Supported Components

- ✅ Authentication pages (Login, Register, Forgot Password)
- ✅ All dashboards (Employee, Manager, Admin)
- ✅ Settings page
- ✅ Forms and input fields
- ✅ Tables and data grids
- ✅ Charts and visualizations
- ✅ Status badges and alerts
- ✅ Navigation headers

### Color Palette

**Dark Mode Colors:**

- Background: `#0f172a` (slate-900)
- Cards: `#1e293b` (slate-800)
- Borders: `#334155` (slate-700)
- Text: `#e2e8f0` (slate-200)
- Muted Text: `#94a3b8` (slate-400)

### How to Use

1. Look for the **sun/moon toggle button** in the top-right corner of any page
2. Click to switch between light and dark themes
3. Your preference is automatically saved for future visits

### Technical Implementation

- **Tailwind CSS**: `darkMode: 'class'` strategy
- **React Context**: ThemeContext provides global state management
- **Chart.js**: Dynamic color configuration based on theme
- **localStorage**: Theme persistence across sessions

## Email Notifications 📧

Automated email notifications keep all stakeholders informed:

### Email Types

1. **Password Reset** - 6-digit verification code (10-min expiry)
2. **Expense Submitted** - Notify manager of new submissions
3. **Expense Approved** - Confirm approval to employee
4. **Expense Rejected** - Notify with rejection reason
5. **New User Welcome** - Credentials and onboarding info

### Email Features

- ✅ Professional HTML templates
- ✅ Mobile-responsive design
- ✅ Color-coded by type
- ✅ Automatic sending
- ✅ Error handling & logging

### Configuration

See `EMAIL_SETUP.md` for Gmail configuration instructions.

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

## Supported Features by Role

### Admin 👑

- View all company expenses
- Manage users (create, edit, delete employees & managers)
- Approve/reject any expense
- Access all analytics and reports
- Export complete company data
- Change user roles

### Manager 👥

- View team expenses
- Approve/reject team member expenses
- Submit personal expenses
- View team analytics
- Export team expense data
- Assign expenses to employees

### Employee 👤

- Submit expenses with receipts
- Track expense status
- View personal analytics
- Export personal expense history
- Update profile & change password
- Upload receipt images/PDFs

## Supported Countries & Currencies

The system supports **195+ countries** with automatic currency detection via REST Countries API.

**Popular currencies:**

- 🇺🇸 US → USD ($)
- 🇮🇳 IN → INR (₹)
- 🇬🇧 GB → GBP (£)
- 🇪🇺 EU → EUR (€)
- 🇯🇵 JP → JPY (¥)
- 🇨🇦 CA → CAD (C$)
- 🇦🇺 AU → AUD (A$)
- And 188+ more!

## Documentation

- **EMAIL_SETUP.md** - Gmail configuration for email notifications
- **EMAIL_NOTIFICATIONS.md** - Complete email system documentation
- **EMAIL_QUICK_REFERENCE.md** - Quick setup guide for emails
- **FORGOT_PASSWORD_IMPLEMENTATION.md** - Password reset feature details
- **HACKATHON_STRATEGY.md** - Feature roadmap and priorities

## Project Highlights

### What Makes This Special

- 🎨 **Professional UI/UX** - Smooth animations, modern design
- 📊 **Data Visualization** - Interactive charts with Chart.js
- 📧 **Email Integration** - Automated notifications with HTML templates
- 🔐 **Security** - JWT auth, password hashing, reset verification
- 📱 **Responsive** - Works perfectly on mobile and desktop
- 🌍 **Global** - Supports 195+ countries and currencies
- 📄 **Receipt Management** - Upload and view receipt images/PDFs
- 📈 **Analytics** - Real-time expense insights and trends
- 🔄 **Workflow** - Complete approval/rejection workflow
- 💾 **Export** - CSV export for reporting

### Architecture Highlights

- RESTful API design
- JWT-based authentication
- Role-based access control (RBAC)
- MongoDB with Mongoose ODM
- Multer for file uploads
- Nodemailer for emails
- React with functional components
- TailwindCSS for styling
- Chart.js for data visualization

## Future Enhancements

- [ ] Multi-level approval chains (threshold-based)
- [ ] Budget tracking and alerts
- [ ] Expense categories customization
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Integration with accounting software
- [ ] Recurring expense templates
- [ ] Expense report generation (PDF)
- [ ] Dark mode
- [ ] Multi-language support

## License

MIT
