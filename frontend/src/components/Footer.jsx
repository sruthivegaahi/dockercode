// src/components/Footer.jsx
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">&copy; {currentYear} Vegaahi Quizz. All Rights Reserved.</p>
        <p className="text-sm mt-1">
          Developed by{" "}
          <a
            href="https://vegaahi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Vegaahi
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
