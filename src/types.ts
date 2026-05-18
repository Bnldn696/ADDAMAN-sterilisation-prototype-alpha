export type InstrumentStatus = 'Good' | 'Fair' | 'Bad';
export type BoiteStatus = 'Good' | 'Fair' | 'Bad';
export type MaterielStatus = 'Operational' | 'Maintenance' | 'Out of Order';

export interface Instrument {
  id: string;
  name: string;
  serialNumber: string;
  status: InstrumentStatus;
  imageUrl: string;
  lastUpdatedBy?: string;
  comment?: string;
}

export interface Boite {
  id: string;
  name: string;
  type?: 'Boite' | 'Tambour';
  status: BoiteStatus;
  instruments: Instrument[];
  lastUpdatedBy?: string;
  comment?: string;
  imageUrl?: string;
}

export interface AutoclaveTest {
  id: string;
  date: string;
  result: 'Pass' | 'Fail';
  leakTest: 'Pass' | 'Fail' | 'N/A';
  notes: string;
  author?: string;
}

export interface Reclamation {
  id: string;
  date: string;
  description: string;
  author?: string;
}

export interface BicarbonateRecord {
  id: string;
  date: string;
  author?: string;
}

export interface Materiel {
  id: string;
  name: string;
  type: 'Autoclave' | 'Soudeuse';
  status: MaterielStatus;
  tests?: AutoclaveTest[];
  reclamations?: Reclamation[];
  bicarbonateRecords?: BicarbonateRecord[];
  lastUpdatedBy?: string;
}

export interface Consomable {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  lastUpdatedBy?: string;
}

export interface Rapport {
  id: string;
  date: string;
  title: string;
  content: string;
  type: 'Report' | 'Instruction';
  category?: 'Maintenance' | 'Panne' | 'Vérification incomplète' | 'Réforme' | 'Test Bowie-Dick non réussite' | 'Autre' | string;
  attachmentUrl?: string; // For images or PDFs (mocked as data URL or external URL)
  author?: string;
}

export interface ChecklistItem {
  instrumentId: string;
  timestamp: string;
}

export interface Checklist {
  id: string;
  date: string;
  boiteId: string;
  scannedItems: ChecklistItem[];
  author?: string;
}

export interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
}

export type ReformeType = 'Boite' | 'Tambour' | 'Instrument';

export interface ReformeItem {
  id: string;
  type: ReformeType;
  name: string;
  reference?: string;
  imageUrl?: string;
  dateAdded: string;
  comment?: string;
}

export interface AppState {
  boites: Boite[];
  materiels: Materiel[];
  consomables: Consomable[];
  rapports: Rapport[];
  checklists: Checklist[];
  currentUser: string | null;
  notifications: Notification[];
  reformes: ReformeItem[];
}
