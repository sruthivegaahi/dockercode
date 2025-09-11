import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    // Navigate to the Quizzes page (you can create a separate component for this)
    navigate('/student/quizzes-dashboard'); 
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-purple-50 to-pink-50 px-6 py-16">
      <h1 className="text-4xl font-semibold mb-6 text-purple-600 relative">
        Welcome to the Student Dashboard
      </h1>

      <p className="max-w-xl text-center text-purple-700 mb-10 text-base leading-relaxed font-normal">
        Hello! We're excited to have you here at{' '}
        <span className="font-semibold underline decoration-pink-300 decoration-1">Vegaahi</span>. 
        Prepare yourself with our curated mock tests designed to boost your skills and confidence.
      </p>

      <h2 className="text-2xl font-semibold mb-4 text-pink-400">Vegaahi Mock Test</h2>
      <p className="max-w-xl text-center text-gray-600 mb-8 leading-relaxed text-base">
        Take the Vegaahi Mock Tests to simulate real exam conditions and improve your performance.
      </p>

      {/* Actions */}
      <div className="flex gap-6 justify-center mb-12">
        {/* Profile Link */}
        <Link 
          to="/student/profile" 
          className="bg-purple-300 text-purple-900 px-6 py-2 rounded-lg shadow-sm hover:bg-purple-400 transition"
        >
          Profile
        </Link>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="bg-pink-300 text-white px-6 py-2 rounded-lg shadow hover:bg-pink-600 transition"
        >
          Start
        </button>
      </div>

      <footer className="text-purple-500 italic font-medium text-sm">
        &copy; {new Date().getFullYear()} Vegaahi — Empowering Your Learning Journey
      </footer>
    </div>
  );
};

export default StudentDashboard;
