import { useState } from "react";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:4000/api/v1/auth/forgot-password", { email });
      setMessage("Password reset link sent! Check your email.");
    } catch (err) {
      setMessage("Email not found");
    }
  };

  return (
    <div style={{maxWidth: '400px', margin: '50px auto', textAlign: 'center'}}>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Enter your email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{width: '100%', padding: '10px', marginBottom: '10px'}}
        />
        <button type="submit" style={{width: '100%', padding: '10px', background: '#f97316', color: 'white', border: 'none'}}>
          Send Reset Link
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}