import { Routes, Route } from 'react-router-dom';
import StudentDashboard from './StudnetDashboard';
import StudentProfile from './StudentProfile';
import UserQuizList from './UserQuizList';
import QuizAttempt from './QuizAttempt';
import UserCodingQuizList from './UserCodingQuizList';
import StudentCodingQuizAttempt from './StudentCodingQuizAttempt';
import StudentTracking from './StudentTracking';
import QuizzesDashboard from '../../QuizzesDashboard';
const StudentRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<StudentDashboard />} />
      <Route path="/profile" element={<StudentProfile />} />
      <Route path="/quizzes" element={<UserQuizList />} />
      <Route path="/quiz/:id" element={<QuizAttempt />} />
        <Route path="/assigned-problems" element={<UserCodingQuizList />} />
      <Route path="/coding-quiz/:id" element={<StudentCodingQuizAttempt />} />
      <Route path="/tracking" element={<StudentTracking />} />
 <Route path="/quizzes-dashboard" element={<QuizzesDashboard />} />
    </Routes>
  );
};

export default StudentRoutes;
