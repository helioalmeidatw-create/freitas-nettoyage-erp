import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Plus, Search, Filter, Calendar, DollarSign, 
  Clock, AlertTriangle, Edit, Trash2, Building2 
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import type { Contract, Client, Property } from '../types';
import { Modal } from '../components/Modal';

export const ContractsPage: React.FC = () => {
  const { t } = useI18n();
  const { settings } = useCompany();
  const toast = useToast();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const [formData, setFormData] = useState<Partial<Contract>>({
    clientId: '',
    propertyId: '',
    contractedServices: 'Limpeza bissemanal de escadas, halls e elevadores',
    frequency: '2 vezes por semana',
    scheduledTimes: '08:30 - 11:00',
    agreedPrice: 380,
    paymentConditions: '30 dias',
    startDate: new Date().toISOString().split('T')[0],
    renewalTerms: 'Renovação anual automática',
    terminationTerms: 'Aviso prévio de 30 dias',
    notes: '',
    status: 'active'
  });

  const fetchData = async () => {
    try {
      const [resContracts, resClients, resProps] = await Promise.all([
        fetch('/api/contracts'),
        fetch('/api/clients'),
        fetch('/api/properties')
      ]);
      if (resContracts.ok) setContracts(await resContracts.json());
      if (resClients.ok) setClients(await resClients.json());
      if (resProps.ok) setProperties(await resProps.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedContract(null);
    setFormData({
      clientId: clients[0]?.id || '',
      propertyId: properties[0]?.id || '',
      contractedServices: 'Limpeza de condomínio residencial (escadas e áreas comuns)',
      frequency: 'Semanal',
      scheduledTimes: '08:30 - 12:00',
      agreedPrice: 380,
      paymentConditions: 'Transferência bancária a 30 dias',
      startDate: new Date().toISOString().split('T')[0],
      renewalTerms: 'Renovação automática',
      terminationTerms: 'Aviso prévio de 30 dias',
      notes: '',
      status: 'active'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cnt: Contract) => {
    setSelectedContract(cnt);
    setFormData(cnt);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      toast.warning('Selecione o cliente associado.');
      return;
    }

    try {
      const method = selectedContract ? 'PUT' : 'POST';
      const endpoint = selectedContract ? `/api/contracts/${selectedContract.id}` : '/api/contracts';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(selectedContract ? 'Contrato atualizado!' : 'Novo contrato registado com sucesso!');
        setIsFormOpen(false);
        fetchData();
      } else {
        toast.error('Erro ao guardar contrato.');
      }
    } catch (err) {
      toast.error('Falha de ligação ao servidor.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem a certeza que deseja eliminar este contrato?')) return;
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Contrato eliminado.');
        fetchData();
      }
    } catch (err) {
      toast.error('Erro ao eliminar contrato.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {t('contractsTitle')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {t('contractsSubtitle')}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
        >
          <Plus className="w-4 h-4" />
          <span>{t('addContract')}</span>
        </button>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">{t('loading')}</div>
        ) : contracts.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{t('noData')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t('contractNumber')}</th>
                  <th className="py-3 px-4">Cliente / Imóvel</th>
                  <th className="py-3 px-4">{t('contractServices')}</th>
                  <th className="py-3 px-4">{t('propFrequency')}</th>
                  <th className="py-3 px-4">{t('contractPrice')}</th>
                  <th className="py-3 px-4">{t('status')}</th>
                  <th className="py-3 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {contracts.map(cnt => (
                  <tr key={cnt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">
                      {cnt.number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{cnt.clientName}</div>
                      <div className="text-[11px] text-slate-400">{cnt.propertyName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                      {cnt.contractedServices}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {cnt.frequency}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      {Number(cnt.agreedPrice).toFixed(2)} €
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        {cnt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(cnt)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title={t('edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cnt.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title={t('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Contract */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedContract ? 'Editar Contrato' : t('addContract')}
        subtitle="Registe os valores acordados, periodicidade e condições de renovação."
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cliente *
              </label>
              <select
                required
                value={formData.clientId || ''}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="">Selecione o Cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Imóvel Associado
              </label>
              <select
                value={formData.propertyId || ''}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="">Selecione o Imóvel...</option>
                {properties
                  .filter(p => !formData.clientId || p.clientId === formData.clientId)
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('contractServices')} *
              </label>
              <input
                type="text"
                required
                value={formData.contractedServices || ''}
                onChange={(e) => setFormData({ ...formData, contractedServices: e.target.value })}
                placeholder="Ex: Limpeza bissemanal de escadas, 2 elevadores e halls de entrada..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('contractPrice')} (€/mês) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.agreedPrice || 0}
                onChange={(e) => setFormData({ ...formData, agreedPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('propFrequency')}
              </label>
              <input
                type="text"
                value={formData.frequency || ''}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="Ex: 2x por semana (Terças e Sextas)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('contractStart')}
              </label>
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('contractEnd')} (Opcional)
              </label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('contractRenewal')}
              </label>
              <input
                type="text"
                value={formData.renewalTerms || ''}
                onChange={(e) => setFormData({ ...formData, renewalTerms: e.target.value })}
                placeholder="Ex: Renovação tácita anual salvo oposição escrita prévia de 60 dias..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all"
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
