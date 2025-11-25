import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/documents', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <LogIn className="w-6 h-6 text-blue-600" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-sm text-gray-600">Sign in to your Partonomy account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-900">Authentication Error</p>
                <p className="text-sm text-rose-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500/40"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <a href="#" className="text-gray-700 hover:text-gray-900 underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-gray-700 hover:text-gray-900 underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
