import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CompanySettings, Quote, Invoice } from '../types';

export const generateQuotePDF = (quote: Quote, client: any, settings: CompanySettings, lang: string = 'pt') => {
  const doc = new jsPDF();
  const primaryColor = settings.primaryColor || '#0284c7';

  // Header Background bar
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, 210, 18, 'F');

  // Company Name
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.tradeName || settings.name, 14, 30);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${settings.address} - ${settings.postalCode} ${settings.city}, ${settings.country}`, 14, 36);
  doc.text(`Tel: ${settings.phone} | E-mail: ${settings.email}`, 14, 41);
  if (settings.vatNumber) doc.text(`NIF / TVA: ${settings.vatNumber}`, 14, 46);
  if (settings.siret) doc.text(`SIRET: ${settings.siret}`, 75, 46);

  // Document Title & Number
  const title = lang === 'fr' ? 'DEVIS COMMERCIAL' : lang === 'en' ? 'PRICE ESTIMATE' : 'PROPOSTA / ORÇAMENTO';
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text(title, 140, 30);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Nº: ${quote.number}`, 140, 37);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${lang === 'fr' ? 'Date' : lang === 'en' ? 'Date' : 'Data'}: ${quote.issueDate}`, 140, 43);
  doc.text(`${lang === 'fr' ? 'Validité' : lang === 'en' ? 'Valid until' : 'Validade'}: ${quote.expiryDate}`, 140, 48);

  // Client Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 55, 182, 30, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(lang === 'fr' ? 'DESTINATAIRE / CLIENT :' : lang === 'en' ? 'CLIENT / RECIPIENT:' : 'DESTINATÁRIO / CLIENTE:', 18, 62);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(client?.name || quote.clientName || 'Cliente', 18, 69);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${client?.address || ''} - ${client?.postalCode || ''} ${client?.city || ''}`, 18, 75);
  doc.text(`NIF / Tax ID: ${client?.taxId || '-'} | Tel: ${client?.phone || client?.mobile || '-'}`, 18, 80);

  // Table of Items
  const headers = lang === 'fr' 
    ? [['Description', 'Qté', 'Unité', 'Prix Unitaire', 'Total HT']]
    : lang === 'en'
    ? [['Description', 'Qty', 'Unit', 'Unit Price', 'Total']]
    : [['Descrição dos Serviços', 'Qtd', 'Unidade', 'Preço Unitário', 'Total s/ IVA']];

  const rows = (quote.items || []).map(i => [
    i.description,
    i.quantity.toString(),
    i.unit || 'serv.',
    `${Number(i.unitPrice).toFixed(2)} €`,
    `${Number(i.total).toFixed(2)} €`
  ]);

  autoTable(doc, {
    startY: 92,
    head: headers,
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: '#ffffff',
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right' }
    }
  });

  // Totals Box
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`${lang === 'fr' ? 'Sous-total HT' : lang === 'en' ? 'Subtotal' : 'Subtotal'}:`, 140, finalY);
  doc.text(`${quote.subtotal.toFixed(2)} €`, 190, finalY, { align: 'right' });

  doc.text(`${lang === 'fr' ? 'TVA' : lang === 'en' ? 'VAT' : 'IVA'} (${quote.vatRate}%):`, 140, finalY + 6);
  doc.text(`${quote.vatAmount.toFixed(2)} €`, 190, finalY + 6, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${lang === 'fr' ? 'TOTAL TTC' : lang === 'en' ? 'TOTAL' : 'TOTAL COM IVA'}:`, 140, finalY + 14);
  doc.setTextColor(primaryColor);
  doc.text(`${quote.total.toFixed(2)} €`, 190, finalY + 14, { align: 'right' });

  // Terms and Bank details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(lang === 'fr' ? 'Conditions & Modalités :' : lang === 'en' ? 'Terms & Conditions:' : 'Condições & Modalidades:', 14, finalY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const termsText = quote.terms || settings.quoteConditions;
  doc.text(doc.splitTextToSize(termsText, 180), 14, finalY + 28);

  if (settings.iban) {
    doc.text(`IBAN: ${settings.iban} | BIC: ${settings.bic || ''} | Banco: ${settings.bankName || ''}`, 14, finalY + 44);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`${settings.name} - ${settings.tradeName} | Documento emitido por Freitas Nettoyage ERP`, 105, 285, { align: 'center' });

  doc.save(`Orcamento_${quote.number}.pdf`);
};

export const generateInvoicePDF = (invoice: Invoice, client: any, settings: CompanySettings, lang: string = 'pt') => {
  const doc = new jsPDF();
  const primaryColor = settings.primaryColor || '#0284c7';

  // Header bar
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, 210, 18, 'F');

  // Company Name
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.tradeName || settings.name, 14, 30);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${settings.address} - ${settings.postalCode} ${settings.city}, ${settings.country}`, 14, 36);
  doc.text(`Tel: ${settings.phone} | E-mail: ${settings.email}`, 14, 41);
  if (settings.vatNumber) doc.text(`NIF / TVA: ${settings.vatNumber}`, 14, 46);
  if (settings.siret) doc.text(`SIRET: ${settings.siret}`, 75, 46);

  // Document Title & Number
  const title = lang === 'fr' ? 'FACTURE' : lang === 'en' ? 'TAX INVOICE' : 'FATURA';
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text(title, 145, 30);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Nº: ${invoice.number}`, 145, 37);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${lang === 'fr' ? 'Émission' : lang === 'en' ? 'Issued' : 'Emissão'}: ${invoice.issueDate}`, 145, 43);
  doc.text(`${lang === 'fr' ? 'Échéance' : lang === 'en' ? 'Due date' : 'Vencimento'}: ${invoice.dueDate}`, 145, 48);

  // Client Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 55, 182, 30, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(lang === 'fr' ? 'FACTURÉ À :' : lang === 'en' ? 'BILLED TO:' : 'FATURADO A:', 18, 62);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(client?.name || invoice.clientName || 'Cliente', 18, 69);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${client?.address || ''} - ${client?.postalCode || ''} ${client?.city || ''}`, 18, 75);
  doc.text(`NIF / SIRET: ${client?.taxId || invoice.clientTaxId || '-'}`, 18, 80);

  // Table of Items
  const headers = lang === 'fr' 
    ? [['Description des Prestations', 'Qté', 'Unité', 'Prix Unitaire', 'Total HT']]
    : lang === 'en'
    ? [['Services Description', 'Qty', 'Unit', 'Unit Price', 'Total']]
    : [['Descrição dos Serviços de Limpeza', 'Qtd', 'Unidade', 'Preço Unitário', 'Total s/ IVA']];

  const rows = (invoice.items || []).map(i => [
    i.description,
    i.quantity.toString(),
    i.unit || 'mês',
    `${Number(i.unitPrice).toFixed(2)} €`,
    `${Number(i.total).toFixed(2)} €`
  ]);

  autoTable(doc, {
    startY: 92,
    head: headers,
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: '#ffffff',
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right' }
    }
  });

  // Totals Box
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`${lang === 'fr' ? 'Total HT' : lang === 'en' ? 'Subtotal' : 'Subtotal'}:`, 140, finalY);
  doc.text(`${invoice.subtotal.toFixed(2)} €`, 190, finalY, { align: 'right' });

  doc.text(`${lang === 'fr' ? 'TVA' : lang === 'en' ? 'VAT' : 'IVA'} (${invoice.vatRate}%):`, 140, finalY + 6);
  doc.text(`${invoice.vatAmount.toFixed(2)} €`, 190, finalY + 6, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${lang === 'fr' ? 'NET À PAYER' : lang === 'en' ? 'TOTAL DUE' : 'TOTAL A PAGAR'}:`, 140, finalY + 14);
  doc.setTextColor(primaryColor);
  doc.text(`${invoice.total.toFixed(2)} €`, 190, finalY + 14, { align: 'right' });

  // Payment Status
  doc.setFontSize(10);
  if (invoice.paidAmount > 0) {
    doc.setTextColor(16, 185, 129); // green
    doc.text(`${lang === 'fr' ? 'Montant Réglé' : lang === 'en' ? 'Paid' : 'Liquidado'}: ${invoice.paidAmount.toFixed(2)} €`, 140, finalY + 22);
    if (invoice.balanceDue > 0) {
      doc.setTextColor(239, 68, 68); // red
      doc.text(`${lang === 'fr' ? 'Reste Dû' : lang === 'en' ? 'Balance Due' : 'Em Dívida'}: ${invoice.balanceDue.toFixed(2)} €`, 140, finalY + 28);
    }
  }

  // Legal & Bank instructions
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(lang === 'fr' ? 'Modalités de Règlement :' : lang === 'en' ? 'Payment Terms:' : 'Instruções de Pagamento:', 14, finalY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`IBAN: ${settings.iban} | BIC: ${settings.bic || ''}`, 14, finalY + 28);
  doc.text(`Banco: ${settings.bankName || ''}`, 14, finalY + 33);
  doc.text(doc.splitTextToSize(invoice.notes || settings.invoiceNotes, 180), 14, finalY + 40);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`${settings.name} - ${settings.tradeName} | Freitas Nettoyage ERP`, 105, 285, { align: 'center' });

  doc.save(`Fatura_${invoice.number}.pdf`);
};
