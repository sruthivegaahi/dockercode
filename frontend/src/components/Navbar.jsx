// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const role = user?.role?.toLowerCase();
  const dashboardLink =
    role === 'admin'
      ? '/admin/dashboard'
      : role === 'student'
      ? '/student/dashboard'
      : null;
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="text-2xl font-extrabold text-purple-600 hover:text-indigo-800 tracking-tight"
          >
            VEGAAHI IT PVT LTD
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
            >
              Home
            </Link>

            {!user ? (
              <Link
                to="/login"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                Login
              </Link>
            ) : (
              <>
                {dashboardLink && (
                  <Link
                    to={dashboardLink}
                    className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                )}

                {/* Student-only Tracking Link */}
                {role === 'student' && (
                  <Link
                    to="/student/tracking"
                    className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                  >
                    Tracking
                  </Link>
                )}

                <span className="text-gray-600 font-medium">Hi, {displayRole}</span>

                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-indigo-600 focus:outline-none"
            >
              {menuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-inner px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            className="block text-gray-700 hover:text-indigo-600 font-medium"
          >
            Home
          </Link>

          {!user ? (
            <Link
              to="/login"
              className="block text-gray-700 hover:text-indigo-600 font-medium"
            >
              Login
            </Link>
          ) : (
            <>
              {dashboardLink && (
                <Link
                  to={dashboardLink}
                  className="block text-gray-700 hover:text-indigo-600 font-medium"
                >
                  Dashboard
                </Link>
              )}

              {/* Student-only Tracking Link */}
              {role === 'student' && (
                <Link
                  to="/tracking"
                  className="block text-gray-700 hover:text-indigo-600 font-medium"
                >
                  Tracking
                </Link>
              )}

              <span className="block text-gray-600 font-medium">Hi, {displayRole}</span>

              <button
                onClick={logout}
                className="w-full text-left text-red-500 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
