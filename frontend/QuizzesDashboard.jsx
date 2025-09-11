import React from 'react';
import { Link } from 'react-router-dom';

const QuizzesDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-purple-50 to-pink-50 px-6 py-16">
      <h1 className="text-4xl font-semibold mb-6 text-purple-600">
        🎯 Quizzes & Coding Quizzes
      </h1>

      <p className="max-w-xl text-center text-purple-700 mb-10 text-base leading-relaxed font-normal">
        Here you can access your assigned quizzes and coding challenges. Select the one you want to attempt.
      </p>

      <div className="flex gap-6 justify-center mb-12">
        <Link 
          to="/student/quizzes" 
          className="bg-pink-300 text-pink-900 px-6 py-2 rounded-lg shadow-sm hover:bg-pink-400 transition"
        >
          Quizzes
        </Link>

        <Link 
          to="/student/assigned-problems" 
          className="bg-indigo-300 text-indigo-900 px-6 py-2 rounded-lg shadow-sm hover:bg-indigo-400 transition"
        >
          Coding Quizzes
        </Link>
      </div>

      <div className="text-center">
        <Link 
          to="/student/dashboard" 
          className="bg-purple-300 text-purple-900 px-6 py-2 rounded-lg shadow hover:bg-purple-400 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <footer className="text-purple-500 italic font-medium text-sm mt-16">
        &copy; {new Date().getFullYear()} Vegaahi — Empowering Your Learning Journey
      </footer>
    </div>
  );
};

export default QuizzesDashboard;
