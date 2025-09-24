import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  Users,
  ClipboardList,
  BarChart3,
  UserCircle,
  FileText,
} from "lucide-react";
import api from "./api";
import AddUserModal from "./AddUser";

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const navigate = useNavigate();

  // ✅ Fetch quizzes with token
  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/api/quizzes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // ✅ Excel Upload with token
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await api.post("/api/excel/upload-users-excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setUploadStatus(
        `✅ Uploaded ${res.data.users.length} users successfully.`
      );
    } catch (err) {
      setUploadStatus(
        "❌ Upload failed: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white p-10 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-bold text-indigo-700 mb-6 text-center">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mb-10 text-center text-lg">
          Manage users, quizzes, and reports from one place.
        </p>

        {/* Grid Layout for Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add User */}
          <div className="p-6 bg-indigo-50 rounded-xl shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-indigo-700 flex items-center gap-2 mb-4">
              <Users size={22} /> User Management
            </h2>
            {/* ✅ refreshQuizzes passed here */}
            <AddUserModal refreshUsers={fetchQuizzes} />
            <Link
              to="/admin/userlist"
              className="mt-3 inline-block bg-indigo-600 text-white px-8 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              View Users
            </Link>
          </div>

          {/* Excel Upload */}
          <div className="p-6 bg-green-50 rounded-xl shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-green-700 flex items-center gap-2 mb-4">
              <FileSpreadsheet size={22} /> Upload via Excel
            </h2>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              className="block w-full text-sm border p-2 rounded mb-2"
            />
            {uploadStatus && (
              <p className="text-sm text-gray-700">{uploadStatus}</p>
            )}
          </div>

          {/* Quizzes */}
          <div className="p-6 bg-purple-50 rounded-xl shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-purple-700 flex items-center gap-2 mb-4">
              <ClipboardList size={22} /> Quiz Management
            </h2>
            <button
              className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition mb-2"
              onClick={() => navigate("/admin/createquiz")}
            >
              Create Quiz
            </button>
            <Link
              to="/admin/quizzes"
              className="block mt-2 bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
            >
              View Quizzes
            </Link>
          </div>

          {/* Coding Questions */}
          <div className="p-6 bg-yellow-50 rounded-xl shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-yellow-700 flex items-center gap-2 mb-4">
              <FileText size={22} /> Coding Questions
            </h2>
            <button
              className="bg-yellow-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition"
              onClick={() => navigate("/admin/coding-questions")}
            >
              Add Coding Question
            </button>
          </div>

          {/* Results */}
          <div className="p-6 bg-blue-50 rounded-xl shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-blue-700 flex items-center gap-2 mb-4">
              <BarChart3 size={22} /> Results
            </h2>
            <button
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              onClick={() => navigate("/admin/results")}
            >
              View Results
            </button>
          </div>

          {/* Profile */}
          <div className="p-6 bg-gray-100 rounded-xl shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <UserCircle size={22} /> Admin Profile
            </h2>
            <Link
              to="/admin/profile"
              className="bg-gray-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
