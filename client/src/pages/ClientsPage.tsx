import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Filter, Phone, Mail, MapPin, Building2, 
  FileText, ShieldCheck, Receipt, Edit, Trash2, Eye, X, CheckCircle2 
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import type { Client, ClientType } from '../types';
import { Modal } from '../components/Modal';

export const ClientsPage: React.FC = () => {
  const { t } = useI18n();
  const { settings } = useCompany();
  const toast = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDetailData, setClientDetailData] = useState<any | null>(null);

  // Form fields
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    tradeName: '',
    type: 'condo_admin',
    contactPerson: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'Portugal',
    taxId: '',
    vatNumber: '',
    website: '',
    notes: '',
    status: 'active'
  });

  const fetchClients = async () => {
    try {
      let url = `/api/clients?search=${encodeURIComponent(search)}`;
      if (filterType !== 'all') url += `&type=${filterType}`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setClients(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, filterType, filterStatus]);

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setFormData({
      name: '',
      tradeName: '',
      type: 'condo_admin',
      contactPerson: '',
      phone: '',
      mobile: '',
      email: '',
      address: '',
      postalCode: '',
      city: '',
      country: settings.country || 'Portugal',
      taxId: '',
      vatNumber: '',
      website: '',
      notes: '',
      status: 'active'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData(client);
    setIsFormOpen(true);
  };

  const handleOpenDetail = async (client: Client) => {
    try {
      const res = await fetch(`/api/clients/${client.id}`);
      if (res.ok) {
        const full = await res.json();
        setClientDetailData(full);
        setIsDetailOpen(true);
      }
    } catch (err) {
      toast.error('Erro ao carregar ficha do cliente.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.warning('O nome do cliente é obrigatório.');
      return;
    }

    try {
      const method = selectedClient ? 'PUT' : 'POST';
      const endpoint = selectedClient ? `/api/clients/${selectedClient.id}` : '/api/clients';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(selectedClient ? 'Cliente atualizado com sucesso!' : 'Novo cliente registado com sucesso!');
        setIsFormOpen(false);
        fetchClients();
      } else {
        toast.error('Erro ao guardar cliente.');
      }
    } catch (err) {
      toast.error('Falha de ligação ao servidor.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem a certeza que deseja eliminar este cliente?')) return;

    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Cliente eliminado com sucesso.');
        fetchClients();
      } else {
        toast.error('Não foi possível eliminar o cliente.');
      }
    } catch (err) {
      toast.error('Falha ao comunicar com o servidor.');
    }
  };

  const getTypeLabel = (type: ClientType) => {
    switch (type) {
      case 'particular': return t('typeParticular');
      case 'company': return t('typeCompany');
      case 'condo': return t('typeCondo');
      case 'condo_admin': return t('typeCondoAdmin');
      case 'real_estate_agency': return t('typeRealEstate');
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {t('clientsTitle')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {t('clientsSubtitle')}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
        >
          <Plus className="w-4 h-4" />
          <span>{t('addClient')}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, código, NIF ou cidade..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">Todos os Tipos</option>
            <option value="condo_admin">Administrador de Condomínio</option>
            <option value="condo">Condomínio</option>
            <option value="company">Empresa</option>
            <option value="particular">Particular</option>
            <option value="real_estate_agency">Agência Imobiliária</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">Todos os Estados</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
            <option value="archived">{t('archived')}</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">{t('loading')}</div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{t('noData')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t('clientCode')}</th>
                  <th className="py-3 px-4">{t('clientName')}</th>
                  <th className="py-3 px-4">{t('clientType')}</th>
                  <th className="py-3 px-4">Contactos</th>
                  <th className="py-3 px-4">{t('clientCity')}</th>
                  <th className="py-3 px-4">NIF / SIRET</th>
                  <th className="py-3 px-4">{t('status')}</th>
                  <th className="py-3 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {clients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">
                      {client.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{client.name}</div>
                      {client.contactPerson && (
                        <div className="text-[11px] text-slate-400">Resp: {client.contactPerson}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                        {getTypeLabel(client.type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600">
                      {client.phone && <div>{client.phone}</div>}
                      {client.email && <div className="text-slate-400">{client.email}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {client.city || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {client.taxId || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        client.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        client.status === 'inactive' ? 'bg-slate-100 text-slate-600' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {client.status === 'active' ? t('active') : client.status === 'inactive' ? t('inactive') : t('archived')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetail(client)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Ver Ficha Completa"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(client)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title={t('edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
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

      {/* Modal Form: Create / Edit Client */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedClient ? 'Editar Cliente' : t('addClient')}
        subtitle="Registe todas as informações cadastrais e fiscais do cliente."
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('clientName')} *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Condomínio Edifício Miradouro"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('clientTradeName')}
              </label>
              <input
                type="text"
                value={formData.tradeName || ''}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                placeholder="Ex: Miradouro Residencial"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('clientType')}
              </label>
              <select
                value={formData.type || 'condo_admin'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ClientType })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="condo_admin">Administrador de Condomínio</option>
                <option value="condo">Condomínio</option>
                <option value="company">Empresa / Escritório</option>
                <option value="particular">Particular</option>
                <option value="real_estate_agency">Agência Imobiliária</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('clientContact')}
              </label>
              <input
                type="text"
                value={formData.contactPerson || ''}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Ex: Dra. Ana Paula (Administradora)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('phone')}
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+351 21 000 0000"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telemóvel / WhatsApp
              </label>
              <input
                type="text"
                value={formData.mobile || ''}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="+351 91 000 0000"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('email')}
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="gestao@empresa.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('clientTaxId')} (NIF / SIRET)
              </label>
              <input
                type="text"
                value={formData.taxId || ''}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="509876543 / 84912345600012"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('address')}
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, Número, Andar..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código Postal
              </label>
              <input
                type="text"
                value={formData.postalCode || ''}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="1000-001"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('clientCity')}
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Lisboa / Paris..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('notes')}
              </label>
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Instruções contratuais, detalhes de faturação ou particularidades do cliente..."
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

      {/* Modal: Client Detail Dossier (Ficha Completa) */}
      {clientDetailData && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Ficha do Cliente: ${clientDetailData.name}`}
          subtitle={`Código: ${clientDetailData.code} • NIF/SIRET: ${clientDetailData.taxId || '-'}`}
          maxWidth="4xl"
        >
          <div className="space-y-6">
            {/* Quick Contact & Address Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="font-bold text-slate-500 block mb-0.5">Contactos:</span>
                <div className="text-slate-800">{clientDetailData.phone || '-'}</div>
                <div className="text-slate-800">{clientDetailData.email || '-'}</div>
              </div>
              <div>
                <span className="font-bold text-slate-500 block mb-0.5">Localização:</span>
                <div className="text-slate-800">{clientDetailData.address || '-'}</div>
                <div className="text-slate-500">{clientDetailData.postalCode} {clientDetailData.city}</div>
              </div>
              <div>
                <span className="font-bold text-slate-500 block mb-0.5">Responsável / Tipo:</span>
                <div className="text-slate-800">{clientDetailData.contactPerson || '-'}</div>
                <div className="text-sky-600 font-semibold">{getTypeLabel(clientDetailData.type)}</div>
              </div>
            </div>

            {/* Imóveis Associados */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Imóveis e Condomínios Registados ({clientDetailData.properties?.length || 0})
                </h4>
              </div>
              {clientDetailData.properties?.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhum imóvel registado para este cliente.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clientDetailData.properties?.map((prop: any) => (
                    <div key={prop.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">{prop.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{prop.address}</div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                        <span>{prop.floorsCount} Pisos</span>
                        <span>•</span>
                        <span>{prop.stairsCount} Escadas</span>
                        <span>•</span>
                        <span>{prop.elevatorsCount} Elevadores</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contratos & Faturas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Contratos ({clientDetailData.contracts?.length || 0})
                  </h4>
                </div>
                <div className="space-y-2">
                  {clientDetailData.contracts?.map((c: any) => (
                    <div key={c.id} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{c.number}</div>
                        <div className="text-[11px] text-slate-500">{c.contractedServices}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sky-600">{Number(c.agreedPrice).toFixed(2)} €</div>
                        <div className="text-[10px] text-emerald-600 uppercase font-semibold">{c.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Faturação ({clientDetailData.invoices?.length || 0})
                  </h4>
                </div>
                <div className="space-y-2">
                  {clientDetailData.invoices?.map((inv: any) => (
                    <div key={inv.id} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{inv.number}</div>
                        <div className="text-[11px] text-slate-500">{inv.issueDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{Number(inv.total).toFixed(2)} €</div>
                        <div className={`text-[10px] font-semibold uppercase ${
                          inv.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {inv.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
