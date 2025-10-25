// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Basic validation
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      // Check for valid username format
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }

      console.log('Attempting registration...');
      const result = await signUp(email, password, username);
      console.log('Registration result:', result);
      
      if (result.user) {
        // Check if email confirmation is required
        if (result.user.identities && result.user.identities.length === 0) {
          setError('User already registered. Please sign in instead.');
          return;
        }
        
        if (result.session) {
          // Immediate sign-in successful
          navigate('/');
        } else {
          // Email confirmation required
          setError('✅ Registration successful! Please check your email to confirm your account. You will be redirected to login.');
          setTimeout(() => {
            navigate('/login');
          }, 4000);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.message.includes('User already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (error.message.includes('invalid_credentials')) {
        setError('Invalid registration details. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please check your email to confirm your account before signing in.');
      } else {
        setError(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="liquid-glass p-8 rounded-2xl w-full max-w-md border border-border-color">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="w-12 h-12 text-accent-color mr-3" />
            <h1 className="text-3xl font-bold">OryxChat</h1>
          </div>
          <p className="text-text-secondary">Create your account</p>
        </div>

        {error && (
          <div className={`aero-glass p-4 mb-6 rounded-lg ${
            error.includes('✅') || error.includes('successful') 
              ? 'text-green-400 border border-green-400/20' 
              : 'text-red-400 border border-red-400/20'
          }`}>
            {error}
            {(error.includes('✅') || error.includes('successful')) && (
              <div className="text-sm mt-2 opacity-90">
                Redirecting to login...
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input w-full"
              required
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
              title="Username can only contain letters, numbers, and underscores"
            />
            <p className="text-xs text-text-secondary mt-1">
              3+ characters, letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn w-full flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating Account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-color hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
