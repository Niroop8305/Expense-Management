# Email Notifications - Quick Reference

## 📧 All Email Triggers

| Event                 | Trigger                       | Recipient | Email Type        |
| --------------------- | ----------------------------- | --------- | ----------------- |
| **Forgot Password**   | User clicks "Forgot Password" | User      | 🔐 Reset Code     |
| **Expense Submitted** | Employee submits expense      | Manager   | 📋 New Submission |
| **Expense Approved**  | Manager/Admin approves        | Employee  | ✅ Approval       |
| **Expense Rejected**  | Manager/Admin rejects         | Employee  | ❌ Rejection      |
| **User Created**      | Admin creates new user        | New User  | 🎉 Welcome        |

---

## 🎨 Email Templates Overview

### 1. Password Reset Email 🔐

- **Color**: Purple
- **Key Element**: 6-digit code (large, centered)
- **Expires**: 10 minutes
- **Security**: Warning if not requested

### 2. Expense Submission Email 📋

- **Color**: Blue
- **Key Element**: Expense details box
- **Recipient**: Employee's manager
- **Action**: Review and approve/reject

### 3. Expense Approval Email ✅

- **Color**: Green
- **Key Element**: Success badge with 🎉
- **Details**: Full expense info + approver name
- **Message**: Reimbursement processing

### 4. Expense Rejection Email ❌

- **Color**: Red
- **Key Element**: Rejection reason (yellow box)
- **Details**: Full expense info + rejector name
- **Guidance**: Next steps for employee

### 5. Welcome Email 🎉

- **Color**: Purple
- **Key Elements**: Credentials box + getting started steps
- **Contains**: Email, temporary password, role
- **Action**: Change password immediately

---

## ⚙️ Quick Setup (5 Minutes)

### Step 1: Gmail Setup

1. Visit: https://myaccount.google.com/apppasswords
2. Enable 2-Step Verification if not already
3. Create App Password for "Mail"
4. Copy the 16-character code

### Step 2: Update .env

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

### Step 3: Restart Backend

```bash
cd backend
npm start
```

### Step 4: Test

Submit an expense and check manager's email!

---

## 🧪 Testing Checklist

- [ ] Submit expense → Manager receives email
- [ ] Approve expense → Employee receives approval email
- [ ] Reject expense → Employee receives rejection email with reason
- [ ] Create user → New user receives welcome email
- [ ] Forgot password → Reset code email received
- [ ] All emails display correctly on mobile
- [ ] Emails not going to spam

---

## 🔍 Troubleshooting Quick Fixes

| Problem        | Solution                               |
| -------------- | -------------------------------------- |
| No emails      | Check .env, restart server             |
| Auth failed    | Use App Password, not regular password |
| Emails in spam | Mark as "Not Spam", add to contacts    |
| Wrong details  | Verify database has correct info       |
| 10-min expired | Request new code                       |

---

## 📊 Email Content Summary

### Expense Submission Email Contains:

- Employee name
- Amount + currency
- Category
- Date
- Description

### Approval Email Contains:

- Success message
- Expense details
- Approver's name
- Processing notice

### Rejection Email Contains:

- Rejection notice
- Expense details
- Rejector's name
- **Rejection reason** (important!)
- Next steps guidance

### Welcome Email Contains:

- Welcome message
- Login credentials
- Role assignment
- Getting started guide
- Security notice

---

## 🚀 Production Considerations

### Gmail Limits:

- **500 emails/day** (free account)
- **100 emails/hour** (recommended)

### For Scale:

- Use **SendGrid** (100/day free)
- Use **Mailgun** (5000/month free)
- Use **AWS SES** ($0.10/1000)

### Best Practices:

- Monitor email logs
- Set up delivery tracking
- Consider email preferences
- Plan for digest emails

---

## 📝 Key Files

| File                             | Purpose                         |
| -------------------------------- | ------------------------------- |
| `backend/src/utils/email.js`     | All email templates & functions |
| `backend/src/routes/expenses.js` | Expense notification triggers   |
| `backend/src/routes/users.js`    | Welcome email trigger           |
| `backend/src/routes/auth.js`     | Password reset email            |
| `backend/.env`                   | Email credentials               |

---

## ✅ Features Summary

**Implemented:**

- ✅ 5 email types
- ✅ Professional HTML templates
- ✅ Auto-send on all key events
- ✅ Error handling
- ✅ Console logging
- ✅ Non-blocking (won't fail operations)
- ✅ Responsive design
- ✅ Brand colors per email type

**Ready to Use:**

- Just add Gmail credentials
- Restart server
- Test with real emails
- Deploy to production!

---

## 💡 Quick Tips

1. **Test with yourself first** - Use your own email for all roles
2. **Check spam folder** - First emails might go there
3. **Use App Password** - Regular password won't work
4. **Monitor logs** - Console shows all email attempts
5. **Don't commit .env** - Keep credentials secure

---

## 🎯 User Journey Examples

### New Employee:

1. Admin creates account → 📧 **Welcome email**
2. Employee logs in with temp password
3. Employee changes password in Settings
4. Employee submits expense → 📧 **Manager notified**
5. Manager approves → 📧 **Employee gets approval**

### Forgot Password:

1. User clicks "Forgot Password" → 📧 **Reset code**
2. User enters 6-digit code
3. User sets new password
4. User logs in successfully

### Expense Rejected:

1. Employee submits expense → 📧 **Manager notified**
2. Manager rejects with reason → 📧 **Employee notified**
3. Employee reads reason
4. Employee resubmits corrected expense
5. Manager approves → 📧 **Employee gets approval**

---

## 📞 Need Help?

- **Setup**: Read `EMAIL_SETUP.md`
- **Details**: Read `EMAIL_NOTIFICATIONS.md`
- **Implementation**: Read `FORGOT_PASSWORD_IMPLEMENTATION.md`

**Everything is documented and ready to go!** 🚀
