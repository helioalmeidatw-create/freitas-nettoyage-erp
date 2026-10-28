import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Search, Calendar, Clock, 
  CheckSquare, CheckCircle2, AlertTriangle, Edit, Trash2,
  Truck, Printer, Package, Cpu
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import type { 
  ServiceIntervention, Client, Property, Team, 
  ServiceCategory, Equipment 
} from '../types';
import { Modal } from '../components/Modal';

export const ServicesPage: React.FC = () => {
  const { t } = useI18n();
  const { settings } = useCompany();
  const toast = useToast();

  const [interventions, setInterventions] = useState<ServiceIntervention[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<ServiceIntervention | null>(null);

  // Quality Checklist Modal
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [currentChecklist, setCurrentChecklist] = useState<any | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);

  // Romaneio / Ficha de Carga Modal
  const [isRomaneioOpen, setIsRomaneioOpen] = useState(false);
  const [selectedForRomaneio, setSelectedForRomaneio] = useState<ServiceIntervention | null>(null);
  const [romaneioNotes, setRomaneioNotes] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<ServiceIntervention>>({
    clientId: '',
    propertyId: '',
    category: 'stairs',
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '08:30',
    endTime: '11:00',
    teamId: '',
    assignedEmployeeIds: [],
    equipmentIds: [],
    materialsList: '',
    frequency: 'weekly',
    price: 85,
    requiredMaterials: 'Detergente neutro perfumado, mopa de microfibra, limpa-vidros e pano de inox.',
    specificInstructions: 'Limpar cuidadosamente os corrimãos e os espelhos do elevador.',
    status: 'scheduled'
  });

  const fetchData = async () => {
    try {
      let url = `/api/interventions?search=${encodeURIComponent(search)}`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (filterDate) url += `&date=${filterDate}`;

      const [resInv, resCli, resProp, resTeams, resEq] = await Promise.all([
        fetch(url),
        fetch('/api/clients'),
        fetch('/api/properties'),
        fetch('/api/teams'),
        fetch('/api/equipment')
      ]);

      if (resInv.ok) setInterventions(await resInv.json());
      if (resCli.ok) setClients(await resCli.json());
      if (resProp.ok) setProperties(await resProp.json());
      if (resTeams.ok) setTeams(await resTeams.json());
      if (resEq.ok) setAllEquipment(await resEq.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filterStatus, filterDate]);

  const handleOpenCreate = () => {
    setSelectedIntervention(null);
    setFormData({
      clientId: clients[0]?.id || '',
      propertyId: properties[0]?.id || '',
      category: 'stairs',
      description: 'Limpeza e conservação de escadas, halls e elevadores',
      scheduledDate: new Date().toISOString().split('T')[0],
      startTime: '08:30',
      endTime: '11:00',
      teamId: teams[0]?.id || '',
      assignedEmployeeIds: [],
      equipmentIds: [],
      materialsList: '5L Detergente neutro mármore, 5 mopas microfibra, 2 frascos limpa-vidros, panos de inox.',
      frequency: 'weekly',
      price: 85,
      requiredMaterials: '5L Detergente neutro mármore, 5 mopas microfibra, 2 frascos limpa-vidros, panos de inox.',
      specificInstructions: 'Atenção redobrada aos corrimãos, rodapés e espelhos dos elevadores.',
      status: 'scheduled'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (inv: ServiceIntervention) => {
    setSelectedIntervention(inv);
    setFormData({
      ...inv,
      equipmentIds: inv.equipmentIds || [],
      materialsList: inv.materialsList || inv.requiredMaterials || ''
    });
    setIsFormOpen(true);
  };

  const handleToggleEquipment = (eqId: string) => {
    const current = formData.equipmentIds || [];
    if (current.includes(eqId)) {
      setFormData({
        ...formData,
        equipmentIds: current.filter(id => id !== eqId)
      });
    } else {
      setFormData({
        ...formData,
        equipmentIds: [...current, eqId]
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.propertyId || !formData.scheduledDate) {
      toast.warning('Preencha os campos obrigatórios (Cliente, Imóvel e Data).');
      return;
    }

    try {
      const method = selectedIntervention ? 'PUT' : 'POST';
      const endpoint = selectedIntervention ? `/api/interventions/${selectedIntervention.id}` : '/api/interventions';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(selectedIntervention ? 'Intervenção atualizada!' : 'Serviço agendado com sucesso!');
        setIsFormOpen(false);
        fetchData();
      } else {
        toast.error('Erro ao guardar serviço.');
      }
    } catch (err) {
      toast.error('Falha de ligação ao servidor.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem a certeza que deseja cancelar esta intervenção?')) return;
    try {
      const res = await fetch(`/api/interventions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Intervenção eliminada.');
        fetchData();
      }
    } catch (err) {
      toast.error('Erro ao eliminar serviço.');
    }
  };

  // Quality Checklist Handlers
  const handleOpenChecklist = async (inv: ServiceIntervention) => {
    setSelectedIntervention(inv);
    setChecklistLoading(true);
    setIsChecklistOpen(true);
    try {
      const res = await fetch(`/api/checklists/${inv.id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentChecklist(data);
      }
    } catch (err) {
      toast.error('Erro ao carregar checklist.');
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleToggleChecklistItem = (itemIndex: number) => {
    if (!currentChecklist) return;
    const updatedItems = [...currentChecklist.items];
    updatedItems[itemIndex].completed = !updatedItems[itemIndex].completed;
    setCurrentChecklist({ ...currentChecklist, items: updatedItems });
  };

  const handleSaveChecklist = async () => {
    if (!selectedIntervention || !currentChecklist) return;
    try {
      const res = await fetch(`/api/checklists/${selectedIntervention.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentChecklist)
      });
      if (res.ok) {
        toast.success('Checklist de qualidade gravada com sucesso!');
        const allDone = currentChecklist.items.every((i: any) => i.completed);
        if (allDone && selectedIntervention.status !== 'completed') {
          await fetch(`/api/interventions/${selectedIntervention.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
          });
          fetchData();
        }
        setIsChecklistOpen(false);
      }
    } catch (err) {
      toast.error('Erro ao gravar checklist.');
    }
  };

  // ----------------------------------------------------
  // Romaneio de Carga & Equipamentos
  // ----------------------------------------------------
  const handleOpenRomaneio = (inv: ServiceIntervention) => {
    setSelectedForRomaneio(inv);
    setRomaneioNotes(inv.checkoutNotes || '');
    setIsRomaneioOpen(true);
  };

  const handleCheckoutEquipment = async () => {
    if (!selectedForRomaneio) return;
    try {
      const res = await fetch(`/api/interventions/${selectedForRomaneio.id}/equipment-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentIds: selectedForRomaneio.equipmentIds || [],
          checkoutNotes: romaneioNotes || 'Máquinas e materiais conferidos e embarcados no veículo.'
        })
      });
      if (res.ok) {
        toast.success('Check-out realizado! Equipamentos marcados como em serviço na viatura.');
        setIsRomaneioOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error('Erro ao processar check-out.');
    }
  };

  const handleCheckinEquipment = async (hasIssue: boolean = false) => {
    if (!selectedForRomaneio) return;
    try {
      const res = await fetch(`/api/interventions/${selectedForRomaneio.id}/equipment-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentIds: selectedForRomaneio.equipmentIds || [],
          hasIssue,
          returnNotes: hasIssue ? 'Retornado com ressalvas/necessidade de manutenção' : 'Todos os equipamentos e ferramentas conferidos e devolvidos ao galpão.'
        })
      });
      if (res.ok) {
        toast.success(hasIssue ? 'Check-in registado com alerta de manutenção.' : 'Check-in concluído! Equipamentos liberados de volta ao armazém.');
        setIsRomaneioOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error('Erro ao processar devolução.');
    }
  };

  const handlePrintRomaneio = () => {
    window.print();
  };

  const getRomaneioStatusBadge = (status?: string, count: number = 0) => {
    if (count === 0) {
      return (
        <span className="text-[10px] text-slate-400 font-medium">Sem máquinas</span>
      );
    }
    switch (status) {
      case 'checked_out':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Truck className="w-3 h-3 text-blue-600 animate-pulse" />
            <span>Na Viatura / Obra</span>
          </span>
        );
      case 'returned_ok':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Conferido & Devolvido</span>
          </span>
        );
      case 'returned_issue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Ressalva / Manutenção</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pendente Embarque</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800">
              Freitas Nettoyage Operações
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {t('servicesTitle')} & Romaneio de Carga
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Agendamento de intervenções com lista obrigatória de equipamentos e materiais a carregar para execução.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
        >
          <Plus className="w-4 h-4" />
          <span>{t('addService')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar código ou descrição..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">Todos os Estados</option>
            <option value="scheduled">{t('srvStatusScheduled')}</option>
            <option value="in_progress">{t('srvStatusInProgress')}</option>
            <option value="completed">{t('srvStatusCompleted')}</option>
            <option value="pending">{t('srvStatusPending')}</option>
            <option value="requires_verification">{t('srvStatusRequiresVerification')}</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">{t('loading')}</div>
        ) : interventions.length === 0 ? (
          <div className="py-16 text-center">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{t('noData')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Código / Data</th>
                  <th className="py-3 px-4">Edifício / Cliente</th>
                  <th className="py-3 px-4">Horário & Categoria</th>
                  <th className="py-3 px-4">Equipa & Operacionais</th>
                  <th className="py-3 px-4">Máquinas & Romaneio</th>
                  <th className="py-3 px-4">{t('price')}</th>
                  <th className="py-3 px-4">{t('status')}</th>
                  <th className="py-3 px-4 text-center">Checklist & Ficha</th>
                  <th className="py-3 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {interventions.map(inv => {
                  const eqCount = inv.equipmentIds?.length || 0;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-sky-700">{inv.code}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{inv.scheduledDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inv.propertyName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{inv.clientName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{inv.startTime} - {inv.endTime}</span>
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {inv.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-600">
                        <div className="font-semibold text-slate-800">{inv.teamName || 'Sem equipa fixa'}</div>
                        <div className="text-slate-400">
                          {inv.assignedEmployees && inv.assignedEmployees.length > 0
                            ? inv.assignedEmployees.map(e => e.fullName.split(' ')[0]).join(', ')
                            : 'Nenhum funcionário alocado'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-800">
                              {eqCount} {eqCount === 1 ? 'máquina' : 'máquinas'}
                            </span>
                          </div>
                          <div>
                            {getRomaneioStatusBadge(inv.equipmentCheckStatus, eqCount)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {Number(inv.price).toFixed(2)} €
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          inv.status === 'requires_verification' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botão de Romaneio de Carga */}
                          <button
                            onClick={() => handleOpenRomaneio(inv)}
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1 border border-indigo-200"
                            title="Ver ou conferir Romaneio de Equipamentos"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Romaneio</span>
                          </button>

                          {/* Botão de Checklist de Qualidade */}
                          <button
                            onClick={() => handleOpenChecklist(inv)}
                            className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Checklist de Inspeção do Serviço"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Qualidade</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title={t('edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL: CRIAR / EDITAR SERVIÇO COM EQUIPAMENTOS      */}
      {/* ==================================================== */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedIntervention ? 'Editar Serviço & Equipamentos' : t('addService')}
        subtitle="Configure imóvel, equipa, e selecione as máquinas e materiais a levar para execução."
        maxWidth="4xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
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
                Imóvel / Edifício *
              </label>
              <select
                required
                value={formData.propertyId || ''}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="">Selecione o Edifício...</option>
                {properties
                  .filter(p => !formData.clientId || p.clientId === formData.clientId)
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('srvCategory')}
              </label>
              <select
                value={formData.category || 'stairs'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="stairs">{t('srvStairs')}</option>
                <option value="floors">{t('srvFloors')}</option>
                <option value="corridors">{t('srvCorridors')}</option>
                <option value="entrances">{t('srvEntrances')}</option>
                <option value="elevators">{t('srvElevators')}</option>
                <option value="common_areas">{t('srvCommonAreas')}</option>
                <option value="offices">{t('srvOffices')}</option>
                <option value="windows">{t('srvWindows')}</option>
                <option value="floor_treatment">{t('srvFloorTreatment')}</option>
                <option value="deep_cleaning">{t('srvDeep')}</option>
                <option value="post_construction">{t('srvPostConstruction')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Periodicidade (Recorrência)
              </label>
              <select
                value={formData.frequency || 'weekly'}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="once">{t('srvFrequencyOnce')}</option>
                <option value="daily">{t('srvFrequencyDaily')}</option>
                <option value="weekly">{t('srvFrequencyWeekly')}</option>
                <option value="biweekly">{t('srvFrequencyBiweekly')}</option>
                <option value="monthly">{t('srvFrequencyMonthly')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('date')} *
              </label>
              <input
                type="date"
                required
                value={formData.scheduledDate || ''}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Início
                </label>
                <input
                  type="time"
                  value={formData.startTime || '08:30'}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fim Previsto
                </label>
                <input
                  type="time"
                  value={formData.endTime || '11:00'}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('srvTeam')}
              </label>
              <select
                value={formData.teamId || ''}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="">Sem equipa fixa</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('price')} (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price || 0}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descrição dos Trabalhos
              </label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Limpeza e conservação de escadas e hall de entrada..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {/* ==================================================== */}
          {/* SEÇÃO OBRIGATÓRIA: MÁQUINAS E EQUIPAMENTOS A LEVAR  */}
          {/* ==================================================== */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                  <Cpu className="w-4 h-4 text-sky-600" />
                  <span>Máquinas & Equipamentos a Levar para a Obra</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Selecione as máquinas cadastradas que a equipa deve colocar na viatura para executar este trabalho:
                </p>
              </div>
              <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-lg">
                {(formData.equipmentIds || []).length} selecionados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {allEquipment.map(eq => {
                const isSelected = (formData.equipmentIds || []).includes(eq.id);
                const isUnavailable = eq.status === 'maintenance' || eq.status === 'broken';
                return (
                  <div
                    key={eq.id}
                    onClick={() => !isUnavailable && handleToggleEquipment(eq.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/20 shadow-sm'
                        : isUnavailable
                        ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isUnavailable}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 pointer-events-none"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-black text-sky-700 bg-sky-100 px-1.5 rounded">
                          {eq.code}
                        </span>
                        {isUnavailable && (
                          <span className="text-[10px] font-bold text-rose-600">Manutenção</span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 truncate mt-1">{eq.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{eq.brandModel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO: MATERIAIS & PRODUTOS A LEVAR */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Lista de Materiais & Insumos de Limpeza (Viatura)</span>
            </label>
            <textarea
              rows={2}
              value={formData.materialsList || ''}
              onChange={(e) => setFormData({ ...formData, materialsList: e.target.value, requiredMaterials: e.target.value })}
              placeholder="Ex: 5L Detergente mármore, 5 mopas microfibra, 2 panos inox, 1 spray desinfetante..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none"
            />
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
              className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all font-bold"
              style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
            >
              {selectedIntervention ? 'Guardar Alterações' : 'Agendar Serviço & Equipamentos'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL: ROMANEIO DE EQUIPAMENTOS & FICHA DE CARGA     */}
      {/* ==================================================== */}
      {selectedForRomaneio && (
        <Modal
          isOpen={isRomaneioOpen}
          onClose={() => setIsRomaneioOpen(false)}
          title="Romaneio de Equipamentos & Ficha de Carga"
          subtitle={`Freitas Nettoyage • OS ${selectedForRomaneio.code} • ${selectedForRomaneio.propertyName}`}
          maxWidth="4xl"
        >
          <div className="space-y-5">
            {/* Printable Header */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ordem de Serviço</span>
                <div className="font-mono font-black text-sky-800 text-sm mt-0.5">{selectedForRomaneio.code}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Data & Horário</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedForRomaneio.scheduledDate} ({selectedForRomaneio.startTime} - {selectedForRomaneio.endTime})</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Cliente</span>
                <div className="font-bold text-slate-800 truncate mt-0.5">{selectedForRomaneio.clientName}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Equipa Encarregada</span>
                <div className="font-bold text-slate-800 truncate mt-0.5">{selectedForRomaneio.teamName || 'Equipa de Campo'}</div>
              </div>
            </div>

            {/* Equipment Loading Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-sky-600" />
                  <span>Máquinas Alocadas para Embarque (Checklist de Viatura)</span>
                </h4>
                <span className="text-[11px] font-bold text-slate-500">
                  Total: {selectedForRomaneio.equipmentIds?.length || 0} máquina(s)
                </span>
              </div>

              {!selectedForRomaneio.equipmentIds || selectedForRomaneio.equipmentIds.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                  Nenhuma máquina foi vinculada a este serviço. Pode editar a intervenção para adicionar equipamentos.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Máquina / Equipamento</th>
                        <th className="py-2.5 px-3">Marca & Modelo / Série</th>
                        <th className="py-2.5 px-3 text-center">Conferência Saída</th>
                        <th className="py-2.5 px-3 text-center">Conferência Retorno</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedForRomaneio.equipmentIds.map(eqId => {
                        const eq = allEquipment.find(e => e.id === eqId);
                        const isCheckedOut = selectedForRomaneio.equipmentCheckStatus === 'checked_out' || selectedForRomaneio.equipmentCheckStatus === 'returned_ok';
                        const isReturned = selectedForRomaneio.equipmentCheckStatus === 'returned_ok' || selectedForRomaneio.equipmentCheckStatus === 'returned_issue';
                        return (
                          <tr key={eqId} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-sky-700">
                              {eq?.code || eqId}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {eq?.name || 'Equipamento'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <div>{eq?.brandModel || '—'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">SN: {eq?.serialNumber || 'N/A'}</div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isCheckedOut ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Carregado</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">Aguardando</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isReturned ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Devolvido</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">Pendente</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Materials List */}
            {selectedForRomaneio.materialsList && (
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900 block mb-1 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Materiais e Produtos Inclusos para Transporte:</span>
                </span>
                <p className="text-xs text-slate-700 font-medium">
                  {selectedForRomaneio.materialsList}
                </p>
              </div>
            )}

            {/* Romaneio Actions */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800">
                Operações de Saída e Retorno no Armazém Freitas Nettoyage:
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleCheckoutEquipment}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>Confirmar Saída (Veículo Carregado)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCheckinEquipment(false)}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Retorno (Tudo Conforme)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCheckinEquipment(true)}
                  className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                  title="Reportar máquina avariada ao retornar"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Retorno c/ Avaria</span>
                </button>
              </div>
            </div>

            {/* Print and Close Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrintRomaneio}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Imprimir Romaneio / Ficha de Carga</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRomaneioOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow transition-all"
                style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================================================== */}
      {/* MODAL: CHECKLIST DE QUALIDADE DO SERVIÇO             */}
      {/* ==================================================== */}
      {selectedIntervention && (
        <Modal
          isOpen={isChecklistOpen}
          onClose={() => setIsChecklistOpen(false)}
          title={t('chkTitle')}
          subtitle={`Intervenção: ${selectedIntervention.code} • ${selectedIntervention.propertyName}`}
          maxWidth="2xl"
        >
          {checklistLoading || !currentChecklist ? (
            <div className="py-8 text-center text-xs text-slate-400">{t('loading')}</div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">{t('chkSubtitle')}</p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {currentChecklist.items.map((item: any, idx: number) => (
                  <div 
                    key={item.id}
                    onClick={() => handleToggleChecklistItem(idx)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      item.completed 
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-semibold">{item.task}</span>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      item.completed 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {item.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Correction Required Flag */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900">
                  <input
                    type="checkbox"
                    checked={currentChecklist.needsCorrection || false}
                    onChange={(e) => setCurrentChecklist({ ...currentChecklist, needsCorrection: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span>{t('chkNeedsCorrection')}</span>
                </label>
                {currentChecklist.needsCorrection && (
                  <textarea
                    rows={2}
                    value={currentChecklist.correctionNotes || ''}
                    onChange={(e) => setCurrentChecklist({ ...currentChecklist, correctionNotes: e.target.value })}
                    placeholder="Descreva o problema identificado que necessita de intervenção corretiva..."
                    className="w-full mt-2 px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none"
                  />
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  {currentChecklist.items.filter((i: any) => i.completed).length} de {currentChecklist.items.length} tarefas validadas
                </span>
                <button
                  type="button"
                  onClick={handleSaveChecklist}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all"
                  style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
                >
                  Guardar Validação
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
