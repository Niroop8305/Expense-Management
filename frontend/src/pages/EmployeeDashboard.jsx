import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { formatCurrency, commonCurrencies, convertCurrency } from "../utils/currency";
import ExpenseByCategoryChart from "../components/ExpenseByCategoryChart";
import ExpenseTrendsChart from "../components/ExpenseTrendsChart";
import ExpenseStatusChart from "../components/ExpenseStatusChart";
import ThemeToggle from "../components/ThemeToggle";

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });

  const [newExpense, setNewExpense] = useState({
    amount: "",
    currency: "USD",
    category: "Travel",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [conversionPreview, setConversionPreview] = useState(null);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [ocrError, setOcrError] = useState("");

  const categories = [
    "Travel",
    "Food",
    "Accommodation",
    "Transportation",
    "Office Supplies",
    "Equipment",
    "Software",
    "Client Entertainment",
    "Training",
    "Other",
  ];

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/login");
      return;
    }

    setUser(storedUser);
    setNewExpense({ ...newExpense, currency: storedUser.company.currency });
    fetchExpenses(token);
  }, [navigate]);

  const fetchExpenses = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(response.data.expenses);
    } catch (err) {
      console.error("Error fetching expenses:", err);
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setOcrData(null);
      setOcrError("");
      
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }

      // Process file with OCR
      await processReceiptWithOCR(file);
    }
  };

  const processReceiptWithOCR = async (file) => {
    setOcrLoading(true);
    setOcrError("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("receipt", file);

      const response = await axios.post(
        "http://localhost:5000/api/expenses/process-receipt",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const { data } = response.data;
        setOcrData(data);
        
        // Auto-fill form fields if OCR data is available and confident
        if (data.confidence > 0.3) {
          setNewExpense(prev => ({
            ...prev,
            ...(data.amount && { amount: data.amount.toString() }),
            ...(data.date && { date: data.date }),
            ...(data.category && { category: data.category }),
            ...(data.description && { description: data.description })
          }));

          setSuccess("Receipt processed successfully! Form fields have been auto-filled.");
        } else {
          setOcrError("Receipt processed but confidence is low. Please verify the extracted data.");
        }
      } else {
        setOcrError(response.data.message || "Failed to process receipt");
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      setOcrError(
        error.response?.data?.message || 
        "Failed to process receipt. Please fill the form manually."
      );
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCurrencyConversion = async (amount, currency) => {
    if (!amount || !currency || !user?.company?.currency) return;
    
    // If same currency as company, no conversion needed
    if (currency === user.company.currency) {
      setConversionPreview(null);
      return;
    }

    setConversionLoading(true);
    try {
      const conversion = await convertCurrency(
        parseFloat(amount),
        currency,
        user.company.currency
      );
      setConversionPreview(conversion);
    } catch (error) {
      console.error('Conversion error:', error);
      setConversionPreview({
        error: true,
        message: error.message || 'Unable to get exchange rate. You can still submit the expense.'
      });
    } finally {
      setConversionLoading(false);
    }
  };

  const handleAmountChange = (value) => {
    setNewExpense({ ...newExpense, amount: value });
    if (value && newExpense.currency) {
      handleCurrencyConversion(value, newExpense.currency);
    }
  };

  const handleCurrencyChange = (currency) => {
    setNewExpense({ ...newExpense, currency });
    if (newExpense.amount && currency) {
      handleCurrencyConversion(newExpense.amount, currency);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/expenses/export/csv",
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `expenses-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSuccess("Expenses exported successfully!");
    } catch (err) {
      setError("Failed to export expenses");
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("amount", newExpense.amount);
      formData.append("currency", newExpense.currency);
      formData.append("category", newExpense.category);
      formData.append("description", newExpense.description);
      formData.append("date", newExpense.date);

      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }

      const response = await axios.post(
        "http://localhost:5000/api/expenses/submit",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(response.data.message);
      setShowSubmitForm(false);
      setNewExpense({
        amount: "",
        currency: user.company.currency,
        category: "Travel",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setReceiptFile(null);
      setReceiptPreview(null);
      setConversionPreview(null);
      setOcrData(null);
      setOcrError("");
      fetchExpenses(token);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit expense");
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    // Status filter
    if (filter !== "all" && exp.status !== filter) return false;

    // Category filter
    if (categoryFilter !== "all" && exp.category !== categoryFilter)
      return false;

    // Date range filter
    if (
      dateFilter.startDate &&
      new Date(exp.date) < new Date(dateFilter.startDate)
    )
      return false;
    if (dateFilter.endDate && new Date(exp.date) > new Date(dateFilter.endDate))
      return false;

    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-xl dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Expenses
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user.company.name} • {user.company.currency}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {user.role}
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition"
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Expenses
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {expenses.length}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow dark:shadow-gray-900/50 p-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              Pending
            </p>
            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-300">
              {expenses.filter((e) => e.status === "pending").length}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow dark:shadow-gray-900/50 p-6">
            <p className="text-sm text-green-800 dark:text-green-400">
              Approved
            </p>
            <p className="text-3xl font-bold text-green-900 dark:text-green-300">
              {expenses.filter((e) => e.status === "approved").length}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow dark:shadow-gray-900/50 p-6">
            <p className="text-sm text-red-800 dark:text-red-400">Rejected</p>
            <p className="text-3xl font-bold text-red-900 dark:text-red-300">
              {expenses.filter((e) => e.status === "rejected").length}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        {expenses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Expense by Category Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 animate-fadeIn">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400"
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
              <ExpenseByCategoryChart
                expenses={filteredExpenses}
                currency={user.company.currency}
              />
            </div>

            {/* Expense Status Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 animate-fadeIn animate-stagger-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-green-600"
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
                Status Distribution
              </h3>
              <ExpenseStatusChart
                expenses={filteredExpenses}
                currency={user.company.currency}
              />
            </div>

            {/* Expense Trends Chart - Full Width */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 animate-fadeIn animate-stagger-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-purple-600 dark:text-purple-400"
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
                Expense Trends Over Time
              </h3>
              <ExpenseTrendsChart
                expenses={filteredExpenses}
                currency={user.company.currency}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-semibold"
          >
            {showSubmitForm ? "Cancel" : "+ Submit New Expense"}
          </button>
        </div>

        {/* Submit Form */}
        {showSubmitForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Submit New Expense
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                (Upload receipt for auto-fill)
              </span>
            </h2>
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      (Will be converted to {user.company.currency} automatically)
                    </span>
                  </label>
                  <select
                    value={newExpense.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {commonCurrencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Currency Conversion Preview */}
                {(conversionPreview || conversionLoading) && newExpense.currency !== user.company.currency && (
                  <div className="md:col-span-2 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      {conversionLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                          <span className="text-sm text-blue-800 dark:text-blue-200">Getting exchange rate...</span>
                        </div>
                      ) : conversionPreview?.error ? (
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-yellow-800 dark:text-yellow-200">{conversionPreview.message}</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Original:</strong> {formatCurrency(conversionPreview.originalAmount, conversionPreview.originalCurrency)}
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Company Currency ({user.company.currency}):</strong> {formatCurrency(conversionPreview.convertedAmount, conversionPreview.convertedCurrency)}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                            Exchange Rate: 1 {conversionPreview.originalCurrency} = {conversionPreview.exchangeRate.toFixed(4)} {conversionPreview.convertedCurrency}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newExpense.category}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, date: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newExpense.description}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        description: e.target.value,
                      })
                    }
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Describe the expense..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Receipt (Optional)
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      (Max 5MB - Images or PDF)
                    </span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                  />
                  {receiptPreview && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Preview:
                      </p>
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="max-w-xs h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  )}
                  {receiptFile && !receiptPreview && (
                    <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <svg
                        className="w-5 h-5 mr-2 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {receiptFile.name}
                    </div>
                  )}

                  {/* OCR Processing Status */}
                  {ocrLoading && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing receipt with OCR... This may take a few seconds.
                      </div>
                    </div>
                  )}

                  {/* OCR Success */}
                  {ocrData && ocrData.confidence > 0.3 && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm">
                          <p className="text-green-700 dark:text-green-300 font-medium">Receipt processed successfully!</p>
                          <p className="text-green-600 dark:text-green-400 mt-1">
                            Form fields have been auto-filled. Confidence: {Math.round(ocrData.confidence * 100)}%
                          </p>
                          {ocrData.amount && <p className="text-xs text-green-600 dark:text-green-400 mt-1">Amount: {ocrData.amount}</p>}
                          {ocrData.date && <p className="text-xs text-green-600 dark:text-green-400">Date: {ocrData.date}</p>}
                          {ocrData.category && <p className="text-xs text-green-600 dark:text-green-400">Category: {ocrData.category}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OCR Low Confidence */}
                  {ocrData && ocrData.confidence <= 0.3 && ocrData.confidence > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm">
                          <p className="text-yellow-700 dark:text-yellow-300 font-medium">Receipt processed with low confidence</p>
                          <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                            Please verify the extracted data. Confidence: {Math.round(ocrData.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OCR Error */}
                  {ocrError && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm">
                          <p className="text-red-700 dark:text-red-300 font-medium">OCR Processing Failed</p>
                          <p className="text-red-600 dark:text-red-400 mt-1">{ocrError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitForm(false);
                    setOcrData(null);
                    setOcrError("");
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
                >
                  {loading ? "Submitting..." : "Submit Expense"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {(filter !== "all" ||
            categoryFilter !== "all" ||
            dateFilter.startDate ||
            dateFilter.endDate) && (
            <div className="mt-3">
              <button
                onClick={() => {
                  setFilter("all");
                  setCategoryFilter("all");
                  setDateFilter({ startDate: "", endDate: "" });
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Expenses List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              My Expenses
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredExpenses.length} of {expenses.length} expenses
            </p>
          </div>

          {/* Expenses Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
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
                    Receipt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Reviewed By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr
                      key={expense._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        {expense.description}
                        {expense.rejectionReason && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Reason: {expense.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <div>
                          {formatCurrency(expense.amount, expense.currency)}
                          {expense.convertedAmount && expense.currency !== expense.convertedCurrency && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {expense.receiptUrl ? (
                          <a
                            href={`http://localhost:5000${expense.receiptUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-1"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"
                              />
                            </svg>
                            <span>View</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">
                            -
                          </span>
                        )}
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
    </div>
  );
};

export default EmployeeDashboard;
