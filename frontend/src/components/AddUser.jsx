import React, { useState } from "react";
import api from "./api";

export default function AddUserModal({ refreshUsers }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    collegeName: "",
    branch: "",
    gender: "Other",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/auth", formData);
      alert(res.data.message);
      setShowModal(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "student",
        collegeName: "",
        branch: "",
        gender: "Other",
      });
      refreshUsers(); // refresh user list in dashboard
    } catch (err) {
      alert(err.response?.data?.message || "Error adding user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-indigo-700 transition duration-200 shadow-md text-center"
      >
        Add User
      </button>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add User</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
              <input
                type="text"
                name="collegeName"
                placeholder="College Name"
                value={formData.collegeName}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="branch"
                placeholder="Branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 bg-gray-400 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {loading ? "Adding..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
