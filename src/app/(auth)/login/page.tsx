'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        const message = result.error === 'CredentialsSignin'
          ? 'Usuário ou senha incorretos.'
          : 'Não foi possível entrar. Tente novamente.';
        setError(message);
      } else if (result?.ok) {
        router.push('/kanban');
        router.refresh();
      } else {
        setError('Ocorreu um erro inesperado');
      }
    } catch {
      setError('Ocorreu um erro. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-5">
            <div className="w-20 h-20 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-100 rounded-2xl flex items-center justify-center shadow-2xl shadow-zinc-900/20 dark:shadow-zinc-100/10 transform hover:scale-105 transition-transform duration-300">
              <span className="text-white dark:text-zinc-900 font-bold text-3xl tracking-tight">H</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-zinc-50 dark:border-zinc-950 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Hype CRM</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Entre para acessar sua workspace</p>
        </div>

        {/* Login Form */}
        <div className="relative bg-white dark:bg-zinc-900/50 rounded-3xl p-8 border border-zinc-100 dark:border-zinc-800/50 shadow-2xl shadow-zinc-200/50 dark:shadow-zinc-950/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-50/50 to-transparent dark:from-zinc-800/20 pointer-events-none" />
          <form onSubmit={handleSubmit} className="relative space-y-5">
            {error && (
              <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium animate-in slide-in-from-top-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                Usuário
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all duration-200"
                  placeholder="Seu usuário"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
                Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-300 dark:focus:border-zinc-600 transition-all duration-200"
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 hover:from-zinc-800 hover:to-zinc-700 dark:hover:from-zinc-200 dark:hover:to-zinc-300 text-white dark:text-zinc-900 py-3 px-4 rounded-xl font-semibold shadow-lg shadow-zinc-900/20 dark:shadow-zinc-100/10 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Entrando...
                </span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Entrar</span>
                  <Sparkles className="w-4 h-4 ml-1 opacity-60" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Credentials Hint */}
        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Demo: <code className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-700 dark:text-zinc-300 font-semibold">admin</code>
            <span className="mx-2 text-zinc-300 dark:text-zinc-700">•</span>
            <code className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-700 dark:text-zinc-300 font-semibold">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
