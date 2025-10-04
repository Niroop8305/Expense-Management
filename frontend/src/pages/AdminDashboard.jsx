import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/currency";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({ name: '', displayName: '', isApprover: true });
  const [roleMessage, setRoleMessage] = useState('');

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    managerId: "",
  });

  useEffect(() => {
    // Check if user is logged in and is admin
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!storedUser || !token || storedUser.role !== "admin") {
      navigate("/login");
      return;
    }

    setUser(storedUser);
    fetchData(token);
  }, [navigate]);

  const fetchData = async (token) => {
    await Promise.all([
      fetchUsers(token),
      fetchExpenses(token),
      fetchStats(token),
      fetchRoles(token)
    ]);
  };

  const fetchExpenses = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(response.data.expenses);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  const fetchUsers = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users);
      const managerList = response.data.users.filter(
        (u) => u.role === "manager" || u.role === "admin"
      );
      setManagers(managerList);
    } catch (err) {
      console.error("Error fetching users:", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchStats = async (token) => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/expenses/stats/summary",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data.stats);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchRoles = async (token) => {
    try {
      const res = await axios.get('http://localhost:5000/api/roles', { headers: { Authorization: `Bearer ${token}` } });
      setRoles(res.data.roles || []);
    } catch (e) { console.error('Error fetching roles', e); }
  };

  const createRole = async (e) => {
    e.preventDefault();
    setRoleMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/roles', newRole, { headers: { Authorization: `Bearer ${token}` } });
      setRoleMessage('Role created');
      setNewRole({ name: '', displayName: '', isApprover: true });
      fetchRoles(token);
    } catch (e) {
      setRoleMessage(e.response?.data?.message || 'Failed to create role');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const systemRoles = ["employee","manager","finance","director","admin"]; // for grouping
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/users/create-user",
        {
          ...newUser,
          managerId: newUser.managerId || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data.message);
      setShowCreateForm(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "employee",
        managerId: "",
      });
      fetchUsers(token);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userToEdit) => {
    setEditingUser({
      ...userToEdit,
      managerId: userToEdit.manager?._id || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/users/${editingUser._id}`,
        {
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          managerId: editingUser.managerId || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data.message);
      setShowEditModal(false);
      setEditingUser(null);
      fetchData(token);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("User deleted successfully");
      fetchData(token);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
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
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              {user.company.name} • {user.company.currency}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Settings
            </button>
            <button
              onClick={() => navigate("/admin/workflows")}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Workflows
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
        {/* Success/Error Messages */}
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
              <p className="text-sm text-yellow-800">Pending Expenses</p>
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
              <p className="text-sm text-blue-800">Approved Amount</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(
                  stats.totalApprovedAmount,
                  user.company.currency
                )}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-t-lg shadow mb-0">
          <nav className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              User Management ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === "expenses"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              All Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >Roles ({roles.length})</button>
          </nav>
        </div>

        {/* User Management Tab */}
        {activeTab === "users" && (
          <>
            {/* Create User Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                {showCreateForm ? "Cancel" : "+ Add Employee/Manager"}
              </button>
            </div>

            {/* Create User Form */}
            {showCreateForm && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Create New User
                </h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={newUser.name}
                        onChange={(e) =>
                          setNewUser({ ...newUser, name: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <select
                        value={newUser.role}
                        onChange={(e) =>
                          setNewUser({ ...newUser, role: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <optgroup label="System Roles">
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="finance">Finance</option>
                          <option value="director">Director</option>
                        </optgroup>
                        {roles.filter(r => !systemRoles.includes(r.name)).length > 0 && (
                          <optgroup label="Custom Roles">
                            {roles.filter(r => !systemRoles.includes(r.name)).map(r => (
                              <option key={r._id} value={r.name}>{r.displayName || r.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {newUser.role === "employee" && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign Manager (Optional)
                        </label>
                        <select
                          value={newUser.managerId}
                          onChange={(e) =>
                            setNewUser({
                              ...newUser,
                              managerId: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">No Manager</option>
                          {managers.map((manager) => (
                            <option key={manager._id} value={manager._id}>
                              {manager.name} ({manager.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
                    >
                      {loading ? "Creating..." : "Create User"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">All Users</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Total: {users.length} users
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manager
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {u.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const roleMeta = roles.find(r => r.name === u.role);
                            const label = roleMeta?.displayName || (u.role.charAt(0).toUpperCase() + u.role.slice(1));
                            const baseClass = u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              u.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              u.role === 'finance' ? 'bg-amber-100 text-amber-800' :
                              u.role === 'director' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-green-100 text-green-800';
                            return (
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${baseClass}`}>{label}</span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {u.manager?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {u.role !== "admin" && (
                            <>
                              <button
                                onClick={() => handleEditUser(u)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                className="text-red-600 hover:text-red-900 font-medium"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Edit User
                  </h3>
                  <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editingUser.name}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            name: e.target.value,
                          })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            email: e.target.value,
                          })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <optgroup label="System Roles">
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="finance">Finance</option>
                          <option value="director">Director</option>
                        </optgroup>
                        {roles.filter(r => !systemRoles.includes(r.name)).length > 0 && (
                          <optgroup label="Custom Roles">
                            {roles.filter(r => !systemRoles.includes(r.name)).map(r => (
                              <option key={r._id} value={r.name}>{r.displayName || r.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    {editingUser.role === "employee" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assign Manager (Optional)</label>
                        <select
                          value={editingUser.managerId}
                          onChange={(e) => setEditingUser({ ...editingUser, managerId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">No Manager</option>
                          {managers.map((manager) => (
                            <option key={manager._id} value={manager._id}>{manager.name} ({manager.role})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingUser(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
                      >
                        {loading ? "Updating..." : "Update User"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                All Company Expenses
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
                          <div className="text-xs text-gray-500">
                            {expense.submittedBy.role}
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
                          {formatCurrency(expense.amount, expense.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              expense.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : expense.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
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
        )}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 order-2 md:order-1 md:col-span-2">
              <h2 className="text-xl font-bold mb-4">Roles</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Display</th>
                    <th className="px-3 py-2">Approver?</th>
                    <th className="px-3 py-2">System</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(r => (
                    <tr key={r._id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">{r.name}</td>
                      <td className="px-3 py-2">{r.displayName || '-'}</td>
                      <td className="px-3 py-2">{r.isApprover ? 'Yes':'No'}</td>
                      <td className="px-3 py-2">{r.isSystem ? 'Yes':'No'}</td>
                    </tr>
                  ))}
                  {roles.length === 0 && (
                    <tr><td className="px-3 py-4 text-center text-gray-500" colSpan={4}>No roles yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded-lg shadow p-6 order-1 md:order-2">
              <h2 className="text-lg font-semibold mb-3">Create Role</h2>
              {roleMessage && <div className="mb-3 text-xs text-blue-600">{roleMessage}</div>}
              <form onSubmit={createRole} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name (identifier)</label>
                  <input value={newRole.name} onChange={(e)=>setNewRole({...newRole, name: e.target.value.toLowerCase()})} required className="w-full border px-2 py-1 rounded" placeholder="e.g. cfo" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
                  <input value={newRole.displayName} onChange={(e)=>setNewRole({...newRole, displayName: e.target.value})} className="w-full border px-2 py-1 rounded" placeholder="e.g. CFO" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Approver?</label>
                  <select value={newRole.isApprover ? 'yes':'no'} onChange={(e)=>setNewRole({...newRole, isApprover: e.target.value==='yes'})} className="w-full border px-2 py-1 rounded">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Create</button>
              </form>
              <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">System roles (admin/employee) cannot be recreated. Newly created approver roles appear in the Workflow Builder under role steps.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
