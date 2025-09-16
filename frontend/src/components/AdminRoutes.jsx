import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import Profile from './profile';
import UserList from './UserList';
import QuizForm from './QuizForm';
import QuizSubmissions from './QuizSubmissions';
import AdminUploadExcel from './AdminUploadExcel';
import AdminQuizList from './AdminQuizList';
import AdminQuizEdit from './AdminQuizEdit';
import AdminQuizResult from './AdminQuizResult';
import CodingQuestionManager from './CodingQuestionManager';
import ResultsList from './ResultsList';
const AdminRoutes = () => {
  return (
 
<Routes>
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="profile" element={<Profile />} />
  <Route path="userlist" element={<UserList />} />
  <Route path="createquiz" element={<QuizForm />} />
  <Route path="quizzes" element={<AdminQuizList />} />
  <Route path="quizzes/:id/edit" element={<AdminQuizEdit />} />
  <Route path="/upload-excel" element={<AdminUploadExcel />} />
  <Route path="quizzes/:quizId/results" element={<AdminQuizResult />} />
  <Route path="/coding-questions" element={<CodingQuestionManager />} />
 <Route path="results" element={<ResultsList />}/>
</Routes>
 
  );
};
 
export default AdminRoutes;
 
 