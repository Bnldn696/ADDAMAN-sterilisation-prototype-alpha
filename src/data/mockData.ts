import { AppState, Boite, InstrumentStatus } from '../types';

const boiteNames = [
  "Partie molle 1", "Partie molle 2", "Partie molle 3", "Partie molle 4", "Partie molle 5",
  "Abdomen", "Vésicule 1", "Vésicule 2", "Chirurgie enfantine 1", "Chirurgie enfantine 2",
  "Hernie enfant", "Coelio", "Thyroïde", "Ostéosynthèse 1", "Ostéosynthèse 2",
  "Broche 1", "Broche 2", "Broche 3", "Curette", "Petits fragments", "Moteur orthopédique",
  "Partie molle membre supérieur", "Partie molle membre inférieur", "Rachis", "Crâne",
  "Neuro chirurgie", "Gynéco", "Bougie", "Curetage 1", "Curetage 2", "Curetage 3",
  "Amygdalectomie 1", "Amygdalectomie 2", "ORL", "Vasculaire", "Fixateur externe", "Dragues"
];

const partieMolleInstruments = [
  { id: 'i1', name: 'Pince de badigeonnage', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i2', name: 'Pince à disséquer à griffe', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i3', name: 'Pince à disséquer sans griffe', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i4', name: 'Ciseau mayo courbe', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i5', name: 'Ciseau mayo droit', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i6', name: 'Porte-aiguille grand modèle', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i7', name: 'Porte-aiguille petit modèle', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i8', name: 'Pince Kocher à griffe', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i9', name: 'Pince Kocher à griffe', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i10', name: 'Pince Kelly', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i11', name: 'Pince Kelly', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i12', name: 'Pince Kelly', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i13', name: 'Pince Pean', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i14', name: 'Pince Pean', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i15', name: 'Fixe champ', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i16', name: 'Fixe champ', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i17', name: 'Fixe champ', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i18', name: 'Fixe champ', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i19', name: 'Farabeuf grand modèle', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i20', name: 'Farabeuf grand modèle', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i21', name: 'Farabeuf petit modèle', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i22', name: 'Farabeuf petit modèle', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
  { id: 'i23', name: 'Manche de bistouri Numéro 4', serialNumber: '', status: 'Good' as InstrumentStatus, imageUrl: '' },
];

const generatedBoites: Boite[] = boiteNames.map((name, index) => {
  const isPartieMolle = name.startsWith('Partie molle');
  // Randomly assign Boite or Tambour for mock data visibility
  const type: 'Boite' | 'Tambour' = index % 5 === 0 ? 'Tambour' : 'Boite';
  return {
    id: `b${index + 1}`,
    name,
    type,
    status: 'Good',
    instruments: isPartieMolle 
      ? partieMolleInstruments.map(inst => ({ ...inst, id: `${inst.id}_b${index + 1}` }))
      : []
  };
});

// Add some mock instruments to the first one just to show how it looks
if (!generatedBoites[0].instruments.length) {
  generatedBoites[0].instruments = [
    {
      id: 'i1_mock',
      name: 'Bistouri',
      serialNumber: 'SN-001',
      status: 'Good',
      imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400&h=300&fit=crop',
    },
    {
      id: 'i2_mock',
      name: 'Pince de Kocher',
      serialNumber: 'SN-002',
      status: 'Fair',
      imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop',
    }
  ];
}

export const initialData: AppState = {
  boites: generatedBoites,
  materiels: [
    {
      id: 'm1',
      name: 'Autoclave Sterilmed 1',
      type: 'Autoclave',
      status: 'Operational',
      tests: [
        { id: 't1', date: new Date().toISOString().split('T')[0], result: 'Pass', leakTest: 'Pass', notes: 'Bowie-Dick test passed' },
      ],
      reclamations: [],
    },
    {
      id: 'm2',
      name: 'Autoclave Sterilmed 2',
      type: 'Autoclave',
      status: 'Maintenance',
      tests: [],
      reclamations: [
        { id: 'r1', date: new Date().toISOString().split('T')[0], description: 'Pressure drop during cycle' },
      ],
    },
    {
      id: 'm3',
      name: 'La Soudeuse',
      type: 'Soudeuse',
      status: 'Operational',
    },
  ],
  consomables: [
    { id: 'c1', name: 'Gaines de stérilisation', quantity: 500, unit: 'm', minThreshold: 100 },
    { id: 'c2', name: 'Indicateurs chimiques', quantity: 2000, unit: 'pcs', minThreshold: 500 },
    { id: 'c3', name: 'Sachets', quantity: 150, unit: 'pcs', minThreshold: 200 },
  ],
  rapports: [
    {
      id: 'r1',
      date: new Date().toISOString().split('T')[0],
      title: 'Consigne de sécurité',
      content: 'Toujours vérifier les joints de l\'autoclave avant le premier cycle de la journée.',
      type: 'Instruction',
      author: 'Système',
    },
    {
      id: 'r2',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      title: 'Rapport de maintenance',
      content: 'Maintenance préventive effectuée sur la soudeuse.',
      type: 'Report',
      author: 'Système',
    },
  ],
  checklists: [],
  currentUser: null,
  notifications: [],
  reformes: [],
};
