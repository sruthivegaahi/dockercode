import React from 'react';
import { useAuth } from '../context/AuthContext';

const StudentProfile = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-purple-600 text-center py-10">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg mt-10 shadow-lg border border-pink-200 mb-16">
      <h1 className="text-2xl font-extrabold text-purple-600 hover:text-indigo-800 tracking-tight text-center">
        Student Dashboard
      </h1>

      {user ? (
        <div className="space-y-6 text-gray-800 mt-8">
          <div className="flex flex-col md:flex-row md:items-center">
            <label className="font-semibold w-32 text-purple-600">Name:</label>
            <span className="ml-0 md:ml-4 text-purple-700 font-medium">{user.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center">
            <label className="font-semibold w-32 text-purple-600">Email:</label>
            <span className="ml-0 md:ml-4 text-purple-700 font-medium">{user.email}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center">
            <label className="font-semibold w-32 text-purple-600">Role:</label>
            <span className="ml-0 md:ml-4 capitalize text-pink-600 font-semibold">{user.role}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center">
            <label className="font-semibold w-32 text-purple-600">User ID:</label>
            <span className="ml-0 md:ml-4 text-gray-500 font-mono">{user._id || user.userId}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center">
            <label className="font-semibold w-32 text-purple-600">Account Created:</label>
            <span className="ml-0 md:ml-4 text-gray-500">
              {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Not available'}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-pink-600 text-center font-semibold">No user data available. Please log in.</p>
      )}
    </div>
  );
};

export default StudentProfile;
