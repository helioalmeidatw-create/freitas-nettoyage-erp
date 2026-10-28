import React, { useState } from 'react';
import { Lock, Mail, Sparkles, Shield, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { settings } = useCompany();
  const toast = useToast();

  const [email, setEmail] = useState('admin@freitas-nettoyage.com');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success(`Bem-vindo ao ${settings.tradeName || 'Freitas Nettoyage ERP'}!`);
      } else {
        // Tenta também com e-mail fallback caso o utilizador use admin@cleanpro.com
        const fallbackSuccess = await login('admin@cleanpro.com', password);
        if (fallbackSuccess) {
          toast.success(`Bem-vindo ao ${settings.tradeName || 'Freitas Nettoyage ERP'}!`);
        } else {
          toast.error('E-mail ou palavra-passe incorretos.');
        }
      }
    } catch (err) {
      toast.error('Erro de conexão ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('admin');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 antialiased text-slate-800">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div 
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white shadow-xl shadow-sky-500/20 mb-4 animate-scale-up"
            style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
          >
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {settings.tradeName || 'Freitas Nettoyage'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Sistema Integrado de Gestão Empresarial & Operações
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Iniciar Sessão</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Introduza as suas credenciais para aceder ao ERP.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@freitas-nettoyage.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Palavra-passe
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-slate-600 font-medium">Manter sessão ativa</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-xs sm:text-sm font-bold text-white rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Badges for Ease of Use */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Acesso Rápido com 1 Clique:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleFillDemo('admin@freitas-nettoyage.com')}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200/80 transition-colors"
              >
                <div className="font-bold text-slate-800">Administrador</div>
                <div className="text-[10px] text-slate-400 truncate">admin@freitas-nettoyage.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('operacoes@cleanpro.com')}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border border-slate-200/80 transition-colors"
              >
                <div className="font-bold text-slate-800">Operacional</div>
                <div className="text-[10px] text-slate-400 truncate">operacoes@cleanpro.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Ligação Segura SSL • Freitas Nettoyage Enterprise</span>
        </div>
      </div>
    </div>
  );
};
