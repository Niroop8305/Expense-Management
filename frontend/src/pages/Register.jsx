import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    country: "",
    currency: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [msg, setMsg] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch countries and currencies from REST Countries API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(
          "https://restcountries.com/v3.1/all?fields=name,currencies"
        );

        // Process the data to extract country name and currencies
        const processedCountries = response.data
          .map((country) => {
            // Safely extract country name
            const countryName = country?.name?.common;
            const currencies = country?.currencies;

            // Validate country name and currencies exist
            if (!countryName || !currencies) {
              return null;
            }

            // Get the first currency code
            const currencyCode = Object.keys(currencies)[0];
            if (!currencyCode) {
              return null;
            }

            // Safely extract currency details
            const currencyData = currencies[currencyCode];
            if (!currencyData) {
              return null;
            }

            const currencyName = currencyData.name || currencyCode;
            const currencySymbol = currencyData.symbol || currencyCode;

            return {
              name: countryName,
              currencyCode,
              currencyName,
              currencySymbol,
            };
          })
          .filter((country) => country !== null)
          .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

        setCountries(processedCountries);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching countries:", error);
        setMsg({
          type: "error",
          text: "Failed to load countries. Please refresh the page.",
        });
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const onChange = (e) => {
    if (e.target.name === "country") {
      // When country changes, automatically set the currency
      const selectedCountry = countries.find((c) => c.name === e.target.value);
      if (selectedCountry) {
        setForm({
          ...form,
          country: e.target.value,
          currency: selectedCountry.currencyCode,
        });
      }
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register-company",
        form
      );
      setMsg({ type: "success", text: res.data.message });
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Server error",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl animate-scaleIn hover-lift transition-smooth">
        <div className="mb-6 animate-fadeIn">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-full flex-shrink-0">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                Register Company
              </h1>
              <p className="text-gray-600">Create your company account</p>
            </div>
          </div>
        </div>

        {msg && (
          <div
            className={`p-4 mb-4 rounded-lg flex items-center animate-slideInDown alert-enter ${
              msg.type === "success"
                ? "bg-green-100 text-green-800 border border-green-400"
                : "bg-red-100 text-red-800 border border-red-400 animate-shake"
            }`}
          >
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {msg.type === "success" ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            <span>{msg.text}</span>
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center space-x-2 p-4 bg-blue-50 rounded-lg mb-4 animate-pulse">
            <div className="spinner w-6 h-6 border-2"></div>
            <span className="text-blue-600 font-medium">
              Loading countries...
            </span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="animate-slideInLeft animate-stagger-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              name="companyName"
              value={form.companyName}
              onChange={onChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-3 transition-smooth hover:border-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              placeholder="Enter company name"
            />
          </div>
          <div className="animate-slideInLeft animate-stagger-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              name="country"
              value={form.country}
              onChange={onChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-3 transition-smooth hover:border-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
              disabled={loading}
            >
              <option value="">
                {loading ? "Loading countries..." : "Select a country"}
              </option>
              {countries.map((country) => (
                <option key={country.name} value={country.name}>
                  {country.name} ({country.currencyCode} -{" "}
                  {country.currencySymbol})
                </option>
              ))}
            </select>
          </div>
          <div className="animate-slideInLeft animate-stagger-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
              <span className="ml-2 text-xs text-gray-500">
                (Auto-populated)
              </span>
            </label>
            <div className="relative">
              <input
                name="currency"
                value={
                  form.currency
                    ? `${form.currency} - ${
                        countries.find((c) => c.currencyCode === form.currency)
                          ?.currencyName || ""
                      }`
                    : ""
                }
                className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 disabled:cursor-not-allowed"
                disabled
                placeholder="Automatically set based on country"
              />
              {form.currency && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-green-500 animate-scaleIn"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
          <div className="animate-slideInRight animate-stagger-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Name
            </label>
            <input
              name="adminName"
              value={form.adminName}
              onChange={onChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-3 transition-smooth hover:border-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter admin name"
              required
            />
          </div>
          <div className="animate-slideInRight animate-stagger-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Email
            </label>
            <input
              name="adminEmail"
              value={form.adminEmail}
              onChange={onChange}
              type="email"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-3 transition-smooth hover:border-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="admin@company.com"
              required
            />
          </div>
          <div className="animate-slideInRight animate-stagger-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              name="adminPassword"
              value={form.adminPassword}
              onChange={onChange}
              type="password"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-3 transition-smooth hover:border-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="animate-slideInUp animate-stagger-4 pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-smooth shadow-lg hover:shadow-xl hover-lift flex items-center justify-center space-x-2"
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Register Company</span>
            </button>
          </div>
        </form>
        <div className="mt-6 text-center animate-fadeIn animate-stagger-4">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-800 font-semibold transition-smooth hover:underline"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
