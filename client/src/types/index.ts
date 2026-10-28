export type UserRole = 
  | 'admin' 
  | 'director' 
  | 'operational_manager' 
  | 'team_leader' 
  | 'employee' 
  | 'accounting';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  active: boolean;
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  tradeName: string;
  logo: string;
  primaryColor: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  taxId: string;
  vatNumber: string;
  siret: string;
  website: string;
  iban: string;
  bic: string;
  bankName: string;
  currency: string;
  defaultLanguage: 'pt' | 'fr' | 'en';
  dateFormat: string;
  timezone: string;
  paymentTerms: string;
  quoteConditions: string;
  invoiceNotes: string;
}

export type ClientType = 
  | 'particular' 
  | 'company' 
  | 'condo' 
  | 'condo_admin' 
  | 'real_estate_agency';

export interface Client {
  id: string;
  code: string;
  type: ClientType;
  name: string;
  tradeName: string;
  contactPerson: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  taxId: string;
  vatNumber: string;
  website: string;
  notes: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  properties?: Property[];
  contracts?: Contract[];
  quotes?: Quote[];
  interventions?: ServiceIntervention[];
  invoices?: Invoice[];
  payments?: Payment[];
}

export type PropertyType = 
  | 'residential_building' 
  | 'commercial_building' 
  | 'office' 
  | 'condominium' 
  | 'villa' 
  | 'other';

export interface Property {
  id: string;
  code: string;
  name: string;
  clientId: string;
  clientName?: string;
  type: PropertyType;
  address: string;
  postalCode: string;
  city: string;
  buildingsCount: number;
  floorsCount: number;
  stairsCount: number;
  elevatorsCount: number;
  entrancesCount: number;
  approxArea: number;
  flooringType: string;
  commonAreasDescription: string;
  cleaningFrequency: string;
  authorizedHours: string;
  siteContact: string;
  accessInstructions: string;
  notes: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type ServiceCategory = 
  | 'stairs'
  | 'floors'
  | 'corridors'
  | 'entrances'
  | 'elevators'
  | 'common_areas'
  | 'offices'
  | 'properties'
  | 'post_construction'
  | 'deep_cleaning'
  | 'windows'
  | 'floor_treatment'
  | 'extraordinary'
  | 'custom';

export type ServiceStatus = 
  | 'to_plan' 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'pending' 
  | 'cancelled' 
  | 'requires_verification';

export interface ServiceIntervention {
  id: string;
  code: string;
  clientId: string;
  clientName?: string;
  propertyId: string;
  propertyName?: string;
  propertyAddress?: string;
  category: ServiceCategory;
  description: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  teamId?: string;
  teamName?: string;
  assignedEmployeeIds: string[];
  assignedEmployees?: Employee[];
  frequency: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  price: number;
  requiredMaterials: string;
  materialsList?: string;
  equipmentIds?: string[];
  equipments?: Equipment[];
  equipmentCheckStatus?: 'pending' | 'checked_out' | 'returned_ok' | 'returned_issue';
  checkedOutAt?: string;
  returnedAt?: string;
  checkoutNotes?: string;
  specificInstructions: string;
  photos: string[];
  status: ServiceStatus;
  completedAt?: string;
  notes?: string;
  createdAt: string;
}

export type EquipmentCategory = 
  | 'floor_care' 
  | 'vacuum' 
  | 'pressure_washer' 
  | 'steamer' 
  | 'scaffold_ladder' 
  | 'generator' 
  | 'hand_tool' 
  | 'other';

export type EquipmentStatus = 'available' | 'in_service' | 'maintenance' | 'broken';

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: EquipmentCategory | string;
  brandModel: string;
  serialNumber: string;
  purchaseDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  status: EquipmentStatus;
  currentServiceId?: string;
  currentServiceCode?: string;
  assignedEmployeeId?: string;
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  code: string;
  fullName: string;
  photo?: string;
  phone: string;
  email: string;
  address: string;
  role: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  teamId?: string;
  teamName?: string;
  workingHours: string;
  availability: string;
  skills: string[];
  notes?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  leaderId?: string;
  color: string;
  notes?: string;
}

export interface QualityChecklist {
  id: string;
  interventionId: string;
  items: {
    id: string;
    task: string;
    completed: boolean;
    notes?: string;
  }[];
  notes?: string;
  beforePhotos: string[];
  afterPhotos: string[];
  needsCorrection: boolean;
  correctionNotes?: string;
  inspectedBy?: string;
  inspectedAt?: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Quote {
  id: string;
  number: string;
  clientId: string;
  clientName?: string;
  propertyId?: string;
  propertyName?: string;
  issueDate: string;
  expiryDate: string;
  items: QuoteItem[];
  discountPercent: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentConditions: string;
  frequency: string;
  notes: string;
  terms: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  createdAt: string;
}

export interface Contract {
  id: string;
  number: string;
  quoteId?: string;
  clientId: string;
  clientName?: string;
  propertyId: string;
  propertyName?: string;
  contractedServices: string;
  frequency: string;
  scheduledTimes: string;
  agreedPrice: number;
  paymentConditions: string;
  startDate: string;
  endDate?: string;
  renewalTerms: string;
  terminationTerms: string;
  notes: string;
  status: 'active' | 'suspended' | 'terminated' | 'expiring_soon';
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  quoteId?: string;
  contractId?: string;
  clientId: string;
  clientName?: string;
  clientTaxId?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  paymentTerms: string;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  paymentDate: string;
  method: 'bank_transfer' | 'direct_debit' | 'card' | 'cash' | 'check';
  reference: string;
  notes: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  supplierId?: string;
  supplierName?: string;
  stockQty: number;
  unit: string;
  purchasePrice: number;
  minStock: number;
  location: string;
  notes: string;
  updatedAt: string;
  isLowStock?: boolean;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  tradeName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  productsSupplied: string;
  paymentConditions: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Expense {
  id: string;
  category: 
    | 'cleaning_products'
    | 'equipment'
    | 'fuel'
    | 'transport'
    | 'maintenance'
    | 'uniforms'
    | 'insurance'
    | 'salaries'
    | 'other';
  description: string;
  amount: number;
  date: string;
  supplierId?: string;
  supplierName?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface DashboardData {
  totalClients: number;
  totalProperties: number;
  todayServicesCount: number;
  completedServicesCount: number;
  pendingServicesCount: number;
  delayedServicesCount: number;
  quotesSentCount: number;
  quotesAcceptedCount: number;
  invoicesIssuedCount: number;
  invoicesUnpaidCount: number;
  totalBilled: number;
  totalOutstanding: number;
  totalExpenses: number;
  netEstimated: number;
  upcomingInterventions: any[];
  chartData: { month: string; receitas: number; despesas: number }[];
  recentActivity: any[];
}
