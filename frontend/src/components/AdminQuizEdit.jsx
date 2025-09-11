import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";

const emptyQuestion = () => ({
  type: "mcq",
  text: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  correctAnswerText: "", 
});

const AdminQuizEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/quizzes/${id}`);
      setQuiz(res.data);

      const transformedQs = (res.data.questions || []).map((q) => ({
        type: q.type,
        text: q.questionText,
        options: q.type === "mcq" ? q.options || ["", "", "", ""] : [],
        correctOptionIndex: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
        correctAnswerText: typeof q.correctAnswer === "string" ? q.correctAnswer : "",
      }));

      setQuestions(transformedQs);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  const handleTypeChange = (index, newType) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index].type = newType;

      if (newType === "mcq") {
        updated[index].options = ["", "", "", ""];
        updated[index].correctOptionIndex = 0;
      } else {
        updated[index].options = [];
        updated[index].correctAnswerText = "";
      }

      return updated;
    });
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const deleteQuestion = (index) => {
    if (!window.confirm("Delete this question?")) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index, text) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index].text = text;
      return updated;
    });
  };

  const updateOptionText = (qIndex, optionIndex, text) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].options[optionIndex] = text;
      return updated;
    });
  };

  const updateCorrectOption = (qIndex, correctIndex) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].correctOptionIndex = correctIndex;
      return updated;
    });
  };

  const updateCorrectAnswerText = (index, text) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index].correctAnswerText = text;
      return updated;
    });
  };

  const saveQuestions = async () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Question ${i + 1} text cannot be empty`);
        return;
      }

      if (q.type === "mcq") {
        if (q.options.some((opt) => !opt.trim())) {
          alert(`All options in question ${i + 1} must be filled`);
          return;
        }
      } else if (q.type === "fill_blank") {
        if (!q.correctAnswerText.trim()) {
          alert(`Correct answer in fill-in-the-blank question ${i + 1} cannot be empty`);
          return;
        }
      }
    }

    const formatted = questions.map((q) => {
      return {
        type: q.type,
        questionText: q.text,
        ...(q.type === "mcq"
          ? {
              options: q.options,
              correctAnswer: q.correctOptionIndex,
            }
          : {
              correctAnswer: q.correctAnswerText,
            }),
      };
    });

    try {
      await api.put(`/api/quizzes/${id}`, {
        title: quiz.title,
        description: quiz.description,
        questions: formatted,
      });
      alert("Questions saved successfully!");
      navigate("/admin/quizzes");
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Failed to save questions");
    }
  };

  if (loading) return <p className="p-6 text-center">Loading...</p>;
  if (error) return <p className="p-6 text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center">Edit Quiz: {quiz.title}</h2>

      {questions.map((q, i) => (
        <div key={i} className="border p-5 rounded-lg mb-6 bg-gray-50 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-semibold">Question {i + 1}</h3>
            <button onClick={() => deleteQuestion(i)} className="text-red-500 font-semibold">
              Delete
            </button>
          </div>

          <label className="block mb-2 font-medium">Question Type</label>
          <select
            value={q.type}
            onChange={(e) => handleTypeChange(i, e.target.value)}
            className="mb-4 p-2 border rounded w-full"
          >
            <option value="mcq">Multiple Choice</option>
            <option value="fill_blank">Fill in the Blank</option>
          </select>

          <label className="block mb-2 font-medium">Question Text</label>
          <textarea
            value={q.text}
            onChange={(e) => updateQuestionText(i, e.target.value)}
            className="w-full p-2 mb-4 border rounded"
            rows={3}
          />

          {q.type === "mcq" ? (
            <>
              <label className="block mb-2 font-medium">Options</label>
              {q.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3 mb-2">
                  <input
                    type="radio"
                    name={`correct-${i}`}
                    checked={q.correctOptionIndex === idx}
                    onChange={() => updateCorrectOption(i, idx)}
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOptionText(i, idx, e.target.value)}
                    className="flex-grow p-2 border rounded"
                  />
                </div>
              ))}
            </>
          ) : (
            <>
              <label className="block mb-2 font-medium">Correct Answer</label>
              <input
                type="text"
                value={q.correctAnswerText}
                onChange={(e) => updateCorrectAnswerText(i, e.target.value)}
                className="w-full p-2 border rounded"
              />
            </>
          )}
        </div>
      ))}

      <div className="flex gap-4 justify-center mt-8">
        <button
          onClick={addQuestion}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          + Add Question
        </button>
        <button
          onClick={saveQuestions}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
        >
          Save Questions
        </button>
      </div>
    </div>
  );
};

export default AdminQuizEdit;
