import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CompanySettings } from '../types';

interface CompanyContextType {
  settings: CompanySettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<CompanySettings>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: CompanySettings = {
  name: 'CleanPro Facility Services Lda',
  tradeName: 'CleanPro ERP & Limpezas',
  logo: '',
  primaryColor: '#0284c7',
  phone: '+351 21 000 0000',
  mobile: '+351 91 000 0000',
  email: 'contacto@cleanpro-services.com',
  address: 'Avenida da Liberdade, nº 150, 3º Dto',
  postalCode: '1250-146',
  city: 'Lisboa',
  country: 'Portugal',
  taxId: '509876543',
  vatNumber: 'PT509876543',
  siret: '849 123 456 00012',
  website: 'https://cleanpro-services.com',
  iban: 'PT50 0033 0000 1234 5678 9012 3',
  bic: 'BCPTPTLX',
  bankName: 'Millennium BCP',
  currency: 'EUR',
  defaultLanguage: 'pt',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Europe/Lisbon',
  paymentTerms: 'Pagamento a 30 dias após emissão da fatura.',
  quoteConditions: 'Orçamento válido por 30 dias. Inclui todos os materiais, equipa profissional e seguro de acidentes de trabalho.',
  invoiceNotes: 'Obrigado pela vossa confiança.'
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const applyBranding = (data: CompanySettings) => {
    if (data.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', data.primaryColor);
    }
    if (data.tradeName) {
      document.title = `${data.tradeName} - ERP`;
    }
  };

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        applyBranding(data);
      }
    } catch (err) {
      console.error('Error fetching settings', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<CompanySettings>): Promise<CompanySettings> => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    const updated = await res.json();
    setSettings(updated);
    applyBranding(updated);
    return updated;
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <CompanyContext.Provider value={{ settings, loading, updateSettings, refreshSettings }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) throw new Error('useCompany must be used within a CompanyProvider');
  return context;
};
