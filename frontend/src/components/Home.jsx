import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const testimonials = [
  {
    quote: "Vegaahi Quizz transformed my learning experience. Interactive tests and peer progress tracking kept me on track!",
    name: "Pawan Etukala",
    role: "Full-Stack Developer",
  },
  {
    quote: "The tailored mock tests and the focus-based learning modules helped me land my dream job faster.",
    name: "Sai Pavan",
    role: "Data Scientist",
  },
  {
    quote: "As an educational consultant, I highly recommend this platform for its intuitive design and collaborative environment.",
    name: "Dilip N",
    role: "Educational Consultant",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-blue-50 to-white flex flex-col font-sans">

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center pt-28 pb-16 px-4 bg-gradient-to-r from-pink-100 to-blue-100 shadow-sm rounded-b-3xl"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold text-purple-700 mb-4 drop-shadow">
          Ace Every Test with Confidence
        </h1>
        <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
          Practice smarter with curated quizzes, personalized progress, and a community that helps you grow.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="mt-8 px-8 py-3 bg-pink-500 text-white text-lg font-medium rounded-full shadow-md hover:bg-pink-600 transition"
        >
          <Link to="/login">Start Your Journey</Link>
        </motion.button>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="py-20 px-4 bg-purple-50 mt-12"
      >
        <h2 className="text-4xl font-bold text-center text-purple-700 mb-10">What Our Learners Say</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch max-w-6xl mx-auto">
          {testimonials.map(({ quote, name, role }, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.03 }}
              className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm transition-all max-w-md mx-auto"
            >
              <p className="text-gray-700 italic mb-4">“{quote}”</p>
              <p className="font-semibold text-pink-600">{name}</p>
              <p className="text-sm text-gray-500">{role}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center py-20 bg-gradient-to-r from-rose-100 via-orange-100 to-yellow-50"
      >
        <h2 className="text-4xl font-bold text-gray-800 mb-6">Join the Vegaahi Community Today</h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">
          Explore mock tests, detailed analytics, and interactive peer discussions that make learning more powerful and fun.
        </p>
        <motion.button
          whileHover={{ scale: 1.07 }}
          className="px-10 py-4 bg-pink-400 text-white text-lg font-semibold rounded-full shadow-lg hover:bg-orange-500 transition"
        >
          <Link to="/login">Join Now</Link>
        </motion.button>
      </motion.section>

    </div>
  );
};

export default Home;
