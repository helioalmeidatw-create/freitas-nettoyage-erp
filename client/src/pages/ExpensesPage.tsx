import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Filter, Trash2, Calendar, Tag, Truck } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import type { Expense, Supplier } from '../types';
import { Modal } from '../components/Modal';

export const ExpensesPage: React.FC = () => {
  const { t } = useI18n();
  const { settings } = useCompany();
  const toast = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Expense>>({
    category: 'cleaning_products',
    description: '',
    amount: 50,
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [resExp, resSup] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/suppliers')
      ]);
      if (resExp.ok) setExpenses(await resExp.json());
      if (resSup.ok) setSuppliers(await resSup.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description?.trim() || !formData.amount) {
      toast.warning('Indique a descrição e o montante da despesa.');
      return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('Despesa registada com sucesso!');
        setIsFormOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error('Erro ao registar despesa.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminar esta despesa?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Despesa eliminada.');
        fetchData();
      }
    } catch (err) {
      toast.error('Erro ao eliminar despesa.');
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'cleaning_products': return t('expCleaningProducts');
      case 'equipment': return t('expEquipment');
      case 'fuel': return t('expFuel');
      case 'transport': return t('expTransport');
      case 'maintenance': return t('expMaintenance');
      case 'uniforms': return t('expUniforms');
      case 'insurance': return t('expInsurance');
      case 'salaries': return t('expSalaries');
      default: return t('expOther');
    }
  };

  const totalAmount = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {t('expensesTitle')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {t('expensesSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Despesas:</span>
            <span className="text-sm font-black text-rose-600">{totalAmount.toFixed(2)} €</span>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
          >
            <Plus className="w-4 h-4" />
            <span>{t('addExpense')}</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">{t('loading')}</div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{t('noData')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t('date')}</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">{t('expenseCategory')}</th>
                  <th className="py-3 px-4">Fornecedor</th>
                  <th className="py-3 px-4">Montante</th>
                  <th className="py-3 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {exp.description}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                        {getCategoryLabel(exp.category)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {exp.supplierName || '-'}
                    </td>
                    <td className="py-3 px-4 font-black text-rose-600">
                      {Number(exp.amount).toFixed(2)} €
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Expense */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t('addExpense')}
        subtitle="Registe os custos incorridos na operação diária."
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição da Despesa *
            </label>
            <input
              type="text"
              required
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Abastecimento de combustível Renault Master..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('expenseCategory')}
            </label>
            <select
              value={formData.category || 'cleaning_products'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="cleaning_products">{t('expCleaningProducts')}</option>
              <option value="equipment">{t('expEquipment')}</option>
              <option value="fuel">{t('expFuel')}</option>
              <option value="transport">{t('expTransport')}</option>
              <option value="maintenance">{t('expMaintenance')}</option>
              <option value="uniforms">{t('expUniforms')}</option>
              <option value="insurance">{t('expInsurance')}</option>
              <option value="salaries">{t('expSalaries')}</option>
              <option value="other">{t('expOther')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Montante (€) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount || 0}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('date')}
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fornecedor Associado (Opcional)
            </label>
            <select
              value={formData.supplierId || ''}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="">Nenhum fornecedor</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md"
              style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
            >
              {t('save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
