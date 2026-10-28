import React, { useState, useEffect } from 'react';
import { UserCog, Plus, Search, Filter, Phone, Mail, Award, Clock, Users } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import type { Employee, Team } from '../types';
import { Modal } from '../components/Modal';

export const EmployeesPage: React.FC = () => {
  const { t } = useI18n();
  const { settings } = useCompany();
  const toast = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Employee>>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    role: 'Técnico de Limpeza',
    teamId: '',
    workingHours: '08:00 - 17:00',
    availability: 'Segunda a Sexta',
    skills: ['Limpeza de Escadas', 'Tratamento de Pisos'],
    status: 'active'
  });

  const fetchData = async () => {
    try {
      const [resEmp, resTeams] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/teams')
      ]);
      if (resEmp.ok) setEmployees(await resEmp.json());
      if (resTeams.ok) setTeams(await resTeams.json());
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
    if (!formData.fullName?.trim()) {
      toast.warning('O nome do funcionário é obrigatório.');
      return;
    }
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('Funcionário registado com sucesso!');
        setIsFormOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error('Erro ao registar funcionário.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {t('employeesTitle')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {t('employeesSubtitle')}
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
        >
          <Plus className="w-4 h-4" />
          <span>{t('addEmployee')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => (
          <div key={emp.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md">
                  {emp.code}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {emp.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{emp.fullName}</h3>
              <div className="text-xs text-sky-600 font-semibold mt-0.5">{emp.role}</div>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{emp.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{emp.workingHours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{emp.teamName || 'Geral'}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                {(emp.skills || []).map((skill, sIdx) => (
                  <span key={sIdx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t('addEmployee')}
        subtitle="Registe os dados do profissional e atribua uma equipa."
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              value={formData.fullName || ''}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Função / Cargo</label>
            <input
              type="text"
              value={formData.role || ''}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Equipa</label>
              <select
                value={formData.teamId || ''}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="">Sem equipa</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Horário de Trabalho</label>
            <input
              type="text"
              value={formData.workingHours || ''}
              onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
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
