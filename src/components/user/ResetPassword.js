import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        password
      });
      
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
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
            <i className="fas fa-key text-4xl text-[#d4af37]"></i>
          </div>
          <h1 className="text-3xl font-bold text-[#d4af37] mb-2">Reset Password</h1>
          <p className="text-white/70">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label className="block text-sm text-white/50 mb-2">New Password</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-white/30"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none transition"
                placeholder="Enter new password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
              >
                <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Confirm Password</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-white/30"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none transition"
                placeholder="Confirm new password"
                disabled={loading}
              />
            </div>
            
            {confirmPassword && (
              <p className={`text-xs mt-1 ${
                password === confirmPassword ? 'text-green-500' : 'text-red-500'
              }`}>
                {password === confirmPassword 
                  ? '✓ Passwords match' 
                  : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Resetting...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Reset Password
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-[#d4af37] hover:underline text-sm"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Login
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResetPassword;
