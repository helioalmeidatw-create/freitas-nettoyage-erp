import { 
  LayoutDashboard, Sparkles, Calendar, Building2, Users, 
  FileText, ShieldCheck, Receipt, DollarSign, Truck, 
  Package, UserCog, BarChart3, Settings, Shield, X, LogOut
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activePage,
  onNavigate
}) => {
  const { t } = useI18n();
  const { settings } = useCompany();
  const { logout } = useAuth();

  const navSections = [
    {
      title: t('navOverview'),
      items: [
        { id: 'dashboard', label: t('navDashboard'), icon: LayoutDashboard }
      ]
    },
    {
      title: t('navOperations'),
      items: [
        { id: 'services', label: t('navServices'), icon: Sparkles },
        { id: 'planning', label: t('navPlanning'), icon: Calendar },
        { id: 'properties', label: t('navProperties'), icon: Building2 }
      ]
    },
    {
      title: t('navCommercial'),
      items: [
        { id: 'clients', label: t('navClients'), icon: Users },
        { id: 'quotes', label: t('navQuotes'), icon: FileText },
        { id: 'contracts', label: t('navContracts'), icon: ShieldCheck }
      ]
    },
    {
      title: t('navFinancial'),
      items: [
        { id: 'invoices', label: t('navInvoices'), icon: Receipt },
        { id: 'expenses', label: t('navExpenses'), icon: DollarSign },
        { id: 'suppliers', label: t('navSuppliers'), icon: Truck },
        { id: 'inventory', label: t('navInventory'), icon: Package }
      ]
    },
    {
      title: t('navHR'),
      items: [
        { id: 'employees', label: t('navEmployees'), icon: UserCog }
      ]
    },
    {
      title: t('navAnalytics'),
      items: [
        { id: 'reports', label: t('navReports'), icon: BarChart3 }
      ]
    },
    {
      title: t('navSettings'),
      items: [
        { id: 'settings', label: t('navSettings'), icon: Settings },
        { id: 'users', label: t('navUsers'), icon: Shield }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 font-black text-sm"
              style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-white tracking-tight truncate">
                {settings.tradeName || 'Freitas Nettoyage'}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Facility & Cleaning Management
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                        isActive 
                          ? 'text-white shadow-md' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                      style={isActive ? { backgroundColor: settings.primaryColor || '#0284c7' } : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Brand Info & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="truncate">Freitas Nettoyage v2.4</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {settings.city}, {settings.country}
              </div>
            </div>
            <button
              onClick={logout}
              title="Terminar Sessão"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
