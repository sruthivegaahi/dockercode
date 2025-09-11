import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminQuizEdit = ({ quizId, token }) => {
  const [quiz, setQuiz] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ title: '', questions: [] });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [colleges, setColleges] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  useEffect(() => {
    if (quizId) {
      axios.get(`/api/quizzes/${quizId}`, { headers })
        .then(res => {
          setQuiz(res.data);
          setFormData({
            title: res.data.title,
            questions: res.data.questions || []
          });
        })
        .catch(err => setError(err.response?.data?.message || 'Error loading quiz'));
    }

    // Fetch college and branch list
    fetchCollegeAndBranch();
  }, [quizId]);

  const fetchCollegeAndBranch = async () => {
    try {
      const res = await axios.get('/api/colleges/all', { headers });
      const { colleges: colList = [], branches: branchList = [] } = res.data || {};
      setColleges(colList);
      setBranches(branchList);
    } catch (err) {
      console.error('Failed to fetch colleges/branches', err);
    }
  };

  const handleInputChange = (e, qIndex) => {
    const { name, value } = e.target;
    const updatedQuestions = [...formData.questions];
    updatedQuestions[qIndex][name] = value;
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleOptionChange = (e, qIndex, optIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[qIndex].options[optIndex] = e.target.value;
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.put(`/api/quizzes/${quizId}`, formData, { headers });
      setQuiz(res.data.quiz);
      setMessage('Quiz updated successfully');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await axios.delete(`/api/quizzes/${quizId}`, { headers });
      setMessage('Quiz deleted successfully');
      setQuiz(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleAssign = async () => {
    if (!selectedCollege && !selectedBranch) {
      alert('Please select a college or branch to assign');
      return;
    }

    try {
      const assignPayload = {
        colleges: selectedCollege ? [selectedCollege] : [],
        branches: selectedBranch ? [selectedBranch] : []
      };

      await axios.put(`/api/quizzes/${quizId}/assign`, assignPayload, { headers });

      setMessage('Quiz assigned successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed');
    }
  };

  if (!quiz) return <div>{error || 'Loading quiz...'}</div>;

  return (
    <div className="p-4 border rounded-md shadow-sm max-w-3xl mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4">Edit Quiz</h2>

      {editing ? (
        <div>
          <label className="block mb-2 font-semibold">Quiz Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="border p-2 w-full mb-4"
          />

          {formData.questions.map((q, qIndex) => (
            <div key={qIndex} className="mb-6 border p-4 rounded">
              <label className="block font-semibold mb-1">Question {qIndex + 1}:</label>
              <input
                type="text"
                name="questionText"
                value={q.questionText}
                onChange={e => handleInputChange(e, qIndex)}
                className="border p-2 w-full mb-2"
              />

              <label className="block mb-1">Question Type:</label>
              <select
                name="type"
                value={q.type}
                onChange={e => handleInputChange(e, qIndex)}
                className="border p-2 w-full mb-2"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="fill">Fill in the Blank</option>
              </select>

              {q.type === 'mcq' && (
                <>
                  <label className="block mb-1">Options:</label>
                  {q.options.map((opt, optIndex) => (
                    <input
                      key={optIndex}
                      type="text"
                      value={opt}
                      onChange={e => handleOptionChange(e, qIndex, optIndex)}
                      className="border p-2 w-full mb-1"
                      placeholder={`Option ${optIndex + 1}`}
                    />
                  ))}

                  <label className="block mt-2">Correct Answer:</label>
                  <input
                    type="text"
                    name="correctAnswer"
                    value={q.correctAnswer}
                    onChange={e => handleInputChange(e, qIndex)}
                    className="border p-2 w-full"
                  />
                </>
              )}

              {q.type === 'fill' && (
                <>
                  <label className="block mt-2">Correct Answer:</label>
                  <input
                    type="text"
                    name="correctAnswer"
                    value={q.correctAnswer}
                    onChange={e => handleInputChange(e, qIndex)}
                    className="border p-2 w-full"
                  />
                </>
              )}
            </div>
          ))}

          <button onClick={handleUpdate} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            Save Changes
          </button>
          <button onClick={() => setEditing(false)} className="bg-gray-300 px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold">{quiz.title}</h3>
          <ul className="list-disc ml-5 mt-2">
            {quiz.questions?.map((q, i) => (
              <li key={i} className="mb-2">
                <strong>Q:</strong> {q.questionText} <br />
                <strong>Type:</strong> {q.type} <br />
                {q.type === 'mcq' && <><strong>Options:</strong> {q.options.join(', ')}<br /></>}
                <strong>Answer:</strong> {q.correctAnswer}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button onClick={() => setEditing(true)} className="bg-yellow-400 px-4 py-2 rounded">
              Edit Quiz
            </button>
            <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded">
              Delete Quiz
            </button>
          </div>

          {/* Assignment section */}
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Assign Quiz</h4>
            <div className="flex gap-4 flex-wrap">
              <select
                value={selectedCollege}
                onChange={e => setSelectedCollege(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="">Select College</option>
                {colleges.map((college, idx) => (
                  <option key={idx} value={college}>{college}</option>
                ))}
              </select>

              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="">Select Branch</option>
                {branches.map((branch, idx) => (
                  <option key={idx} value={branch}>{branch}</option>
                ))}
              </select>

              <button
                onClick={handleAssign}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {message && <div className="mt-4 text-green-600">{message}</div>}
      {error && <div className="mt-4 text-red-600">{error}</div>}
    </div>
  );
};

export default AdminQuizEdit;
