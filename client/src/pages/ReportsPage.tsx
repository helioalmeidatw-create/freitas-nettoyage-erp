import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Building2, Download } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';

export const ReportsPage: React.FC = () => {
  const { t } = useI18n();
  const { settings } = useCompany();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports/profitability');
      if (res.ok) {
        const json = await res.json();
        setReports(json.clientReports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const totalBilled = reports.reduce((acc, r) => acc + (r.totalBilled || 0), 0);
  const totalPaid = reports.reduce((acc, r) => acc + (r.totalPaid || 0), 0);
  const totalOutstanding = reports.reduce((acc, r) => acc + (r.outstanding || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {t('reportsTitle')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {t('reportsSubtitle')}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">{t('repTotalBilled')}</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalBilled.toFixed(2)} €</div>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-emerald-100 bg-emerald-50/30 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">{t('repTotalReceived')}</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{totalPaid.toFixed(2)} €</div>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-amber-100 bg-amber-50/30 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">{t('repPendingBalance')}</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{totalOutstanding.toFixed(2)} €</div>
        </div>
      </div>

      {/* Client Profitability Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">{t('repClientProfitability')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Código / Cliente</th>
                <th className="py-3 px-4">Imóveis Atendidos</th>
                <th className="py-3 px-4">Contratos Ativos</th>
                <th className="py-3 px-4">{t('repTotalBilled')}</th>
                <th className="py-3 px-4">{t('repTotalReceived')}</th>
                <th className="py-3 px-4">{t('repPendingBalance')}</th>
                <th className="py-3 px-4 text-right">Rentabilidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {reports.map((row) => (
                <tr key={row.clientId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sky-700 font-bold block">{row.clientCode}</span>
                    <span className="font-bold text-slate-900">{row.clientName}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {row.propertiesCount} Edifícios
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {row.contractsCount} Contratos
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {Number(row.totalBilled).toFixed(2)} €
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-600">
                    {Number(row.totalPaid).toFixed(2)} €
                  </td>
                  <td className="py-3 px-4 font-bold text-amber-600">
                    {Number(row.outstanding).toFixed(2)} €
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      row.totalPaid > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {row.profitStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
