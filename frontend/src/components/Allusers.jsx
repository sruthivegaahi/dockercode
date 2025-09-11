import React, { useEffect, useState } from 'react';
import api from './api';

const Allusers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [following, setFollowing] = useState(new Set()); // IDs of users current user follows
  const [followers, setFollowers] = useState(new Set()); // IDs of users who follow current user

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get logged-in user info
        const meRes = await api.get('/api/follow/me');
        const me = meRes.data;
        setCurrentUser(me);

        // 2. Get all users
        const usersRes = await api.get('/api/admin/users');
        setUsers(usersRes.data);

        // 3. Get current user's following list
        const followingRes = await api.get(`/api/follow/following/${me._id}`);
        // followingRes.data is an array of { _id, name, email } or just IDs
        const followingIds = new Set(
          followingRes.data.map(f => 
            f.following ? (f.following._id || f.following) : f._id
          )
        );
        setFollowing(followingIds);

        // 4. Get current user's followers list
        const followersRes = await api.get(`/api/follow/followers/${me._id}`);
        // followersRes.data is an array of users who follow current user
        const followerIds = new Set(followersRes.data.map(f => f._id || f));
        setFollowers(followerIds);

      } catch (error) {
        console.error('Error fetching data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Follow a user
  const handleFollow = async (userId) => {
    try {
      await api.post('/api/follow', { following: userId });
      setFollowing(prev => new Set(prev).add(userId));
    } catch (error) {
      console.error('Failed to follow user:', error.message);
      alert('Failed to follow user');
    }
  };

  // Unfollow a user
  const handleUnfollow = async (userId) => {
    try {
      await api.delete(`/api/follow/${userId}`);
      setFollowing(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to unfollow user:', error.message);
      alert('Failed to unfollow user');
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(users.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

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
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-2 tracking-tight">
          📋 User Management
        </h2>

        {currentUser && (
          <p className="text-center text-indigo-600 font-semibold mb-6">
            You are following {following.size} user{following.size !== 1 ? 's' : ''} &nbsp;|&nbsp; 
            You have {followers.size} follower{followers.size !== 1 ? 's' : ''}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 text-gray-800">
              <tr>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">#</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">Name</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">Email</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">Role</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">Created At</th>
                <th className="py-3 px-5 text-left font-semibold tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {currentUsers.map((user, index) => {
                // Don't show follow/unfollow button for current logged in user
                const isCurrentUser = currentUser && user._id === currentUser._id;
                const isFollowing = following.has(user._id);

                return (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 transition-all duration-200 ease-in-out"
                  >
                    <td className="py-3 px-5">{indexOfFirstUser + index + 1}</td>
                    <td className="py-3 px-5 font-medium">{user.name}</td>
                    <td className="py-3 px-5">{user.email}</td>
                    <td className="py-3 px-5 capitalize">{user.role}</td>
                    <td className="py-3 px-5">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-5">
                      {!isCurrentUser && (
                        isFollowing ? (
                          <button
                            onClick={() => handleUnfollow(user._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                          >
                            Unfollow
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFollow(user._id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                          >
                            Follow
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
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

export default Allusers;
