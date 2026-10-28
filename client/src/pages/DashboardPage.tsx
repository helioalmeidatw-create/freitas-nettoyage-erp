import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, Sparkles, CheckCircle2, Clock, AlertTriangle, 
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Calendar, FileText, ChevronRight, Activity
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import type { DashboardData } from '../types';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { t } = useI18n();
  const { settings } = useCompany();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold">{t('loading')}</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: t('dashTotalClients'),
      value: data.totalClients,
      icon: Users,
      page: 'clients',
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: t('dashTotalProperties'),
      value: data.totalProperties,
      icon: Building2,
      page: 'properties',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: t('dashTodayServices'),
      value: data.todayServicesCount,
      icon: Sparkles,
      page: 'services',
      color: 'text-sky-600',
      bg: 'bg-sky-50'
    },
    {
      label: t('dashCompletedServices'),
      value: data.completedServicesCount,
      icon: CheckCircle2,
      page: 'services',
      color: 'text-teal-600',
      bg: 'bg-teal-50'
    },
    {
      label: t('dashPendingServices'),
      value: data.pendingServicesCount,
      icon: Clock,
      page: 'services',
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: t('dashDelayedServices'),
      value: data.delayedServicesCount,
      icon: AlertTriangle,
      page: 'services',
      color: data.delayedServicesCount > 0 ? 'text-rose-600' : 'text-slate-400',
      bg: data.delayedServicesCount > 0 ? 'bg-rose-50' : 'bg-slate-50'
    }
  ];

  const financialCards = [
    {
      label: t('dashBilled'),
      value: `${data.totalBilled.toFixed(2)} €`,
      icon: TrendingUp,
      textColor: 'text-emerald-600',
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-100'
    },
    {
      label: t('dashOutstanding'),
      value: `${data.totalOutstanding.toFixed(2)} €`,
      icon: ArrowUpRight,
      textColor: 'text-amber-600',
      bg: 'bg-amber-50/50',
      border: 'border-amber-100'
    },
    {
      label: t('dashExpenses'),
      value: `${data.totalExpenses.toFixed(2)} €`,
      icon: TrendingDown,
      textColor: 'text-rose-600',
      bg: 'bg-rose-50/50',
      border: 'border-rose-100'
    },
    {
      label: t('dashNetProfit'),
      value: `${data.netEstimated.toFixed(2)} €`,
      icon: DollarSign,
      textColor: data.netEstimated >= 0 ? 'text-blue-600' : 'text-rose-600',
      bg: 'bg-sky-50/50',
      border: 'border-sky-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {t('dashTitle')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {t('dashSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('services')}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('addService')}</span>
          </button>
          <button
            onClick={() => onNavigate('quotes')}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{t('addQuote')}</span>
          </button>
        </div>
      </div>

      {/* Operational KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(card.page)}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 truncate">{card.label}</span>
                <div className={`p-1.5 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border ${card.border} ${card.bg} shadow-sm flex items-center justify-between`}
            >
              <div>
                <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                <p className={`text-2xl font-extrabold mt-1 tracking-tight ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                <Icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart & Upcoming Interventions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Revenue vs Expenses Bar/Evolution Chart */}
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('dashRevenueExpensesChart')}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Últimos meses de operação calculados em tempo real</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
                Receitas
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-md bg-rose-400 inline-block"></span>
                Despesas
              </span>
            </div>
          </div>

          {/* Visual Bar representation */}
          <div className="space-y-4 pt-2">
            {data.chartData.map((item, idx) => {
              const maxVal = Math.max(
                ...data.chartData.map(c => Math.max(c.receitas, c.despesas)), 
                1000
              );
              const revPercent = Math.min(100, Math.round((item.receitas / maxVal) * 100));
              const expPercent = Math.min(100, Math.round((item.despesas / maxVal) * 100));

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{item.month}</span>
                    <span className="text-slate-500 font-medium">
                      +{item.receitas.toFixed(2)}€ / -{item.despesas.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex items-center gap-2 h-4 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${revPercent}%` }}
                      title={`Receitas: ${item.receitas}€`}
                    />
                    <div 
                      className="h-full bg-rose-400 rounded-full transition-all duration-500"
                      style={{ width: `${expPercent}%` }}
                      title={`Despesas: ${item.despesas}€`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Services List */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">{t('dashUpcomingInterventions')}</h3>
              <button 
                onClick={() => onNavigate('services')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                Ver todos
              </button>
            </div>

            {data.upcomingInterventions.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">{t('dashNoInterventions')}</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingInterventions.map((inv) => (
                  <div 
                    key={inv.id}
                    onClick={() => onNavigate('services')}
                    className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate">{inv.propertyName}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{inv.scheduledDate}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-1">
                      {inv.clientName} • {inv.startTime} - {inv.endTime}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                        {inv.code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        inv.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Company Activity */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('dashRecentActivity')}</span>
            </div>
            <div className="space-y-2">
              {data.recentActivity.slice(0, 3).map((act: any) => (
                <div key={act.id} className="text-[11px] text-slate-500 leading-tight">
                  <span className="font-semibold text-slate-700">{act.userName}:</span> {act.details}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
