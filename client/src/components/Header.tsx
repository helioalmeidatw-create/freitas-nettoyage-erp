import React, { useState } from 'react';
import { 
  Bell, Globe, Menu, User as UserIcon, LogOut, CheckCircle2, 
  AlertTriangle, Settings
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { GlobalSearch } from './GlobalSearch';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (page: string, id?: string) => void;
  activePage: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNavigate
}) => {
  const { language, setLanguage, t } = useI18n();
  const { settings } = useCompany();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <GlobalSearch onNavigate={onNavigate} />
      </div>

      {/* Right: Language Selector, Notifications, User Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Language Selector: PT | FR | EN */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setLanguage('pt')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              language === 'pt' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Português"
          >
            PT
          </button>
          <button
            onClick={() => setLanguage('fr')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              language === 'fr' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Français"
          >
            FR
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              language === 'en' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="English"
          >
            EN
          </button>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl relative transition-colors"
            title={t('notifications')}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-scale-up">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{t('notifications')}</span>
                <span className="text-[10px] bg-sky-100 text-sky-700 font-semibold px-2 py-0.5 rounded-full">3 Novas</span>
              </div>
              <div className="divide-y divide-slate-50">
                <div className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Serviço Concluído</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">SRV-2026-001 (Jardins da Alameda) concluído pela Equipa Alpha.</p>
                </div>
                <div className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Alerta de Stock Mínimo</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Recarga Mopa Microfibra atingiu 3 unidades (Mín: 6).</p>
                </div>
                <div className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Pagamento Parcial Recebido</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Fatura FT-2026-003 recebeu 500,00€ de sinal.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm"
              style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
            >
              FN
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">Admin Freitas Nettoyage</div>
              <div className="text-[10px] text-slate-500 font-medium">Administrador Geral</div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-scale-up">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-800">Admin Freitas Nettoyage</div>
                <div className="text-[11px] text-slate-500 truncate">{settings.email}</div>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); onNavigate('settings'); }}
                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('navSettings')}</span>
              </button>
              <button
                onClick={() => { setShowUserMenu(false); onNavigate('users'); }}
                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('navUsers')}</span>
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Terminar Sessão</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
