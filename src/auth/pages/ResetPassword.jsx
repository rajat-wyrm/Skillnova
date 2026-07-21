import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`http://localhost:4000/api/v1/auth/reset-password/${token}`, { password });
    alert('Password reset successful!');
    navigate('/login');
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="p-6 shadow-lg rounded bg-white w-96">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        <input type="password" required placeholder="New Password" value={password} onChange={e=>setPassword(e.target.value)} className="border w-full p-2 mb-3 rounded"/>
        <button className="bg-green-600 text-white w-full p-2 rounded">Reset Password</button>
      </form>
    </div>
  );
}