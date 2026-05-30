const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Company = require('./src/models/Company');
const Role = require('./src/models/Role');
const User = require('./src/models/User');
const Workflow = require('./src/models/Workflow');
const Expense = require('./src/models/Expense');
const AuditLog = require('./src/models/AuditLog');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to DB...');

  // Clear existing data
  await Company.deleteMany({});
  await Role.deleteMany({});
  await User.deleteMany({});
  await Workflow.deleteMany({});
  await Expense.deleteMany({});
  await AuditLog.deleteMany({});
  console.log('Cleared existing data.');

  // 1. Create Company
  const company = await Company.create({
    name: 'Acme Corporation',
    country: 'United States',
    currency: 'USD',
  });

  // 2. Create Roles
  const adminRole = await Role.create({ company: company._id, name: 'admin', displayName: 'Admin', isSystem: true, isApprover: false });
  const employeeRole = await Role.create({ company: company._id, name: 'employee', displayName: 'Employee', isSystem: true, isApprover: false });
  const managerRole = await Role.create({ company: company._id, name: 'manager', displayName: 'Manager', isSystem: false, isApprover: true });
  const cfoRole = await Role.create({ company: company._id, name: 'cfo', displayName: 'Chief Financial Officer', isSystem: false, isApprover: true });

  // 3. Create Users
  const passwordHash = await bcrypt.hash('123456', 10);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@gmail.com',
    password: passwordHash,
    role: 'admin',
    roleName: 'admin',
    company: company._id,
  });

  const cfo = await User.create({
    name: 'CFO User',
    email: 'cfo@gmail.com',
    password: passwordHash,
    role: 'cfo',
    roleName: 'cfo',
    company: company._id,
  });

  const manager = await User.create({
    name: 'Manager User',
    email: 'manager@gmail.com',
    password: passwordHash,
    role: 'manager',
    roleName: 'manager',
    company: company._id,
    manager: cfo._id, // manager reports to CFO
  });

  const employee = await User.create({
    name: 'Employee User',
    email: 'employee8@gmail.com',
    password: passwordHash,
    role: 'employee',
    roleName: 'employee',
    company: company._id,
    manager: manager._id,
  });

  // 4. Create Workflow
  const workflow = await Workflow.create({
    company: company._id,
    name: 'Standard Approval Workflow',
    steps: [
      {
        stepIndex: 0, // This should be 0 because it's the first workflow step!
        approverType: 'role',
        approverRole: 'cfo',
        approvalMode: 'any'
      }
    ]
  });

  // 5. Create Expenses

  // exp1: Pending for Manager (no approvals yet)
  const exp1 = await Expense.create({
    amount: 150.0,
    currency: 'USD',
    convertedAmount: 150.0,
    convertedCurrency: 'USD',
    category: 'Travel',
    description: 'Flight to NYC (Pending Manager)',
    date: new Date(),
    status: 'pending',
    submittedBy: employee._id,
    company: company._id,
    workflow: workflow._id,
    currentStep: 0,
    isManagerApprover: true,
    approvals: []
  });

  // exp2: Pending for CFO (Manager already approved)
  const exp2 = await Expense.create({
    amount: 500.0,
    currency: 'USD',
    convertedAmount: 500.0,
    convertedCurrency: 'USD',
    category: 'Equipment',
    description: 'New Monitor (Pending CFO)',
    date: new Date(),
    status: 'pending',
    submittedBy: employee._id,
    company: company._id,
    workflow: workflow._id,
    currentStep: 0, // still on step 0, which is CFO, because manager is a pre-step!
    isManagerApprover: true,
    approvals: [
      {
        approver: manager._id,
        role: 'manager',
        decision: 'approved',
        comment: 'Approved by manager, waiting for CFO',
        actedAt: new Date()
      }
    ]
  });

  // exp3: Fully Approved (Manager + CFO approved)
  const exp3 = await Expense.create({
    amount: 120.0,
    currency: 'USD',
    convertedAmount: 120.0,
    convertedCurrency: 'USD',
    category: 'Food',
    description: 'Team Lunch (Fully Approved)',
    date: new Date(),
    status: 'approved',
    submittedBy: employee._id,
    company: company._id,
    workflow: workflow._id,
    currentStep: 1, // advanced past step 0
    isManagerApprover: true,
    approvals: [
      {
        approver: manager._id,
        role: 'manager',
        decision: 'approved',
        comment: 'Approved by manager',
        actedAt: new Date()
      },
      {
        approver: cfo._id,
        role: 'cfo',
        decision: 'approved',
        comment: 'Approved by CFO',
        actedAt: new Date()
      }
    ],
    reviewedBy: cfo._id,
    reviewedAt: new Date()
  });

  // exp4: Rejected by Manager
  const exp4 = await Expense.create({
    amount: 2500.0,
    currency: 'USD',
    convertedAmount: 2500.0,
    convertedCurrency: 'USD',
    category: 'Software',
    description: 'Enterprise License (Rejected)',
    date: new Date(),
    status: 'rejected',
    submittedBy: employee._id,
    company: company._id,
    workflow: workflow._id,
    currentStep: 0,
    isManagerApprover: true,
    rejectionReason: 'Too expensive',
    approvals: [
      {
        approver: manager._id,
        role: 'manager',
        decision: 'rejected',
        comment: 'Too expensive',
        actedAt: new Date()
      }
    ]
  });

  // 6. Create Audit Logs
  await AuditLog.create({ expense: exp1._id, action: 'submitted', user: employee._id, comment: 'Expense submitted' });
  
  await AuditLog.create({ expense: exp2._id, action: 'submitted', user: employee._id, comment: 'Expense submitted' });
  await AuditLog.create({ expense: exp2._id, action: 'approved', user: manager._id, comment: 'Approved by manager, waiting for CFO' });
  
  await AuditLog.create({ expense: exp3._id, action: 'submitted', user: employee._id, comment: 'Expense submitted' });
  await AuditLog.create({ expense: exp3._id, action: 'approved', user: manager._id, comment: 'Approved by manager' });
  await AuditLog.create({ expense: exp3._id, action: 'approved', user: cfo._id, comment: 'Approved by CFO' });
  
  await AuditLog.create({ expense: exp4._id, action: 'submitted', user: employee._id, comment: 'Expense submitted' });
  await AuditLog.create({ expense: exp4._id, action: 'rejected', user: manager._id, comment: 'Too expensive' });

  console.log('Seeding complete with better workflows!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
