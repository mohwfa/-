import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from './components/ToastContainer';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { InvoiceList } from './components/Invoices/InvoiceList';
import { InvoiceModal } from './components/Invoices/InvoiceModal';
import { VoucherList } from './components/Vouchers/VoucherList';
import { VoucherModal } from './components/Vouchers/VoucherModal';
import { TreasuryList } from './components/Treasuries/TreasuryList';
import { PartyList } from './components/Parties/PartyList';
import { EmployeeList } from './components/Employees/EmployeeList';
import { ReportsView } from './components/Reports/ReportsView';
import { UserManagement } from './components/Users/UserManagement';
import { PrintSlipModal } from './components/Print/PrintSlipModal';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { AboutSystemModal } from './components/AboutSystemModal';
import { LockScreen } from './components/Auth/LockScreen';
import { PublicStatementPortal } from './components/Portal/PublicStatementPortal';
import { Invoice, InvoiceType, Voucher, VoucherType } from './types';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [invoiceInitialType, setInvoiceInitialType] = useState<InvoiceType>('sale');

  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherToEdit, setVoucherToEdit] = useState<Voucher | null>(null);
  const [voucherInitialType, setVoucherInitialType] = useState<VoucherType>('receipt');
  const [voucherInitialPartyId, setVoucherInitialPartyId] = useState<string | undefined>(undefined);

  const [isCompanySettingsOpen, setIsCompanySettingsOpen] = useState(false);
  const [companySettingsInitialTab, setCompanySettingsInitialTab] = useState<
    'general' | 'print' | 'admin' | 'fiscal'
  >('general');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const handleOpenCompanySettings = (
    tab: 'general' | 'print' | 'admin' | 'fiscal' = 'general'
  ) => {
    setCompanySettingsInitialTab(tab);
    setIsCompanySettingsOpen(true);
  };

  // Print Slip Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTargetInvoice, setPrintTargetInvoice] = useState<Invoice | undefined>(undefined);
  const [printTargetVoucher, setPrintTargetVoucher] = useState<Voucher | undefined>(undefined);

  const handleOpenNewInvoice = (type: InvoiceType = 'sale') => {
    setInvoiceToEdit(null);
    setInvoiceInitialType(type);
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoice = (inv: Invoice) => {
    setInvoiceToEdit(inv);
    setIsInvoiceModalOpen(true);
  };

  const handlePrintInvoice = (inv: Invoice) => {
    setPrintTargetInvoice(inv);
    setPrintTargetVoucher(undefined);
    setIsPrintModalOpen(true);
  };

  const handleOpenNewVoucher = (type: VoucherType = 'receipt') => {
    setVoucherToEdit(null);
    setVoucherInitialType(type);
    setVoucherInitialPartyId(undefined);
    setIsVoucherModalOpen(true);
  };

  const handleEditVoucher = (v: Voucher) => {
    setVoucherToEdit(v);
    setIsVoucherModalOpen(true);
  };

  const handlePrintVoucher = (v: Voucher) => {
    setPrintTargetVoucher(v);
    setPrintTargetInvoice(undefined);
    setIsPrintModalOpen(true);
  };

  const handleOpenNewVoucherForParty = (partyId: string, type: VoucherType) => {
    setVoucherToEdit(null);
    setVoucherInitialType(type);
    setVoucherInitialPartyId(partyId);
    setCurrentTab('vouchers');
    setIsVoucherModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      <Header
        onOpenNewInvoice={() => handleOpenNewInvoice('sale')}
        onOpenNewVoucher={() => handleOpenNewVoucher('receipt')}
        onNavigateToEmployees={() => setCurrentTab('employees')}
        onNavigateToUsers={() => setCurrentTab('users')}
        onOpenCompanySettings={handleOpenCompanySettings}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-4 p-3 sm:p-5 lg:p-6">
        <Sidebar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

        <main className="flex-1 min-w-0">
          {currentTab === 'dashboard' && (
            <Dashboard
              onOpenNewInvoice={handleOpenNewInvoice}
              onOpenNewVoucher={() => handleOpenNewVoucher('receipt')}
              onOpenNewVoucherForParty={handleOpenNewVoucherForParty}
              onPrintInvoice={handlePrintInvoice}
              onPrintVoucher={handlePrintVoucher}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'invoices' && (
            <InvoiceList
              onOpenNewInvoice={handleOpenNewInvoice}
              onEditInvoice={handleEditInvoice}
              onPrintInvoice={handlePrintInvoice}
            />
          )}

          {currentTab === 'vouchers' && (
            <VoucherList
              onOpenNewVoucher={handleOpenNewVoucher}
              onEditVoucher={handleEditVoucher}
              onPrintVoucher={handlePrintVoucher}
            />
          )}

          {currentTab === 'treasuries' && <TreasuryList />}

          {currentTab === 'parties' && (
            <PartyList onOpenNewVoucherForParty={handleOpenNewVoucherForParty} />
          )}

          {currentTab === 'employees' && <EmployeeList />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'users' && <UserManagement />}
        </main>
      </div>

      {/* Modals */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setInvoiceToEdit(null);
        }}
        invoiceToEdit={invoiceToEdit}
        initialType={invoiceInitialType}
        onSavedAndPrint={(savedInv) => {
          handlePrintInvoice(savedInv);
        }}
      />

      <VoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => {
          setIsVoucherModalOpen(false);
          setVoucherToEdit(null);
          setVoucherInitialPartyId(undefined);
        }}
        voucherToEdit={voucherToEdit}
        initialType={voucherInitialType}
        initialPartyId={voucherInitialPartyId}
        onSavedAndPrint={(savedV) => {
          handlePrintVoucher(savedV);
        }}
      />

      <PrintSlipModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        invoice={printTargetInvoice}
        voucher={printTargetVoucher}
      />

      <CompanySettingsModal
        isOpen={isCompanySettingsOpen}
        onClose={() => setIsCompanySettingsOpen(false)}
        onNavigateToUsers={() => setCurrentTab('users')}
        initialTab={companySettingsInitialTab}
      />

      <AboutSystemModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        onNavigateToTab={(tab) => setCurrentTab(tab)}
        onOpenCompanySettings={handleOpenCompanySettings}
      />

      <LockScreen />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  const [portalToken, setPortalToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const portal = params.get('portal');
    const token = params.get('token');
    if (portal === 'statement' && token) {
      return token;
    }
    return null;
  });

  if (portalToken) {
    return (
      <PublicStatementPortal
        token={portalToken}
        onExitPortal={() => {
          setPortalToken(null);
          window.history.pushState({}, '', window.location.pathname);
        }}
      />
    );
  }

  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
