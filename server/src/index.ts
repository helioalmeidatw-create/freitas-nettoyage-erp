import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { db } from './db/store';
import { 
  Client, Property, ServiceIntervention, Employee, Team, 
  Quote, Contract, Invoice, Payment, InventoryItem, 
  StockMovement, Supplier, Expense, QualityChecklist, Equipment 
} from './types';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// ----------------------------------------------------
// 1. SETTINGS & BRANDING (No code modification needed!)
// ----------------------------------------------------
app.get('/api/settings', (req: Request, res: Response) => {
  res.json(db.getSettings());
});

app.put('/api/settings', (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  db.logAudit('usr-1', 'Admin', 'UPDATE_SETTINGS', 'Configurações e identidade da empresa atualizadas.');
  res.json(updated);
});

// ----------------------------------------------------
// 2. AUTHENTICATION & USERS
// ----------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const users = db.getCollection('users');
  const normalizedEmail = (email || '').toLowerCase().trim();
  
  const user = users.find(u => {
    const uEmail = u.email.toLowerCase().trim();
    if (uEmail === normalizedEmail) return true;
    if (normalizedEmail === 'admin@freitas-nettoyage.com' && uEmail === 'admin@cleanpro.com') return true;
    if (normalizedEmail === 'admin@cleanpro.com' && uEmail === 'admin@freitas-nettoyage.com') return true;
    return false;
  });
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique o e-mail e a palavra-passe.' });
  }

  db.logAudit(user.id, user.name, 'LOGIN', 'Sessão iniciada no Freitas Nettoyage ERP.');
  
  const { password: _, ...userWithoutPass } = user;
  res.json({
    token: 'jwt-token-session-' + user.id,
    user: userWithoutPass
  });
});

app.post('/api/auth/change-password', (req: Request, res: Response) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const users = db.getCollection('users');
  const normalizedEmail = (email || '').toLowerCase().trim();
  const user = users.find(u => {
    const uEmail = u.email.toLowerCase().trim();
    return uEmail === normalizedEmail || 
      (normalizedEmail === 'admin@freitas-nettoyage.com' && uEmail === 'admin@cleanpro.com') ||
      (normalizedEmail === 'admin@cleanpro.com' && uEmail === 'admin@freitas-nettoyage.com');
  });

  if (!user || user.password !== currentPassword) {
    return res.status(401).json({ error: 'A palavra-passe atual está incorreta.' });
  }

  user.password = newPassword;
  db.update('users', user.id, { password: newPassword });
  db.logAudit(user.id, user.name, 'PASSWORD_CHANGE', 'Palavra-passe do utilizador alterada com sucesso.');
  
  res.json({ success: true, message: 'Palavra-passe atualizada com sucesso!' });
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  const updated = db.update('users', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  const { password: _, ...safeUser } = updated;
  res.json(safeUser);
});

app.get('/api/users', (req: Request, res: Response) => {
  const users = db.getCollection('users').map(({ password, ...u }) => u);
  res.json(users);
});

app.post('/api/users', (req: Request, res: Response) => {
  const newUser = {
    id: 'usr-' + Date.now(),
    createdAt: new Date().toISOString(),
    active: true,
    ...req.body
  };
  db.insert('users', newUser);
  const { password, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// ----------------------------------------------------
// 3. DASHBOARD METRICS (Computed Real Data)
// ----------------------------------------------------
app.get('/api/dashboard', (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const clients = db.getCollection('clients');
  const properties = db.getCollection('properties');
  const interventions = db.getCollection('interventions');
  const quotes = db.getCollection('quotes');
  const invoices = db.getCollection('invoices');
  const expenses = db.getCollection('expenses');
  const auditLogs = db.getCollection('auditLogs');

  const todayServices = interventions.filter(i => i.scheduledDate === today);
  const completedServices = interventions.filter(i => i.status === 'completed');
  const pendingServices = interventions.filter(i => ['to_plan', 'scheduled', 'in_progress', 'pending'].includes(i.status));
  const delayedServices = interventions.filter(i => i.scheduledDate < today && i.status !== 'completed' && i.status !== 'cancelled');

  const quotesSent = quotes.filter(q => q.status === 'sent');
  const quotesAccepted = quotes.filter(q => q.status === 'accepted' || q.status === 'converted');

  const invoicesIssued = invoices.length;
  const invoicesUnpaid = invoices.filter(inv => ['issued', 'partially_paid', 'overdue'].includes(inv.status));
  
  // Real Financial calculations
  const totalBilled = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
  const netEstimated = totalBilled - totalExpenses;

  // Upcoming 5 interventions
  const upcomingInterventions = interventions
    .filter(i => i.scheduledDate >= today && i.status !== 'cancelled')
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.startTime.localeCompare(b.startTime))
    .slice(0, 5)
    .map(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      const prop = properties.find(p => p.id === inv.propertyId);
      return {
        ...inv,
        clientName: client?.name || 'Cliente',
        propertyName: prop?.name || 'Imóvel'
      };
    });

  // Monthly revenue and expenses breakdown
  const monthlyRevenueMap: Record<string, { revenue: number; expenses: number }> = {};
  for (let m = 0; m < 6; m++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - m));
    const key = d.toISOString().substring(0, 7); // YYYY-MM
    monthlyRevenueMap[key] = { revenue: 0, expenses: 0 };
  }

  invoices.forEach(inv => {
    const key = (inv.issueDate || '').substring(0, 7);
    if (monthlyRevenueMap[key]) {
      monthlyRevenueMap[key].revenue += (inv.paidAmount || 0);
    }
  });

  expenses.forEach(exp => {
    const key = (exp.date || '').substring(0, 7);
    if (monthlyRevenueMap[key]) {
      monthlyRevenueMap[key].expenses += (exp.amount || 0);
    }
  });

  const chartData = Object.entries(monthlyRevenueMap).map(([month, val]) => ({
    month,
    receitas: Math.round(val.revenue * 100) / 100,
    despesas: Math.round(val.expenses * 100) / 100
  }));

  res.json({
    totalClients: clients.length,
    totalProperties: properties.length,
    todayServicesCount: todayServices.length,
    completedServicesCount: completedServices.length,
    pendingServicesCount: pendingServices.length,
    delayedServicesCount: delayedServices.length,
    quotesSentCount: quotesSent.length,
    quotesAcceptedCount: quotesAccepted.length,
    invoicesIssuedCount: invoicesIssued,
    invoicesUnpaidCount: invoicesUnpaid.length,
    totalBilled,
    totalOutstanding,
    totalExpenses,
    netEstimated,
    upcomingInterventions,
    chartData,
    recentActivity: auditLogs.slice(0, 8)
  });
});

// ----------------------------------------------------
// 4. CLIENTS MODULE
// ----------------------------------------------------
app.get('/api/clients', (req: Request, res: Response) => {
  const { search, status, type } = req.query;
  let list = db.getCollection('clients');

  if (search) {
    const term = (search as string).toLowerCase();
    list = list.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.taxId.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term)
    );
  }

  if (status && status !== 'all') {
    list = list.filter(c => c.status === status);
  }

  if (type && type !== 'all') {
    list = list.filter(c => c.type === type);
  }

  res.json(list);
});

app.get('/api/clients/:id', (req: Request, res: Response) => {
  const client = db.findById('clients', req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

  const properties = db.getCollection('properties').filter(p => p.clientId === client.id);
  const contracts = db.getCollection('contracts').filter(c => c.clientId === client.id);
  const quotes = db.getCollection('quotes').filter(q => q.clientId === client.id);
  const interventions = db.getCollection('interventions').filter(i => i.clientId === client.id);
  const invoices = db.getCollection('invoices').filter(i => i.clientId === client.id);
  const payments = db.getCollection('payments').filter(p => p.clientId === client.id);

  res.json({
    ...client,
    properties,
    contracts,
    quotes,
    interventions,
    invoices,
    payments
  });
});

app.post('/api/clients', (req: Request, res: Response) => {
  const clients = db.getCollection('clients');
  const code = 'CLI-' + String(clients.length + 1).padStart(3, '0');
  const newClient: Client = {
    id: 'cli-' + Date.now(),
    code,
    name: req.body.name,
    tradeName: req.body.tradeName || req.body.name,
    type: req.body.type || 'condo',
    contactPerson: req.body.contactPerson || '',
    phone: req.body.phone || '',
    mobile: req.body.mobile || '',
    email: req.body.email || '',
    address: req.body.address || '',
    postalCode: req.body.postalCode || '',
    city: req.body.city || '',
    country: req.body.country || 'Portugal',
    taxId: req.body.taxId || '',
    vatNumber: req.body.vatNumber || '',
    website: req.body.website || '',
    notes: req.body.notes || '',
    status: req.body.status || 'active',
    createdAt: new Date().toISOString()
  };

  db.insert('clients', newClient);
  db.logAudit('usr-1', 'Admin', 'CREATE_CLIENT', `Cliente criado: ${newClient.name} (${newClient.code})`);
  res.status(201).json(newClient);
});

app.put('/api/clients/:id', (req: Request, res: Response) => {
  const updated = db.update('clients', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Cliente não encontrado' });
  db.logAudit('usr-1', 'Admin', 'UPDATE_CLIENT', `Cliente atualizado: ${updated.name}`);
  res.json(updated);
});

app.delete('/api/clients/:id', (req: Request, res: Response) => {
  const client = db.findById('clients', req.params.id);
  const deleted = db.delete('clients', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Cliente não encontrado' });
  db.logAudit('usr-1', 'Admin', 'DELETE_CLIENT', `Cliente eliminado: ${client?.name}`);
  res.json({ success: true });
});

// ----------------------------------------------------
// 5. PROPERTIES MODULE
// ----------------------------------------------------
app.get('/api/properties', (req: Request, res: Response) => {
  const { clientId, search, type } = req.query;
  let list = db.getCollection('properties');

  if (clientId) {
    list = list.filter(p => p.clientId === clientId);
  }

  if (type && type !== 'all') {
    list = list.filter(p => p.type === type);
  }

  if (search) {
    const term = (search as string).toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.address.toLowerCase().includes(term) ||
      p.city.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term)
    );
  }

  const clients = db.getCollection('clients');
  const enriched = list.map(p => ({
    ...p,
    clientName: clients.find(c => c.id === p.clientId)?.name || 'Cliente'
  }));

  res.json(enriched);
});

app.get('/api/properties/:id', (req: Request, res: Response) => {
  const prop = db.findById('properties', req.params.id);
  if (!prop) return res.status(404).json({ error: 'Imóvel não encontrado' });

  const client = db.findById('clients', prop.clientId);
  const interventions = db.getCollection('interventions').filter(i => i.propertyId === prop.id);
  const contracts = db.getCollection('contracts').filter(c => c.propertyId === prop.id);

  res.json({
    ...prop,
    client,
    interventions,
    contracts
  });
});

app.post('/api/properties', (req: Request, res: Response) => {
  const properties = db.getCollection('properties');
  const code = 'IMO-' + String(properties.length + 1).padStart(3, '0');
  const newProperty: Property = {
    id: 'prop-' + Date.now(),
    code,
    name: req.body.name,
    clientId: req.body.clientId,
    type: req.body.type || 'condominium',
    address: req.body.address || '',
    postalCode: req.body.postalCode || '',
    city: req.body.city || '',
    buildingsCount: Number(req.body.buildingsCount) || 1,
    floorsCount: Number(req.body.floorsCount) || 1,
    stairsCount: Number(req.body.stairsCount) || 1,
    elevatorsCount: Number(req.body.elevatorsCount) || 0,
    entrancesCount: Number(req.body.entrancesCount) || 1,
    approxArea: Number(req.body.approxArea) || 0,
    flooringType: req.body.flooringType || '',
    commonAreasDescription: req.body.commonAreasDescription || '',
    cleaningFrequency: req.body.cleaningFrequency || '',
    authorizedHours: req.body.authorizedHours || '',
    siteContact: req.body.siteContact || '',
    accessInstructions: req.body.accessInstructions || '',
    notes: req.body.notes || '',
    status: req.body.status || 'active',
    createdAt: new Date().toISOString()
  };

  db.insert('properties', newProperty);
  db.logAudit('usr-1', 'Admin', 'CREATE_PROPERTY', `Imóvel registado: ${newProperty.name} (${newProperty.code})`);
  res.status(201).json(newProperty);
});

app.put('/api/properties/:id', (req: Request, res: Response) => {
  const updated = db.update('properties', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Imóvel não encontrado' });
  db.logAudit('usr-1', 'Admin', 'UPDATE_PROPERTY', `Imóvel atualizado: ${updated.name}`);
  res.json(updated);
});

app.delete('/api/properties/:id', (req: Request, res: Response) => {
  const prop = db.findById('properties', req.params.id);
  const deleted = db.delete('properties', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Imóvel não encontrado' });
  db.logAudit('usr-1', 'Admin', 'DELETE_PROPERTY', `Imóvel eliminado: ${prop?.name}`);
  res.json({ success: true });
});

// ----------------------------------------------------
// 6. SERVICES & INTERVENTIONS MODULE (With recurring automation)
// ----------------------------------------------------
app.get('/api/interventions', (req: Request, res: Response) => {
  const { date, status, employeeId, teamId, clientId, propertyId, search } = req.query;
  let list = db.getCollection('interventions');

  if (date) {
    list = list.filter(i => i.scheduledDate === date);
  }
  if (status && status !== 'all') {
    list = list.filter(i => i.status === status);
  }
  if (employeeId) {
    list = list.filter(i => (i.assignedEmployeeIds || []).includes(employeeId as string));
  }
  if (teamId) {
    list = list.filter(i => i.teamId === teamId);
  }
  if (clientId) {
    list = list.filter(i => i.clientId === clientId);
  }
  if (propertyId) {
    list = list.filter(i => i.propertyId === propertyId);
  }
  if (search) {
    const term = (search as string).toLowerCase();
    list = list.filter(i => 
      i.code.toLowerCase().includes(term) ||
      i.description.toLowerCase().includes(term)
    );
  }

  const clients = db.getCollection('clients');
  const properties = db.getCollection('properties');
  const teams = db.getCollection('teams');
  const employees = db.getCollection('employees');
  const allEquipment = db.getCollection('equipment');

  const enriched = list.map(inv => ({
    ...inv,
    clientName: clients.find(c => c.id === inv.clientId)?.name || 'Cliente',
    propertyName: properties.find(p => p.id === inv.propertyId)?.name || 'Imóvel',
    propertyAddress: properties.find(p => p.id === inv.propertyId)?.address || '',
    teamName: teams.find(t => t.id === inv.teamId)?.name || '',
    assignedEmployees: employees.filter(e => (inv.assignedEmployeeIds || []).includes(e.id)),
    equipments: allEquipment.filter(eq => (inv.equipmentIds || []).includes(eq.id))
  }));

  res.json(enriched);
});

app.post('/api/interventions', (req: Request, res: Response) => {
  const count = db.getCollection('interventions').length + 1;
  const year = new Date().getFullYear();
  const code = `SRV-${year}-${String(count).padStart(3, '0')}`;

  const newIntervention: ServiceIntervention = {
    id: 'int-' + Date.now(),
    code,
    clientId: req.body.clientId,
    propertyId: req.body.propertyId,
    category: req.body.category || 'stairs',
    description: req.body.description || 'Serviço de limpeza',
    scheduledDate: req.body.scheduledDate,
    startTime: req.body.startTime || '09:00',
    endTime: req.body.endTime || '11:00',
    teamId: req.body.teamId || '',
    assignedEmployeeIds: req.body.assignedEmployeeIds || [],
    frequency: req.body.frequency || 'once',
    price: Number(req.body.price) || 0,
    requiredMaterials: req.body.requiredMaterials || '',
    materialsList: req.body.materialsList || req.body.requiredMaterials || '',
    equipmentIds: req.body.equipmentIds || [],
    equipmentCheckStatus: 'pending',
    specificInstructions: req.body.specificInstructions || '',
    photos: req.body.photos || [],
    status: req.body.status || 'scheduled',
    createdAt: new Date().toISOString()
  };

  db.insert('interventions', newIntervention);

  // If equipment selected, update their currentServiceId if in progress
  if (req.body.equipmentIds && req.body.equipmentIds.length > 0 && req.body.status === 'in_progress') {
    req.body.equipmentIds.forEach((eqId: string) => {
      db.update('equipment', eqId, { 
        status: 'in_service', 
        currentServiceId: newIntervention.id,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    });
  }

  // Initialize standard Quality Checklist
  const checklist: QualityChecklist = {
    id: 'chk-' + Date.now(),
    interventionId: newIntervention.id,
    items: [
      { id: '1', task: 'Entrada principal e hall limpos e higienizados', completed: false },
      { id: '2', task: 'Escadas varridas e lavadas sem resíduos', completed: false },
      { id: '3', task: 'Corrimãos limpos e desinfetados', completed: false },
      { id: '4', task: 'Elevadores, espelhos e botões higienizados', completed: false },
      { id: '5', task: 'Corredores e patamares tratados', completed: false },
      { id: '6', task: 'Vidros acessíveis limpos', completed: false },
      { id: '7', task: 'Caixotes de lixo e recipientes esvaziados', completed: false },
      { id: '8', task: 'Máquinas e equipamentos limpos e conferidos no veículo', completed: false },
      { id: '9', task: 'Verificação final de qualidade executada', completed: false }
    ],
    beforePhotos: [],
    afterPhotos: [],
    needsCorrection: false
  };
  db.insert('checklists', checklist);

  // If recurring, generate the next 3 scheduled interventions automatically!
  if (req.body.frequency && req.body.frequency !== 'once') {
    const daysToAdd = req.body.frequency === 'daily' ? 1 
      : req.body.frequency === 'weekly' ? 7 
      : req.body.frequency === 'biweekly' ? 14 
      : 30;

    let baseDate = new Date(req.body.scheduledDate);
    for (let r = 1; r <= 3; r++) {
      baseDate.setDate(baseDate.getDate() + daysToAdd);
      const nextDateStr = baseDate.toISOString().split('T')[0];
      const recId = 'int-' + (Date.now() + r);
      const recCode = `SRV-${year}-${String(count + r).padStart(3, '0')}`;
      db.insert('interventions', {
        ...newIntervention,
        id: recId,
        code: recCode,
        scheduledDate: nextDateStr,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      });
    }
  }

  db.logAudit('usr-1', 'Admin', 'CREATE_INTERVENTION', `Intervenção criada: ${newIntervention.code}`);
  res.status(201).json(newIntervention);
});

app.put('/api/interventions/:id', (req: Request, res: Response) => {
  const existing = db.findById('interventions', req.params.id) as ServiceIntervention;
  if (!existing) return res.status(404).json({ error: 'Serviço não encontrado' });

  const updates = { ...req.body };
  if (req.body.status === 'completed' && !existing.completedAt) {
    updates.completedAt = new Date().toISOString();
    // Libera máquinas alocadas de volta para disponível se concluído
    const eqIds = updates.equipmentIds || existing.equipmentIds || [];
    eqIds.forEach((eqId: string) => {
      const eq = db.findById('equipment', eqId);
      if (eq && eq.status === 'in_service') {
        db.update('equipment', eqId, { 
          status: 'available', 
          currentServiceId: undefined,
          updatedAt: new Date().toISOString().split('T')[0]
        });
      }
    });
  }

  const updated = db.update('interventions', req.params.id, updates);
  db.logAudit('usr-1', 'Admin', 'UPDATE_INTERVENTION', `Intervenção ${updated.code} atualizada para estado: ${updated.status}`);
  res.json(updated);
});

// Romaneio: Check-out de Equipamentos (Saída do Galpão / Veículo Carregado)
app.post('/api/interventions/:id/equipment-checkout', (req: Request, res: Response) => {
  const existing = db.findById('interventions', req.params.id) as ServiceIntervention;
  if (!existing) return res.status(404).json({ error: 'Serviço não encontrado' });

  const equipmentIds: string[] = req.body.equipmentIds || existing.equipmentIds || [];
  const checkoutNotes: string = req.body.checkoutNotes || 'Equipamentos conferidos e carregados na viatura.';
  const now = new Date().toISOString();

  // Marca os equipamentos como em serviço
  equipmentIds.forEach(eqId => {
    db.update('equipment', eqId, {
      status: 'in_service',
      currentServiceId: existing.id,
      updatedAt: now.split('T')[0]
    });
  });

  const updated = db.update('interventions', existing.id, {
    equipmentIds,
    equipmentCheckStatus: 'checked_out',
    checkedOutAt: now,
    checkoutNotes
  });

  db.logAudit('usr-1', 'Admin', 'EQUIPMENT_CHECKOUT', `Romaneio de saída executado para intervenção ${existing.code} (${equipmentIds.length} equipamentos)`);
  res.json(updated);
});

// Romaneio: Check-in de Equipamentos (Retorno e Conferência no Galpão)
app.post('/api/interventions/:id/equipment-checkin', (req: Request, res: Response) => {
  const existing = db.findById('interventions', req.params.id) as ServiceIntervention;
  if (!existing) return res.status(404).json({ error: 'Serviço não encontrado' });

  const equipmentIds: string[] = req.body.equipmentIds || existing.equipmentIds || [];
  const now = new Date().toISOString();
  const hasIssue = Boolean(req.body.hasIssue);
  const returnNotes = req.body.returnNotes || (hasIssue ? 'Retornado com ressalvas' : 'Todos os equipamentos retornados em perfeitas condições.');

  // Libera equipamentos para available (ou maintenance se reportou problema)
  equipmentIds.forEach(eqId => {
    const issueWithThisOne = req.body.brokenEquipmentIds?.includes(eqId);
    db.update('equipment', eqId, {
      status: issueWithThisOne ? 'maintenance' : 'available',
      currentServiceId: undefined,
      notes: issueWithThisOne ? `Avaria reportada após serviço ${existing.code}` : undefined,
      updatedAt: now.split('T')[0]
    });
  });

  const updated = db.update('interventions', existing.id, {
    equipmentCheckStatus: hasIssue ? 'returned_issue' : 'returned_ok',
    returnedAt: now,
    checkoutNotes: (existing.checkoutNotes ? existing.checkoutNotes + ' | ' : '') + returnNotes
  });

  db.logAudit('usr-1', 'Admin', 'EQUIPMENT_CHECKIN', `Romaneio de retorno concluído para ${existing.code} (Status: ${updated.equipmentCheckStatus})`);
  res.json(updated);
});

app.delete('/api/interventions/:id', (req: Request, res: Response) => {
  const inv = db.findById('interventions', req.params.id);
  const deleted = db.delete('interventions', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Serviço não encontrado' });
  db.logAudit('usr-1', 'Admin', 'DELETE_INTERVENTION', `Intervenção eliminada: ${inv?.code}`);
  res.json({ success: true });
});

// ----------------------------------------------------
// 7. QUALITY CHECKLIST MODULE
// ----------------------------------------------------
app.get('/api/checklists/:interventionId', (req: Request, res: Response) => {
  const checklists = db.getCollection('checklists');
  let chk = checklists.find(c => c.interventionId === req.params.interventionId);
  if (!chk) {
    chk = {
      id: 'chk-' + Date.now(),
      interventionId: String(req.params.interventionId),
      items: [
        { id: '1', task: 'Entrada limpa', completed: false },
        { id: '2', task: 'Escadas limpas', completed: false },
        { id: '3', task: 'Corrimãos limpos', completed: false },
        { id: '4', task: 'Pavimentos lavados', completed: false },
        { id: '5', task: 'Elevadores limpos', completed: false }
      ],
      beforePhotos: [],
      afterPhotos: [],
      needsCorrection: false
    };
    db.insert('checklists', chk);
  }
  res.json(chk);
});

app.put('/api/checklists/:interventionId', (req: Request, res: Response) => {
  const checklists = db.getCollection('checklists');
  const idx = checklists.findIndex(c => c.interventionId === req.params.interventionId);
  if (idx !== -1) {
    checklists[idx] = { ...checklists[idx], ...req.body };
    db.update('checklists', checklists[idx].id, req.body);
    return res.json(checklists[idx]);
  }
  const created = {
    id: 'chk-' + Date.now(),
    interventionId: req.params.interventionId,
    ...req.body
  };
  db.insert('checklists', created);
  res.json(created);
});

// ----------------------------------------------------
// 8. EMPLOYEES & TEAMS (HR Operations)
// ----------------------------------------------------
app.get('/api/employees', (req: Request, res: Response) => {
  const employees = db.getCollection('employees');
  const teams = db.getCollection('teams');
  const enriched = employees.map(e => ({
    ...e,
    teamName: teams.find(t => t.id === e.teamId)?.name || 'Sem equipa'
  }));
  res.json(enriched);
});

app.post('/api/employees', (req: Request, res: Response) => {
  const emps = db.getCollection('employees');
  const code = 'EMP-' + String(emps.length + 1).padStart(3, '0');
  const newEmp: Employee = {
    id: 'emp-' + Date.now(),
    code,
    fullName: req.body.fullName,
    phone: req.body.phone || '',
    email: req.body.email || '',
    address: req.body.address || '',
    role: req.body.role || 'Operacional de Limpeza',
    hireDate: req.body.hireDate || new Date().toISOString().split('T')[0],
    status: req.body.status || 'active',
    teamId: req.body.teamId || '',
    workingHours: req.body.workingHours || '08:00 - 17:00',
    availability: req.body.availability || 'Disponível',
    skills: req.body.skills || ['Limpeza Geral'],
    notes: req.body.notes || '',
    createdAt: new Date().toISOString()
  };

  db.insert('employees', newEmp);
  db.logAudit('usr-1', 'Admin', 'CREATE_EMPLOYEE', `Funcionário registado: ${newEmp.fullName} (${newEmp.code})`);
  res.status(201).json(newEmp);
});

app.put('/api/employees/:id', (req: Request, res: Response) => {
  const updated = db.update('employees', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Funcionário não encontrado' });
  res.json(updated);
});

app.delete('/api/employees/:id', (req: Request, res: Response) => {
  const deleted = db.delete('employees', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Funcionário não encontrado' });
  res.json({ success: true });
});

app.get('/api/teams', (req: Request, res: Response) => {
  res.json(db.getCollection('teams'));
});

app.post('/api/teams', (req: Request, res: Response) => {
  const newTeam: Team = {
    id: 'team-' + Date.now(),
    name: req.body.name,
    leaderId: req.body.leaderId || '',
    color: req.body.color || '#0284c7',
    notes: req.body.notes || ''
  };
  db.insert('teams', newTeam);
  res.status(201).json(newTeam);
});

// ----------------------------------------------------
// 9. QUOTES (Orçamentos) & CONVERSION
// ----------------------------------------------------
app.get('/api/quotes', (req: Request, res: Response) => {
  const quotes = db.getCollection('quotes');
  const clients = db.getCollection('clients');
  const properties = db.getCollection('properties');

  const enriched = quotes.map(q => ({
    ...q,
    clientName: clients.find(c => c.id === q.clientId)?.name || 'Cliente',
    propertyName: properties.find(p => p.id === q.propertyId)?.name || 'Imóvel'
  }));

  res.json(enriched);
});

app.get('/api/quotes/:id', (req: Request, res: Response) => {
  const quote = db.findById('quotes', req.params.id);
  if (!quote) return res.status(404).json({ error: 'Orçamento não encontrado' });

  const client = db.findById('clients', quote.clientId);
  const property = quote.propertyId ? db.findById('properties', quote.propertyId) : null;
  const settings = db.getSettings();

  res.json({
    ...quote,
    client,
    property,
    settings
  });
});

app.post('/api/quotes', (req: Request, res: Response) => {
  const quotes = db.getCollection('quotes');
  const year = new Date().getFullYear();
  const number = `ORC-${year}-${String(quotes.length + 1).padStart(3, '0')}`;

  const items = req.body.items || [];
  const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.total) || 0), 0);
  const vatRate = Number(req.body.vatRate) || 23;
  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = subtotal + vatAmount;

  const newQuote: Quote = {
    id: 'orc-' + Date.now(),
    number,
    clientId: req.body.clientId,
    propertyId: req.body.propertyId || '',
    issueDate: req.body.issueDate || new Date().toISOString().split('T')[0],
    expiryDate: req.body.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    items,
    discountPercent: Number(req.body.discountPercent) || 0,
    vatRate,
    subtotal,
    vatAmount,
    total,
    paymentConditions: req.body.paymentConditions || '30 dias',
    frequency: req.body.frequency || 'Contrato Recorrente',
    notes: req.body.notes || '',
    terms: req.body.terms || db.getSettings().quoteConditions,
    status: req.body.status || 'draft',
    createdAt: new Date().toISOString()
  };

  db.insert('quotes', newQuote);
  db.logAudit('usr-1', 'Admin', 'CREATE_QUOTE', `Orçamento gerado: ${newQuote.number} (${total.toFixed(2)}€)`);
  res.status(201).json(newQuote);
});

app.put('/api/quotes/:id', (req: Request, res: Response) => {
  const items = req.body.items;
  let updates = { ...req.body };
  if (items) {
    const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.total) || 0), 0);
    const vatRate = Number(req.body.vatRate) || 23;
    const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
    const total = subtotal + vatAmount;
    updates.subtotal = subtotal;
    updates.vatAmount = vatAmount;
    updates.total = total;
  }

  const updated = db.update('quotes', req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Orçamento não encontrado' });
  res.json(updated);
});

// Automatic Conversion: Accepted Quote -> Contract & Service
app.post('/api/quotes/:id/convert', (req: Request, res: Response) => {
  const quote = db.findById('quotes', req.params.id) as Quote;
  if (!quote) return res.status(404).json({ error: 'Orçamento não encontrado' });

  // 1. Mark quote as converted
  db.update('quotes', quote.id, { status: 'converted' });

  // 2. Generate Contract
  const contractsCount = db.getCollection('contracts').length + 1;
  const year = new Date().getFullYear();
  const contractNumber = `CNT-${year}-${String(contractsCount).padStart(3, '0')}`;
  
  const newContract: Contract = {
    id: 'cnt-' + Date.now(),
    number: contractNumber,
    quoteId: quote.id,
    clientId: quote.clientId,
    propertyId: quote.propertyId || '',
    contractedServices: quote.items.map(i => i.description).join('; '),
    frequency: quote.frequency,
    scheduledTimes: 'Conforme agendamento inicial',
    agreedPrice: quote.subtotal,
    paymentConditions: quote.paymentConditions,
    startDate: new Date().toISOString().split('T')[0],
    renewalTerms: 'Renovação automática salvo oposição expressa de 30 dias.',
    terminationTerms: 'Aviso prévio de 30 dias.',
    notes: `Convertido do orçamento ${quote.number}.`,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  db.insert('contracts', newContract);

  // 3. Generate initial Service Intervention
  const srvCount = db.getCollection('interventions').length + 1;
  const srvCode = `SRV-${year}-${String(srvCount).padStart(3, '0')}`;
  const newIntervention: ServiceIntervention = {
    id: 'int-' + Date.now(),
    code: srvCode,
    clientId: quote.clientId,
    propertyId: quote.propertyId || '',
    category: 'stairs',
    description: `Serviço inicial do contrato ${newContract.number}`,
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '12:00',
    assignedEmployeeIds: [],
    frequency: 'weekly',
    price: quote.items[0]?.unitPrice || quote.total,
    requiredMaterials: 'Material padrão CleanPro',
    specificInstructions: 'Execução de acordo com a proposta comercial.',
    photos: [],
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };
  db.insert('interventions', newIntervention);

  db.logAudit('usr-1', 'Admin', 'CONVERT_QUOTE', `Orçamento ${quote.number} convertido no Contrato ${newContract.number}`);
  res.json({ contract: newContract, intervention: newIntervention });
});

app.delete('/api/quotes/:id', (req: Request, res: Response) => {
  const deleted = db.delete('quotes', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Orçamento não encontrado' });
  res.json({ success: true });
});

// ----------------------------------------------------
// 10. CONTRACTS MODULE
// ----------------------------------------------------
app.get('/api/contracts', (req: Request, res: Response) => {
  const contracts = db.getCollection('contracts');
  const clients = db.getCollection('clients');
  const properties = db.getCollection('properties');

  const enriched = contracts.map(c => ({
    ...c,
    clientName: clients.find(cl => cl.id === c.clientId)?.name || 'Cliente',
    propertyName: properties.find(p => p.id === c.propertyId)?.name || 'Imóvel'
  }));

  res.json(enriched);
});

app.post('/api/contracts', (req: Request, res: Response) => {
  const count = db.getCollection('contracts').length + 1;
  const year = new Date().getFullYear();
  const number = `CNT-${year}-${String(count).padStart(3, '0')}`;

  const newContract: Contract = {
    id: 'cnt-' + Date.now(),
    number,
    clientId: req.body.clientId,
    propertyId: req.body.propertyId || '',
    contractedServices: req.body.contractedServices || 'Limpeza geral de condomínio',
    frequency: req.body.frequency || 'Semanal',
    scheduledTimes: req.body.scheduledTimes || '08:00 - 12:00',
    agreedPrice: Number(req.body.agreedPrice) || 0,
    paymentConditions: req.body.paymentConditions || '30 dias',
    startDate: req.body.startDate || new Date().toISOString().split('T')[0],
    endDate: req.body.endDate || '',
    renewalTerms: req.body.renewalTerms || 'Renovável anualmente',
    terminationTerms: req.body.terminationTerms || 'Aviso prévio de 30 dias',
    notes: req.body.notes || '',
    status: req.body.status || 'active',
    createdAt: new Date().toISOString()
  };

  db.insert('contracts', newContract);
  db.logAudit('usr-1', 'Admin', 'CREATE_CONTRACT', `Contrato registado: ${newContract.number}`);
  res.status(201).json(newContract);
});

app.put('/api/contracts/:id', (req: Request, res: Response) => {
  const updated = db.update('contracts', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Contrato não encontrado' });
  res.json(updated);
});

app.delete('/api/contracts/:id', (req: Request, res: Response) => {
  const deleted = db.delete('contracts', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Contrato não encontrado' });
  res.json({ success: true });
});

// ----------------------------------------------------
// 11. INVOICES & PAYMENTS (Fiscal / French SIRET / PT NIF Compliant)
// ----------------------------------------------------
app.get('/api/invoices', (req: Request, res: Response) => {
  const invoices = db.getCollection('invoices');
  const clients = db.getCollection('clients');

  const enriched = invoices.map(inv => ({
    ...inv,
    clientName: clients.find(c => c.id === inv.clientId)?.name || 'Cliente',
    clientTaxId: clients.find(c => c.id === inv.clientId)?.taxId || ''
  }));

  res.json(enriched);
});

app.get('/api/invoices/:id', (req: Request, res: Response) => {
  const invoice = db.findById('invoices', req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Fatura não encontrada' });

  const client = db.findById('clients', invoice.clientId);
  const payments = db.getCollection('payments').filter(p => p.invoiceId === invoice.id);
  const settings = db.getSettings();

  res.json({
    ...invoice,
    client,
    payments,
    settings
  });
});

app.post('/api/invoices', (req: Request, res: Response) => {
  const invoices = db.getCollection('invoices');
  const year = new Date().getFullYear();
  const number = `FT-${year}-${String(invoices.length + 1).padStart(3, '0')}`;

  const items = req.body.items || [];
  const subtotal = items.reduce((acc: number, i: any) => acc + (Number(i.total) || 0), 0);
  const vatRate = Number(req.body.vatRate) || 23;
  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = subtotal + vatAmount;

  const newInvoice: Invoice = {
    id: 'inv-' + Date.now(),
    number,
    clientId: req.body.clientId,
    contractId: req.body.contractId || '',
    quoteId: req.body.quoteId || '',
    issueDate: req.body.issueDate || new Date().toISOString().split('T')[0],
    dueDate: req.body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    items,
    subtotal,
    vatRate,
    vatAmount,
    total,
    paidAmount: 0,
    balanceDue: total,
    paymentTerms: req.body.paymentTerms || '30 dias',
    status: req.body.status || 'issued',
    notes: req.body.notes || db.getSettings().invoiceNotes,
    createdAt: new Date().toISOString()
  };

  db.insert('invoices', newInvoice);
  db.logAudit('usr-1', 'Admin', 'CREATE_INVOICE', `Fatura emitida: ${newInvoice.number} (${total.toFixed(2)}€)`);
  res.status(201).json(newInvoice);
});

app.post('/api/invoices/:id/payments', (req: Request, res: Response) => {
  const invoice = db.findById('invoices', req.params.id) as Invoice;
  if (!invoice) return res.status(404).json({ error: 'Fatura não encontrada' });

  const payAmount = Number(req.body.amount);
  if (!payAmount || payAmount <= 0) {
    return res.status(400).json({ error: 'Indique um montante válido para o pagamento.' });
  }

  const newPayment: Payment = {
    id: 'pay-' + Date.now(),
    invoiceId: invoice.id,
    clientId: invoice.clientId,
    amount: payAmount,
    paymentDate: req.body.paymentDate || new Date().toISOString().split('T')[0],
    method: req.body.method || 'bank_transfer',
    reference: req.body.reference || '',
    notes: req.body.notes || '',
    createdAt: new Date().toISOString()
  };

  db.insert('payments', newPayment);

  const updatedPaid = (invoice.paidAmount || 0) + payAmount;
  const updatedBalance = Math.max(0, invoice.total - updatedPaid);
  const newStatus = updatedBalance <= 0 ? 'paid' : 'partially_paid';

  db.update('invoices', invoice.id, {
    paidAmount: updatedPaid,
    balanceDue: updatedBalance,
    status: newStatus
  });

  db.logAudit('usr-1', 'Admin', 'RECORD_PAYMENT', `Pagamento registado para ${invoice.number}: ${payAmount.toFixed(2)}€ (${newStatus})`);
  res.status(201).json({ payment: newPayment, newStatus, balanceDue: updatedBalance });
});

// CSV Export for Invoices
app.get('/api/invoices-export', (req: Request, res: Response) => {
  const invoices = db.getCollection('invoices');
  const clients = db.getCollection('clients');

  let csv = 'Numero,Cliente,NIF,Data Emissao,Vencimento,Subtotal,IVA,Total,Valor Pago,Em Divida,Estado\n';
  invoices.forEach(inv => {
    const client = clients.find(c => c.id === inv.clientId);
    csv += `"${inv.number}","${client?.name || ''}","${client?.taxId || ''}","${inv.issueDate}","${inv.dueDate}",${inv.subtotal},${inv.vatAmount},${inv.total},${inv.paidAmount},${inv.balanceDue},"${inv.status}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=faturas_cleanpro.csv');
  res.send('\uFEFF' + csv);
});

// ----------------------------------------------------
// 12. INVENTORY & STOCK MANAGEMENT
// ----------------------------------------------------
app.get('/api/inventory', (req: Request, res: Response) => {
  const items = db.getCollection('inventory');
  const suppliers = db.getCollection('suppliers');

  const enriched = items.map(item => ({
    ...item,
    supplierName: suppliers.find(s => s.id === item.supplierId)?.name || 'Fornecedor padrão',
    isLowStock: item.stockQty <= item.minStock
  }));

  res.json(enriched);
});

app.post('/api/inventory', (req: Request, res: Response) => {
  const count = db.getCollection('inventory').length + 1;
  const code = 'MAT-' + String(count).padStart(3, '0');

  const newItem: InventoryItem = {
    id: 'mat-' + Date.now(),
    code,
    name: req.body.name,
    category: req.body.category || 'Produtos de Limpeza',
    supplierId: req.body.supplierId || '',
    stockQty: Number(req.body.stockQty) || 0,
    unit: req.body.unit || 'unidade',
    purchasePrice: Number(req.body.purchasePrice) || 0,
    minStock: Number(req.body.minStock) || 5,
    location: req.body.location || 'Armazém Central',
    notes: req.body.notes || '',
    updatedAt: new Date().toISOString().split('T')[0]
  };

  db.insert('inventory', newItem);
  res.status(201).json(newItem);
});

app.post('/api/inventory/:id/movement', (req: Request, res: Response) => {
  const item = db.findById('inventory', req.params.id) as InventoryItem;
  if (!item) return res.status(404).json({ error: 'Artigo não encontrado' });

  const { type, quantity, reason, employeeId } = req.body;
  const qty = Number(quantity);
  const newStock = type === 'in' ? item.stockQty + qty : Math.max(0, item.stockQty - qty);

  db.update('inventory', item.id, {
    stockQty: newStock,
    updatedAt: new Date().toISOString().split('T')[0]
  });

  const movement: StockMovement = {
    id: 'mov-' + Date.now(),
    inventoryItemId: item.id,
    type,
    quantity: qty,
    reason: reason || 'Ajuste operacional de stock',
    date: new Date().toISOString().split('T')[0],
    employeeId: employeeId || ''
  };
  db.insert('stockMovements', movement);

  res.json({ item: { ...item, stockQty: newStock }, movement });
});

// ----------------------------------------------------
// 12.1 EQUIPMENT & MACHINERY (Máquinas & Equipamentos)
// ----------------------------------------------------
app.get('/api/equipment', (req: Request, res: Response) => {
  const { status, category, search } = req.query;
  let list = db.getCollection('equipment') || [];

  if (status && status !== 'all') {
    list = list.filter(e => e.status === status);
  }

  if (category && category !== 'all') {
    list = list.filter(e => e.category === category);
  }

  if (search) {
    const term = (search as string).toLowerCase();
    list = list.filter(e => 
      e.name.toLowerCase().includes(term) ||
      e.code.toLowerCase().includes(term) ||
      e.brandModel.toLowerCase().includes(term) ||
      e.serialNumber.toLowerCase().includes(term) ||
      e.location.toLowerCase().includes(term)
    );
  }

  const interventions = db.getCollection('interventions') || [];
  const enriched = list.map(eq => {
    let currentServiceCode = undefined;
    if (eq.currentServiceId) {
      const srv = interventions.find(i => i.id === eq.currentServiceId);
      currentServiceCode = srv?.code;
    }
    return {
      ...eq,
      currentServiceCode
    };
  });

  res.json(enriched);
});

app.post('/api/equipment', (req: Request, res: Response) => {
  const equipmentList = db.getCollection('equipment') || [];
  const count = equipmentList.length + 1;
  const code = 'EQ-' + String(count).padStart(3, '0');
  const today = new Date().toISOString().split('T')[0];

  const newEq: Equipment = {
    id: 'eq-' + Date.now(),
    code,
    name: req.body.name || 'Equipamento',
    category: req.body.category || 'other',
    brandModel: req.body.brandModel || '',
    serialNumber: req.body.serialNumber || '',
    purchaseDate: req.body.purchaseDate || today,
    lastMaintenanceDate: req.body.lastMaintenanceDate || '',
    nextMaintenanceDate: req.body.nextMaintenanceDate || '',
    status: req.body.status || 'available',
    location: req.body.location || 'Armazém Central',
    notes: req.body.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: today
  };

  db.insert('equipment', newEq);
  db.logAudit('usr-1', 'Admin', 'CREATE_EQUIPMENT', `Máquina/Equipamento cadastrado: ${newEq.name} (${newEq.code})`);
  res.status(201).json(newEq);
});

app.put('/api/equipment/:id', (req: Request, res: Response) => {
  const existing = db.findById('equipment', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Equipamento não encontrado' });

  const updates = {
    ...req.body,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  const updated = db.update('equipment', req.params.id, updates);
  db.logAudit('usr-1', 'Admin', 'UPDATE_EQUIPMENT', `Equipamento ${updated.code} atualizado.`);
  res.json(updated);
});

app.patch('/api/equipment/:id/status', (req: Request, res: Response) => {
  const existing = db.findById('equipment', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Equipamento não encontrado' });

  const { status, notes, location } = req.body;
  const updates: any = {
    status: status || existing.status,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  if (notes !== undefined) updates.notes = notes;
  if (location !== undefined) updates.location = location;

  const updated = db.update('equipment', req.params.id, updates);
  db.logAudit('usr-1', 'Admin', 'UPDATE_EQUIPMENT_STATUS', `Status de ${updated.code} alterado para: ${updated.status}`);
  res.json(updated);
});

app.delete('/api/equipment/:id', (req: Request, res: Response) => {
  const eq = db.findById('equipment', req.params.id);
  const deleted = db.delete('equipment', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Equipamento não encontrado' });
  db.logAudit('usr-1', 'Admin', 'DELETE_EQUIPMENT', `Equipamento eliminado: ${eq?.name} (${eq?.code})`);
  res.json({ success: true });
});

// ----------------------------------------------------
// 13. SUPPLIERS (Fornecedores)
// ----------------------------------------------------
app.get('/api/suppliers', (req: Request, res: Response) => {
  res.json(db.getCollection('suppliers'));
});

app.post('/api/suppliers', (req: Request, res: Response) => {
  const count = db.getCollection('suppliers').length + 1;
  const code = 'FOR-' + String(count).padStart(3, '0');

  const newSupplier: Supplier = {
    id: 'sup-' + Date.now(),
    code,
    name: req.body.name,
    tradeName: req.body.tradeName || req.body.name,
    contactPerson: req.body.contactPerson || '',
    phone: req.body.phone || '',
    email: req.body.email || '',
    address: req.body.address || '',
    taxId: req.body.taxId || '',
    productsSupplied: req.body.productsSupplied || '',
    paymentConditions: req.body.paymentConditions || '30 dias',
    status: req.body.status || 'active',
    createdAt: new Date().toISOString()
  };

  db.insert('suppliers', newSupplier);
  res.status(201).json(newSupplier);
});

// ----------------------------------------------------
// 14. EXPENSES (Despesas Operacionais)
// ----------------------------------------------------
app.get('/api/expenses', (req: Request, res: Response) => {
  const expenses = db.getCollection('expenses');
  const suppliers = db.getCollection('suppliers');

  const enriched = expenses.map(e => ({
    ...e,
    supplierName: suppliers.find(s => s.id === e.supplierId)?.name || ''
  }));

  res.json(enriched);
});

app.post('/api/expenses', (req: Request, res: Response) => {
  const newExpense: Expense = {
    id: 'desp-' + Date.now(),
    category: req.body.category || 'cleaning_products',
    description: req.body.description,
    amount: Number(req.body.amount) || 0,
    date: req.body.date || new Date().toISOString().split('T')[0],
    supplierId: req.body.supplierId || '',
    receiptUrl: req.body.receiptUrl || '',
    notes: req.body.notes || '',
    createdAt: new Date().toISOString()
  };

  db.insert('expenses', newExpense);
  db.logAudit('usr-1', 'Admin', 'CREATE_EXPENSE', `Despesa registada: ${newExpense.description} (${newExpense.amount.toFixed(2)}€)`);
  res.status(201).json(newExpense);
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  db.delete('expenses', req.params.id);
  res.json({ success: true });
});

// ----------------------------------------------------
// 15. REPORTS & PROFITABILITY (Relatórios e Rentabilidade)
// ----------------------------------------------------
app.get('/api/reports/profitability', (req: Request, res: Response) => {
  const clients = db.getCollection('clients');
  const invoices = db.getCollection('invoices');
  const properties = db.getCollection('properties');
  const contracts = db.getCollection('contracts');

  const clientReports = clients.map(client => {
    const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
    const totalBilled = clientInvoices.reduce((acc, i) => acc + i.total, 0);
    const totalPaid = clientInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
    const clientProps = properties.filter(p => p.clientId === client.id);
    const clientContracts = contracts.filter(c => c.clientId === client.id);

    return {
      clientId: client.id,
      clientName: client.name,
      clientCode: client.code,
      propertiesCount: clientProps.length,
      contractsCount: clientContracts.length,
      totalBilled,
      totalPaid,
      outstanding: totalBilled - totalPaid,
      // Status indicator
      profitStatus: totalPaid > 0 ? 'Rentável' : 'Em curso'
    };
  });

  res.json({ clientReports });
});

// ----------------------------------------------------
// 16. SYSTEM BACKUP & RESET (Demo or Clean Empty State)
// ----------------------------------------------------
app.post('/api/system/reset', (req: Request, res: Response) => {
  const { includeDemo } = req.body;
  const newState = db.generateInitialState(includeDemo !== false);
  db.replaceAll(newState);
  res.json({ success: true, message: includeDemo !== false ? 'Base de dados reposta com dados de demonstração.' : 'Base de dados limpa com sucesso.' });
});

app.get('/api/system/backup', (req: Request, res: Response) => {
  const raw = db.getRawData();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=cleanpro_backup.json');
  res.send(JSON.stringify(raw, null, 2));
});

app.post('/api/system/restore', (req: Request, res: Response) => {
  try {
    db.replaceAll(req.body);
    res.json({ success: true, message: 'Dados restaurados com sucesso!' });
  } catch (err: any) {
    res.status(400).json({ error: 'Ficheiro de cópia de segurança inválido.' });
  }
});

// Global Search (Cmd+K / Search bar across clients, properties, contracts, invoices, services)
app.get('/api/search', (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').toLowerCase().trim();
  if (!query) return res.json([]);

  const clients = db.getCollection('clients');
  const properties = db.getCollection('properties');
  const contracts = db.getCollection('contracts');
  const invoices = db.getCollection('invoices');
  const interventions = db.getCollection('interventions');

  const results: any[] = [];

  clients.forEach(c => {
    if (c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query) || c.taxId.includes(query)) {
      results.push({ type: 'client', id: c.id, title: c.name, subtitle: `${c.code} • ${c.city}` });
    }
  });

  properties.forEach(p => {
    if (p.name.toLowerCase().includes(query) || p.address.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)) {
      results.push({ type: 'property', id: p.id, title: p.name, subtitle: `${p.code} • ${p.address}` });
    }
  });

  invoices.forEach(inv => {
    if (inv.number.toLowerCase().includes(query)) {
      results.push({ type: 'invoice', id: inv.id, title: inv.number, subtitle: `Total: ${inv.total.toFixed(2)}€ • ${inv.status}` });
    }
  });

  contracts.forEach(cnt => {
    if (cnt.number.toLowerCase().includes(query) || cnt.contractedServices.toLowerCase().includes(query)) {
      results.push({ type: 'contract', id: cnt.id, title: cnt.number, subtitle: `${cnt.agreedPrice.toFixed(2)}€ • ${cnt.frequency}` });
    }
  });

  interventions.forEach(inv => {
    if (inv.code.toLowerCase().includes(query) || inv.description.toLowerCase().includes(query)) {
      results.push({ type: 'intervention', id: inv.id, title: inv.code, subtitle: `${inv.scheduledDate} • ${inv.description}` });
    }
  });

  res.json(results.slice(0, 15));
});

// ----------------------------------------------------
// SERVE PRODUCTION FRONTEND STATIC FILES
// ----------------------------------------------------
const clientDistCandidates = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist')
];

const foundDist = clientDistCandidates.find(p => fs.existsSync(p));

if (foundDist) {
  app.use(express.static(foundDist));
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(foundDist, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`Freitas Nettoyage ERP Server running on port ${PORT}`);
});
