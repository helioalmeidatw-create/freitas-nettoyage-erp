import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, 
  Users, Building2, CheckCircle2, AlertTriangle, Filter, Sparkles 
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import type { ServiceIntervention, Employee, Team } from '../types';

export const PlanningPage: React.FC = () => {
  const { t } = useI18n();
  const { settings } = useCompany();

  const [interventions, setInterventions] = useState<ServiceIntervention[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'day' | 'week' | 'month'
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [filterTeam, setFilterTeam] = useState('all');

  const fetchData = async () => {
    try {
      const [resInv, resEmp, resTeams] = await Promise.all([
        fetch('/api/interventions'),
        fetch('/api/employees'),
        fetch('/api/teams')
      ]);
      if (resInv.ok) setInterventions(await resInv.json());
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

  // Date Navigation helpers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get days in current week
  const getWeekDays = (base: Date) => {
    const days: Date[] = [];
    const dayOfWeek = base.getDay(); // 0 is Sunday, 1 is Monday...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(base);
    monday.setDate(base.getDate() + mondayOffset);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);

  // Filtered interventions
  const filteredInterventions = interventions.filter(inv => {
    if (filterTeam !== 'all' && inv.teamId !== filterTeam) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {t('navPlanning')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Organização diária das equipas de limpeza e escalas de serviços.
          </p>
        </div>

        {/* View Switcher & Date Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Mês
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter by Team */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-500">Filtrar Equipa:</span>
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
        >
          <option value="all">Todas as Equipas</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Week Calendar View */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center divide-x divide-slate-100">
            {weekDays.map((d, idx) => {
              const isToday = d.toDateString() === new Date().toDateString();
              const dayName = d.toLocaleDateString('pt-PT', { weekday: 'short' });
              return (
                <div key={idx} className={`py-3 px-1 ${isToday ? 'bg-sky-50/70 font-bold' : ''}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {dayName}
                  </div>
                  <div className={`text-base font-black mt-0.5 ${isToday ? 'text-sky-600' : 'text-slate-800'}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-[480px]">
            {weekDays.map((d, idx) => {
              const dateStr = d.toISOString().split('T')[0];
              const dayJobs = filteredInterventions.filter(i => i.scheduledDate === dateStr);

              return (
                <div key={idx} className="p-2 space-y-2">
                  <div className="md:hidden py-1 px-2 bg-slate-100 rounded text-[11px] font-bold text-slate-700">
                    {d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </div>

                  {dayJobs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-4">
                      <span className="text-[11px] text-slate-300">Sem serviços</span>
                    </div>
                  ) : (
                    dayJobs.map(job => (
                      <div
                        key={job.id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                            {job.startTime}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${
                            job.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}></span>
                        </div>
                        <div className="font-bold text-slate-900 leading-snug line-clamp-2">
                          {job.propertyName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {job.teamName || 'Equipa Geral'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day / Mobile Schedule View */}
      {(viewMode === 'day' || viewMode === 'month') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-sky-600" />
            <span>Serviços para {currentDate.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          <div className="space-y-3">
            {filteredInterventions
              .filter(i => i.scheduledDate === currentDate.toISOString().split('T')[0])
              .map(job => (
                <div key={job.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                        {job.startTime} - {job.endTime}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{job.propertyName}</span>
                    </div>
                    <div className="text-slate-500 mt-1 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.propertyAddress}</span>
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      Equipa: <span className="text-slate-700 font-semibold">{job.teamName || 'Geral'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      job.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
