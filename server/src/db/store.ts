import fs from 'fs';
import path from 'path';
import { 
  User, CompanySettings, Client, Property, ServiceIntervention, 
  Employee, Team, QualityChecklist, Quote, Contract, Invoice, 
  Payment, InventoryItem, StockMovement, Supplier, Expense, AuditLog,
  Equipment
} from '../types';

export interface DatabaseSchema {
  settings: CompanySettings;
  users: User[];
  clients: Client[];
  properties: Property[];
  interventions: ServiceIntervention[];
  employees: Employee[];
  teams: Team[];
  checklists: QualityChecklist[];
  quotes: Quote[];
  contracts: Contract[];
  invoices: Invoice[];
  payments: Payment[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  equipment: Equipment[];
  suppliers: Supplier[];
  expenses: Expense[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'cleanpro_data.json');

const DEFAULT_SETTINGS: CompanySettings = {
  name: 'Freitas Nettoyage',
  tradeName: 'Freitas Nettoyage',
  logo: '',
  primaryColor: '#0284c7', // Professional Blue
  phone: '+33 1 42 68 55 00',
  mobile: '+33 6 12 34 56 78',
  email: 'contact@freitas-nettoyage.com',
  address: '15 Rue de la Paix',
  postalCode: '75002',
  city: 'Paris',
  country: 'France',
  taxId: 'FR84912345678',
  vatNumber: 'FR84912345678',
  siret: '849 123 456 00012',
  website: 'https://freitas-nettoyage.com',
  iban: 'FR76 3000 6000 0112 3456 7890 189',
  bic: 'BNPAFRPPXXX',
  bankName: 'BNP Paribas',
  currency: 'EUR',
  defaultLanguage: 'pt',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Europe/Paris',
  paymentTerms: 'Pagamento a 30 dias após emissão da fatura.',
  quoteConditions: 'Orçamento válido por 30 dias. Inclui todos os materiais, máquinas profissionais, equipa qualificada e seguro de responsabilidade.',
  invoiceNotes: 'Agradecemos a vossa preferência. Freitas Nettoyage - Excelência em Serviços e Limpezas.'
};

export class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        let updated = false;

        // Migração de Equipamentos
        if (!parsed.equipment || !Array.isArray(parsed.equipment) || parsed.equipment.length === 0) {
          parsed.equipment = this.generateInitialEquipment();
          updated = true;
        }

        // Atualização da Marca para Freitas Nettoyage
        if (parsed.settings) {
          if (parsed.settings.name?.includes('CleanPro') || parsed.settings.tradeName?.includes('CleanPro')) {
            parsed.settings.name = 'Freitas Nettoyage';
            parsed.settings.tradeName = 'Freitas Nettoyage';
            parsed.settings.email = 'contact@freitas-nettoyage.com';
            parsed.settings.website = 'https://freitas-nettoyage.com';
            parsed.settings.invoiceNotes = 'Agradecemos a vossa preferência. Freitas Nettoyage - Excelência em Serviços e Limpezas.';
            updated = true;
          }
        }

        if (updated) {
          this.save(parsed);
        }
        return parsed;
      } catch (err) {
        console.error('Error reading database file, creating fresh state', err);
      }
    }
    const fresh = this.generateInitialState();
    this.save(fresh);
    return fresh;
  }

  public generateInitialEquipment(): Equipment[] {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'eq-001',
        code: 'EQ-001',
        name: 'Monobrosse / Enceradeira Industrial 17"',
        category: 'floor_care',
        brandModel: 'Kärcher BDS 43/180 C Adv',
        serialNumber: 'SN-KRC-89210',
        purchaseDate: '2024-03-15',
        lastMaintenanceDate: '2026-01-10',
        nextMaintenanceDate: '2026-07-10',
        status: 'available',
        location: 'Armazém Central - Baia A1',
        notes: 'Indicada para decapagem, polimento e lavagem de mármore e granito.',
        createdAt: '2024-03-15T09:00:00Z',
        updatedAt: today
      },
      {
        id: 'eq-002',
        code: 'EQ-002',
        name: 'Aspirador Industrial Pó e Água 55L',
        category: 'vacuum',
        brandModel: 'Nilfisk VL500-55 BSF',
        serialNumber: 'SN-NLF-45512',
        purchaseDate: '2024-05-20',
        lastMaintenanceDate: '2026-02-01',
        nextMaintenanceDate: '2026-08-01',
        status: 'available',
        location: 'Armazém Central - Baia A2',
        notes: 'Excelente poder de sucção com filtro duplo para líquidos e poeiras de obra.',
        createdAt: '2024-05-20T10:00:00Z',
        updatedAt: today
      },
      {
        id: 'eq-003',
        code: 'EQ-003',
        name: 'Lavadora de Alta Pressão 150 Bar',
        category: 'pressure_washer',
        brandModel: 'Kärcher HD 5/15 C Plus',
        serialNumber: 'SN-KRC-11093',
        purchaseDate: '2024-08-10',
        lastMaintenanceDate: '2026-01-20',
        nextMaintenanceDate: '2026-07-20',
        status: 'available',
        location: 'Armazém Central - Baia B1',
        notes: 'Equipamento para lavagem de garagens, pátios exteriores e entradas.',
        createdAt: '2024-08-10T11:00:00Z',
        updatedAt: today
      },
      {
        id: 'eq-004',
        code: 'EQ-004',
        name: 'Injetora/Extratora Profissional de Alcatifas',
        category: 'floor_care',
        brandModel: 'Kärcher Puzzi 10/1',
        serialNumber: 'SN-KRC-77341',
        purchaseDate: '2025-01-15',
        lastMaintenanceDate: '2026-02-10',
        nextMaintenanceDate: '2026-08-10',
        status: 'available',
        location: 'Armazém Central - Baia B2',
        notes: 'Lavagem profunda de carpetes, tapetes e estofos em escritórios.',
        createdAt: '2025-01-15T09:30:00Z',
        updatedAt: today
      },
      {
        id: 'eq-005',
        code: 'EQ-005',
        name: 'Escada Telescópica Profissional 4.4m',
        category: 'scaffold_ladder',
        brandModel: 'Hailo Pro T80',
        serialNumber: 'SN-HLO-3004',
        purchaseDate: '2024-02-10',
        status: 'available',
        location: 'Carrinha Equipa Alpha (Edifícios)',
        notes: 'Norma EN131 para acesso seguro a vidros altos e tetos.',
        createdAt: '2024-02-10T08:00:00Z',
        updatedAt: today
      },
      {
        id: 'eq-006',
        code: 'EQ-006',
        name: 'Gerador de Vapor Sanitizante 8 Bar',
        category: 'steamer',
        brandModel: 'Polti Vaporetto Pro 95',
        serialNumber: 'SN-PLT-8820',
        purchaseDate: '2025-04-12',
        lastMaintenanceDate: '2026-01-05',
        nextMaintenanceDate: '2026-07-05',
        status: 'available',
        location: 'Armazém Central - Baia C1',
        notes: 'Higienização a 180°C de corrimãos, espelhos e zonas de contacto.',
        createdAt: '2025-04-12T14:00:00Z',
        updatedAt: today
      },
      {
        id: 'eq-007',
        code: 'EQ-007',
        name: 'Polidora de Alta Velocidade 1500 RPM',
        category: 'floor_care',
        brandModel: 'Taski Ergodisc 1200',
        serialNumber: 'SN-TSK-5521',
        purchaseDate: '2023-11-05',
        lastMaintenanceDate: '2025-10-15',
        nextMaintenanceDate: '2026-03-01',
        status: 'maintenance',
        location: 'Oficina Técnica / Fornecedor',
        notes: 'Substituição da correia de transmissão e escovas do motor.',
        createdAt: '2023-11-05T10:00:00Z',
        updatedAt: today
      }
    ];
  }

  private save(dataToSave?: DatabaseSchema) {
    this.ensureDirectory();
    const data = dataToSave || this.data;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  public replaceAll(newData: DatabaseSchema) {
    this.data = newData;
    this.save();
  }

  public getSettings(): CompanySettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<CompanySettings>): CompanySettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }

  // Generic collection operations
  public getCollection<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public insert<K extends keyof DatabaseSchema>(key: K, item: any): any {
    const list = this.data[key] as any[];
    list.unshift(item);
    this.save();
    return item;
  }

  public update<K extends keyof DatabaseSchema>(key: K, id: any, updates: any): any {
    const list = this.data[key] as any[];
    const idx = list.findIndex(i => String(i.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.save();
      return list[idx];
    }
    return null;
  }

  public delete<K extends keyof DatabaseSchema>(key: K, id: any): boolean {
    const list = this.data[key] as any[];
    const initialLen = list.length;
    this.data[key] = list.filter(i => String(i.id) !== String(id)) as any;
    const removed = (this.data[key] as any[]).length < initialLen;
    if (removed) this.save();
    return removed;
  }

  public findById<K extends keyof DatabaseSchema>(key: K, id: any): any {
    const list = this.data[key] as any[];
    return list.find(i => String(i.id) === String(id)) || null;
  }

  public logAudit(userId: string, userName: string, action: string, details: string) {
    this.insert('auditLogs', {
      id: 'log-' + Date.now(),
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  public generateInitialState(includeDemo: boolean = true): DatabaseSchema {
    const today = new Date().toISOString().split('T')[0];

    const users: User[] = [
      {
        id: 'usr-1',
        name: 'Administrador Geral',
        email: 'admin@cleanpro.com',
        password: 'admin', // Demo password
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-2',
        name: 'Carlos Oliveira (Operações)',
        email: 'operacoes@cleanpro.com',
        password: 'admin',
        role: 'operational_manager',
        active: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-3',
        name: 'Mariana Santos (Contabilidade)',
        email: 'financeiro@cleanpro.com',
        password: 'admin',
        role: 'accounting',
        active: true,
        createdAt: new Date().toISOString()
      }
    ];

    if (!includeDemo) {
      return {
        settings: DEFAULT_SETTINGS,
        users,
        clients: [],
        properties: [],
        interventions: [],
        employees: [],
        teams: [],
        checklists: [],
        quotes: [],
        contracts: [],
        invoices: [],
        payments: [],
        inventory: [],
        stockMovements: [],
        equipment: [],
        suppliers: [],
        expenses: [],
        auditLogs: [
          {
            id: 'log-0',
            userId: 'usr-1',
            userName: 'Administrador Geral',
            action: 'INITIALIZE',
            details: 'Sistema CleanPro ERP inicializado.',
            timestamp: new Date().toISOString()
          }
        ]
      };
    }

    // Rich realistic Demo Data
    const clients: Client[] = [
      {
        id: 'cli-001',
        code: 'CLI-001',
        type: 'condo_admin',
        name: 'LusoGestão Condomínios Lda',
        tradeName: 'LusoGestão Residencial',
        contactPerson: 'Dr. Fernando Pires',
        phone: '+351 21 445 6789',
        mobile: '+351 96 123 4567',
        email: 'gestao@lusogestao.pt',
        address: 'Rua Castilho, 52, 2º',
        postalCode: '1250-071',
        city: 'Lisboa',
        country: 'Portugal',
        taxId: '504112233',
        vatNumber: 'PT504112233',
        website: 'https://lusogestao.pt',
        notes: 'Administra 14 condomínios na zona da Grande Lisboa.',
        status: 'active',
        createdAt: '2026-01-10T10:00:00Z'
      },
      {
        id: 'cli-002',
        code: 'CLI-002',
        type: 'condo',
        name: 'Condomínio Edifício Miradouro do Parque',
        tradeName: 'Edifício Miradouro',
        contactPerson: 'Ana Paula Rocha (Administradora)',
        phone: '+351 21 888 7777',
        mobile: '+351 93 456 7890',
        email: 'condominio.miradouro@gmail.com',
        address: 'Alameda dos Oceanos, Lote 4.12',
        postalCode: '1990-203',
        city: 'Lisboa (Parque das Nações)',
        country: 'Portugal',
        taxId: '901234567',
        vatNumber: 'PT901234567',
        website: '',
        notes: 'Edifício de luxo com 8 pisos e 2 entradas principais.',
        status: 'active',
        createdAt: '2026-01-15T11:00:00Z'
      },
      {
        id: 'cli-003',
        code: 'CLI-003',
        type: 'company',
        name: 'Nexus Tech Innovation Hub SA',
        tradeName: 'Nexus Tech Offices',
        contactPerson: 'Pedro Alvalade (Facility Manager)',
        phone: '+351 21 999 0011',
        mobile: '+351 91 777 8899',
        email: 'facilities@nexustech.io',
        address: 'Avenida José Malhoa, 16, Piso 4',
        postalCode: '1070-159',
        city: 'Lisboa',
        country: 'Portugal',
        taxId: '512998877',
        vatNumber: 'PT512998877',
        website: 'https://nexustech.io',
        notes: 'Escritórios abertos e salas de reunião com limpeza diária pós-laboral.',
        status: 'active',
        createdAt: '2026-02-01T09:30:00Z'
      }
    ];

    const properties: Property[] = [
      {
        id: 'prop-001',
        code: 'IMO-001',
        name: 'Condomínio Jardins da Alameda - Bloco A e B',
        clientId: 'cli-001',
        type: 'condominium',
        address: 'Rua Tomás Ribeiro, 45',
        postalCode: '1050-226',
        city: 'Lisboa',
        buildingsCount: 2,
        floorsCount: 6,
        stairsCount: 4,
        elevatorsCount: 2,
        entrancesCount: 2,
        approxArea: 950,
        flooringType: 'Pedra mármore polida e granito',
        commonAreasDescription: 'Hall de entrada, escadaria principal em mármore, 2 elevadores panorâmicos, patamares e sala de condomínio.',
        cleaningFrequency: '2 vezes por semana (Terças e Sextas)',
        authorizedHours: '08:00 - 12:00',
        siteContact: 'Sr. António (Porteiro) - 912 345 678',
        accessInstructions: 'Chave magnética no cofre digital de entrada (Código: 4821#)',
        notes: 'Atenção especial ao polimento do corrimão de inox e espelhos dos elevadores.',
        status: 'active',
        createdAt: '2026-01-11T12:00:00Z'
      },
      {
        id: 'prop-002',
        code: 'IMO-002',
        name: 'Edifício Miradouro do Parque - Torre Sul',
        clientId: 'cli-002',
        type: 'residential_building',
        address: 'Alameda dos Oceanos, Lote 4.12',
        postalCode: '1990-203',
        city: 'Lisboa',
        buildingsCount: 1,
        floorsCount: 8,
        stairsCount: 2,
        elevatorsCount: 3,
        entrancesCount: 1,
        approxArea: 1400,
        flooringType: 'Cerâmica retificada e pedra calcária',
        commonAreasDescription: 'Entrada ampla em vidro duplo, 8 patamares, escadas de emergência e conduta de lixo.',
        cleaningFrequency: '3 vezes por semana (Segundas, Quartas e Sextas)',
        authorizedHours: '09:00 - 13:00',
        siteContact: 'D. Margarida - 934 567 890',
        accessInstructions: 'Portão eletrónico com intercomunicador direto à administração.',
        notes: 'Utilizar produto neutro com brilho nos pisos e desinfeção constante dos botões de elevador.',
        status: 'active',
        createdAt: '2026-01-16T10:00:00Z'
      },
      {
        id: 'prop-003',
        code: 'IMO-003',
        name: 'Nexus Tech HQ - Escritórios e Cowork',
        clientId: 'cli-003',
        type: 'office',
        address: 'Avenida José Malhoa, 16, Piso 4',
        postalCode: '1070-159',
        city: 'Lisboa',
        buildingsCount: 1,
        floorsCount: 1,
        stairsCount: 1,
        elevatorsCount: 4,
        entrancesCount: 1,
        approxArea: 680,
        flooringType: 'Vinílico acústico e alcatifa nas salas de conferência',
        commonAreasDescription: 'Open space com 70 postos de trabalho, 5 salas de reunião, copa/cozinha, 6 WC e zona de recepção.',
        cleaningFrequency: 'Diária (Segunda a Sexta)',
        authorizedHours: '19:00 - 22:00 (Pós-laboral)',
        siteContact: 'Segurança central da receção do edifício',
        accessInstructions: 'Cartão de acesso emitido para a equipa CleanPro na portaria central.',
        notes: 'Esvaziar todos os ecopontos e higienizar teclados/ecrãs sob pedido.',
        status: 'active',
        createdAt: '2026-02-02T14:00:00Z'
      }
    ];

    const employees: Employee[] = [
      {
        id: 'emp-001',
        code: 'EMP-001',
        fullName: 'Maria de Fátima Silva',
        photo: '',
        phone: '+351 92 111 2233',
        email: 'fatima.silva@cleanpro-team.com',
        address: 'Rua das Amendoeiras, 12, Amadora',
        role: 'Líder de Equipa / Operacional Sénior',
        hireDate: '2024-03-01',
        status: 'active',
        teamId: 'team-01',
        workingHours: '08:00 - 17:00',
        availability: 'Segunda a Sexta',
        skills: ['Limpeza de Escadas', 'Tratamento de Mármore', 'Lavagem de Vidros', 'Controlo de Qualidade'],
        notes: 'Excelente avaliação de clientes e rigor na checklist.',
        createdAt: '2024-03-01T08:00:00Z'
      },
      {
        id: 'emp-002',
        code: 'EMP-002',
        fullName: 'João Miguel Valente',
        photo: '',
        phone: '+351 93 222 3344',
        email: 'joao.valente@cleanpro-team.com',
        address: 'Praceta do Sol, 8, Odivelas',
        role: 'Técnico de Limpeza e Manutenção',
        hireDate: '2024-06-15',
        status: 'active',
        teamId: 'team-01',
        workingHours: '08:00 - 17:00',
        availability: 'Segunda a Sexta',
        skills: ['Monodisco', 'Lavadora de Pavimentos', 'Garagens', 'Aspiração Industrial'],
        notes: 'Carta de condução de ligeiros para a carrinha de serviço.',
        createdAt: '2024-06-15T08:00:00Z'
      },
      {
        id: 'emp-003',
        code: 'EMP-003',
        fullName: 'Sónia Maria Ferreira',
        photo: '',
        phone: '+351 91 333 4455',
        email: 'sonia.ferreira@cleanpro-team.com',
        address: 'Avenida D. Carlos I, 88, Sintra',
        role: 'Operacional de Escritórios e Condomínios',
        hireDate: '2025-01-10',
        status: 'active',
        teamId: 'team-02',
        workingHours: '14:00 - 22:00',
        availability: 'Segunda a Sexta',
        skills: ['Higienização de Escritórios', 'Desinfeção Sanitária', 'Vidros'],
        notes: 'Responsável pelo turno vespertino / noturno.',
        createdAt: '2025-01-10T08:00:00Z'
      }
    ];

    const teams: Team[] = [
      {
        id: 'team-01',
        name: 'Equipa Alpha (Condomínios e Escadas)',
        leaderId: 'emp-001',
        color: '#0284c7',
        notes: 'Atribuída a condomínios residenciais de alta frequência.'
      },
      {
        id: 'team-02',
        name: 'Equipa Beta (Escritórios e Comercial)',
        leaderId: 'emp-003',
        color: '#10b981',
        notes: 'Atribuída a espaços de escritórios e coworks.'
      }
    ];

    const interventions: ServiceIntervention[] = [
      {
        id: 'int-001',
        code: 'SRV-2026-001',
        clientId: 'cli-001',
        propertyId: 'prop-001',
        category: 'stairs',
        description: 'Limpeza completa de 4 lances de escadas em mármore, 2 halls de entrada e elevadores.',
        scheduledDate: today,
        startTime: '08:30',
        endTime: '11:00',
        teamId: 'team-01',
        assignedEmployeeIds: ['emp-001', 'emp-002'],
        frequency: 'weekly',
        price: 95.00,
        requiredMaterials: 'Detergente neutro perfumado, mopa de microfibra, limpa-vidros e pano de inox.',
        specificInstructions: 'Polir o corrimão de inox e retirar marcas dos espelhos dos 2 elevadores.',
        photos: [],
        status: 'completed',
        completedAt: today + 'T11:15:00Z',
        notes: 'Serviço executado com sucesso e inspecionado pelo porteiro.',
        createdAt: today + 'T07:00:00Z'
      },
      {
        id: 'int-002',
        code: 'SRV-2026-002',
        clientId: 'cli-002',
        propertyId: 'prop-002',
        category: 'elevators',
        description: 'Higienização profunda dos 3 elevadores, patamares e lavagem do piso da entrada.',
        scheduledDate: today,
        startTime: '11:30',
        endTime: '13:30',
        teamId: 'team-01',
        assignedEmployeeIds: ['emp-001', 'emp-002'],
        frequency: 'weekly',
        price: 85.00,
        requiredMaterials: 'Desinfetante hospitalar, aspirador industrial, detergente desengordurante.',
        specificInstructions: 'Cuidado ao limpar os sensores óticos das portas dos elevadores.',
        photos: [],
        status: 'in_progress',
        notes: 'Equipa no local a iniciar patamares superiores.',
        createdAt: today + 'T07:00:00Z'
      },
      {
        id: 'int-003',
        code: 'SRV-2026-003',
        clientId: 'cli-003',
        propertyId: 'prop-003',
        category: 'offices',
        description: 'Limpeza pós-laboral dos 70 postos de trabalho, 6 WC e zona de copa.',
        scheduledDate: today,
        startTime: '19:00',
        endTime: '22:00',
        teamId: 'team-02',
        assignedEmployeeIds: ['emp-003'],
        frequency: 'daily',
        price: 110.00,
        requiredMaterials: 'Panos codificados por cores, desinfetante virucida, sacos de lixo recicláveis.',
        specificInstructions: 'Alarme desativa com código fornecido na portaria.',
        photos: [],
        status: 'scheduled',
        notes: 'Confirmado com o gestor de instalações.',
        createdAt: today + 'T07:00:00Z'
      }
    ];

    const checklists: QualityChecklist[] = [
      {
        id: 'chk-001',
        interventionId: 'int-001',
        items: [
          { id: 't1', task: 'Hall de entrada e portas de vidro limpos e sem dedadas', completed: true },
          { id: 't2', task: 'Degraus e patamares de escadas varridos e lavados', completed: true },
          { id: 't3', task: 'Corrimãos higienizados e polidos com produto específico', completed: true },
          { id: 't4', task: 'Cabines de elevadores, botões, rodapés e espelhos impecáveis', completed: true },
          { id: 't5', task: 'Remoção de teias de aranha nos cantos e tectos', completed: true },
          { id: 't6', task: 'Caixotes de lixo e cinzeiros exteriores esvaziados', completed: true },
          { id: 't7', task: 'Revisão final e aposição de aroma agradável no hall', completed: true }
        ],
        notes: 'Todos os pontos validados com nota 10/10.',
        beforePhotos: [],
        afterPhotos: [],
        needsCorrection: false,
        inspectedBy: 'Maria de Fátima Silva',
        inspectedAt: today + 'T11:10:00Z'
      }
    ];

    const quotes: Quote[] = [
      {
        id: 'orc-2026-001',
        number: 'ORC-2026-001',
        clientId: 'cli-001',
        propertyId: 'prop-001',
        issueDate: '2026-01-05',
        expiryDate: '2026-02-05',
        items: [
          {
            id: 'item-1',
            description: 'Limpeza bissemanal de escadas, halls e elevadores (Mensalidade)',
            quantity: 1,
            unit: 'mês',
            unitPrice: 380.00,
            discount: 0,
            total: 380.00
          },
          {
            id: 'item-2',
            description: 'Tratamento e cristalização inicial do piso de pedra mármore',
            quantity: 1,
            unit: 'serviço',
            unitPrice: 250.00,
            discount: 10,
            total: 225.00
          }
        ],
        discountPercent: 0,
        vatRate: 23,
        subtotal: 605.00,
        vatAmount: 139.15,
        total: 744.15,
        paymentConditions: '30 dias após data da fatura',
        frequency: 'Contrato Mensal Recorrente',
        notes: 'Inclui fornecimento contínuo de consumíveis e produtos certificados com ficha técnica.',
        terms: 'A proposta inclui seguro de responsabilidade civil e substituição de equipa em caso de baixa.',
        status: 'converted',
        createdAt: '2026-01-05T10:00:00Z'
      },
      {
        id: 'orc-2026-002',
        number: 'ORC-2026-002',
        clientId: 'cli-002',
        propertyId: 'prop-002',
        issueDate: today,
        expiryDate: '2026-11-27',
        items: [
          {
            id: 'item-1',
            description: 'Limpeza trissemanal de condomínio residencial (8 pisos + 3 elevadores)',
            quantity: 1,
            unit: 'mês',
            unitPrice: 520.00,
            discount: 5,
            total: 494.00
          },
          {
            id: 'item-2',
            description: 'Lavagem trimestral de caixilharias e vidros de fachada acessíveis',
            quantity: 1,
            unit: 'serviço',
            unitPrice: 150.00,
            discount: 0,
            total: 150.00
          }
        ],
        discountPercent: 0,
        vatRate: 23,
        subtotal: 644.00,
        vatAmount: 148.12,
        total: 792.12,
        paymentConditions: 'Transferência bancária a 15 dias',
        frequency: 'Contrato Anual Renovável',
        notes: 'Valores líquidos de descontos de parceria.',
        terms: 'Validade de 30 dias contados da presente data.',
        status: 'sent',
        createdAt: today + 'T08:00:00Z'
      }
    ];

    const contracts: Contract[] = [
      {
        id: 'cnt-2026-001',
        number: 'CNT-2026-001',
        quoteId: 'orc-2026-001',
        clientId: 'cli-001',
        propertyId: 'prop-001',
        contractedServices: 'Limpeza bissemanal de escadas, átrios e 2 elevadores',
        frequency: '2 vezes por semana',
        scheduledTimes: 'Terças e Sextas das 08h30 às 11h00',
        agreedPrice: 380.00,
        paymentConditions: 'Pagamento mensal por débito direto / transferência até dia 5',
        startDate: '2026-01-15',
        endDate: '2027-01-14',
        renewalTerms: 'Renovação automática anual salvo aviso prévio com 60 dias de antecedência.',
        terminationTerms: 'Rescisão motivada com aviso prévio de 30 dias.',
        notes: 'Contrato ativo com elevado índice de satisfação dos condóminos.',
        status: 'active',
        createdAt: '2026-01-12T15:00:00Z'
      },
      {
        id: 'cnt-2026-002',
        number: 'CNT-2026-002',
        clientId: 'cli-003',
        propertyId: 'prop-003',
        contractedServices: 'Higienização e conservação diária de escritórios corporativos e salas de reuniões',
        frequency: 'Diária (Segunda a Sexta)',
        scheduledTimes: '19h00 às 22h00',
        agreedPrice: 1250.00,
        paymentConditions: 'Faturação a 30 dias de fim de mês',
        startDate: '2026-02-01',
        endDate: '2027-01-31',
        renewalTerms: 'Renovável anualmente',
        terminationTerms: 'Aviso prévio escrito de 60 dias',
        notes: 'Exige protocolo rígido de confidencialidade NDA assinado por todos os operacionais.',
        status: 'active',
        createdAt: '2026-01-28T16:00:00Z'
      }
    ];

    const invoices: Invoice[] = [
      {
        id: 'inv-2026-001',
        number: 'FT-2026-001',
        contractId: 'cnt-2026-001',
        clientId: 'cli-001',
        issueDate: '2026-01-31',
        dueDate: '2026-02-28',
        items: [
          {
            id: 'inv-i1',
            description: 'Prestação de serviços de limpeza de condomínio - Mês de Janeiro 2026',
            quantity: 1,
            unit: 'mês',
            unitPrice: 380.00,
            total: 380.00
          }
        ],
        subtotal: 380.00,
        vatRate: 23,
        vatAmount: 87.40,
        total: 467.40,
        paidAmount: 467.40,
        balanceDue: 0.00,
        paymentTerms: 'Transferência bancária a 30 dias',
        status: 'paid',
        notes: 'Liquidada por transferência bancária.',
        createdAt: '2026-01-31T18:00:00Z'
      },
      {
        id: 'inv-2026-002',
        number: 'FT-2026-002',
        contractId: 'cnt-2026-001',
        clientId: 'cli-001',
        issueDate: today,
        dueDate: '2026-11-27',
        items: [
          {
            id: 'inv-i2',
            description: 'Prestação de serviços de limpeza de condomínio - Mensalidade em curso',
            quantity: 1,
            unit: 'mês',
            unitPrice: 380.00,
            total: 380.00
          }
        ],
        subtotal: 380.00,
        vatRate: 23,
        vatAmount: 87.40,
        total: 467.40,
        paidAmount: 0.00,
        balanceDue: 467.40,
        paymentTerms: 'Transferência bancária a 30 dias',
        status: 'issued',
        notes: 'A aguardar pagamento.',
        createdAt: today + 'T09:00:00Z'
      },
      {
        id: 'inv-2026-003',
        number: 'FT-2026-003',
        contractId: 'cnt-2026-002',
        clientId: 'cli-003',
        issueDate: today,
        dueDate: '2026-11-27',
        items: [
          {
            id: 'inv-i3',
            description: 'Serviço corporativo de limpeza e conservação de escritórios e cowork',
            quantity: 1,
            unit: 'mês',
            unitPrice: 1250.00,
            total: 1250.00
          }
        ],
        subtotal: 1250.00,
        vatRate: 23,
        vatAmount: 287.50,
        total: 1537.50,
        paidAmount: 500.00,
        balanceDue: 1037.50,
        paymentTerms: 'Transferência bancária a 30 dias',
        status: 'partially_paid',
        notes: 'Adiantamento de 500€ recebido.',
        createdAt: today + 'T09:30:00Z'
      }
    ];

    const payments: Payment[] = [
      {
        id: 'pay-001',
        invoiceId: 'inv-2026-001',
        clientId: 'cli-001',
        amount: 467.40,
        paymentDate: '2026-02-15',
        method: 'bank_transfer',
        reference: 'TRF-BCP-98821',
        notes: 'Pagamento total da fatura FT-2026-001',
        createdAt: '2026-02-15T10:00:00Z'
      },
      {
        id: 'pay-002',
        invoiceId: 'inv-2026-003',
        clientId: 'cli-003',
        amount: 500.00,
        paymentDate: today,
        method: 'bank_transfer',
        reference: 'TRF-NEXUS-010',
        notes: 'Pagamento parcial de sinal',
        createdAt: today + 'T10:00:00Z'
      }
    ];

    const inventory: InventoryItem[] = [
      {
        id: 'mat-001',
        code: 'MAT-DET-01',
        name: 'Detergente Neutro Perfumado para Mármore (5L)',
        category: 'Produtos Químicos',
        supplierId: 'sup-001',
        stockQty: 18,
        unit: 'garrafão',
        purchasePrice: 12.50,
        minStock: 5,
        location: 'Armazém Central - Prateleira A1',
        notes: 'Adequado para pedra natural e cerâmica sensível.',
        updatedAt: today
      },
      {
        id: 'mat-002',
        code: 'MAT-INOX-02',
        name: 'Polidor e Protetor de Aço Inox (Aerossol 500ml)',
        category: 'Tratamento de Metais',
        supplierId: 'sup-001',
        stockQty: 8,
        unit: 'unidade',
        purchasePrice: 7.20,
        minStock: 4,
        location: 'Armazém Central - Prateleira B2',
        notes: 'Utilizado nos elevadores e corrimãos.',
        updatedAt: today
      },
      {
        id: 'mat-003',
        code: 'MAT-MOP-03',
        name: 'Recarga Mopa de Microfibra Profissional 60cm',
        category: 'Acessórios e Têxteis',
        supplierId: 'sup-002',
        stockQty: 3,
        unit: 'unidade',
        purchasePrice: 6.80,
        minStock: 6, // ALERTA DE STOCK BAIXO
        location: 'Armazém Central - Gavetão C',
        notes: 'Abaixo do stock mínimo! Necessário encomendar novo lote.',
        updatedAt: today
      },
      {
        id: 'mat-004',
        code: 'MAT-DES-04',
        name: 'Desinfetante Virucida Multiusos Spray 750ml',
        category: 'Produtos Químicos',
        supplierId: 'sup-001',
        stockQty: 24,
        unit: 'frasco',
        purchasePrice: 4.10,
        minStock: 8,
        location: 'Armazém Central - Prateleira A2',
        notes: 'Certificação EN14476 para escritório e áreas médicas.',
        updatedAt: today
      }
    ];

    const stockMovements: StockMovement[] = [
      {
        id: 'mov-001',
        inventoryItemId: 'mat-001',
        type: 'in',
        quantity: 20,
        reason: 'Receção de encomenda de fornecedor #1092',
        date: '2026-02-01',
        employeeId: 'emp-001'
      },
      {
        id: 'mov-002',
        inventoryItemId: 'mat-001',
        type: 'out',
        quantity: 2,
        reason: 'Abastecimento Carrinha Equipa Alpha (Edifícios)',
        date: today,
        employeeId: 'emp-002'
      }
    ];

    const suppliers: Supplier[] = [
      {
        id: 'sup-001',
        code: 'FOR-001',
        name: 'CleanSupply Portugal SA',
        tradeName: 'CleanSupply Distribuição',
        contactPerson: 'Miguel Barreto',
        phone: '+351 21 777 6655',
        email: 'pedidos@cleansupply.pt',
        address: 'Zona Industrial da Maia, Setor 4',
        taxId: '503998811',
        productsSupplied: 'Detergentes industriais, desinfetantes, ceras e químicos',
        paymentConditions: '30 dias',
        status: 'active',
        createdAt: '2024-01-10T10:00:00Z'
      },
      {
        id: 'sup-002',
        code: 'FOR-002',
        name: 'EquipLimpa Máquinas e Acessórios Lda',
        tradeName: 'EquipLimpa',
        contactPerson: 'Sofia Valente',
        phone: '+351 22 888 9900',
        email: 'comercial@equiplimpa.pt',
        address: 'Estrada Nacional 10, Alverca',
        taxId: '508443322',
        productsSupplied: 'Aspiradores industriais, mopas, carros de limpeza e monodisco',
        paymentConditions: 'Pronto pagamento c/ 3% desconto',
        status: 'active',
        createdAt: '2024-02-05T11:00:00Z'
      }
    ];

    const expenses: Expense[] = [
      {
        id: 'desp-001',
        category: 'cleaning_products',
        description: 'Compra de lote mensal de detergentes para mármore e desinfetantes',
        amount: 285.50,
        date: today,
        supplierId: 'sup-001',
        receiptUrl: '',
        notes: 'Fatura FT 8991/2026',
        createdAt: today + 'T10:00:00Z'
      },
      {
        id: 'desp-002',
        category: 'fuel',
        description: 'Abastecimento gasóleo Carrinha Renault Master (Equipa Alpha)',
        amount: 82.00,
        date: today,
        notes: 'Galp Segunda Circular',
        createdAt: today + 'T08:15:00Z'
      },
      {
        id: 'desp-003',
        category: 'insurance',
        description: 'Seguro de responsabilidade civil e acidentes de trabalho (Trimestral)',
        amount: 340.00,
        date: '2026-01-02',
        notes: 'Fidelidade Companhia de Seguros',
        createdAt: '2026-01-02T12:00:00Z'
      }
    ];

    return {
      settings: DEFAULT_SETTINGS,
      users,
      clients,
      properties,
      interventions,
      employees,
      teams,
      checklists,
      quotes,
      contracts,
      invoices,
      payments,
      inventory,
      stockMovements,
      equipment: this.generateInitialEquipment(),
      suppliers,
      expenses,
      auditLogs: [
        {
          id: 'log-1',
          userId: 'usr-1',
          userName: 'Administrador Geral',
          action: 'LOGIN',
          details: 'Sessão iniciada no CleanPro ERP.',
          timestamp: new Date().toISOString()
        }
      ]
    };
  }
}

export const db = new DatabaseStore();
