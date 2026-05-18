import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Consomable } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Syringe, Plus, Minus, AlertTriangle, X, Trash2, Edit2 } from 'lucide-react';

export const ConsomablesView: React.FC = () => {
  const { state, updateConsomable, addConsomable, deleteConsomable, addNotification } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedItemForUsage, setSelectedItemForUsage] = useState<Consomable | null>(null);
  const [usageAmount, setUsageAmount] = useState(0);
  const [usageType, setUsageType] = useState<'add' | 'remove'>('remove');
  const [newConsomable, setNewConsomable] = useState({
    name: '',
    quantity: 0,
    unit: 'unités',
    minThreshold: 10
  });
  const [editingConsomable, setEditingConsomable] = useState<Consomable | null>(null);

  const filteredConsomables = state.consomables.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuantityChange = (consomable: Consomable, amount: number) => {
    const newQuantity = Math.max(0, consomable.quantity + amount);
    updateConsomable({ ...consomable, quantity: newQuantity, lastUpdatedBy: state.currentUser || 'Système' });

    if (newQuantity <= consomable.minThreshold && consomable.quantity > consomable.minThreshold) {
      // Trigger notification when stock drops below threshold
      addNotification({
        id: `notif${Date.now()}`,
        message: `Le stock de ${consomable.name} est bas (${newQuantity} ${consomable.unit}).`,
        date: new Date().toISOString(),
        read: false
      });
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addConsomable({
      id: `c${Date.now()}`,
      name: newConsomable.name,
      quantity: newConsomable.quantity,
      unit: newConsomable.unit,
      minThreshold: newConsomable.minThreshold,
      lastUpdatedBy: state.currentUser || 'Système'
    });
    setShowAddModal(false);
    setNewConsomable({ name: '', quantity: 0, unit: 'unités', minThreshold: 10 });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConsomable) return;
    updateConsomable({
      ...editingConsomable,
      lastUpdatedBy: state.currentUser || 'Système'
    });
    setEditingConsomable(null);
  };

  const handleUsageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForUsage) return;

    const amount = usageType === 'add' ? usageAmount : -usageAmount;
    handleQuantityChange(selectedItemForUsage, amount);
    
    setShowUsageModal(false);
    setSelectedItemForUsage(null);
    setUsageAmount(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Consommables</h1>
        <div className="flex w-full sm:w-auto gap-3">
          <div className="relative flex-1 sm:w-64">
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
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-sm transition-colors"
          >
            <Plus className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Nouveau</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Article
                </th>
                <th scope="col" className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Stock
                </th>
                <th scope="col" className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest ">
                  <span className="hidden sm:inline">État</span>
                </th>
                <th scope="col" className="px-4 sm:px-6 py-4 text-right text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredConsomables.map((item) => {
                const isLowStock = item.quantity <= item.minThreshold;
                return (
                  <motion.tr key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Syringe className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-xs sm:text-sm font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] sm:text-xs text-slate-500">Min: {item.minThreshold} {item.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm sm:text-lg font-black text-slate-900">
                        {item.quantity} <span className="text-[10px] sm:text-xs font-normal text-slate-400">{item.unit}</span>
                      </div>
                      {item.lastUpdatedBy && (
                        <div className="text-[9px] sm:text-xs text-slate-400 mt-0.5">Par: {item.lastUpdatedBy}</div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {isLowStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] sm:text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                          <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Critique
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleQuantityChange(item, -10)}
                          className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-200 shadow-sm active:scale-90"
                          title="Retirer 10"
                        >
                          <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => handleQuantityChange(item, 10)}
                          className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-slate-200 shadow-sm active:scale-90"
                          title="Ajouter 10"
                        >
                          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItemForUsage(item);
                            setUsageType('remove');
                            setUsageAmount(0);
                            setShowUsageModal(true);
                          }}
                          className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-200 shadow-sm active:scale-90"
                          title="Saisir utilisation"
                        >
                          <Syringe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        {state.currentUser === 'Fatihi Anas' && (
                          <>
                            <button
                              onClick={() => setEditingConsomable(item)}
                              className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-200 shadow-sm active:scale-90"
                              title="Modifier"
                            >
                              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {filteredConsomables.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Aucun consommable trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Consomable Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-900">Nouveau Consommable</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'article</label>
                  <input
                    type="text"
                    required
                    value={newConsomable.name}
                    onChange={(e) => setNewConsomable({ ...newConsomable, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Ex: Compresses stériles"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantité initiale</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newConsomable.quantity}
                      onChange={(e) => setNewConsomable({ ...newConsomable, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unité</label>
                    <input
                      type="text"
                      required
                      value={newConsomable.unit}
                      onChange={(e) => setNewConsomable({ ...newConsomable, unit: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Ex: unités, boîtes..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seuil minimal (Alerte stock)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newConsomable.minThreshold}
                    onChange={(e) => setNewConsomable({ ...newConsomable, minThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Une alerte sera affichée si la quantité descend en dessous de ce seuil.</p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors">Ajouter</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Edit Consomable Modal */}
      <AnimatePresence>
        {editingConsomable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-900">Modifier Consommable</h3>
                <button onClick={() => setEditingConsomable(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'article</label>
                  <input
                    type="text"
                    required
                    value={editingConsomable.name}
                    onChange={(e) => setEditingConsomable({ ...editingConsomable, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Ex: Compresses stériles"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantité</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingConsomable.quantity}
                      onChange={(e) => setEditingConsomable({ ...editingConsomable, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unité</label>
                    <input
                      type="text"
                      required
                      value={editingConsomable.unit}
                      onChange={(e) => setEditingConsomable({ ...editingConsomable, unit: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Ex: unités, boîtes..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seuil minimal (Alerte stock)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingConsomable.minThreshold}
                    onChange={(e) => setEditingConsomable({ ...editingConsomable, minThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingConsomable(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-teal-200"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Usage Modal */}
      <AnimatePresence>
        {showUsageModal && selectedItemForUsage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-900">Saisir utilisation</h3>
                <button onClick={() => setShowUsageModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleUsageSubmit} className="p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Article: <span className="font-bold text-slate-900">{selectedItemForUsage.name}</span></p>
                  <p className="text-xs text-slate-500 mb-4">Stock actuel: {selectedItemForUsage.quantity} {selectedItemForUsage.unit}</p>
                  
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setUsageType('remove')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${usageType === 'remove' ? 'bg-red-100 text-red-700 border-2 border-red-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      Utiliser (Retirer)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsageType('add')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${usageType === 'add' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      Ajouter au stock
                    </button>
                  </div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quantité à {usageType === 'remove' ? 'retirer' : 'ajouter'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max={usageType === 'remove' ? selectedItemForUsage.quantity : undefined}
                      value={usageAmount || ''}
                      onChange={(e) => setUsageAmount(parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-16 focus:ring-teal-500 focus:border-teal-500 text-lg"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">{selectedItemForUsage.unit}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowUsageModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors">Confirmer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
