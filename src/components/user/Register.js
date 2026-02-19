import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { register as registerService } from '../../services/auth';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[A-Z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[$@#&!]+/)) strength++;
    setPasswordStrength(strength);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email');
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    
    if (!formData.agreeTerms) {
      toast.error('You must agree to the terms and conditions');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const response = await registerService({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      login(response.user);
      toast.success('Registration successful!');
      navigate('/');
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    return colors[passwordStrength - 1] || 'bg-gray-500';
  };

  const getStrengthText = () => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return texts[passwordStrength - 1] || '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center py-8"
    >
      <div className="glass max-w-md w-full p-8 rounded-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#d4af37]/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-star text-4xl text-[#d4af37]"></i>
          </div>
          <h1 className="text-3xl font-bold text-[#d4af37] mb-2">Create Account</h1>
          <p className="text-white/70">Join our Islamic community</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Full Name</label>
            <div className="relative">
              <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-white/30"></i>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none transition"
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Email Address</label>
            <div className="relative">
              <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-white/30"></i>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none transition"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Password</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-white/30"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none transition"
                placeholder="Create a password"
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
            
            {/* Password Strength Meter */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-1 h-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-full rounded ${
                        i < passwordStrength ? getStrengthColor() : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-white/30 mt-1">{getStrengthText()}</p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Confirm Password</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-white/30"></i>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none transition"
                placeholder="Confirm your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
              >
                <i className={`fas fa-${showConfirmPassword ? 'eye-slash' : 'eye'}`}></i>
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <p className={`text-xs mt-1 ${
                formData.password === formData.confirmPassword 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {formData.password === formData.confirmPassword 
                  ? '✓ Passwords match' 
                  : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          {/* Terms and Conditions */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-[#d4af37]"
            />
            <span className="text-sm text-white/50">
              I agree to the{' '}
              <Link to="/terms" className="text-[#d4af37] hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-[#d4af37] hover:underline">Privacy Policy</Link>
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Creating Account...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i>
                Sign Up
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-white/50">
            Already have an account?{' '}
            <Link to="/login" className="text-[#d4af37] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Register;
