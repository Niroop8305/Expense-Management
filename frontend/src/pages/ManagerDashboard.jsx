import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/currency";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!storedUser || !token || storedUser.role !== "manager") {
      navigate("/login");
      return;
    }

    setUser(storedUser);
    fetchData(token);
  }, [navigate]);

  const fetchData = async (token) => {
    try {
      const [expensesRes, pendingRes, statsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/expenses", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/expenses/pending", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/expenses/stats/summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setExpenses(expensesRes.data.expenses);
      setPendingExpenses(pendingRes.data.expenses);
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
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
      const response = await axios.put(
        `http://localhost:5000/api/expenses/${expenseId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data.message);
      fetchData(token);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve expense");
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
      setError("Rejection reason is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/expenses/${selectedExpense._id}/reject`,
        { reason: rejectionReason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data.message);
      setShowRejectModal(false);
      setSelectedExpense(null);
      setRejectionReason("");
      fetchData(token);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject expense");
    } finally {
      setLoading(false);
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Manager Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              {user.company.name} • {user.company.currency}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-600">{user.role}</p>
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
        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
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
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
            <button
              onClick={() => setSuccess("")}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 rounded-lg shadow p-6">
              <p className="text-sm text-yellow-800">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-900">
                {stats.totalPending}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-6">
              <p className="text-sm text-green-800">Approved</p>
              <p className="text-3xl font-bold text-green-900">
                {stats.totalApproved}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-6">
              <p className="text-sm text-red-800">Rejected</p>
              <p className="text-3xl font-bold text-red-900">
                {stats.totalRejected}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-6">
              <p className="text-sm text-blue-800">Total Approved Amount</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(
                  stats.totalApprovedAmount,
                  user.company.currency
                )}
              </p>
            </div>
          </div>
        )}

        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Pending Approvals
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {pendingExpenses.length} expenses waiting for your approval
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No pending approvals
                    </td>
                  </tr>
                ) : (
                  pendingExpenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.submittedBy.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {expense.submittedBy.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          {formatCurrency(expense.amount, expense.currency)}
                          {expense.convertedAmount && expense.currency !== expense.convertedCurrency && (
                            <div className="text-xs text-gray-500 mt-1">
                              ≈ {formatCurrency(expense.convertedAmount, expense.convertedCurrency)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleApprove(expense._id)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-900 font-medium disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(expense)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Team Expenses */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              All Team Expenses
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: {expenses.length} expenses
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reviewed By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.submittedBy.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        {expense.description}
                        {expense.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">
                            Reason: {expense.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          {formatCurrency(expense.amount, expense.currency)}
                          {expense.convertedAmount && expense.currency !== expense.convertedCurrency && (
                            <div className="text-xs text-gray-500 mt-1">
                              ≈ {formatCurrency(expense.convertedAmount, expense.convertedCurrency)}
                            </div>
                          )}
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Reject Expense
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Employee: {selectedExpense?.submittedBy.name}
              <br />
              Amount:{" "}
              {formatCurrency(
                selectedExpense?.amount,
                selectedExpense?.currency
              )}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Explain why this expense is being rejected..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedExpense(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-300"
              >
                {loading ? "Rejecting..." : "Reject Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
