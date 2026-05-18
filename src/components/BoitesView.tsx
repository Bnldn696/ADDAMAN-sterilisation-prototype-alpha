import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { Boite, Instrument, Checklist } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, ThumbsUp, ThumbsDown, Minus, ArrowLeft, Image as ImageIcon, X, PackageOpen, Plus, RefreshCw, Camera, CheckCircle2, Edit, Trash2, GripVertical, Upload, FileDown, ClipboardCheck, Copy, Cylinder } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CameraScanner } from './CameraScanner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import fuzzysort from 'fuzzysort';

const SortableInstrument = ({ 
  inst, 
  isChecked, 
  getStatusColor, 
  setSelectedInstrument, 
  setInstrumentToEdit, 
  setShowEditInstrument, 
  setInstrumentToReplace, 
  setShowReplace, 
  state, 
  updateBoite, 
  selectedBoite, 
  setSelectedBoite,
  isSelectedForAction,
  onToggleSelection,
  setShowPasteModal
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: inst.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      whileHover={{ y: -2 }}
      className={`rounded-xl p-4 border flex flex-col justify-between transition-colors ${isChecked ? 'bg-emerald-50 border-emerald-300' : isSelectedForAction ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'} ${isDragging ? 'shadow-xl ring-2 ring-teal-500 opacity-90' : ''}`}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-start gap-2">
          {state.currentUser === 'Fatihi Anas' && (
            <div className="mt-1 flex items-center h-full">
              <input 
                type="checkbox" 
                checked={isSelectedForAction}
                onChange={() => onToggleSelection(inst.id)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          )}
          <div 
            {...attributes} 
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 flex items-center">
              {inst.name}
              {isChecked && <CheckCircle2 className="h-4 w-4 ml-2 text-emerald-500" />}
            </h4>
            <p className="text-xs text-slate-500 font-mono mt-1">
              {inst.serialNumber ? `SN: ${inst.serialNumber}` : 'Sans numéro de série'}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(inst.status)}`}>
          {inst.status}
        </span>
      </div>

      <div className="flex items-center gap-1 mb-3 bg-white/50 p-1 rounded-lg border border-slate-100 self-start">
        <button 
          onClick={() => {
            const updatedInstruments = selectedBoite.instruments.map((i: any) => i.id === inst.id ? { ...i, status: 'Good', lastUpdatedBy: state.currentUser || 'Système' } : i);
            const updatedBoite = { ...selectedBoite, instruments: updatedInstruments, lastUpdatedBy: state.currentUser || 'Système' };
            updateBoite(updatedBoite);
            setSelectedBoite(updatedBoite);
          }}
          className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${inst.status === 'Good' ? 'bg-emerald-500 text-white' : 'text-emerald-600 hover:bg-emerald-50'}`}
          title="Bon"
        >
          B
        </button>
        <button 
          onClick={() => {
            const updatedInstruments = selectedBoite.instruments.map((i: any) => i.id === inst.id ? { ...i, status: 'Fair', lastUpdatedBy: state.currentUser || 'Système' } : i);
            const updatedBoite = { ...selectedBoite, instruments: updatedInstruments, lastUpdatedBy: state.currentUser || 'Système' };
            updateBoite(updatedBoite);
            setSelectedBoite(updatedBoite);
          }}
          className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${inst.status === 'Fair' ? 'bg-amber-500 text-white' : 'text-amber-600 hover:bg-amber-50'}`}
          title="Moyen"
        >
          M
        </button>
        <button 
          onClick={() => {
            const updatedInstruments = selectedBoite.instruments.map((i: any) => i.id === inst.id ? { ...i, status: 'Bad', lastUpdatedBy: state.currentUser || 'Système' } : i);
            const updatedBoite = { ...selectedBoite, instruments: updatedInstruments, lastUpdatedBy: state.currentUser || 'Système' };
            updateBoite(updatedBoite);
            setSelectedBoite(updatedBoite);
          }}
          className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${inst.status === 'Bad' ? 'bg-red-500 text-white' : 'text-red-600 hover:bg-red-50'}`}
          title="Mauvais"
        >
          MA
        </button>
      </div>
      {inst.lastUpdatedBy && (
        <p className="text-[10px] text-slate-400 text-right mt-1 mb-2">Modifié par: {inst.lastUpdatedBy}</p>
      )}
      <div className="flex flex-wrap gap-2 mt-auto pt-3">
        <button
          onClick={() => setSelectedInstrument(inst)}
          className="flex-1 min-w-[80px] flex items-center justify-center py-2 px-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors"
        >
          <ImageIcon className="h-4 w-4 mr-1.5" />
          Image
        </button>
        <button
          onClick={() => { setInstrumentToEdit(inst); setShowEditInstrument(true); }}
          className="flex items-center justify-center py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          title="Éditer l'instrument"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => { 
            onToggleSelection(inst.id, true);
            setShowPasteModal(true);
          }}
          className="flex items-center justify-center py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Copier l'instrument"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setInstrumentToReplace(inst); setShowReplace(true); }}
          className="flex items-center justify-center py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
          title="Remplacer l'instrument"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        {state.currentUser === 'Fatihi Anas' && (
          <button
            onClick={() => {
              const updatedBoite = {
                ...selectedBoite,
                instruments: selectedBoite.instruments.filter((i: any) => i.id !== inst.id),
                lastUpdatedBy: state.currentUser || 'Système'
              };
              updateBoite(updatedBoite);
              setSelectedBoite(updatedBoite);
            }}
            className="flex items-center justify-center py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            title="Supprimer l'instrument"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export const BoitesView: React.FC = () => {
  const { state, updateBoite, addBoite, addRapport, addChecklist, deleteBoite } = useStore();
  const [selectedBoite, setSelectedBoite] = useState<Boite | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'boites' | 'instruments'>('all');
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);

  // Modals
  const [showAddBoite, setShowAddBoite] = useState(false);
  const [newBoiteName, setNewBoiteName] = useState('');
  const [newBoiteType, setNewBoiteType] = useState<'Boite' | 'Tambour'>('Boite');

  const [showAddInstrument, setShowAddInstrument] = useState(false);
  const [newInstrument, setNewInstrument] = useState({ name: '', serialNumber: '', imageUrl: '' });

  const [showEditInstrument, setShowEditInstrument] = useState(false);
  const [instrumentToEdit, setInstrumentToEdit] = useState<Instrument | null>(null);

  const [showReplace, setShowReplace] = useState(false);
  const [instrumentToReplace, setInstrumentToReplace] = useState<Instrument | null>(null);
  const [newSerialNumber, setNewSerialNumber] = useState('');

  const [imageZoom, setImageZoom] = useState(1);

  // Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<'verify' | 'add' | 'edit'>('verify');
  const [currentChecklist, setCurrentChecklist] = useState<string[]>([]); // Array of scanned instrument IDs
  const [showChecklist, setShowChecklist] = useState(false);

  // Admin Management State
  const [selectedInstrumentsForAction, setSelectedInstrumentsForAction] = useState<string[]>([]);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [targetBoiteId, setTargetBoiteId] = useState('');

  const checklistRef = React.useRef<HTMLDivElement>(null);

  const startVerification = () => {
    setScannerMode('verify');
    setCurrentChecklist([]);
    setShowChecklist(true);
    // setShowScanner(true);
    setTimeout(() => {
        checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const { filteredBoites, matchedInstruments } = useMemo(() => {
    let matchedBoites: Boite[] = [];
    let matchedInsts: (Instrument & { boiteId: string, boiteName: string })[] = [];

    if (!searchQuery.trim()) {
        if (searchType === 'instruments') {
           return { filteredBoites: [], matchedInstruments: state.boites.flatMap(b => b.instruments.map(i => ({...i, boiteId: b.id, boiteName: b.name}))) };
        }
        return { filteredBoites: state.boites, matchedInstruments: [] };
    }

    if (searchType === 'boites' || searchType === 'all') {
        const results = fuzzysort.go(searchQuery, state.boites, { key: 'name', threshold: -20000 });
        const boiteIds = new Set(results.map(r => (r.obj as Boite).id));
        matchedBoites = state.boites.filter(b => boiteIds.has(b.id));
    }

    if (searchType === 'instruments' || searchType === 'all') {
        const allInstruments = state.boites.flatMap(b => b.instruments.map(i => ({...i, boiteId: b.id, boiteName: b.name})));
        const results = fuzzysort.go(searchQuery, allInstruments, { key: 'name', threshold: -20000 });
        
        matchedInsts = results.map(r => r.obj as (Instrument & { boiteId: string, boiteName: string }));
        
        if (searchType === 'all') {
            const matchedBoiteIds = new Set(matchedInsts.map(r => r.boiteId));
            const additionallyMatched = state.boites.filter(b => matchedBoiteIds.has(b.id) && !matchedBoites.find(mb => mb.id === b.id));
            matchedBoites = [...matchedBoites, ...additionallyMatched];
        }
    }

    return { filteredBoites: matchedBoites, matchedInstruments: matchedInsts };
  }, [state.boites, searchQuery, searchType]);

  const downloadPDF = () => {
    if (!selectedBoite) return;
    const doc = new jsPDF();
    doc.text(`Fiche d'Instrumentation: ${selectedBoite.name}`, 14, 15);
    autoTable(doc, {
      head: [['Désignation', 'Quantité', 'Référence']],
      body: selectedBoite.instruments.map(inst => [inst.name, '1', inst.serialNumber || '-']),
      startY: 20,
    });
    doc.save(`Fiche_${selectedBoite.name}.pdf`);
  };

  const handleStatusChange = (status: 'Good' | 'Fair' | 'Bad') => {
    if (!selectedBoite) return;
    const updatedBoite = { ...selectedBoite, status };
    updateBoite(updatedBoite);
    setSelectedBoite(updatedBoite);
    addRapport({
      id: `r${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: `Changement d'état: ${selectedBoite.name}`,
      content: `L'état de la boîte a été modifié à "${status}".`,
      type: 'Report'
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && selectedBoite) {
      const oldIndex = selectedBoite.instruments.findIndex((i: any) => i.id === active.id);
      const newIndex = selectedBoite.instruments.findIndex((i: any) => i.id === over.id);
      
      const newInstruments = arrayMove(selectedBoite.instruments, oldIndex, newIndex);
      
      const updatedBoite = {
        ...selectedBoite,
        instruments: newInstruments,
        lastUpdatedBy: state.currentUser || 'Système'
      };
      
      updateBoite(updatedBoite);
      setSelectedBoite(updatedBoite);
    }
  };

  const toggleInstrumentSelection = (id: string, single: boolean = false) => {
    if (single) {
      setSelectedInstrumentsForAction([id]);
    } else {
      setSelectedInstrumentsForAction(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  const selectAllInstruments = () => {
    if (!selectedBoite) return;
    if (selectedInstrumentsForAction.length === selectedBoite.instruments.length) {
      setSelectedInstrumentsForAction([]); // Deselect all
    } else {
      setSelectedInstrumentsForAction(selectedBoite.instruments.map((i: any) => i.id)); // Select all
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedBoite || selectedInstrumentsForAction.length === 0) return;
    if (window.confirm(`Are you sure you want to permanently delete these ${selectedInstrumentsForAction.length} selected instruments?`)) {
      const updatedBoite = {
        ...selectedBoite,
        instruments: selectedBoite.instruments.filter((i: any) => !selectedInstrumentsForAction.includes(i.id)),
        lastUpdatedBy: state.currentUser || 'Système'
      };
      updateBoite(updatedBoite);
      setSelectedBoite(updatedBoite);
      setSelectedInstrumentsForAction([]);
    }
  };

  const handlePasteToBoite = () => {
    if (!selectedBoite || selectedInstrumentsForAction.length === 0 || !targetBoiteId) return;
    
    const targetBoite = state.boites.find(b => b.id === targetBoiteId);
    if (!targetBoite) return;

    const instrumentsToCopy = selectedBoite.instruments.filter((i: any) => selectedInstrumentsForAction.includes(i.id));
    
    // Create exact duplicates with new IDs to avoid React key conflicts
    const copiedInstruments = instrumentsToCopy.map((inst: any) => ({
      ...inst,
      id: `i${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));

    // Add to target boite
    const updatedTargetBoite = {
      ...targetBoite,
      instruments: [...targetBoite.instruments, ...copiedInstruments],
      lastUpdatedBy: state.currentUser || 'Système'
    };
    updateBoite(updatedTargetBoite);

    addRapport({
      id: `rap-copy-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: `Instruments copiés: ${targetBoite.name}`,
      content: `${instrumentsToCopy.length} instrument(s) ont été copiés depuis la boîte "${selectedBoite.name}" vers la boîte "${targetBoite.name}".\nInstruments: ${instrumentsToCopy.map((i: any) => i.name).join(', ')}`,
      type: 'Instruction',
      author: state.currentUser || 'Système'
    });

    // We DO NOT remove from the current boite as this is a Copy action.
    
    setSelectedInstrumentsForAction([]);
    setShowPasteModal(false);
    setTargetBoiteId('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Good': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Fair': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Bad': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleAddBoiteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBoite({
      id: `b${Date.now()}`,
      name: newBoiteName,
      type: newBoiteType,
      status: 'Good',
      instruments: [],
      lastUpdatedBy: state.currentUser || 'Système'
    });
    setShowAddBoite(false);
    setNewBoiteName('');
    setNewBoiteType('Boite');
  };

  const handleAddInstrumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoite) return;
    const inst: Instrument = {
      id: `i${Date.now()}`,
      name: newInstrument.name,
      serialNumber: newInstrument.serialNumber,
      status: 'Good',
      imageUrl: newInstrument.imageUrl || 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400&h=300&fit=crop',
      lastUpdatedBy: state.currentUser || 'Système'
    };
    const updatedBoite = {
      ...selectedBoite,
      instruments: [...selectedBoite.instruments, inst],
      lastUpdatedBy: state.currentUser || 'Système'
    };
    updateBoite(updatedBoite);
    setSelectedBoite(updatedBoite);
    setShowAddInstrument(false);
    setNewInstrument({ name: '', serialNumber: '', imageUrl: '' });
  };

  const handleEditInstrumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoite || !instrumentToEdit) return;
    
    const updatedInstruments = selectedBoite.instruments.map(i => {
      if (i.id === instrumentToEdit.id) {
        return { ...instrumentToEdit, lastUpdatedBy: state.currentUser || 'Système' };
      }
      return i;
    });

    const updatedBoite = { ...selectedBoite, instruments: updatedInstruments, lastUpdatedBy: state.currentUser || 'Système' };
    updateBoite(updatedBoite);
    setSelectedBoite(updatedBoite);
    setShowEditInstrument(false);
    setInstrumentToEdit(null);
  };

  const handleReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoite || !instrumentToReplace) return;

    const updatedInstruments = selectedBoite.instruments.map(i => {
      if (i.id === instrumentToReplace.id) {
        return { ...i, serialNumber: newSerialNumber, status: 'Good' as const, lastUpdatedBy: state.currentUser || 'Système' };
      }
      return i;
    });

    const updatedBoite = { ...selectedBoite, instruments: updatedInstruments, lastUpdatedBy: state.currentUser || 'Système' };
    updateBoite(updatedBoite);
    setSelectedBoite(updatedBoite);

    addRapport({
      id: `r${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: `Remplacement d'instrument: ${instrumentToReplace.name}`,
      content: `L'instrument "${instrumentToReplace.name}" dans la boîte "${selectedBoite.name}" a été remplacé.\nAncien numéro de série: ${instrumentToReplace.serialNumber || 'Aucun'}\nNouveau numéro de série: ${newSerialNumber || 'Aucun'}`,
      type: 'Report'
    });

    setShowReplace(false);
    setInstrumentToReplace(null);
    setNewSerialNumber('');
  };

  if (selectedBoite) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedBoite(null)}
          className="flex items-center text-teal-600 hover:text-teal-800 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux boîtes
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{selectedBoite.name}</h2>
              <div className="flex items-center mt-2 gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedBoite.status)}`}>
                  État Général: {selectedBoite.status}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2 bg-slate-50 p-3 sm:p-2 rounded-xl border border-slate-100">
              <span className="text-xs sm:text-sm font-medium text-slate-500 mr-0 sm:mr-2 uppercase tracking-wide">Modifier l'état:</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => handleStatusChange('Good')} 
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${selectedBoite.status === 'Good' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50'}`}
                >
                  Bon
                </button>
                <button 
                  onClick={() => handleStatusChange('Fair')} 
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${selectedBoite.status === 'Fair' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50'}`}
                >
                  Moyen
                </button>
                <button 
                  onClick={() => handleStatusChange('Bad')} 
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${selectedBoite.status === 'Bad' ? 'bg-red-500 text-white shadow-sm' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'}`}
                >
                  Mauvais
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b pb-4">
            <div className="flex items-center gap-4 w-full justify-between sm:justify-start">
              <h3 className="text-lg font-semibold text-slate-800 shrink-0">Instrumentation ({selectedBoite.instruments.length})</h3>
              {state.currentUser === 'Fatihi Anas' && selectedBoite.instruments.length > 0 && (
                <button
                  onClick={selectAllInstruments}
                  className="text-xs sm:text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors shrink-0"
                >
                  {selectedInstrumentsForAction.length === selectedBoite.instruments.length ? 'Désélectionner' : 'Sélectionner tout'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {state.currentUser === 'Fatihi Anas' && selectedInstrumentsForAction.length > 0 && (
                <>
                  <button 
                    onClick={() => setShowPasteModal(true)} 
                    className="flex-1 sm:flex-none flex items-center justify-center text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
                    title="Copier vers une autre boîte"
                  >
                    <Copy className="h-4 w-4 mr-1.5" /> Copier ({selectedInstrumentsForAction.length})
                  </button>
                  <button 
                    onClick={handleDeleteSelected} 
                    className="flex-1 sm:flex-none flex items-center justify-center text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                    title="Supprimer la sélection"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" /> Supprimer ({selectedInstrumentsForAction.length})
                  </button>
                </>
              )}
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button 
                  onClick={startVerification} 
                  className="flex-1 sm:flex-none flex items-center justify-center text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                  title="Scanner pour vérifier la boîte"
                >
                  <ClipboardCheck className="h-4 w-4 mr-1.5" /> Vérifier
                </button>
                <button 
                    onClick={downloadPDF} 
                    className="flex-1 sm:flex-none flex items-center justify-center text-xs sm:text-sm text-purple-600 hover:text-purple-800 font-medium bg-purple-50 px-3 py-1.5 rounded-lg transition-colors border border-purple-100"
                    title="Télécharger la fiche"
                >
                    <FileDown className="h-4 w-4 mr-1.5" /> Fiche
                </button>
                <button 
                  onClick={() => {
                    setNewInstrument({ name: '', serialNumber: '', imageUrl: '' });
                    setShowAddInstrument(true);
                  }} 
                  className="flex-1 sm:flex-none flex items-center justify-center text-xs sm:text-sm text-teal-600 hover:text-teal-800 font-medium bg-teal-50 px-3 py-1.5 rounded-lg transition-colors border border-teal-100"
                  title="Ajouter un instrument manuellement"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Ajouter
                </button>
              </div>
            </div>
          </div>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={selectedBoite.instruments.map(i => i.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedBoite.instruments.map((inst) => {
                  const isChecked = currentChecklist.includes(inst.id);
                  return (
                    <SortableInstrument
                      key={inst.id}
                      inst={inst}
                      isChecked={isChecked}
                      getStatusColor={getStatusColor}
                      setSelectedInstrument={setSelectedInstrument}
                      setInstrumentToEdit={setInstrumentToEdit}
                      setShowEditInstrument={setShowEditInstrument}
                      setInstrumentToReplace={setInstrumentToReplace}
                      setShowReplace={setShowReplace}
                      state={state}
                      updateBoite={updateBoite}
                      selectedBoite={selectedBoite}
                      setSelectedBoite={setSelectedBoite}
                      isSelectedForAction={selectedInstrumentsForAction.includes(inst.id)}
                      onToggleSelection={toggleInstrumentSelection}
                      setShowPasteModal={setShowPasteModal}
                    />
                  );
                })}
                {selectedBoite.instruments.length === 0 && (
                  <div className="col-span-full py-8 text-center text-slate-500 italic">
                    Aucun instrument dans cette boîte.
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
          
          {showChecklist && (
            <div ref={checklistRef} className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-emerald-800">Vérification en cours</h4>
                  <p className="text-sm text-emerald-600">{currentChecklist.length} / {selectedBoite.instruments.length} instruments vérifiés</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setScannerMode('verify');
                      setShowScanner(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Camera className="h-4 w-4 mr-2" /> Continuer le scan
                  </button>
                  <button
                    onClick={() => {
                      addChecklist({
                        id: `chk${Date.now()}`,
                        date: new Date().toISOString(),
                        boiteId: selectedBoite.id,
                        scannedItems: currentChecklist.map(id => ({ instrumentId: id, timestamp: new Date().toISOString() })),
                        author: state.currentUser || 'Système'
                      });

                      addRapport({
                        id: `chk-log-${Date.now()}`,
                        date: new Date().toISOString().split('T')[0],
                        title: `Vérification: ${selectedBoite.name}`,
                        content: `Vérification effectuée: ${currentChecklist.length} / ${selectedBoite.instruments.length} instruments présents.`,
                        type: 'Instruction',
                        author: state.currentUser || 'Système'
                      });
                      
                      if (currentChecklist.length === selectedBoite.instruments.length) {
                        addRapport({
                          id: `r${Date.now()}`,
                          date: new Date().toISOString().split('T')[0],
                          title: `STATUS: BOITE COMPLETE`,
                          content: `Boite Name: ${selectedBoite.name}\nVerification: All instruments (Copied from Master List) are verified.`,
                          type: 'Instruction'
                        });
                      }
                      
                      setCurrentChecklist([]);
                      setShowChecklist(false);
                      alert('Vérification enregistrée avec succès !');
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Terminer la vérification
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-emerald-200 overflow-x-auto shadow-inner">
                <table className="min-w-full divide-y divide-emerald-200">
                  <thead className="bg-emerald-100/50">
                    <tr>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-widest">Status</th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-widest">Instrument</th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-widest">S/N</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-emerald-100">
                    {selectedBoite.instruments.map((inst: any) => {
                      const isChecked = currentChecklist.includes(inst.id);
                      return (
                        <tr 
                          key={inst.id} 
                          className={`${isChecked ? 'bg-emerald-50/50' : 'hover:bg-slate-50 cursor-pointer'} transition-colors`}
                          onClick={() => {
                            setCurrentChecklist(prev => 
                              prev.includes(inst.id) ? prev.filter(id => id !== inst.id) : [...prev, inst.id]
                            );
                          }}
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-center sm:text-left">
                            {isChecked ? (
                              <span className="text-emerald-600 font-bold">✓</span>
                            ) : (
                              <span className="text-slate-300 font-bold">○</span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 font-medium">
                            {inst.name}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-[10px] sm:text-sm text-slate-500 font-mono">
                            {inst.serialNumber || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Image Modal */}
        <AnimatePresence>
          {selectedInstrument && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 z-10">
                  <h3 className="font-bold text-lg text-slate-900">{selectedInstrument.name}</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setImageZoom(z => Math.max(0.5, z - 0.25))} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors" title="Zoom arrière">
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-medium w-12 text-center">{Math.round(imageZoom * 100)}%</span>
                    <button onClick={() => setImageZoom(z => Math.min(3, z + 0.25))} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors" title="Zoom avant">
                      <Plus className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => { setSelectedInstrument(null); setImageZoom(1); }}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors ml-4"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-slate-100 p-4 flex items-center justify-center relative min-h-[50vh]">
                  {selectedInstrument.imageUrl && selectedInstrument.imageUrl.trim() !== '' ? (
                    <div className="overflow-auto w-full h-full flex items-center justify-center">
                      <img
                        src={selectedInstrument.imageUrl}
                        alt={selectedInstrument.name}
                        className="transition-transform duration-200 origin-center object-contain max-w-full max-h-full"
                        style={{ transform: `scale(${imageZoom})` }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-slate-100 flex items-center justify-center rounded-lg border border-slate-200">
                      <ImageIcon className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-white z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-mono">
                      {selectedInstrument.serialNumber ? `SN: ${selectedInstrument.serialNumber}` : 'Sans numéro de série'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedInstrument.status)}`}>
                      État: {selectedInstrument.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Instrument Modal */}
        <AnimatePresence>
          {showAddInstrument && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-900">Nouvel Instrument</h3>
                  <button onClick={() => setShowAddInstrument(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleAddInstrumentSubmit} className="p-4 space-y-4">
                  <div className="bg-teal-50 p-3 rounded-xl border border-teal-100 flex items-center justify-between">
                    <span className="text-sm text-teal-800 font-medium">Remplissage automatique</span>
                    <button
                      type="button"
                      onClick={() => {
                        setScannerMode('add');
                        setShowScanner(true);
                        setShowAddInstrument(false); // Hide this modal while scanning
                      }}
                      className="flex items-center text-sm bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <Camera className="h-4 w-4 mr-2" /> Scanner avec l'IA
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'instrument</label>
                    <input
                      type="text"
                      required
                      value={newInstrument.name}
                      onChange={(e) => setNewInstrument({ ...newInstrument, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de série (Optionnel)</label>
                    <input
                      type="text"
                      value={newInstrument.serialNumber}
                      onChange={(e) => setNewInstrument({ ...newInstrument, serialNumber: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image de l'instrument</label>
                    <div className="space-y-3">
                      <input
                        type="url"
                        value={newInstrument.imageUrl}
                        onChange={(e) => setNewInstrument({ ...newInstrument, imageUrl: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="URL de l'image (https://...)"
                      />
                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-slate-500 text-center">ou</span>
                        <div className="flex gap-2">
                          <label className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl cursor-pointer transition-colors border border-slate-200 border-dashed">
                            <Upload className="h-4 w-4" />
                            <span className="text-sm font-medium">Télécharger</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setNewInstrument({ ...newInstrument, imageUrl: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                          <label className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl cursor-pointer transition-colors border border-slate-200 border-dashed">
                            <Camera className="h-4 w-4" />
                            <span className="text-sm font-medium">Prendre photo</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment"
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setNewInstrument({ ...newInstrument, imageUrl: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddInstrument(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors">Ajouter</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Instrument Modal */}
        <AnimatePresence>
          {showEditInstrument && instrumentToEdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-900">Éditer l'Instrument</h3>
                  <button onClick={() => { setShowEditInstrument(false); setInstrumentToEdit(null); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleEditInstrumentSubmit} className="p-4 space-y-4">
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                    <span className="text-sm text-blue-800 font-medium">Mettre à jour avec l'IA</span>
                    <button
                      type="button"
                      onClick={() => {
                        setScannerMode('edit');
                        setShowScanner(true);
                        setShowEditInstrument(false); // Hide this modal while scanning
                      }}
                      className="flex items-center text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="h-4 w-4 mr-2" /> Scanner
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'instrument</label>
                    <input
                      type="text"
                      required
                      value={instrumentToEdit.name}
                      onChange={(e) => setInstrumentToEdit({ ...instrumentToEdit, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de série (Optionnel)</label>
                    <input
                      type="text"
                      value={instrumentToEdit.serialNumber}
                      onChange={(e) => setInstrumentToEdit({ ...instrumentToEdit, serialNumber: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image de l'instrument</label>
                    <div className="space-y-3">
                      <input
                        type="url"
                        value={instrumentToEdit.imageUrl}
                        onChange={(e) => setInstrumentToEdit({ ...instrumentToEdit, imageUrl: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="URL de l'image (https://...)"
                      />
                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-slate-500 text-center">ou</span>
                        <div className="flex gap-2">
                          <label className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl cursor-pointer transition-colors border border-slate-200 border-dashed">
                            <Upload className="h-4 w-4" />
                            <span className="text-sm font-medium">Télécharger</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setInstrumentToEdit({ ...instrumentToEdit, imageUrl: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                          <label className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl cursor-pointer transition-colors border border-slate-200 border-dashed">
                            <Camera className="h-4 w-4" />
                            <span className="text-sm font-medium">Prendre photo</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment"
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setInstrumentToEdit({ ...instrumentToEdit, imageUrl: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => { setShowEditInstrument(false); setInstrumentToEdit(null); }} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Enregistrer</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Replace Instrument Modal */}
        <AnimatePresence>
          {showReplace && instrumentToReplace && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-900">Remplacer l'instrument</h3>
                  <button onClick={() => setShowReplace(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleReplaceSubmit} className="p-4 space-y-4">
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <p className="text-sm text-amber-800">
                      Vous allez remplacer <strong>{instrumentToReplace.name}</strong> (Ancien SN: {instrumentToReplace.serialNumber}).
                      Un rapport sera généré automatiquement.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau Numéro de série (Optionnel)</label>
                    <input
                      type="text"
                      value={newSerialNumber}
                      onChange={(e) => setNewSerialNumber(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Entrez le nouveau SN..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowReplace(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors">Confirmer le remplacement</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Scanner */}
        <AnimatePresence>
          {showScanner && (
            <CameraScanner
              mode={scannerMode}
              expectedInstruments={selectedBoite.instruments.map(i => ({ id: i.id, name: i.name }))}
              onClose={() => setShowScanner(false)}
              onScan={(result, imageUrl) => {
                if (result.includes("Error scanning")) {
                  alert(result);
                  return;
                }

                if (scannerMode === 'verify') {
                  // Try to find the instrument by name in the current boite
                  const matchedInstrument = selectedBoite.instruments.find(i => 
                    i.name.toLowerCase().includes(result.toLowerCase()) || 
                    result.toLowerCase().includes(i.name.toLowerCase())
                  );
                  
                  if (matchedInstrument) {
                    let newChecklist = currentChecklist;
                    if (!currentChecklist.includes(matchedInstrument.id)) {
                      newChecklist = [...currentChecklist, matchedInstrument.id];
                      setCurrentChecklist(newChecklist);
                    }
                    
                    if (newChecklist.length === selectedBoite.instruments.length) {
                      addChecklist({
                        id: `chk${Date.now()}`,
                        date: new Date().toISOString(),
                        boiteId: selectedBoite.id,
                        scannedItems: newChecklist.map(id => ({ instrumentId: id, timestamp: new Date().toISOString() })),
                        author: state.currentUser || 'Système'
                      });
                      
                      addRapport({
                        id: `r${Date.now()}`,
                        date: new Date().toISOString().split('T')[0],
                        title: `STATUS: BOITE COMPLETE`,
                        content: `Boite Name: ${selectedBoite.name}\nVerification: All instruments (Copied from Master List) are verified.`,
                        type: 'Instruction'
                      });
                      
                      setCurrentChecklist([]);
                      setShowChecklist(false);
                      alert(`Instrument vérifié : ${matchedInstrument.name}\n\nBOÎTE COMPLÈTE ! Rapport généré automatiquement.`);
                    } else {
                      alert(`Instrument vérifié : ${matchedInstrument.name}`);
                    }
                  } else {
                    alert(`Instrument scanné (${result}) non reconnu dans cette boîte.`);
                  }
                } else if (scannerMode === 'add') {
                  setNewInstrument({
                    name: result,
                    serialNumber: '',
                    imageUrl: imageUrl
                  });
                  setShowScanner(false);
                  setShowAddInstrument(true);
                } else if (scannerMode === 'edit' && instrumentToEdit) {
                  setInstrumentToEdit({
                    ...instrumentToEdit,
                    name: result,
                    imageUrl: imageUrl
                  });
                  setShowScanner(false);
                  setShowEditInstrument(true);
                }
              }}
            />
          )}
        </AnimatePresence>

        {/* Paste to Boite Modal */}
        <AnimatePresence>
          {showPasteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-900">Copier vers une boîte</h3>
                  <button onClick={() => setShowPasteModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sélectionnez la boîte de destination</label>
                    <select
                      value={targetBoiteId}
                      onChange={(e) => setTargetBoiteId(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">-- Choisir une boîte --</option>
                      {state.boites.filter(b => b.id !== selectedBoite?.id).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowPasteModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                    <button 
                      type="button" 
                      onClick={handlePasteToBoite}
                      disabled={!targetBoiteId}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Copier
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Boîtes et Instrumentation</h1>
        <div className="flex w-full sm:w-auto gap-3 flex-wrap sm:flex-nowrap">
          <select 
            value={searchType} 
            onChange={(e) => setSearchType(e.target.value as any)} 
            className="border border-slate-300 rounded-xl px-3 py-2 bg-white text-sm focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-700 font-medium"
          >
             <option value="all">Tout rechercher</option>
             <option value="boites">Boîtes/Tambours</option>
             <option value="instruments">Instruments seuls</option>
          </select>
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={searchType === 'boites' ? "Rechercher une boîte..." : searchType === 'instruments' ? "Rechercher un instrument..." : "Rechercher une boîte ou instrument..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors"
            />
          </div>
          <button
            onClick={() => setShowAddBoite(true)}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-sm transition-colors"
          >
            <Plus className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Nouvelle</span>
          </button>
        </div>
      </div>

      {searchType === 'instruments' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             {matchedInstruments.map(inst => (
                <button key={inst.id} onClick={() => { const b = state.boites.find(b => b.id === inst.boiteId); if(b) setSelectedBoite(b); }} className="w-full flex justify-between items-center p-4 hover:bg-slate-50 border-b last:border-b-0 transition text-left">
                  <div className="flex items-center gap-4">
                     {inst.imageUrl ? <img src={inst.imageUrl} alt={inst.name} className="w-12 h-12 object-cover rounded-lg" /> : <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs text-center font-medium">N/A</div>}
                     <div>
                        <p className="font-bold text-slate-900">{inst.name}</p>
                        <p className="text-sm text-slate-500">Boîte: {inst.boiteName} • Réf: {inst.serialNumber || '-'}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(inst.status)}`}>{inst.status}</span>
                     <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </button>
             ))}
             {matchedInstruments.length === 0 && (
                <div className="p-12 text-center text-slate-500 bg-white">
                   Aucun instrument trouvé pour "{searchQuery}"
                </div>
             )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoites.map((boite) => (
            <motion.div
              key={boite.id}
              whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer transition-all"
              onClick={() => setSelectedBoite(boite)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{boite.name}</h3>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(boite.status)}`}>
                    {boite.status}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-slate-500 mb-6">
                  {boite.type === 'Tambour' ? (
                    <Cylinder className="h-4 w-4 mr-2" />
                  ) : (
                    <PackageOpen className="h-4 w-4 mr-2" />
                  )}
                  {boite.instruments.length} instruments
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  {boite.lastUpdatedBy ? (
                    <span className="text-xs text-slate-400">Modifié par: {boite.lastUpdatedBy}</span>
                  ) : (
                    <span></span>
                  )}
                  <div className="flex items-center gap-2">
                    {state.currentUser === 'Fatihi Anas' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBoite(boite.id);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer la boîte"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredBoites.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
              Aucune boîte trouvée pour "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Add Boite Modal */}
      <AnimatePresence>
        {showAddBoite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-900">Nouvel Élément</h3>
                <button onClick={() => setShowAddBoite(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddBoiteSubmit} className="p-4 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Type d'élément</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setNewBoiteType('Boite')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${newBoiteType === 'Boite' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                    >
                      <PackageOpen className={`h-8 w-8 ${newBoiteType === 'Boite' ? 'text-teal-600' : 'text-slate-400'}`} />
                      <span className="font-bold">Boîte</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewBoiteType('Tambour')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${newBoiteType === 'Tambour' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                    >
                      <Cylinder className={`h-8 w-8 ${newBoiteType === 'Tambour' ? 'text-teal-600' : 'text-slate-400'}`} />
                      <span className="font-bold">Tambour</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nom du {newBoiteType === 'Boite' ? 'boîte' : 'tambour'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newBoiteName}
                    onChange={(e) => setNewBoiteName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder={newBoiteType === 'Boite' ? "Ex: Boîte Orthopédie..." : "Ex: Tambour Compresses..."}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddBoite(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors">Créer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
