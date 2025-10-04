import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/currency";
import ThemeToggle from "../components/ThemeToggle";
import ExpenseByCategoryChart from "../components/ExpenseByCategoryChart";
import ExpenseTrendsChart from "../components/ExpenseTrendsChart";
import ExpenseStatusChart from "../components/ExpenseStatusChart";

/*
  ApproverDashboard
  Unified dashboard for any approver role except admin & employee.
  Covers: manager, finance, director, and any custom dynamic approver role.
  Behaviour differences:
    - Manager: sees team + self expenses (same as before)
    - Other roles: only their submitted expenses (backend restriction) + pending approvals list
*/

const ApproverDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [myExpenses, setMyExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [roleDisplay, setRoleDisplay] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    if (!storedUser || !token) {
      navigate("/login");
      return;
    }
    // Redirect disallowed roles
    if (storedUser.role === "employee") {
      navigate("/employee/dashboard");
      return;
    }
    if (storedUser.role === "admin") {
      navigate("/admin/dashboard");
      return;
    }
    setUser(storedUser);
    bootstrap(token, storedUser.role, storedUser.company.id);
  }, [navigate]);

  const bootstrap = async (token, role, companyId) => {
    fetchRoleMeta(token, role);
    fetchData(token);
  };

  const fetchRoleMeta = async (token, roleName) => {
    try {
      if (["manager", "finance", "director"].includes(roleName)) {
        setRoleDisplay(cap(roleName));
        return;
      }
      const res = await axios.get("http://localhost:5000/api/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const match = (res.data.roles || []).find((r) => r.name === roleName);
      setRoleDisplay(match ? match.displayName || match.name : cap(roleName));
    } catch (e) {
      setRoleDisplay(cap(roleName));
    }
  };

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const fetchData = async (token) => {
    try {
      const [pendingRes, statsRes, myRes] = await Promise.all([
        axios.get("http://localhost:5000/api/expenses/pending", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/expenses/stats/summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/expenses", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setPendingExpenses(pendingRes.data.expenses);
      setStats(statsRes.data.stats);
      setMyExpenses(myRes.data.expenses);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleApprove = async (expenseId) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:5000/api/expenses/${expenseId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(res.data.message);
      fetchData(token);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve");
    } finally {
      setLoading(false);
    }
  };

  const openRejectModal = (expense) => {
    setSelectedExpense(expense);
    setShowRejectModal(true);
    setRejectionReason("");
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Rejection reason required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:5000/api/expenses/${selectedExpense._id}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(res.data.message);
      setShowRejectModal(false);
      setSelectedExpense(null);
      setRejectionReason("");
      fetchData(token);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject");
    } finally {
      setLoading(false);
    }
  };

  const openTimeline = async (expense) => {
    setTimelineOpen(true);
    setTimelineLoading(true);
    setTimelineData(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/expenses/${expense._id}/timeline`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTimelineData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setTimelineLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  const isManager = user.role === "manager";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {roleDisplay || cap(user.role)} Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user.company.name} • {user.company.currency}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {roleDisplay || user.role}
              </p>
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
            <button
              onClick={() => setError("")}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-4">
            {success}
            <button
              onClick={() => setSuccess("")}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow dark:shadow-gray-900/50 p-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Pending
              </p>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-200">
                {stats.totalPending}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow dark:shadow-gray-900/50 p-6">
              <p className="text-sm text-green-800 dark:text-green-300">
                Approved
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-200">
                {stats.totalApproved}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow dark:shadow-gray-900/50 p-6">
              <p className="text-sm text-red-800 dark:text-red-300">Rejected</p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-200">
                {stats.totalRejected}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow dark:shadow-gray-900/50 p-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Approved Amount
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {formatCurrency(
                  stats.totalApprovedAmount,
                  user.company.currency
                )}
              </p>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {myExpenses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                  />
                </svg>
                Expenses by Category
              </h3>
              <ExpenseByCategoryChart expenses={myExpenses} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Expense Status
              </h3>
              <ExpenseStatusChart expenses={myExpenses} />
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
                Monthly Expense Trends
              </h3>
              <ExpenseTrendsChart expenses={myExpenses} />
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Pending Approvals
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pendingExpenses.length} expenses waiting for your action
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Step Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pendingExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No pending approvals
                    </td>
                  </tr>
                ) : (
                  pendingExpenses.map((expense) => (
                    <tr
                      key={expense._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {expense.submittedBy.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {expense.submittedBy.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300 max-w-xs">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(expense.amount, expense.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                        {expense._requiredRole || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleApprove(expense._id)}
                          disabled={loading}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 font-medium disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(expense)}
                          disabled={loading}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => openTimeline(expense)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium"
                        >
                          Timeline
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isManager ? "All Team Expenses" : "My Submitted Expenses"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total: {myExpenses.length} expenses
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Reviewed By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {myExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  myExpenses.map((expense) => (
                    <tr
                      key={expense._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {expense.submittedBy.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300 max-w-xs">
                        {expense.description}
                        {expense.rejectionReason && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Reason: {expense.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(expense.amount, expense.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            expense.status
                          )}`}
                        >
                          {expense.status.charAt(0).toUpperCase() +
                            expense.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {expense.reviewedBy?.name || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showRejectModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Reject Expense
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Employee: {selectedExpense.submittedBy.name}
              <br />
              Amount:{" "}
              {formatCurrency(selectedExpense.amount, selectedExpense.currency)}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Explain the reason..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedExpense(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-300 dark:disabled:bg-red-800"
              >
                {loading ? "Rejecting..." : "Reject Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {timelineOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full p-6 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Approval Timeline
              </h3>
              <button
                onClick={() => {
                  setTimelineOpen(false);
                  setTimelineData(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            {timelineLoading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading...
              </p>
            )}
            {!timelineLoading && timelineData && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Expense
                  </p>
                  <div className="text-sm bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded p-3">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {timelineData.expense.description}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Status: {timelineData.expense.status}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sequential Steps
                  </p>
                  <ol className="space-y-2">
                    {timelineData.steps.map((step) => (
                      <li
                        key={step.stepIndex + step.role}
                        className="border dark:border-gray-600 rounded p-3 flex justify-between items-start bg-white dark:bg-gray-700 shadow-sm"
                      >
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {step.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Role: {step.role}
                          </div>
                          {step.comment && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Comment: {step.comment}
                            </div>
                          )}
                          {step.role === "users" &&
                            step.approvals &&
                            step.approvals.length > 0 && (
                              <ul className="mt-1 text-[11px] text-gray-600 dark:text-gray-400 list-disc ml-4">
                                {step.approvals.map((a) => (
                                  <li key={a.approver}>
                                    {a.approver} — {a.decision}
                                  </li>
                                ))}
                              </ul>
                            )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded font-medium ${
                            step.status === "approved"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : step.status === "rejected"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                              : step.status === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {step.status}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Audit Log
                  </p>
                  {timelineData.auditLogs.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No audit events yet.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {timelineData.auditLogs.map((log) => (
                        <li
                          key={log._id}
                          className="border dark:border-gray-600 rounded p-2 bg-gray-50 dark:bg-gray-700 flex justify-between"
                        >
                          <div className="text-gray-900 dark:text-gray-300">
                            <span className="font-medium">{log.action}</span> by{" "}
                            {log.user?.name || "User"}
                            {log.comment && (
                              <span className="text-gray-600 dark:text-gray-400">
                                {" "}
                                — {log.comment}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproverDashboard;
