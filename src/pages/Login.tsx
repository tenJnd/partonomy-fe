import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLang } from '../hooks/useLang';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const lang = useLang();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/app/documents', { replace: true });
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
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('auth.welcomeBack')}</h1>
            <p className="text-sm text-gray-600">{t('auth.signInToAccount')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-900">{t('auth.authenticationError')}</p>
                <p className="text-sm text-rose-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.emailAddress')}
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
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                  placeholder={t('auth.enterPassword')}
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
                <span className="ml-2 text-sm text-gray-600">{t('auth.rememberMe')}</span>
              </label>
              <Link
                to={`/${lang}/forgot-password`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed"
            >
              {loading ? t('auth.signingIn') : t('auth.login')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('auth.dontHaveAccount')}{' '}
              <Link
                to={`/${lang}/signup`}
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          {t('auth.agreeToTerms')}{' '}
          <a href="#" className="text-gray-700 hover:text-gray-900 underline">
            {t('auth.termsOfService')}
          </a>{' '}
          {t('auth.and')}{' '}
          <a href="#" className="text-gray-700 hover:text-gray-900 underline">
            {t('auth.privacyPolicy')}
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
