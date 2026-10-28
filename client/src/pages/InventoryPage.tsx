import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, AlertTriangle, ArrowDownRight, 
  ArrowUpRight, Edit, MapPin, RefreshCw, Wrench, CheckCircle2, 
  Clock, AlertCircle, Trash2, Cpu
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import type { InventoryItem, Supplier, Equipment, EquipmentStatus } from '../types';
import { Modal } from '../components/Modal';

export const InventoryPage: React.FC = () => {
  const { t } = useI18n();
  const { settings } = useCompany();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'materials' | 'equipment'>('equipment');

  // Materials State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMaterial, setSearchMaterial] = useState('');

  // Equipment State
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [searchEquipment, setSearchEquipment] = useState('');
  const [filterEquipmentStatus, setFilterEquipmentStatus] = useState<string>('all');
  const [filterEquipmentCategory, setFilterEquipmentCategory] = useState<string>('all');

  // Material Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Equipment Modals
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [equipmentFormData, setEquipmentFormData] = useState<Partial<Equipment>>({
    code: '',
    name: '',
    category: 'floor_care',
    brandModel: '',
    serialNumber: '',
    status: 'available',
    location: 'Armazém Central',
    notes: ''
  });

  // Form State Material
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'Produtos Químicos',
    supplierId: '',
    stockQty: 10,
    unit: 'unidade',
    purchasePrice: 10,
    minStock: 5,
    location: 'Armazém Central',
    notes: ''
  });

  // Movement State
  const [movementType, setMovementType] = useState<'in' | 'out'>('out');
  const [movementQty, setMovementQty] = useState<number>(1);
  const [movementReason, setMovementReason] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resItems, resSuppliers, resEquipment] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/suppliers'),
        fetch('/api/equipment')
      ]);
      if (resItems.ok) setItems(await resItems.json());
      if (resSuppliers.ok) setSuppliers(await resSuppliers.json());
      if (resEquipment.ok) setEquipmentList(await resEquipment.json());
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados de inventário.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ----------------------------------------------------
  // Materials Handlers
  // ----------------------------------------------------
  const handleOpenCreateMaterial = () => {
    setSelectedItem(null);
    setFormData({
      name: '',
      category: 'Produtos Químicos',
      supplierId: suppliers[0]?.id || '',
      stockQty: 10,
      unit: 'unidade',
      purchasePrice: 12.5,
      minStock: 5,
      location: 'Armazém Central - Estante A',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenMovement = (item: InventoryItem) => {
    setSelectedItem(item);
    setMovementType('out');
    setMovementQty(1);
    setMovementReason('Abastecimento de viatura da equipa de serviço');
    setIsMovementOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.warning('O nome do material é obrigatório.');
      return;
    }

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('Material registado no inventário com sucesso!');
        setIsFormOpen(false);
        fetchData();
      } else {
        toast.error('Erro ao registar material.');
      }
    } catch (err) {
      toast.error('Falha de ligação.');
    }
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || movementQty <= 0) return;

    try {
      const res = await fetch(`/api/inventory/${selectedItem.id}/movement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: movementType,
          quantity: movementQty,
          reason: movementReason
        })
      });

      if (res.ok) {
        toast.success(`Movimento de ${movementType === 'in' ? 'Entrada' : 'Saída'} registado com sucesso!`);
        setIsMovementOpen(false);
        fetchData();
      } else {
        toast.error('Erro ao registar movimento.');
      }
    } catch (err) {
      toast.error('Falha na operação.');
    }
  };

  // ----------------------------------------------------
  // Equipment Handlers
  // ----------------------------------------------------
  const handleOpenCreateEquipment = () => {
    setSelectedEquipment(null);
    setEquipmentFormData({
      name: '',
      category: 'floor_care',
      brandModel: '',
      serialNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      lastMaintenanceDate: '',
      nextMaintenanceDate: '',
      status: 'available',
      location: 'Armazém Central - Baia de Equipamentos',
      notes: ''
    });
    setIsEquipmentModalOpen(true);
  };

  const handleOpenEditEquipment = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setEquipmentFormData({
      code: eq.code,
      name: eq.name,
      category: eq.category,
      brandModel: eq.brandModel,
      serialNumber: eq.serialNumber,
      purchaseDate: eq.purchaseDate || '',
      lastMaintenanceDate: eq.lastMaintenanceDate || '',
      nextMaintenanceDate: eq.nextMaintenanceDate || '',
      status: eq.status,
      location: eq.location,
      notes: eq.notes || ''
    });
    setIsEquipmentModalOpen(true);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentFormData.name?.trim()) {
      toast.warning('O nome do equipamento é obrigatório.');
      return;
    }

    try {
      const isEditing = Boolean(selectedEquipment);
      const url = isEditing ? `/api/equipment/${selectedEquipment!.id}` : '/api/equipment';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipmentFormData)
      });

      if (res.ok) {
        toast.success(isEditing ? 'Equipamento atualizado!' : 'Equipamento/Máquina cadastrada com sucesso!');
        setIsEquipmentModalOpen(false);
        fetchData();
      } else {
        toast.error('Erro ao salvar equipamento.');
      }
    } catch (err) {
      toast.error('Falha de ligação.');
    }
  };

  const handleChangeEquipmentStatus = async (eq: Equipment, newStatus: EquipmentStatus) => {
    try {
      const res = await fetch(`/api/equipment/${eq.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Estado de ${eq.code} alterado para: ${getStatusLabel(newStatus)}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Falha ao atualizar estado.');
    }
  };

  const handleDeleteEquipment = async (eq: Equipment) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar o equipamento "${eq.name}" (${eq.code})?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/equipment/${eq.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Equipamento removido com sucesso.');
        fetchData();
      } else {
        toast.error('Não foi possível remover o equipamento.');
      }
    } catch (err) {
      toast.error('Falha na operação.');
    }
  };

  // Helpers
  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Disponível
          </span>
        );
      case 'in_service':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
            Em Serviço / Na Obra
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <Wrench className="w-3 h-3 text-rose-600" />
            Em Manutenção
          </span>
        );
      case 'broken':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
            <AlertCircle className="w-3 h-3 text-slate-600" />
            Inativo / Avariado
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusLabel = (status: EquipmentStatus) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'in_service': return 'Em Serviço';
      case 'maintenance': return 'Manutenção';
      case 'broken': return 'Avariado';
      default: return status;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'floor_care': return 'Tratamento de Pisos / Monobrosse';
      case 'vacuum': return 'Aspiradores Industriais';
      case 'pressure_washer': return 'Lavadoras Alta Pressão';
      case 'steamer': return 'Geradores de Vapor / Desinfeção';
      case 'scaffold_ladder': return 'Escadas & Andaimes';
      case 'generator': return 'Geradores & Energia';
      case 'hand_tool': return 'Ferramentas Manuais';
      default: return cat || 'Outros';
    }
  };

  // Filtered Lists
  const filteredMaterials = items.filter(i => 
    i.name.toLowerCase().includes(searchMaterial.toLowerCase()) ||
    i.code.toLowerCase().includes(searchMaterial.toLowerCase()) ||
    i.category.toLowerCase().includes(searchMaterial.toLowerCase())
  );

  const filteredEquipment = equipmentList.filter(eq => {
    const matchSearch = 
      eq.name.toLowerCase().includes(searchEquipment.toLowerCase()) ||
      eq.code.toLowerCase().includes(searchEquipment.toLowerCase()) ||
      eq.brandModel.toLowerCase().includes(searchEquipment.toLowerCase()) ||
      eq.serialNumber.toLowerCase().includes(searchEquipment.toLowerCase()) ||
      eq.location.toLowerCase().includes(searchEquipment.toLowerCase());
    
    const matchStatus = filterEquipmentStatus === 'all' || eq.status === filterEquipmentStatus;
    const matchCategory = filterEquipmentCategory === 'all' || eq.category === filterEquipmentCategory;

    return matchSearch && matchStatus && matchCategory;
  });

  // KPI Calculations
  const totalEquipment = equipmentList.length;
  const availableEquipment = equipmentList.filter(e => e.status === 'available').length;
  const inServiceEquipment = equipmentList.filter(e => e.status === 'in_service').length;
  const maintenanceEquipment = equipmentList.filter(e => e.status === 'maintenance' || e.status === 'broken').length;

  const lowStockCount = items.filter(i => i.isLowStock).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800">
              Freitas Nettoyage Gestão de Ativos
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Materiais, Máquinas & Equipamentos
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Controle integrado de insumos consumíveis e romaneio de maquinários industriais para obras e serviços.
          </p>
        </div>

        {/* Action Button */}
        {activeTab === 'materials' ? (
          <button
            onClick={handleOpenCreateMaterial}
            className="px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
          >
            <Plus className="w-4 h-4" />
            <span>Registar Novo Material</span>
          </button>
        ) : (
          <button
            onClick={handleOpenCreateEquipment}
            className="px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Máquina / Equipamento</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Equipamentos</div>
            <div className="text-xl font-black text-slate-900">{totalEquipment} un.</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Disponíveis Galpão</div>
            <div className="text-xl font-black text-emerald-600">{availableEquipment} un.</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Em Serviço / Na Obra</div>
            <div className="text-xl font-black text-amber-600">{inServiceEquipment} un.</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Em Manutenção</div>
            <div className="text-xl font-black text-rose-600">{maintenanceEquipment} un.</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl pt-2 shadow-sm">
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'equipment'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Máquinas & Equipamentos ({totalEquipment})</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'materials'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Materiais & Consumíveis ({items.length})</span>
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
              {lowStockCount} reposição
            </span>
          )}
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: MÁQUINAS & EQUIPAMENTOS                       */}
      {/* ==================================================== */}
      {activeTab === 'equipment' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchEquipment}
                onChange={(e) => setSearchEquipment(e.target.value)}
                placeholder="Pesquisar máquina, patrimônio, marca ou série..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={filterEquipmentCategory}
                onChange={(e) => setFilterEquipmentCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
              >
                <option value="all">Todas as Categorias</option>
                <option value="floor_care">Tratamento de Pisos</option>
                <option value="vacuum">Aspiradores</option>
                <option value="pressure_washer">Alta Pressão</option>
                <option value="steamer">Vapor / Desinfeção</option>
                <option value="scaffold_ladder">Escadas & Andaimes</option>
                <option value="hand_tool">Ferramentas</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterEquipmentStatus}
                onChange={(e) => setFilterEquipmentStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
              >
                <option value="all">Todos os Estados</option>
                <option value="available">🟢 Disponível</option>
                <option value="in_service">🟡 Em Serviço</option>
                <option value="maintenance">🔴 Manutenção</option>
                <option value="broken">⚪ Avariado</option>
              </select>
            </div>
          </div>

          {/* Equipment Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">{t('loading')}</div>
            ) : filteredEquipment.length === 0 ? (
              <div className="py-16 text-center">
                <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Nenhum equipamento encontrado com os filtros atuais.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Patrimônio / Equipamento</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Marca & Modelo / Nº Série</th>
                      <th className="py-3 px-4">Localização Atual</th>
                      <th className="py-3 px-4">Estado / Disponibilidade</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredEquipment.map(eq => (
                      <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded w-max">
                            {eq.code}
                          </div>
                          <div className="font-bold text-slate-900 mt-1">{eq.name}</div>
                          {eq.currentServiceCode && (
                            <div className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                              <span>Alocado na OS:</span>
                              <span className="font-mono underline">{eq.currentServiceCode}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {getCategoryLabel(eq.category)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{eq.brandModel || '—'}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            SN: {eq.serialNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{eq.location}</span>
                          </div>
                          {eq.nextMaintenanceDate && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Próx. Revisão: {eq.nextMaintenanceDate}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(eq.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Fast status toggle */}
                            {eq.status !== 'available' && (
                              <button
                                onClick={() => handleChangeEquipmentStatus(eq, 'available')}
                                title="Marcar como Disponível no Galpão"
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-emerald-200"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Liberar</span>
                              </button>
                            )}
                            {eq.status === 'available' && (
                              <button
                                onClick={() => handleChangeEquipmentStatus(eq, 'maintenance')}
                                title="Enviar para Manutenção"
                                className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-rose-200"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                <span>Manutenção</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEditEquipment(eq)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                              title="Editar Equipamento"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteEquipment(eq)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Eliminar Equipamento"
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
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: MATERIAIS & CONSUMÍVEIS (PRODUTOS)             */}
      {/* ==================================================== */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchMaterial}
                onChange={(e) => setSearchMaterial(e.target.value)}
                placeholder="Pesquisar material, código ou categoria..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* Inventory Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">{t('loading')}</div>
            ) : filteredMaterials.length === 0 ? (
              <div className="py-16 text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">{t('noData')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Código / Material</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">{t('stockLocation')}</th>
                      <th className="py-3 px-4">Preço Compra</th>
                      <th className="py-3 px-4">{t('stockLevel')}</th>
                      <th className="py-3 px-4">{t('stockMin')}</th>
                      <th className="py-3 px-4 text-right">Movimentar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredMaterials.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-sky-700 font-bold">{item.code}</div>
                          <div className="font-bold text-slate-900 mt-0.5">{item.name}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {item.location}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {Number(item.purchasePrice).toFixed(2)} € / {item.unit}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-black ${item.isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
                              {item.stockQty} {item.unit}s
                            </span>
                            {item.isLowStock && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Repor</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-medium">
                          {item.minStock} {item.unit}s
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenMovement(item)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-white bg-slate-100 hover:bg-slate-800 rounded-xl transition-all inline-flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Entrada / Saída</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CADASTRAR / EDITAR MÁQUINA E EQUIPAMENTO      */}
      {/* ==================================================== */}
      <Modal
        isOpen={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        title={selectedEquipment ? `Editar Equipamento (${selectedEquipment.code})` : 'Cadastrar Nova Máquina ou Equipamento'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveEquipment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome da Máquina / Equipamento *
              </label>
              <input
                type="text"
                required
                value={equipmentFormData.name || ''}
                onChange={e => setEquipmentFormData({ ...equipmentFormData, name: e.target.value })}
                placeholder="Ex: Monobrosse Industrial 17'', Aspirador Pó e Água 55L, Andaime..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Categoria do Equipamento
              </label>
              <select
                value={equipmentFormData.category || 'floor_care'}
                onChange={e => setEquipmentFormData({ ...equipmentFormData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="floor_care">Tratamento de Pisos / Monobrosse</option>
                <option value="vacuum">Aspirador Industrial</option>
                <option value="pressure_washer">Lavadora Alta Pressão</option>
                <option value="steamer">Vaporizador & Higienizador</option>
                <option value="scaffold_ladder">Escada Telescópica / Andaime</option>
                <option value="generator">Gerador & Extensões</option>
                <option value="hand_tool">Ferramenta Manual</option>
                <option value="other">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estado Operacional
              </label>
              <select
                value={equipmentFormData.status || 'available'}
                onChange={e => setEquipmentFormData({ ...equipmentFormData, status: e.target.value as EquipmentStatus })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
              >
                <option value="available">🟢 Disponível no Armazém</option>
                <option value="in_service">🟡 Em Serviço / Na Obra</option>
                <option value="maintenance">🔴 Em Manutenção / Oficina</option>
                <option value="broken">⚪ Inativo / Avariado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Marca e Modelo
              </label>
              <input
                type="text"
                value={equipmentFormData.brandModel || ''}
                onChange={e => setEquipmentFormData({ ...equipmentFormData, brandModel: e.target.value })}
                placeholder="Ex: Kärcher BDS 43/180 C, Nilfisk VL500..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número de Série / Patrimônio
              </label>
              <input
                type="text"
                value={equipmentFormData.serialNumber || ''}
                onChange={e => setEquipmentFormData({ ...equipmentFormData, serialNumber: e.target.value })}
                placeholder="Ex: SN-KRC-98124"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Localização habitual no galpão
              </label>
              <input
                type="text"
                value={equipmentFormData.location || ''}
                onChange={e => setEquipmentFormData({ ...equipmentFormData, location: e.target.value })}
                placeholder="Ex: Armazém Central - Baia A1"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Próxima Manutenção Preventiva
              </label>
              <input
                type="date"
                value={equipmentFormData.nextMaintenanceDate || ''}
                onChange={e => setEquipmentFormData({ ...equipmentFormData, nextMaintenanceDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações Técnicas / Restrições de Uso
              </label>
              <textarea
                rows={3}
                value={equipmentFormData.notes || ''}
                onChange={e => setEquipmentFormData({ ...equipmentFormData, notes: e.target.value })}
                placeholder="Instruções de segurança, voltagem (220V), acessórios inclusos..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEquipmentModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
            >
              {selectedEquipment ? 'Guardar Alterações' : 'Cadastrar Equipamento'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL: NOVO MATERIAL / INVENTÁRIO                    */}
      {/* ==================================================== */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t('addMaterial')}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome do Material / Insumo *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Detergente Especial Pisos 5L"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Categoria
              </label>
              <input
                type="text"
                value={formData.category || ''}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Produtos Químicos"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unidade de Medida
              </label>
              <input
                type="text"
                value={formData.unit || ''}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Ex: unidade, litro, garrafão, kg"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Qtd Inicial
              </label>
              <input
                type="number"
                value={formData.stockQty || 0}
                onChange={e => setFormData({ ...formData, stockQty: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stock Mínimo
              </label>
              <input
                type="number"
                value={formData.minStock || 0}
                onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preço Compra (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice || 0}
                onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Localização no Armazém
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Prateleira B, Estante 3"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
            >
              Guardar Artigo
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL: MOVIMENTAÇÃO DE MATERIAL                      */}
      {/* ==================================================== */}
      <Modal
        isOpen={isMovementOpen}
        onClose={() => setIsMovementOpen(false)}
        title={`Movimentar Stock: ${selectedItem?.name}`}
      >
        <form onSubmit={handleSaveMovement} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Stock Atual em Galpão:</span>
            <span className="text-sm font-black text-slate-900">{selectedItem?.stockQty} {selectedItem?.unit}s</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Tipo de Movimento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMovementType('out')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  movementType === 'out'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                <span>Saída (Uso / Serviço)</span>
              </button>
              <button
                type="button"
                onClick={() => setMovementType('in')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  movementType === 'in'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span>Entrada (Compra / Reposição)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quantidade ({selectedItem?.unit}s)
            </label>
            <input
              type="number"
              min="1"
              required
              value={movementQty}
              onChange={e => setMovementQty(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivo da Movimentação
            </label>
            <input
              type="text"
              value={movementReason}
              onChange={e => setMovementReason(e.target.value)}
              placeholder="Ex: Abastecimento da carrinha Equipa Alpha"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsMovementOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: movementType === 'out' ? '#e11d48' : '#059669' }}
            >
              Confirmar {movementType === 'out' ? 'Saída' : 'Entrada'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
