import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../Supabase/client'; // Path
import './Login.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      alert('Error al registrarse: ' + error.message);
    } else {
      alert('Registro exitoso. Revisa tu correo para confirmar la cuenta.');
      navigate('/login'); // Redirige al login después de registrarse
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleRegister}>
        <h2>Crear cuenta</h2>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="action-button">Registrarse</button>
        <p>
          ¿Ya tienes una cuenta? <Link to="/">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
