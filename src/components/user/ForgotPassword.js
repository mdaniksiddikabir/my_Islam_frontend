import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    try {
      setLoading(true);
      
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      
      setSubmitted(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[80vh] flex items-center justify-center py-8"
    >
      <div className="glass max-w-md w-full p-8 rounded-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#d4af37]/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-lock text-4xl text-[#d4af37]"></i>
          </div>
          <h1 className="text-3xl font-bold text-[#d4af37] mb-2">Forgot Password?</h1>
          <p className="text-white/70">
            {submitted 
              ? 'Check your email for reset instructions'
              : 'Enter your email to reset your password'}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white/50 mb-2">Email Address</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-white/30"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none transition"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Send Reset Link
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-500/20 rounded-lg">
              <p className="text-green-500">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>
            <p className="text-sm text-white/50">
              Didn't receive the email?{' '}
              <button
                onClick={() => setSubmitted(false)}
                className="text-[#d4af37] hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-[#d4af37] hover:underline text-sm">
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Login
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;
