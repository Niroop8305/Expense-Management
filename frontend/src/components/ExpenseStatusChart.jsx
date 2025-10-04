import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useTheme } from "../context/ThemeContext";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ExpenseStatusChart = ({ expenses, currency = "USD" }) => {
  const { isDark } = useTheme();
  // Group expenses by status
  const statusData = expenses.reduce(
    (acc, expense) => {
      const status = expense.status;
      acc[status].count++;
      acc[status].amount += expense.amount;
      return acc;
    },
    {
      pending: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 },
    }
  );

  const data = {
    labels: ["Pending", "Approved", "Rejected"],
    datasets: [
      {
        label: "Number of Expenses",
        data: [
          statusData.pending.count,
          statusData.approved.count,
          statusData.rejected.count,
        ],
        backgroundColor: [
          "rgba(234, 179, 8, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgba(234, 179, 8, 1)",
          "rgba(34, 197, 94, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          color: isDark ? "#e5e7eb" : "#374151",
        },
      },
      tooltip: {
        backgroundColor: isDark
          ? "rgba(31, 41, 55, 0.95)"
          : "rgba(255, 255, 255, 0.95)",
        titleColor: isDark ? "#e5e7eb" : "#111827",
        bodyColor: isDark ? "#d1d5db" : "#374151",
        borderColor: isDark ? "#4b5563" : "#e5e7eb",
        borderWidth: 1,
        callbacks: {
          afterLabel: function (context) {
            const status = context.label.toLowerCase();
            const amount = statusData[status].amount;
            return `Total: ${currency} ${amount.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: isDark ? "#9ca3af" : "#6b7280",
          stepSize: 1,
          callback: function (value) {
            if (Number.isInteger(value)) {
              return value;
            }
          },
        },
        grid: {
          color: isDark ? "rgba(75, 85, 99, 0.3)" : "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        ticks: {
          color: isDark ? "#9ca3af" : "#6b7280",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  if (expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
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
          <p className="text-lg font-medium">No status data available</p>
          <p className="text-sm mt-1">
            Submit expenses to see status distribution
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 md:h-80">
      <Bar data={data} options={options} />
    </div>
  );
};

export default ExpenseStatusChart;
