import React, { useState } from 'react';
import { 
  Settings, Save, Palette, Building, Phone, Mail, Globe, 
  CreditCard, ShieldCheck, Database, RefreshCw, Download, Upload,
  Lock, KeyRound, CheckCircle2
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import type { CompanySettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { t } = useI18n();
  const { settings, updateSettings } = useCompany();
  const { user } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [saving, setSaving] = useState(false);

  // Security / Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const presetColors = [
    { label: 'Azul Oceano', hex: '#0284c7' },
    { label: 'Azul Cobalto', hex: '#2563eb' },
    { label: 'Verde Esmeralda', hex: '#059669' },
    { label: 'Turquesa', hex: '#0d9488' },
    { label: 'Índigo Noturno', hex: '#4f46e5' },
    { label: 'Grafite Elegante', hex: '#334155' }
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      toast.success('Definições e identidade da empresa atualizadas com sucesso!');
    } catch (err) {
      toast.error('Erro ao guardar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning('Preencha todos os campos da palavra-passe.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('A nova palavra-passe e a confirmação não coincidem.');
      return;
    }
    if (newPassword.length < 4) {
      toast.warning('A nova palavra-passe deve ter pelo menos 4 caracteres.');
      return;
    }

    setChangingPass(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email || 'admin@freitas-nettoyage.com',
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Palavra-passe alterada com sucesso! O seu acesso permanece ativo.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Erro ao alterar palavra-passe.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao alterar palavra-passe.');
    } finally {
      setChangingPass(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/system/backup', '_blank');
  };

  const handleReset = async (includeDemo: boolean) => {
    const msg = includeDemo 
      ? 'Tem a certeza que deseja repor a base de dados com dados de demonstração?' 
      : 'ATENÇÃO: Deseja apagar todos os dados e iniciar com uma base de dados limpa?';
    if (!window.confirm(msg)) return;

    try {
      const res = await fetch('/api/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeDemo })
      });
      if (res.ok) {
        toast.success(includeDemo ? 'Dados de exemplo restaurados!' : 'Base de dados limpa com sucesso!');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      toast.error('Falha ao redefinir base de dados.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {t('settingsTitle')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {t('settingsSubtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Visual Identity & Colors */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Palette className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Identidade Visual & Cores da Empresa</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('setTradeName')} *
              </label>
              <input
                type="text"
                required
                value={formData.tradeName || ''}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('setCompanyName')}
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {t('setPrimaryColor')}
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {presetColors.map((color, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setFormData({ ...formData, primaryColor: color.hex })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      formData.primaryColor === color.hex 
                        ? 'border-slate-800 bg-slate-50 ring-2 ring-sky-500/30' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span 
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.label}</span>
                  </button>
                ))}
                <div className="flex items-center gap-2 ml-2">
                  <input
                    type="color"
                    value={formData.primaryColor || '#0284c7'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0"
                  />
                  <span className="text-xs font-mono text-slate-500">{formData.primaryColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts & Address */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Sede Social & Contactos Oficiais</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('setAddress')}</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('setPostalCode')}</label>
              <input
                type="text"
                value={formData.postalCode || ''}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('setCity')}</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('setPhone')}</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('setEmail')}</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Legal & Fiscal Info (France SIRET / PT NIF / TVA) */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Enquadramento Fiscal & Dados Bancários</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('setTaxId')}</label>
              <input
                type="text"
                value={formData.taxId || ''}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('setVatNumber')}</label>
              <input
                type="text"
                value={formData.vatNumber || ''}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('setSiret')}</label>
              <input
                type="text"
                value={formData.siret || ''}
                onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                placeholder="Ex: 849 123 456 00012"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('setIban')}</label>
              <input
                type="text"
                value={formData.iban || ''}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('setBankName')}</label>
              <input
                type="text"
                value={formData.bankName || ''}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            style={{ backgroundColor: formData.primaryColor || '#0284c7' }}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'A guardar...' : t('save')}</span>
          </button>
        </div>
      </form>

      {/* Security & Password Change */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <KeyRound className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">Segurança & Alteração de Palavra-passe</h3>
        </div>

        <p className="text-xs text-slate-500">
          Altere a palavra-passe da sua conta (<strong className="text-slate-700">{user?.email || 'admin@freitas-nettoyage.com'}</strong>). Você continuará com acesso imediato e a nova senha será exigida nos próximos inícios de sessão em qualquer dispositivo.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Palavra-passe Atual</label>
              <input
                type="password"
                placeholder="Senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nova Palavra-passe</label>
              <input
                type="password"
                placeholder="Mínimo 4 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-start">
            <button
              type="submit"
              disabled={changingPass}
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow transition-all flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{changingPass ? 'A atualizar...' : 'Atualizar Palavra-passe'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Database Maintenance & Backups */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">{t('setBackupTitle')}</h3>
        </div>

        <p className="text-xs text-slate-500">
          Exporte uma cópia completa de todos os clientes, contratos, faturas e relatórios em formato JSON estruturado, ou restaure dados de demonstração para testes.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>{t('setDownloadBackup')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleReset(true)}
            className="px-4 py-2 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-sky-600" />
            <span>{t('setResetDemo')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleReset(false)}
            className="px-4 py-2 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all flex items-center gap-2"
          >
            <span>{t('setResetClean')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
