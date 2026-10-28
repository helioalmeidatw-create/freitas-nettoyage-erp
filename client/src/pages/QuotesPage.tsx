import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Filter, Download, ArrowRight, 
  Trash2, Edit, CheckCircle2, XCircle, Clock, Building2 
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import type { Quote, Client, Property, QuoteItem } from '../types';
import { Modal } from '../components/Modal';
import { generateQuotePDF } from '../components/PDFGenerator';

export const QuotesPage: React.FC = () => {
  const { t, language } = useI18n();
  const { settings } = useCompany();
  const toast = useToast();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Form
  const [formData, setFormData] = useState<Partial<Quote>>({
    clientId: '',
    propertyId: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    items: [
      { id: '1', description: 'Limpeza bissemanal de escadas, halls e elevadores', quantity: 1, unit: 'mês', unitPrice: 380, discount: 0, total: 380 }
    ],
    vatRate: 23,
    paymentConditions: '30 dias',
    frequency: 'Contrato Recorrente',
    notes: '',
    status: 'draft'
  });

  const fetchData = async () => {
    try {
      const [resQuotes, resClients, resProps] = await Promise.all([
        fetch('/api/quotes'),
        fetch('/api/clients'),
        fetch('/api/properties')
      ]);
      if (resQuotes.ok) setQuotes(await resQuotes.json());
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
    setSelectedQuote(null);
    setFormData({
      clientId: clients[0]?.id || '',
      propertyId: properties[0]?.id || '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: [
        { id: '1', description: 'Limpeza bissemanal de escadas, halls de entrada e elevadores', quantity: 1, unit: 'mês', unitPrice: 380, discount: 0, total: 380 }
      ],
      vatRate: 23,
      paymentConditions: '30 dias após emissão da fatura',
      frequency: 'Contrato Mensal Recorrente',
      notes: 'Todos os produtos e equipamentos incluídos.',
      status: 'draft'
    });
    setIsFormOpen(true);
  };

  // Add Item Line
  const handleAddItem = () => {
    const items = formData.items || [];
    setFormData({
      ...formData,
      items: [
        ...items,
        { id: String(Date.now()), description: '', quantity: 1, unit: 'serviço', unitPrice: 100, discount: 0, total: 100 }
      ]
    });
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const items = [...(formData.items || [])];
    items[index] = { ...items[index], [field]: value };
    // Recalculate total
    const qty = Number(items[index].quantity) || 0;
    const price = Number(items[index].unitPrice) || 0;
    items[index].total = Math.round(qty * price * 100) / 100;
    setFormData({ ...formData, items });
  };

  const handleRemoveItem = (index: number) => {
    const items = (formData.items || []).filter((_, idx) => idx !== index);
    setFormData({ ...formData, items });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      toast.warning('Selecione o cliente para o orçamento.');
      return;
    }

    try {
      const method = selectedQuote ? 'PUT' : 'POST';
      const endpoint = selectedQuote ? `/api/quotes/${selectedQuote.id}` : '/api/quotes';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(selectedQuote ? 'Orçamento atualizado!' : 'Orçamento gerado com sucesso!');
        setIsFormOpen(false);
        fetchData();
      } else {
        toast.error('Erro ao guardar orçamento.');
      }
    } catch (err) {
      toast.error('Falha de ligação ao servidor.');
    }
  };

  // 1-Click Convert to Contract & Service
  const handleConvert = async (quote: Quote) => {
    if (!window.confirm(`Deseja aceitar e converter o Orçamento ${quote.number} em Contrato e Intervenção de Serviço?`)) return;

    try {
      const res = await fetch(`/api/quotes/${quote.id}/convert`, { method: 'POST' });
      if (res.ok) {
        toast.success(t('quoteConvertedSuccess'));
        fetchData();
      } else {
        toast.error('Erro ao converter orçamento.');
      }
    } catch (err) {
      toast.error('Falha ao comunicar com o servidor.');
    }
  };

  // Export PDF
  const handleExportPDF = (quote: Quote) => {
    const client = clients.find(c => c.id === quote.clientId);
    generateQuotePDF(quote, client, settings, language);
    toast.success('Documento PDF descarregado!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">{t('quoteAccepted')}</span>;
      case 'converted': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">{t('quoteConverted')}</span>;
      case 'sent': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-100 text-sky-800">{t('quoteSent')}</span>;
      case 'rejected': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800">{t('quoteRejected')}</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{t('quoteDraft')}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {t('quotesTitle')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {t('quotesSubtitle')}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
        >
          <Plus className="w-4 h-4" />
          <span>{t('addQuote')}</span>
        </button>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">{t('loading')}</div>
        ) : quotes.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{t('noData')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t('quoteNumber')}</th>
                  <th className="py-3 px-4">Cliente / Imóvel</th>
                  <th className="py-3 px-4">Datas</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">{t('total')}</th>
                  <th className="py-3 px-4">{t('status')}</th>
                  <th className="py-3 px-4 text-center">Ações Rápidas</th>
                  <th className="py-3 px-4 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {quotes.map(quote => (
                  <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">
                      {quote.number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{quote.clientName}</div>
                      {quote.propertyName && (
                        <div className="text-[11px] text-slate-400">{quote.propertyName}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600">
                      <div>Emissão: {quote.issueDate}</div>
                      <div className="text-slate-400">Válido até: {quote.expiryDate}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {Number(quote.subtotal).toFixed(2)} €
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      {Number(quote.total).toFixed(2)} €
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(quote.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {quote.status !== 'converted' ? (
                        <button
                          onClick={() => handleConvert(quote)}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Aceitar e Converter em Contrato Oficial"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Converter</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">Contrato Ativo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleExportPDF(quote)}
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

      {/* Modal: Create Quote */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedQuote ? 'Editar Orçamento' : t('addQuote')}
        subtitle="Adicione os itens de limpeza, periodicidade e taxas para cálculo automático."
        maxWidth="4xl"
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
                Imóvel / Condomínio
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('quoteIssueDate')}
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
                {t('quoteExpiryDate')}
              </label>
              <input
                type="date"
                value={formData.expiryDate || ''}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* Dynamic Item Lines */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Linhas de Serviço do Orçamento
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Linha</span>
              </button>
            </div>

            <div className="space-y-2">
              {(formData.items || []).map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="Descrição do serviço (ex: Limpeza bissemanal de escadas...)"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qtd"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Preço Unitário (€)"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
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
