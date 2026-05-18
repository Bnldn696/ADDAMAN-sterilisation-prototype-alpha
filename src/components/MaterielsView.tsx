import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Materiel, AutoclaveTest, Reclamation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Wrench, Settings, AlertCircle, CheckCircle2, Plus, Calendar, X, Trash2, Edit2 } from 'lucide-react';

export const MaterielsView: React.FC = () => {
  const { state, updateMateriel, addMateriel, deleteMateriel, addRapport } = useStore();
  const [selectedMateriel, setSelectedMateriel] = useState<Materiel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showLeakTestModal, setShowLeakTestModal] = useState(false);
  const [showReclamationModal, setShowReclamationModal] = useState(false);
  const [showAddMaterielModal, setShowAddMaterielModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  
  const [newTest, setNewTest] = useState({ result: 'Pass', leakTest: 'Pass' as 'Pass' | 'Fail' | 'N/A', notes: '' });
  const [newLeakTest, setNewLeakTest] = useState({ result: 'Pass' as 'Pass' | 'Fail', value: '' });
  const [newReclamation, setNewReclamation] = useState({ description: '' });
  const [newMateriel, setNewMateriel] = useState({ name: '', type: 'Autoclave' as 'Autoclave' | 'Soudeuse' });
  const [editingDateItem, setEditingDateItem] = useState<{id: string, type: 'test' | 'bicarbonate' | 'reclamation', date: string} | null>(null);

  const filteredMateriels = state.materiels.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMateriel || !editingDateItem) return;

    const updatedMateriel = { ...selectedMateriel, lastUpdatedBy: state.currentUser || 'Système' };

    if (editingDateItem.type === 'test') {
      updatedMateriel.tests = updatedMateriel.tests.map(t => t.id === editingDateItem.id ? { ...t, date: editingDateItem.date } : t);
    } else if (editingDateItem.type === 'bicarbonate') {
      updatedMateriel.bicarbonateRecords = updatedMateriel.bicarbonateRecords?.map(b => b.id === editingDateItem.id ? { ...b, date: editingDateItem.date } : b);
    } else if (editingDateItem.type === 'reclamation') {
      updatedMateriel.reclamations = updatedMateriel.reclamations.map(r => r.id === editingDateItem.id ? { ...r, date: editingDateItem.date } : r);
    }

    updateMateriel(updatedMateriel);
    setSelectedMateriel(updatedMateriel);
    setEditingDateItem(null);
  };

  const handleDeleteItem = (id: string, type: 'test' | 'bicarbonate' | 'reclamation') => {
    if (!selectedMateriel) return;
    const updatedMateriel = { ...selectedMateriel, lastUpdatedBy: state.currentUser || 'Système' };

    if (type === 'test') {
      updatedMateriel.tests = updatedMateriel.tests.filter(t => t.id !== id);
    } else if (type === 'bicarbonate') {
      updatedMateriel.bicarbonateRecords = updatedMateriel.bicarbonateRecords?.filter(b => b.id !== id);
    } else if (type === 'reclamation') {
      updatedMateriel.reclamations = updatedMateriel.reclamations.filter(r => r.id !== id);
    }

    updateMateriel(updatedMateriel);
    setSelectedMateriel(updatedMateriel);

    addRapport({
      id: `rap-delete-item-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: `Suppression: ${selectedMateriel.name}`,
      content: `Un élément de type "${type}" a été supprimé pour le matériel "${selectedMateriel.name}".`,
      type: 'Instruction',
      author: state.currentUser || 'Système'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Maintenance': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Out of Order': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleStatusChange = (status: 'Operational' | 'Maintenance' | 'Out of Order') => {
    if (selectedMateriel) {
      const updated = { ...selectedMateriel, status, lastUpdatedBy: state.currentUser || 'Système' };
      updateMateriel(updated);
      setSelectedMateriel(updated);
      
      // Add more specific rapport for status change
      addRapport({
        id: `rap-status-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `État modifié: ${selectedMateriel.name}`,
        content: `L'état du matériel "${selectedMateriel.name}" a été changé en : ${status === 'Operational' ? 'Opérationnel' : status === 'Maintenance' ? 'En Maintenance' : 'En Panne'}.`,
        type: 'Instruction',
        author: state.currentUser || 'Système'
      });
      
      if (selectedMateriel.type === 'Autoclave' && status !== 'Operational') {
        setNewReclamation({ description: `Changement d'état vers: ${status === 'Maintenance' ? 'En Maintenance' : 'En Panne'}. ` });
        setShowReclamationModal(true);
      }
    }
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMateriel && selectedMateriel.type === 'Autoclave') {
      const test: AutoclaveTest = {
        id: `t${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        result: newTest.result as 'Pass' | 'Fail',
        leakTest: 'N/A', // Forced N/A for Bowie-Dick section
        notes: newTest.notes,
        author: state.currentUser || 'Système',
      };
      const updated = {
        ...selectedMateriel,
        tests: [test, ...(selectedMateriel.tests || [])],
        lastUpdatedBy: state.currentUser || 'Système'
      };
      updateMateriel(updated);
      setSelectedMateriel(updated);

      addRapport({
        id: `rap${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Test Bowie-Dick ${test.result === 'Pass' ? 'RÉUSSI' : 'ÉCHOUÉ'}: ${selectedMateriel.name}`,
        content: `Test Bowie-Dick effectué pour ${selectedMateriel.name}.\nRésultat: ${test.result === 'Pass' ? 'CONFORME (Pass)' : 'NON CONFORME (Fail)'}\nNotes: ${test.notes || 'Aucune'}`,
        type: 'Report', // Changed to Report to appear in interventions
        author: state.currentUser || 'Système'
      });

      setShowTestModal(false);
      setNewTest({ result: 'Pass', leakTest: 'Pass', notes: '' });
    }
  };

  const handleAddReclamation = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMateriel) {
      const rec: Reclamation = {
        id: `r${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: newReclamation.description,
        author: state.currentUser || 'Système',
      };
      const updated = {
        ...selectedMateriel,
        reclamations: [rec, ...(selectedMateriel.reclamations || [])],
        lastUpdatedBy: state.currentUser || 'Système'
      };
      updateMateriel(updated);
      setSelectedMateriel(updated);
      
      // Automatically add to Rapports
      addRapport({
        id: `rap${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Observation: ${selectedMateriel.name}`,
        content: newReclamation.description,
        type: 'Report',
        author: state.currentUser || 'Système'
      });

      setShowReclamationModal(false);
      setNewReclamation({ description: '' });
    }
  };

  const handleAddBicarbonate = () => {
    if (selectedMateriel) {
      const record = {
        id: `b${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        author: state.currentUser || 'Système',
      };
      const updated = {
        ...selectedMateriel,
        bicarbonateRecords: [record, ...(selectedMateriel.bicarbonateRecords || [])],
        lastUpdatedBy: state.currentUser || 'Système'
      };
      updateMateriel(updated);
      setSelectedMateriel(updated);

      addRapport({
        id: `rap${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Sel Bicarbonate Ajouté: ${selectedMateriel.name}`,
        content: `Ajout de sel bicarbonate effectué pour l'autoclave "${selectedMateriel.name}" le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}.`,
        type: 'Instruction',
        author: state.currentUser || 'Système'
      });
      alert("L'ajout de sel bicarbonate a été enregistré dans les consignes et l'historique.");
    }
  };

  const handleLeakTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMateriel && selectedMateriel.type === 'Autoclave') {
      const test: AutoclaveTest = {
        id: `lt${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        result: 'Pass',
        leakTest: newLeakTest.result,
        notes: newLeakTest.value ? `Valeur: ${newLeakTest.value}` : 'Test de fuite effectué.',
        author: state.currentUser || 'Système',
      };
      
      const updated = {
        ...selectedMateriel,
        tests: [test, ...(selectedMateriel.tests || [])],
        lastUpdatedBy: state.currentUser || 'Système'
      };
      updateMateriel(updated);
      setSelectedMateriel(updated);

      addRapport({
        id: `rap${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Test de Fuite ${newLeakTest.result === 'Pass' ? 'RÉUSSI' : 'ÉCHOUÉ'}: ${selectedMateriel.name}`,
        content: `Test de fuite effectué pour "${selectedMateriel.name}".\nRésultat: ${newLeakTest.result === 'Pass' ? 'RÉUSSI' : 'ÉCHOUÉ'}\nValeur trouvée: ${newLeakTest.value || 'N/A'}`,
        type: 'Report',
        author: state.currentUser || 'Système'
      });
      
      setShowLeakTestModal(false);
      setNewLeakTest({ result: 'Pass', value: '' });
      alert("Le test de fuite a été enregistré.");
    }
  };

  const handleAddMateriel = (e: React.FormEvent) => {
    e.preventDefault();
    const materiel: Materiel = {
      id: `mat${Date.now()}`,
      name: newMateriel.name,
      type: newMateriel.type,
      status: 'Operational',
      tests: [],
      reclamations: [],
      bicarbonateRecords: [],
      lastUpdatedBy: state.currentUser || 'Système'
    };
    addMateriel(materiel);
    
    addRapport({
      id: `rap-new-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: `Nouveau Matériel: ${materiel.name}`,
      content: `Un nouveau matériel de type "${materiel.type}" a été ajouté à l'inventaire sous le nom "${materiel.name}".`,
      type: 'Instruction',
      author: state.currentUser || 'Système'
    });

    setShowAddMaterielModal(false);
    setNewMateriel({ name: '', type: 'Autoclave' });
  };

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMateriel && editedName.trim()) {
      const oldName = selectedMateriel.name;
      const updated = {
        ...selectedMateriel,
        name: editedName,
        lastUpdatedBy: state.currentUser || 'Système'
      };
      updateMateriel(updated);
      setSelectedMateriel(updated);
      
      addRapport({
        id: `rap-rename-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Matériel renommé: ${oldName}`,
        content: `Le matériel "${oldName}" a été renommé en "${editedName}".`,
        type: 'Instruction',
        author: state.currentUser || 'Système'
      });

      setIsEditingName(false);
    }
  };

  if (selectedMateriel) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedMateriel(null)}
          className="flex items-center text-teal-600 hover:text-teal-800 font-medium transition-colors"
        >
          <Wrench className="h-4 w-4 mr-2" />
          Retour aux matériels
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex-1">
              {isEditingName ? (
                <form onSubmit={handleUpdateName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-bold text-slate-900 border-b-2 border-teal-500 focus:outline-none bg-transparent"
                    autoFocus
                  />
                  <button type="submit" className="text-emerald-600 hover:text-emerald-800"><CheckCircle2 className="h-6 w-6" /></button>
                  <button type="button" onClick={() => setIsEditingName(false)} className="text-red-500 hover:text-red-700"><X className="h-6 w-6" /></button>
                </form>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedMateriel.name}</h2>
                  {state.currentUser === 'Fatihi Anas' && (
                    <button 
                      onClick={() => {
                        setEditedName(selectedMateriel.name);
                        setIsEditingName(true);
                      }}
                      className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-slate-500">{selectedMateriel.type}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {selectedMateriel.type === 'Autoclave' && (
                <>
                  <button
                    onClick={() => setShowLeakTestModal(true)}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-sm font-medium transition-colors"
                  >
                    + Faire Test de fuite
                  </button>
                  <button
                    onClick={handleAddBicarbonate}
                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm font-medium transition-colors"
                  >
                    + Ajouter Sel Bicarbonate
                  </button>
                </>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500 mr-2">Modifier l'état:</span>
                <select
                  value={selectedMateriel.status}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-teal-500 ${getStatusColor(selectedMateriel.status)}`}
                >
                  <option value="Operational">Opérationnel</option>
                  <option value="Maintenance">En Maintenance</option>
                  <option value="Out of Order">En Panne</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tests Section (Only for Autoclaves) */}
            {selectedMateriel.type === 'Autoclave' && (
              <div className="space-y-8">
                {/* Bowie-Dick Tests */}
                <div>
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-teal-600" />
                      Tests Bowie-Dick
                    </h3>
                    <button
                      onClick={() => setShowTestModal(true)}
                      className="flex items-center text-sm text-teal-600 hover:text-teal-800 font-medium bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Ajouter
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {(!selectedMateriel.tests || selectedMateriel.tests.filter(t => t.leakTest === 'N/A').length === 0) ? (
                      <p className="text-sm text-slate-500 italic">Aucun test Bowie-Dick enregistré.</p>
                    ) : (
                      selectedMateriel.tests.filter(t => t.leakTest === 'N/A').map((test) => (
                        <div key={test.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium flex items-center text-slate-700">
                                <Calendar className="h-4 w-4 mr-1 text-slate-400" /> {test.date}
                              </span>
                              {state.currentUser === 'Fatihi Anas' && (
                                <div className="flex gap-1">
                                  <button onClick={() => setEditingDateItem({id: test.id, type: 'test', date: test.date})} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"><Edit2 className="h-3 w-3" /></button>
                                  <button onClick={() => handleDeleteItem(test.id, 'test')} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 className="h-3 w-3" /></button>
                                </div>
                              )}
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${test.result === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {test.result}
                            </span>
                          </div>
                          {test.notes && <p className="text-sm text-slate-600 mt-2">{test.notes}</p>}
                          <p className="text-xs text-slate-400 mt-2 text-right">Par: {test.author || 'Système'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Leak Tests (Tests de fuite) */}
                <div>
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-emerald-600" />
                      Tests de Fuite
                    </h3>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {(!selectedMateriel.tests || selectedMateriel.tests.filter(t => t.leakTest !== 'N/A').length === 0) ? (
                      <p className="text-sm text-slate-500 italic">Aucun test de fuite enregistré.</p>
                    ) : (
                      selectedMateriel.tests.filter(t => t.leakTest !== 'N/A').map((test) => (
                        <div key={test.id} className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 shadow-sm transition-all hover:shadow-md">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium flex items-center text-slate-700">
                                <Calendar className="h-4 w-4 mr-1 text-emerald-400" /> {test.date}
                              </span>
                              {state.currentUser === 'Fatihi Anas' && (
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => {
                                      const newStatus = confirm("Le test est-il RÉUSSI ? (OK = Réussi, Annuler = Échoué)");
                                      const newNotes = prompt("Modifier la valeur/commentaire:", test.notes);
                                      if (newNotes !== null) {
                                        const updated = {
                                          ...selectedMateriel,
                                          tests: selectedMateriel.tests.map(t => t.id === test.id ? { 
                                            ...t, 
                                            leakTest: newStatus ? 'Pass' : 'Fail',
                                            notes: newNotes 
                                          } : t),
                                          lastUpdatedBy: state.currentUser || 'Système'
                                        };
                                        updateMateriel(updated);
                                        setSelectedMateriel(updated);

                                        addRapport({
                                          id: `rap-leak-edit-${Date.now()}`,
                                          date: new Date().toISOString().split('T')[0],
                                          title: `Test Fuite Modifié: ${selectedMateriel.name}`,
                                          content: `Un test de fuite pour "${selectedMateriel.name}" a été modifié.\nNouveau Résultat: ${newStatus ? 'RÉUSSI' : 'ÉCHOUÉ'}\nNouvelle Valeur: ${newNotes}`,
                                          type: 'Report',
                                          author: state.currentUser || 'Système'
                                        });
                                      }
                                    }}
                                    className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-white transition-colors shadow-sm"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button onClick={() => handleDeleteItem(test.id, 'test')} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-white transition-colors shadow-sm">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${test.leakTest === 'Pass' ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                              FUITE: {test.leakTest === 'Pass' ? 'RÉUSSI' : 'ÉCHOUÉ'}
                            </span>
                          </div>
                          {test.notes && (
                            <div className="mt-2 bg-white/50 p-2 rounded-lg text-sm text-slate-700 border border-emerald-50 italic">
                                {test.notes}
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-2 text-right">Par: {test.author || 'Système'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bicarbonate Records Section (Only for Autoclaves) */}
            {selectedMateriel.type === 'Autoclave' && (
              <div>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                    <Wrench className="h-5 w-5 mr-2 text-blue-500" />
                    Sel Bicarbonate
                  </h3>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {(!selectedMateriel.bicarbonateRecords || selectedMateriel.bicarbonateRecords.length === 0) ? (
                    <p className="text-sm text-slate-500 italic">Aucun ajout enregistré.</p>
                  ) : (
                    selectedMateriel.bicarbonateRecords.map((record) => (
                      <div key={record.id} className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium flex items-center text-slate-700">
                              <Calendar className="h-4 w-4 mr-1 text-slate-400" /> {record.date}
                            </div>
                            {state.currentUser === 'Fatihi Anas' && (
                              <div className="flex gap-1">
                                <button onClick={() => setEditingDateItem({id: record.id, type: 'bicarbonate', date: record.date})} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"><Edit2 className="h-3 w-3" /></button>
                                <button onClick={() => handleDeleteItem(record.id, 'bicarbonate')} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 className="h-3 w-3" /></button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-700">Ajout de sel bicarbonate</p>
                        <p className="text-xs text-slate-400 mt-2 text-right">Par: {record.author || 'Système'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Observations Section */}
            <div className={selectedMateriel.type !== 'Autoclave' ? 'col-span-full' : ''}>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                  Observations
                </h3>
                <button
                  onClick={() => setShowReclamationModal(true)}
                  className="flex items-center text-sm text-amber-600 hover:text-amber-800 font-medium bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" /> Ajouter
                </button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {(!selectedMateriel.reclamations || selectedMateriel.reclamations.length === 0) ? (
                  <p className="text-sm text-slate-500 italic">Aucune observation.</p>
                ) : (
                  selectedMateriel.reclamations.map((rec) => (
                    <div key={rec.id} className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium flex items-center text-slate-700">
                              <Calendar className="h-4 w-4 mr-1 text-slate-400" /> {rec.date}
                            </div>
                            {state.currentUser === 'Fatihi Anas' && (
                              <div className="flex gap-1">
                                <button onClick={() => setEditingDateItem({id: rec.id, type: 'reclamation', date: rec.date})} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"><Edit2 className="h-3 w-3" /></button>
                                <button onClick={() => handleDeleteItem(rec.id, 'reclamation')} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 className="h-3 w-3" /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      <p className="text-sm text-slate-700">{rec.description}</p>
                      <p className="text-xs text-slate-400 mt-2 text-right">Par: {rec.author || 'Système'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Test Modal */}
        <AnimatePresence>
          {showTestModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-900">Nouveau Test Bowie-Dick</h3>
                  <button onClick={() => setShowTestModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleAddTest} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Résultat Bowie-Dick</label>
                    <select
                      value={newTest.result}
                      onChange={(e) => setNewTest({ ...newTest, result: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="Pass">Conforme (Pass)</option>
                      <option value="Fail">Non Conforme (Fail)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Commentaire (Optionnel)</label>
                    <textarea
                      value={newTest.notes}
                      onChange={(e) => setNewTest({ ...newTest, notes: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                      rows={3}
                      placeholder="Détails du test..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowTestModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors">Enregistrer</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Leak Test Modal */}
        <AnimatePresence>
          {showLeakTestModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-900">Nouveau Test de Fuite</h3>
                  <button onClick={() => setShowLeakTestModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleLeakTestSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Résultat du test</label>
                    <select
                      value={newLeakTest.result}
                      onChange={(e) => setNewLeakTest({ ...newLeakTest, result: e.target.value as 'Pass' | 'Fail' })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      <option value="Pass">RÉUSSI (Conforme)</option>
                      <option value="Fail">ÉCHOUÉ (Non conforme)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valeur trouvée / Commentaire</label>
                    <input
                      type="text"
                      required
                      value={newLeakTest.value}
                      onChange={(e) => setNewLeakTest({ ...newLeakTest, value: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="ex: -1.3 bar ou OK"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowLeakTestModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm">Enregistrer</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Reclamation Modal */}
        <AnimatePresence>
          {showReclamationModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-900">Nouvelle Observation</h3>
                  <button onClick={() => setShowReclamationModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleAddReclamation} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description du problème</label>
                    <textarea
                      required
                      value={newReclamation.description}
                      onChange={(e) => setNewReclamation({ description: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                      rows={4}
                      placeholder="Décrivez le problème rencontré..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowReclamationModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors">Ajouter</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Edit Date Modal */}
        <AnimatePresence>
          {editingDateItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-lg text-slate-900">Modifier la date</h3>
                  <button onClick={() => setEditingDateItem(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleEditDateSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={editingDateItem.date}
                      onChange={(e) => setEditingDateItem({ ...editingDateItem, date: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setEditingDateItem(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors">Enregistrer</button>
                  </div>
                </form>
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
        <h1 className="text-2xl font-bold text-slate-900">Matériels</h1>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <button
            onClick={() => setShowAddMaterielModal(true)}
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Nouveau Matériel
          </button>
          <div className="relative flex-1 sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMateriels.map((materiel) => (
          <motion.div
            key={materiel.id}
            whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer transition-all"
            onClick={() => setSelectedMateriel(materiel)}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="bg-slate-100 p-2 rounded-lg mr-3">
                    {materiel.type === 'Autoclave' ? <Settings className="h-5 w-5 text-slate-600" /> : <Wrench className="h-5 w-5 text-slate-600" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{materiel.name}</h3>
                    <p className="text-xs text-slate-500">{materiel.type}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(materiel.status)}`}>
                  {materiel.status}
                </span>
                <div className="flex gap-2 items-center">
                  {materiel.reclamations && materiel.reclamations.length > 0 && (
                    <span className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                      <AlertCircle className="h-3 w-3 mr-1" /> {materiel.reclamations.length}
                    </span>
                  )}
                  {materiel.type === 'Autoclave' && materiel.tests && materiel.tests.length > 0 && (
                    <span className="flex items-center text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> {materiel.tests.length}
                    </span>
                  )}
                  {state.currentUser === 'Fatihi Anas' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Supprimer définitivement ${materiel.name} ?`)) {
                          deleteMateriel(materiel.id);
                          addRapport({
                            id: `rap-del-mat-${Date.now()}`,
                            date: new Date().toISOString().split('T')[0],
                            title: `Matériel supprimé: ${materiel.name}`,
                            content: `Le matériel "${materiel.name}" (${materiel.type}) a été retiré de l'inventaire.`,
                            type: 'Instruction',
                            author: state.currentUser || 'Système'
                          });
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {materiel.lastUpdatedBy && (
                <div className="mt-3 text-[10px] text-slate-400 text-right">
                  Modifié par: {materiel.lastUpdatedBy}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {filteredMateriels.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
            Aucun matériel trouvé pour "{searchQuery}"
          </div>
        )}
      </div>

      {/* Add Materiel Modal */}
      <AnimatePresence>
        {showAddMaterielModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-900">Nouveau Matériel</h3>
                <button onClick={() => setShowAddMaterielModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddMateriel} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Désignation</label>
                  <input
                    type="text"
                    required
                    value={newMateriel.name}
                    onChange={(e) => setNewMateriel({ ...newMateriel, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Nom du matériel (ex: Sterilmed 3)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={newMateriel.type}
                    onChange={(e) => setNewMateriel({ ...newMateriel, type: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  >
                    <option value="Autoclave">Autoclave</option>
                    <option value="Soudeuse">Soudeuse</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddMaterielModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors">Ajouter</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
