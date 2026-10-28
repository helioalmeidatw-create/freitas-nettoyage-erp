import React, { useState } from 'react';
import { I18nProvider } from './context/I18nContext';
import { CompanyProvider } from './context/CompanyContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';

import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { ServicesPage } from './pages/ServicesPage';
import { PlanningPage } from './pages/PlanningPage';
import { QuotesPage } from './pages/QuotesPage';
import { ContractsPage } from './pages/ContractsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InventoryPage } from './pages/InventoryPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';

export const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page: string) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">A carregar Freitas Nettoyage ERP...</span>
        </div>
      </div>
    );
  }

  // Se não estiver logado, EXIGE tela de login com e-mail e senha!
  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage onNavigate={handleNavigate} />;
      case 'clients': return <ClientsPage />;
      case 'properties': return <PropertiesPage />;
      case 'services': return <ServicesPage />;
      case 'planning': return <PlanningPage />;
      case 'quotes': return <QuotesPage />;
      case 'contracts': return <ContractsPage />;
      case 'invoices': return <InvoicesPage />;
      case 'inventory': return <InventoryPage />;
      case 'suppliers': return <SuppliersPage />;
      case 'expenses': return <ExpensesPage />;
      case 'employees': return <EmployeesPage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      case 'users': return <UsersPage />;
      default: return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activePage={activePage}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={handleNavigate}
          activePage={activePage}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <I18nProvider>
      <CompanyProvider>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </CompanyProvider>
    </I18nProvider>
  );
}
