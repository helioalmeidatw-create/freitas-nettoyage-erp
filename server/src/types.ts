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
  password: string; // hashed or demo
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
  taxId: string; // NIF / CNPJ / etc
  vatNumber: string; // Numéro TVA intracommunautaire
  siret: string; // French SIRET if applicable
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
  type: PropertyType;
  address: string;
  postalCode: string;
  city: string;
  buildingsCount: number;
  floorsCount: number;
  stairsCount: number;
  elevatorsCount: number;
  entrancesCount: number;
  approxArea: number; // m2
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
  propertyId: string;
  category: ServiceCategory;
  description: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  teamId?: string;
  assignedEmployeeIds: string[];
  frequency: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  price: number;
  requiredMaterials: string;
  materialsList?: string;
  equipmentIds?: string[];
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
  discount: number; // percentage
  total: number;
}

export interface Quote {
  id: string;
  number: string;
  clientId: string;
  propertyId?: string;
  issueDate: string;
  expiryDate: string;
  items: QuoteItem[];
  discountPercent: number;
  vatRate: number; // e.g. 20 for France, 23 for PT
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
  propertyId: string;
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
  stockQty: number;
  unit: string;
  purchasePrice: number;
  minStock: number;
  location: string;
  notes: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: string;
  employeeId?: string;
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
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}
