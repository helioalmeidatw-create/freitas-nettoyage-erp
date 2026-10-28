import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, Filter, MapPin, Key, Clock, 
  Layers, User, Edit, Trash2, ShieldCheck, Eye 
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import type { Property, Client, PropertyType } from '../types';
import { Modal } from '../components/Modal';

export const PropertiesPage: React.FC = () => {
  const { t } = useI18n();
  const { settings } = useCompany();
  const toast = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const [formData, setFormData] = useState<Partial<Property>>({
    name: '',
    clientId: '',
    type: 'condominium',
    address: '',
    postalCode: '',
    city: '',
    buildingsCount: 1,
    floorsCount: 4,
    stairsCount: 2,
    elevatorsCount: 1,
    entrancesCount: 1,
    approxArea: 500,
    flooringType: 'Mármore e granito polido',
    commonAreasDescription: 'Hall de entrada, escadaria principal, elevadores e patamares.',
    cleaningFrequency: '2 vezes por semana',
    authorizedHours: '08:00 - 12:00',
    siteContact: '',
    accessInstructions: '',
    notes: '',
    status: 'active'
  });

  const fetchProperties = async () => {
    try {
      let url = `/api/properties?search=${encodeURIComponent(search)}`;
      if (filterType !== 'all') url += `&type=${filterType}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setProperties(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const json = await res.json();
        setClients(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchClients();
  }, [search, filterType]);

  const handleOpenCreate = () => {
    setSelectedProperty(null);
    setFormData({
      name: '',
      clientId: clients[0]?.id || '',
      type: 'condominium',
      address: '',
      postalCode: '',
      city: '',
      buildingsCount: 1,
      floorsCount: 4,
      stairsCount: 2,
      elevatorsCount: 1,
      entrancesCount: 1,
      approxArea: 500,
      flooringType: 'Mármore e pedra calcária',
      commonAreasDescription: 'Hall de entrada, escadas, elevadores e patamares de acesso.',
      cleaningFrequency: '2x por semana',
      authorizedHours: '08:30 - 12:00',
      siteContact: '',
      accessInstructions: '',
      notes: '',
      status: 'active'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (prop: Property) => {
    setSelectedProperty(prop);
    setFormData(prop);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.clientId) {
      toast.warning('O nome do imóvel e o cliente associado são obrigatórios.');
      return;
    }

    try {
      const method = selectedProperty ? 'PUT' : 'POST';
      const endpoint = selectedProperty ? `/api/properties/${selectedProperty.id}` : '/api/properties';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(selectedProperty ? 'Imóvel atualizado!' : 'Novo imóvel registado!');
        setIsFormOpen(false);
        fetchProperties();
      } else {
        toast.error('Erro ao guardar imóvel.');
      }
    } catch (err) {
      toast.error('Falha de ligação ao servidor.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem a certeza que deseja eliminar este imóvel?')) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Imóvel eliminado com sucesso.');
        fetchProperties();
      }
    } catch (err) {
      toast.error('Erro ao eliminar imóvel.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {t('propertiesTitle')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {t('propertiesSubtitle')}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
        >
          <Plus className="w-4 h-4" />
          <span>{t('addProperty')}</span>
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
            placeholder="Pesquisar imóvel, morada ou código..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 w-full md:w-auto"
        >
          <option value="all">Todos os Tipos de Imóveis</option>
          <option value="condominium">Condomínio Residencial</option>
          <option value="residential_building">Prédio / Edifício</option>
          <option value="office">Escritórios / Corporativo</option>
          <option value="commercial_building">Edifício Comercial</option>
        </select>
      </div>

      {/* Properties Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">{t('loading')}</div>
      ) : properties.length === 0 ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">{t('noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map(prop => (
            <div 
              key={prop.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md">
                    {prop.code}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {prop.cleaningFrequency || 'Semanal'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{prop.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{prop.address}, {prop.city}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Cliente: <span className="text-slate-700 font-semibold">{prop.clientName}</span>
                </div>

                {/* Technical Counters */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 bg-slate-50 rounded-xl text-center">
                  <div>
                    <div className="text-xs font-black text-slate-800">{prop.floorsCount}</div>
                    <div className="text-[10px] text-slate-500">Pisos</div>
                  </div>
                  <div className="border-x border-slate-200">
                    <div className="text-xs font-black text-slate-800">{prop.stairsCount}</div>
                    <div className="text-[10px] text-slate-500">Escadas</div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800">{prop.elevatorsCount}</div>
                    <div className="text-[10px] text-slate-500">Elevadores</div>
                  </div>
                </div>

                {/* Access Code Preview */}
                {prop.accessInstructions && (
                  <div className="mt-3 p-2 bg-amber-50/70 border border-amber-200/50 rounded-lg flex items-start gap-2 text-[11px] text-amber-900">
                    <Key className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{prop.accessInstructions}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  {prop.approxArea ? `${prop.approxArea} m²` : 'Área não definida'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setSelectedProperty(prop); setIsDetailOpen(true); }}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                    title="Ver Detalhes Técnicos"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(prop)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title={t('edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(prop.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title={t('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Property */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedProperty ? 'Editar Imóvel' : t('addProperty')}
        subtitle="Registe os detalhes técnicos e operacionais de limpeza do edifício."
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('propName')} *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Condomínio Edifício Miradouro - Bloco A"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('propClient')} *
              </label>
              <select
                required
                value={formData.clientId || ''}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="">Selecione o Cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('propType')}
              </label>
              <select
                value={formData.type || 'condominium'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PropertyType })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="condominium">Condomínio Residencial</option>
                <option value="residential_building">Prédio / Edifício</option>
                <option value="office">Escritórios / Cowork</option>
                <option value="commercial_building">Edifício Comercial</option>
                <option value="villa">Moradia</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('address')}
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Morada completa..."
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
                placeholder="Lisboa..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {/* Counters */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('propFloors')}
              </label>
              <input
                type="number"
                min="1"
                value={formData.floorsCount || 1}
                onChange={(e) => setFormData({ ...formData, floorsCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('propStairs')}
              </label>
              <input
                type="number"
                min="0"
                value={formData.stairsCount || 1}
                onChange={(e) => setFormData({ ...formData, stairsCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('propElevators')}
              </label>
              <input
                type="number"
                min="0"
                value={formData.elevatorsCount || 0}
                onChange={(e) => setFormData({ ...formData, elevatorsCount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('propArea')}
              </label>
              <input
                type="number"
                min="0"
                value={formData.approxArea || 0}
                onChange={(e) => setFormData({ ...formData, approxArea: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo de Pavimento / Piso
              </label>
              <input
                type="text"
                value={formData.flooringType || ''}
                onChange={(e) => setFormData({ ...formData, flooringType: e.target.value })}
                placeholder="Ex: Mármore polido, granito, cerâmica, vinílico..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('propFrequency')}
              </label>
              <input
                type="text"
                value={formData.cleaningFrequency || ''}
                onChange={(e) => setFormData({ ...formData, cleaningFrequency: e.target.value })}
                placeholder="Ex: 2x por semana (Terças e Sextas)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('propHours')}
              </label>
              <input
                type="text"
                value={formData.authorizedHours || ''}
                onChange={(e) => setFormData({ ...formData, authorizedHours: e.target.value })}
                placeholder="Ex: 08:30 - 12:00"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('propAccess')}
              </label>
              <textarea
                rows={2}
                value={formData.accessInstructions || ''}
                onChange={(e) => setFormData({ ...formData, accessInstructions: e.target.value })}
                placeholder="Código do portão (Ex: 4821#), localização das chaves, contacto do porteiro..."
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

      {/* Modal: View Technical Specs */}
      {selectedProperty && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Especificações Técnicas: ${selectedProperty.name}`}
          subtitle={`Código: ${selectedProperty.code} • ${selectedProperty.city}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-slate-500 block mb-1">Localização:</span>
                <div className="text-slate-800">{selectedProperty.address}</div>
                <div className="text-slate-500">{selectedProperty.postalCode} {selectedProperty.city}</div>
              </div>
              <div>
                <span className="font-bold text-slate-500 block mb-1">Cliente Responsável:</span>
                <div className="text-slate-800 font-semibold">{selectedProperty.clientName}</div>
              </div>
            </div>

            <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100">
              <span className="font-bold text-sky-800 block mb-2">Instruções de Acesso & Segurança:</span>
              <p className="text-sky-950 font-medium whitespace-pre-line">
                {selectedProperty.accessInstructions || 'Sem instruções específicas de segurança registadas.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-500 block mb-1">Horário Autorizado:</span>
                <span className="text-slate-800">{selectedProperty.authorizedHours || 'Livre'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-500 block mb-1">Frequência:</span>
                <span className="text-slate-800">{selectedProperty.cleaningFrequency || 'Conforme Contrato'}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
