import React, { useState } from 'react';
import api from './api';

const AdminUploadExcel = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [skippedUsers, setSkippedUsers] = useState([]);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Axios request for Excel upload
      const res = await api.post("/api/upload-users-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Show uploaded users
      if (res.data.users && res.data.users.length > 0) {
        setMessage(`Users uploaded: ${res.data.users.join(", ")}`);
      } else {
        setMessage("No users were uploaded (duplicates or invalid data).");
      }

      // Show skipped users if any
      if (res.data.skipped) {
        setSkippedUsers(res.data.skipped);
      } else {
        setSkippedUsers([]);
      }
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      setMessage(err.response?.data?.message || "Error uploading file");
      setSkippedUsers([]);
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded shadow text-center">
      <h2 className="text-lg font-semibold mb-2">Upload Users via Excel</h2>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-3"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Upload
      </button>

      {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}

      {skippedUsers.length > 0 && (
        <div className="mt-3 text-left">
          <h3 className="font-semibold">Skipped Users:</h3>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {skippedUsers.map((user, index) => (
              <li key={index}>
                {user.name || "Unknown"} — {user.email || "No email"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminUploadExcel;
