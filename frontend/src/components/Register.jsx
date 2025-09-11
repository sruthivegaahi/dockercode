import React, { useState } from 'react';
import { useNavigate ,Link} from 'react-router-dom';

// import axios from 'axios';
import api from './api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });

  
const navigate = useNavigate();


  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await api.post('/api/auth/register', formData, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
       navigate('/login');

      setMessage(res.data.message || 'Registered successfully');
      setFormData({ name: '', email: '', password: '', role: 'student' });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-100 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 shadow-2xl rounded-3xl w-full max-w-md m-auto border border-blue-300">
        <h2 className="text-2xl font-semibold text-center text-blue-800 mb-6">Create an Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Register
          </button>
        </form>

        {message && <p className="mt-4 text-green-600 text-center">{message}</p>}
        {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
      <div className="text-center mt-6 text-sm text-gray-600">
  Already have an account?{' '}
  <Link to="/login" className="text-blue-600 hover:underline">
    Login here
  </Link>
</div>
      </div>
    </div>
  );
};

export default Register;
