import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { login } from '../services/auth';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    try {
      setLoading(true);
      const response = await login(formData.email, formData.password);
      
      if (response.success) {
        toast.success(t('auth.loginSuccess'));
        navigate('/profile');
      } else {
        toast.error(response.message || t('auth.loginFailed'));
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[80vh] flex items-center justify-center p-4"
    >
      <div className="glass max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#d4af37]/20 mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-user text-3xl text-[#d4af37]"></i>
          </div>
          <h1 className="text-2xl font-bold text-[#d4af37] mb-2">
            {t('auth.welcomeBack')}
          </h1>
          <p className="text-white/70">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm text-white/50 mb-2">
              {t('auth.email')}
            </label>
            <div className="relative">
              <i className="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-white/30"></i>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm text-white/50 mb-2">
              {t('auth.password')}
            </label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-white/30"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/30 hover:text-white/50"
              >
                <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <Link 
              to="/forgot-password" 
              className="text-sm text-[#d4af37] hover:underline"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                {t('auth.loggingIn')}
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                {t('auth.login')}
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-white/50">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-[#d4af37] hover:underline font-bold">
              {t('auth.registerNow')}
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-white/5 rounded-lg">
          <p className="text-sm text-white/50 mb-2 text-center">
            {t('auth.demoCredentials')}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-white/30">Email:</div>
            <div className="text-white/70">test@example.com</div>
            <div className="text-white/30">Password:</div>
            <div className="text-white/70">password123</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;
