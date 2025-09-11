import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../components/api';

const AdminDashboard = () => {
  const { user, loading, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      const res = await api.put('/api/users/profile', formData, {
        withCredentials: true,
      });

      setUser((prevUser) => ({
        ...prevUser,
        ...formData,
      }));

      setMessage('Profile updated successfully.');
      setEditMode(false);
    } catch (error) {
      console.error('Update failed:', error);
      setMessage('Failed to update profile.');
    }
  };

  const handleCancel = () => {
    // Reset formData to original user data
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
    });
    setEditMode(false);
    setMessage('');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6">Admin Dashboard</h1>

      {message && (
        <div
          className={`mb-4 ${
            message.includes('successfully') ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {message}
        </div>
      )}

      {user ? (
        <div className="space-y-4 text-gray-800">
          <div>
            <label className="font-semibold">Name:</label>
            {editMode ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="ml-2 border p-1 rounded"
              />
            ) : (
              <span className="ml-2">{user.name}</span>
            )}
          </div>

          <div>
            <label className="font-semibold">Email:</label>
            {editMode ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="ml-2 border p-1 rounded"
              />
            ) : (
              <span className="ml-2">{user.email}</span>
            )}
          </div>

          <div>
            <label className="font-semibold">Role:</label>
            <span className="ml-2 capitalize">{user.role}</span>
          </div>

          <div>
            <label className="font-semibold">User ID:</label>
            <span className="ml-2 text-gray-600">{user._id || user.userId}</span>
          </div>

          <div>
            <label className="font-semibold">Account Created:</label>
            <span className="ml-2 text-gray-600">
              {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Not available'}
            </span>
          </div>

          {editMode ? (
            <div className="flex space-x-4 mt-4">
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
              Edit Profile
            </button>
          )}
        </div>
      ) : (
        <p className="text-red-500">No user data available. Please log in.</p>
      )}
    </div>
  );
};

export default AdminDashboard;
