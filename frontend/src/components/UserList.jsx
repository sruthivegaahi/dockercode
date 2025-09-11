import React, { useEffect, useState } from 'react';
import api from './api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/api/admin/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== id));
    } catch (error) {
      console.error('Failed to delete user:', error.message);
    }
  };

  // Filtered users based on search
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.collegeName?.toLowerCase().includes(term) ||
      user.branch?.toLowerCase().includes(term) ||
      user.gender?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-lg font-semibold py-10 text-gray-600 animate-pulse">
        Loading users...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-100">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8 tracking-tight">
          📋 User Management
        </h2>

        {/* Search */}
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // reset to first page on search
            }}
            placeholder="Search by name, email, college, branch, role, gender..."
            className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm text-gray-700"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 text-gray-800">
              <tr>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">#</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">Name</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">Email</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">College</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">Branch</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">Gender</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">Role</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">Created At</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                currentUsers.map((user, index) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 transition-all duration-200 ease-in-out"
                  >
                    <td className="py-3 px-5">{indexOfFirstUser + index + 1}</td>
                    <td className="py-3 px-5 font-medium">{user.name}</td>
                    <td className="py-3 px-5">{user.email}</td>
                    <td className="py-3 px-5">{user.collegeName || 'N/A'}</td>
                    <td className="py-3 px-5">{user.branch || 'N/A'}</td>
                    <td className="py-3 px-5 capitalize">{user.gender || 'N/A'}</td>
                    <td className="py-3 px-5 capitalize">{user.role}</td>
                    <td className="py-3 px-5">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-5">
                      {user.role === 'student' ? (
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white font-medium py-1.5 px-4 rounded-full shadow-md hover:from-red-600 hover:to-red-700 transition"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-center items-center space-x-2 text-sm">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserList;
