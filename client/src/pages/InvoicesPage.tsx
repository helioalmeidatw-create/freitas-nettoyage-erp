import React, { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Search, Filter, Download, DollarSign, 
  CheckCircle2, Clock, AlertTriangle, FileSpreadsheet, Eye 
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import type { Invoice, Client, InvoiceItem } from '../types';
import { Modal } from '../components/Modal';
import { generateInvoicePDF } from '../components/PDFGenerator';

export const InvoicesPage: React.FC = () => {
  const { t, language } = useI18n();
  const { settings } = useCompany();
  const toast = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Invoice>>({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    items: [
      { id: '1', description: 'Prestação de serviços de limpeza e conservação de condomínio', quantity: 1, unit: 'mês', unitPrice: 380, total: 380 }
    ],
    vatRate: 23,
    paymentTerms: '30 dias',
    status: 'issued',
    notes: ''
  });

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'direct_debit' | 'card' | 'cash' | 'check'>('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');

  const fetchData = async () => {
    try {
      const [resInv, resCli] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/clients')
      ]);
      if (resInv.ok) setInvoices(await resInv.json());
      if (resCli.ok) setClients(await resCli.json());
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
    setSelectedInvoice(null);
    setFormData({
      clientId: clients[0]?.id || '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: [
        { id: '1', description: 'Prestação mensal de serviços de limpeza', quantity: 1, unit: 'mês', unitPrice: 380, total: 380 }
      ],
      vatRate: 23,
      paymentTerms: '30 dias após data da fatura',
      status: 'issued',
      notes: settings.invoiceNotes || ''
    });
    setIsFormOpen(true);
  };

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balanceDue || inv.total);
    setPaymentRef('');
    setIsPaymentOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (paymentAmount <= 0) {
      toast.warning('O montante de pagamento deve ser superior a zero.');
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: paymentAmount,
          method: paymentMethod,
          reference: paymentRef,
          paymentDate: new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        toast.success('Pagamento registado com sucesso!');
        setIsPaymentOpen(false);
        fetchData();
      } else {
        toast.error('Erro ao registar pagamento.');
      }
    } catch (err) {
      toast.error('Falha de ligação ao servidor.');
    }
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      toast.warning('Selecione o cliente a faturar.');
      return;
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Fatura emitida com sucesso!');
        setIsFormOpen(false);
        fetchData();
      } else {
        toast.error('Erro ao emitir fatura.');
      }
    } catch (err) {
      toast.error('Falha ao comunicar com o servidor.');
    }
  };

  // Export PDF
  const handleExportPDF = (inv: Invoice) => {
    const client = clients.find(c => c.id === inv.clientId);
    generateInvoicePDF(inv, client, settings, language);
    toast.success('Documento PDF da Fatura descarregado!');
  };

  // Export CSV
  const handleExportCSV = () => {
    window.open('/api/invoices-export', '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">{t('invoiceStatusPaid')}</span>;
      case 'partially_paid': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">{t('invoiceStatusPartiallyPaid')}</span>;
      case 'issued': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-100 text-sky-800">{t('invoiceStatusIssued')}</span>;
      case 'overdue': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800">{t('invoiceStatusOverdue')}</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{t('invoiceStatusDraft')}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {t('invoicesTitle')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {t('invoicesSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{t('exportCSV')}</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
          >
            <Plus className="w-4 h-4" />
            <span>{t('addInvoice')}</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">{t('loading')}</div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{t('noData')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t('invoiceNumber')}</th>
                  <th className="py-3 px-4">Cliente & NIF</th>
                  <th className="py-3 px-4">Emissão / Vencimento</th>
                  <th className="py-3 px-4">{t('total')}</th>
                  <th className="py-3 px-4">{t('invoicePaid')}</th>
                  <th className="py-3 px-4">{t('invoiceBalance')}</th>
                  <th className="py-3 px-4">{t('status')}</th>
                  <th className="py-3 px-4 text-center">Règlement</th>
                  <th className="py-3 px-4 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">
                      {inv.number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inv.clientName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">NIF: {inv.clientTaxId || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600">
                      <div>Emissão: {inv.issueDate}</div>
                      <div className="text-slate-400">Vence: {inv.dueDate}</div>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      {Number(inv.total).toFixed(2)} €
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">
                      {Number(inv.paidAmount).toFixed(2)} €
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">
                      {Number(inv.balanceDue) > 0 ? (
                        <span className="text-amber-600">{Number(inv.balanceDue).toFixed(2)} €</span>
                      ) : (
                        <span className="text-slate-400">0.00 €</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inv.balanceDue > 0 ? (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Pagar</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-600">Totalmente Pago</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleExportPDF(inv)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        title={t('exportPDF')}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Invoice */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t('addInvoice')}
        subtitle="Emita faturas com numeração sequencial, IVA e dados bancários automáticos."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveInvoice} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cliente a Faturar *
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
                Data de Emissão
              </label>
              <input
                type="date"
                value={formData.issueDate || ''}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('invoiceDueDate')}
              </label>
              <input
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Taxa de IVA (%)
              </label>
              <input
                type="number"
                value={formData.vatRate || 23}
                onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor sem Impostos (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.items?.[0]?.unitPrice || 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const items = [{ id: '1', description: formData.items?.[0]?.description || 'Serviços de limpeza', quantity: 1, unit: 'mês', unitPrice: val, total: val }];
                  setFormData({ ...formData, items });
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descrição dos Serviços
              </label>
              <input
                type="text"
                value={formData.items?.[0]?.description || ''}
                onChange={(e) => {
                  const desc = e.target.value;
                  const price = formData.items?.[0]?.unitPrice || 0;
                  setFormData({
                    ...formData,
                    items: [{ id: '1', description: desc, quantity: 1, unit: 'mês', unitPrice: price, total: price }]
                  });
                }}
                placeholder="Ex: Prestação de serviços de limpeza e conservação de condomínio..."
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

      {/* Modal: Register Payment */}
      {selectedInvoice && (
        <Modal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          title={t('invoiceRegisterPayment')}
          subtitle={`Fatura: ${selectedInvoice.number} • Cliente: ${selectedInvoice.clientName}`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('payAmount')} (€) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                max={selectedInvoice.balanceDue}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Valor total em dívida: {Number(selectedInvoice.balanceDue).toFixed(2)} €
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('payMethod')}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="bank_transfer">{t('payTransfer')}</option>
                <option value="direct_debit">{t('payDirectDebit')}</option>
                <option value="card">{t('payCard')}</option>
                <option value="cash">{t('payCash')}</option>
                <option value="check">{t('payCheck')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Referência / Comprovativo Bancário
              </label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Ex: TRF-BCP-98123"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
              >
                Confirmar Recebimento
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
