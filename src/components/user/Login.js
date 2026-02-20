import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login as loginService } from '../../services/auth';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  // Load saved email if "Remember Me" was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedRememberMe && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    try {
      setLoading(true);
      
      // Pass rememberMe to login service (for backend token expiration)
      const responseData = await loginService(email, password, rememberMe);
      
      // Handle Remember Me for frontend
      if (rememberMe) {
        // Save email for 30 days
        localStorage.setItem('savedEmail', email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        // Clear saved data
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('rememberMe');
      }
      
      // Update auth context
      login(responseData.user);
      
      toast.success('Logged in successfully!');
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Show appropriate error message
      if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[80vh] flex items-center justify-center py-8 px-4"
    >
      <div className="glass max-w-md w-full p-8 rounded-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#d4af37]/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-moon text-4xl text-[#d4af37]"></i>
          </div>
          <h1 className="text-3xl font-bold text-[#d4af37] mb-2">Welcome Back</h1>
          <p className="text-white/70">Sign in to continue your journey</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
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
                required
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none transition"
                placeholder="Enter your password"
                disabled={loading}
                required
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                  rememberMe 
                    ? 'bg-[#d4af37] border-[#d4af37]' 
                    : 'bg-transparent border-white/30 group-hover:border-white/50'
                }`}>
                  {rememberMe && (
                    <i className="fas fa-check text-[#1a3f54] text-xs absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></i>
                  )}
                </div>
              </div>
              <span className="text-sm text-white/50 group-hover:text-white/70 transition">
                Remember me
              </span>
            </label>
            
            <Link 
              to="/forgot-password" 
              className="text-sm text-[#d4af37] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Signing in...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-white/50">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#d4af37] hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>

        {/* Remember Me Info */}
        {rememberMe && (
          <div className="mt-4 p-3 bg-[#d4af37]/10 rounded-lg text-center">
            <p className="text-xs text-[#d4af37] flex items-center justify-center gap-1">
              <i className="fas fa-info-circle"></i>
              You'll stay logged in on this device for 30 days
            </p>
          </div>
        )}

        {/* Islamic Quote */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-sm text-white/30 italic">
            "Seeking knowledge is an obligation upon every Muslim"
          </p>
          <p className="text-center text-xs text-white/20 mt-2">
            - Prophet Muhammad (ﷺ)
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
