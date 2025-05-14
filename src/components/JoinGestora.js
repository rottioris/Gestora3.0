import React, { useState } from 'react';
import { FaCube } from 'react-icons/fa';
import './JoinGestora.css';

const JoinGestora = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) newErrors.email = 'Invalid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Aquí iría la lógica de registro
      alert('Registered!');
    }
  };

  return (
    <div className="join-gestora-container">
      <div className="form-section">
        <form className="join-form" onSubmit={handleSubmit}>
          <h2>Join Gestora</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {errors.email && <span className="error">{errors.email}</span>}
          <input
            type="password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {errors.password && <span className="error">{errors.password}</span>}
          <p className="terms">
            By clicking Agree & Join, you agree to the Gestora <br/>
            <b>User Agreement, Privacy Policy,</b> and <b>Cookie Policy</b>.
          </p>
          <button type="submit" className="join-btn">Agree & Join</button>
        </form>
      </div>
      <div className="icon-section">
        <FaCube className="cube-icon" />
      </div>
    </div>
  );
};

export default JoinGestora; 