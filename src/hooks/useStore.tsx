import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Boite, Materiel, Consomable, Rapport, Checklist, Notification, ReformeItem, BoiteExterne } from '../types';
import { initialData } from '../data/mockData';

interface StoreContextType {
  state: AppState;
  updateBoite: (boite: Boite) => void;
  addBoite: (boite: Boite) => void;
  updateMateriel: (materiel: Materiel) => void;
  addMateriel: (materiel: Materiel) => void;
  updateConsomable: (consomable: Consomable) => void;
  addConsomable: (consomable: Consomable) => void;
  addRapport: (rapport: Rapport) => void;
  updateRapport: (rapport: Rapport) => void;
  addBoiteExterne: (boite: BoiteExterne) => void;
  updateBoiteExterne: (boite: BoiteExterne) => void;
  addChecklist: (checklist: Checklist) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  deleteBoite: (id: string) => void;
  deleteMateriel: (id: string) => void;
  deleteConsomable: (id: string) => void;
  deleteRapport: (id: string) => void;
  addReforme: (reforme: ReformeItem) => void;
  updateReforme: (reforme: ReformeItem) => void;
  deleteReforme: (id: string) => void;
  resetData: () => void;
  login: (password: string) => boolean;
  logout: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    // Changed key to v5 to force reload with new initial data
    const saved = localStorage.getItem('addaman_sterilization_data_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.checklists) parsed.checklists = [];
        if (!parsed.reformes) parsed.reformes = [];
        if (parsed.currentUser === undefined) parsed.currentUser = null;
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return { ...initialData, reformes: [] };
  });

  useEffect(() => {
    try {
      localStorage.setItem('addaman_sterilization_data_v5', JSON.stringify(state));
    } catch (e) {
      console.error('Save error', e);
      // Create a non-blocking UI alert instead of window.alert to prevent PWA crashes
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.backgroundColor = '#ef4444';
      toast.style.color = '#fff';
      toast.style.padding = '12px 24px';
      toast.style.borderRadius = '8px';
      toast.style.zIndex = '9999';
      toast.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      toast.style.fontWeight = 'bold';
      toast.style.textAlign = 'center';
      toast.innerText = 'Erreur: Mémoire saturée. La sauvegarde a échoué. Videz des anciens rapports/photos.';
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) document.body.removeChild(toast);
      }, 5000);
    }
  }, [state]);

  const login = (password: string) => {
    let user = null;
    if (password === 'Tilk@d0ubaba') user = 'Fatihi Anas';
    else if (password === 'N@ghrif!') user = 'Naghrifi Walid';
    else if (password === '123456789') user = 'Utilisateur';

    if (user) {
      setState(prev => ({ ...prev, currentUser: user }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const updateBoite = (boite: Boite) => {
    setState((prev) => {
      const oldBoite = prev.boites.find(b => b.id === boite.id);
      let logMsg = "";
      if (oldBoite) {
        if (oldBoite.status !== boite.status) {
          logMsg = `Changement d'état de la boîte "${boite.name}": ${oldBoite.status} -> ${boite.status}.`;
        } else if (JSON.stringify(oldBoite.instruments) !== JSON.stringify(boite.instruments)) {
          // Find which instrument changed
          const changedInst = boite.instruments.find((inst, idx) => {
            const oldInst = oldBoite.instruments.find(oi => oi.id === inst.id);
            return !oldInst || oldInst.status !== inst.status || oldInst.name !== inst.name;
          });
          if (changedInst) {
            const oldInst = oldBoite.instruments.find(oi => oi.id === changedInst.id);
            if (oldInst && oldInst.status !== changedInst.status) {
              logMsg = `Changement d'état de l'instrument "${changedInst.name}" dans "${boite.name}": ${oldInst.status} -> ${changedInst.status}.`;
            } else if (!oldInst) {
              logMsg = `Nouvel instrument ajouté à "${boite.name}": "${changedInst.name}".`;
            } else {
              logMsg = `Modification de l'instrument "${changedInst.name}" dans "${boite.name}".`;
            }
          } else if (oldBoite.instruments.length > boite.instruments.length) {
            logMsg = `Un instrument a été retiré de la boîte "${boite.name}".`;
          } else {
            logMsg = `Mise à jour de la boîte "${boite.name}".`;
          }
        } else {
          logMsg = `Modification de la boîte "${boite.name}".`;
        }
      }

      const logRapport: Rapport = {
        id: `log-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Suivi Boîte: ${boite.name}`,
        content: logMsg,
        type: 'Instruction',
        author: prev.currentUser || 'Système'
      };

      return {
        ...prev,
        boites: prev.boites.map((b) => (b.id === boite.id ? boite : b)),
        rapports: [logRapport, ...prev.rapports]
      };
    });
  };

  const addBoite = (boite: Boite) => {
    setState((prev) => {
      const logRapport: Rapport = {
        id: `log-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Nouvelle Boîte: ${boite.name}`,
        content: `Ajout d'une nouvelle boîte/tambour: "${boite.name}" avec ${boite.instruments.length} instruments.`,
        type: 'Instruction',
        author: prev.currentUser || 'Système'
      };

      return {
        ...prev,
        boites: [boite, ...prev.boites],
        rapports: [logRapport, ...prev.rapports]
      };
    });
  };

  const updateMateriel = (materiel: Materiel) => {
    setState((prev) => {
      const oldMat = prev.materiels.find(m => m.id === materiel.id);
      let logMsg = "";
      const formatStatus = (s: string) => {
        if (s === 'Operational') return 'Opérationnel';
        if (s === 'Maintenance') return 'En Maintenance';
        if (s === 'Out of Order') return 'En Panne';
        return s;
      };

      if (oldMat) {
        if (oldMat.status !== materiel.status) {
          logMsg = `Changement d'état du matériel "${materiel.name}" : ${formatStatus(oldMat.status)} ➜ ${formatStatus(materiel.status)}.`;
        } else if (oldMat.name !== materiel.name) {
          logMsg = `Renommage du matériel : "${oldMat.name}" ➜ "${materiel.name}".`;
        } else {
          // Check tests
          const oldTests = oldMat.tests || [];
          const newTests = materiel.tests || [];
          if (newTests.length > oldTests.length) {
            const added = newTests.find(nt => !oldTests.some(ot => ot.id === nt.id));
            if (added) {
              if (added.leakTest !== 'N/A') {
                logMsg = `Test de fuite enregistré pour "${materiel.name}" : ${added.leakTest === 'Pass' ? 'Réussi (Pass)' : 'Échoué (Fail)'}${added.notes ? ` (${added.notes})` : ''}.`;
              } else {
                logMsg = `Test Bowie-Dick enregistré pour "${materiel.name}" : ${added.result === 'Pass' ? 'Conforme (Pass)' : 'Non Conforme (Fail)'}${added.notes ? ` (${added.notes})` : ''}.`;
              }
            } else {
              logMsg = `Ajout d'un rapport de test pour "${materiel.name}".`;
            }
          } else if (newTests.length < oldTests.length) {
            const deleted = oldTests.find(ot => !newTests.some(nt => nt.id === ot.id));
            if (deleted) {
              logMsg = `Suppression d'un ${deleted.leakTest !== 'N/A' ? 'test de fuite' : 'test Bowie-Dick'} datant du ${deleted.date} pour "${materiel.name}".`;
            } else {
              logMsg = `Suppression d'un test pour "${materiel.name}".`;
            }
          } else {
            // Check if any test was modified
            const modified = newTests.find(nt => {
              const ot = oldTests.find(o => o.id === nt.id);
              return ot && (ot.date !== nt.date || ot.result !== nt.result || ot.leakTest !== nt.leakTest || ot.notes !== nt.notes);
            });
            if (modified) {
              const original = oldTests.find(ot => ot.id === modified.id);
              if (original) {
                const changes: string[] = [];
                if (original.date !== modified.date) changes.push(`date (${original.date} ➜ ${modified.date})`);
                if (original.result !== modified.result) changes.push(`résultat BD (${original.result} ➜ ${modified.result})`);
                if (original.leakTest !== modified.leakTest) changes.push(`résultat fuite (${original.leakTest} ➜ ${modified.leakTest})`);
                if (original.notes !== modified.notes) changes.push(`notes`);
                logMsg = `Modification du ${modified.leakTest !== 'N/A' ? 'test de fuite' : 'test Bowie-Dick'} pour "${materiel.name}" : modification ${changes.join(', ')}.`;
              } else {
                logMsg = `Modification d'un test pour "${materiel.name}".`;
              }
            } else {
              // Check bicarbonateRecords
              const oldBic = oldMat.bicarbonateRecords || [];
              const newBic = materiel.bicarbonateRecords || [];
              if (newBic.length > oldBic.length) {
                const added = newBic[0];
                logMsg = `Ajout de sel bicarbonate pour l'autoclave "${materiel.name}" le ${added ? added.date : new Date().toISOString().split('T')[0]}.`;
              } else if (newBic.length < oldBic.length) {
                const deleted = oldBic.find(ob => !newBic.some(nb => nb.id === ob.id));
                logMsg = `Suppression d'un enregistrement d'ajout de sel bicarbonate datant du ${deleted ? deleted.date : ''} pour "${materiel.name}".`;
              } else {
                const modifiedBic = newBic.find(nb => {
                  const ob = oldBic.find(o => o.id === nb.id);
                  return ob && ob.date !== nb.date;
                });
                if (modifiedBic) {
                  const original = oldBic.find(ob => ob.id === modifiedBic.id);
                  logMsg = `Modification de la date de l'ajout de sel bicarbonate pour "${materiel.name}" : ${original ? original.date : ''} ➜ ${modifiedBic.date}.`;
                } else {
                  // Check reclamations
                  const oldRec = oldMat.reclamations || [];
                  const newRec = materiel.reclamations || [];
                  if (newRec.length > oldRec.length) {
                    const added = newRec.find(nr => !oldRec.some(or => or.id === nr.id));
                    logMsg = `Nouvelle observation ajoutée pour "${materiel.name}" : "${added ? added.description : ''}".`;
                  } else if (newRec.length < oldRec.length) {
                    const deleted = oldRec.find(or => !newRec.some(nr => nr.id === or.id));
                    logMsg = `Suppression de l'observation pour "${materiel.name}" : "${deleted ? deleted.description : ''}".`;
                  } else {
                    const modifiedRec = newRec.find(nr => {
                      const or = oldRec.find(o => o.id === nr.id);
                      return or && (or.date !== nr.date || or.description !== nr.description);
                    });
                    if (modifiedRec) {
                      const original = oldRec.find(or => or.id === modifiedRec.id);
                      logMsg = `Modification d'une observation pour "${materiel.name}" : "${original ? original.description : ''}" ➜ "${modifiedRec.description}" (Date: ${modifiedRec.date}).`;
                    } else {
                      logMsg = `Mise à jour des informations pour "${materiel.name}".`;
                    }
                  }
                }
              }
            }
          }
        }
      }

      const logRapport: Rapport = {
        id: `log-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Suivi Matériel: ${materiel.name}`,
        content: logMsg,
        type: 'Instruction',
        author: prev.currentUser || 'Système'
      };

      return {
        ...prev,
        materiels: prev.materiels.map((m) => (m.id === materiel.id ? materiel : m)),
        rapports: [logRapport, ...prev.rapports]
      };
    });
  };

  const addMateriel = (materiel: Materiel) => {
    setState((prev) => {
      const logRapport: Rapport = {
        id: `log-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Nouveau Matériel: ${materiel.name}`,
        content: `Ajout du matériel : "${materiel.name}" (Type: ${materiel.type}).`,
        type: 'Instruction',
        author: prev.currentUser || 'Système'
      };

      return {
        ...prev,
        materiels: [materiel, ...prev.materiels],
        rapports: [logRapport, ...prev.rapports]
      };
    });
  };

  const updateConsomable = (consomable: Consomable) => {
    setState((prev) => {
      const oldCons = prev.consomables.find(c => c.id === consomable.id);
      let logMsg = `Mise à jour du consommable "${consomable.name}". Quantité: ${consomable.quantity} ${consomable.unit}.`;
      
      const logRapport: Rapport = {
        id: `log-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Suivi Consommable: ${consomable.name}`,
        content: logMsg,
        type: 'Instruction',
        author: prev.currentUser || 'Système'
      };

      return {
        ...prev,
        consomables: prev.consomables.map((c) => (c.id === consomable.id ? consomable : c)),
        rapports: [logRapport, ...prev.rapports]
      };
    });
  };

  const addConsomable = (consomable: Consomable) => {
    setState((prev) => {
      const logRapport: Rapport = {
        id: `log-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Nouveau Consommable: ${consomable.name}`,
        content: `Ajout du consommable: "${consomable.name}" (Quantité initiale: ${consomable.quantity} ${consomable.unit}).`,
        type: 'Instruction',
        author: prev.currentUser || 'Système'
      };

      return {
        ...prev,
        consomables: [consomable, ...prev.consomables],
        rapports: [logRapport, ...prev.rapports]
      };
    });
  };

  const addRapport = (rapport: Rapport) => {
    setState((prev) => ({
      ...prev,
      rapports: [{ ...rapport, author: prev.currentUser || 'Système' }, ...prev.rapports],
    }));
  };

  const updateRapport = (rapport: Rapport) => {
    setState((prev) => ({
      ...prev,
      rapports: prev.rapports.map((r) => (r.id === rapport.id ? rapport : r)),
    }));
  };

  const addBoiteExterne = (boite: BoiteExterne) => {
    setState((prev) => {
      const logRapport: Rapport = {
        id: `r${Date.now()}_entree`,
        date: boite.dateEntre.split('T')[0],
        title: `Entrée d'une boîte externe`,
        content: `Nom de la boîte : ${boite.name}\n\n${boite.content || ''}`,
        type: 'Instruction',
        category: 'Boîte Externe',
        attachmentUrls: boite.attachmentUrls || [],
        author: prev.currentUser || 'Système',
      };
      
      return {
        ...prev,
        boitesExternes: [boite, ...(prev.boitesExternes || [])],
        rapports: [logRapport, ...prev.rapports]
      };
    });
  };

  const updateBoiteExterne = (boite: BoiteExterne) => {
    setState((prev) => {
      const oldBoite = (prev.boitesExternes || []).find(b => b.id === boite.id);
      
      let newRapport = null;
      if (oldBoite && !oldBoite.dateSortie && boite.dateSortie) {
        newRapport = {
          id: `r${Date.now()}_sortie`,
          date: boite.dateSortie.split('T')[0],
          title: `Sortie de la boîte externe`,
          content: `La boîte externe "${boite.name}" est déclarée comme sortie de la clinique.`,
          type: 'Instruction',
          category: 'Boîte Externe',
          author: boite.authorSortie || prev.currentUser || 'Système',
          attachmentUrls: [],
        };
      }

      return {
        ...prev,
        boitesExternes: (prev.boitesExternes || []).map((b) => (b.id === boite.id ? boite : b)),
        rapports: newRapport ? [newRapport as Rapport, ...prev.rapports] : prev.rapports
      };
    });
  };

  const addChecklist = (checklist: Checklist) => {
    setState((prev) => ({
      ...prev,
      checklists: [checklist, ...prev.checklists],
    }));
  };

  const deleteBoite = (id: string) => {
    setState((prev) => {
      const boite = prev.boites.find(b => b.id === id);
      const logRapport: Rapport = {
        id: `log-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Suppression Boîte: ${boite?.name || id}`,
        content: `Suppression de la boîte/tambour: "${boite?.name || id}".`,
        type: 'Instruction',
        author: prev.currentUser || 'Système'
      };

      return {
        ...prev,
        boites: prev.boites.filter((b) => b.id !== id),
        rapports: [logRapport, ...prev.rapports]
      };
    });
  };

  const deleteMateriel = (id: string) => {
    setState((prev) => {
      const mat = prev.materiels.find(m => m.id === id);
      const logRapport: Rapport = {
        id: `log-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Suppression Matériel: ${mat?.name || id}`,
        content: `Suppression du matériel: "${mat?.name || id}".`,
        type: 'Instruction',
        author: prev.currentUser || 'Système'
      };

      return {
        ...prev,
        materiels: prev.materiels.filter((m) => m.id !== id),
        rapports: [logRapport, ...prev.rapports]
      };
    });
  };

  const deleteConsomable = (id: string) => {
    setState((prev) => {
      const cons = prev.consomables.find(c => c.id === id);
      const logRapport: Rapport = {
        id: `log-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: `Suppression Consommable: ${cons?.name || id}`,
        content: `Suppression du consommable: "${cons?.name || id}".`,
        type: 'Instruction',
        author: prev.currentUser || 'Système'
      };

      return {
        ...prev,
        consomables: prev.consomables.filter((c) => c.id !== id),
        rapports: [logRapport, ...prev.rapports]
      };
    });
  };

  const deleteRapport = (id: string) => {
    setState((prev) => ({
      ...prev,
      rapports: prev.rapports.filter((r) => r.id !== id),
    }));
  };

  const addReforme = (reforme: ReformeItem) => {
    setState((prev) => ({
      ...prev,
      reformes: [reforme, ...(prev.reformes || [])],
    }));
  };

  const updateReforme = (reforme: ReformeItem) => {
    setState((prev) => ({
      ...prev,
      reformes: (prev.reformes || []).map((r) => (r.id === reforme.id ? reforme : r)),
    }));
  };

  const deleteReforme = (id: string) => {
    setState((prev) => ({
      ...prev,
      reformes: (prev.reformes || []).filter((r) => r.id !== id),
    }));
  };

  const addNotification = (notification: Notification) => {
    setState((prev) => ({
      ...prev,
      notifications: [notification, ...(prev.notifications || [])],
    }));
  };

  const markNotificationAsRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  };

  const resetData = () => {
    setState(initialData);
  };

  return (
    <StoreContext.Provider value={{ state, updateBoite, addBoite, updateMateriel, addMateriel, updateConsomable, addConsomable, addRapport, updateRapport, addBoiteExterne, updateBoiteExterne, addChecklist, addNotification, markNotificationAsRead, deleteBoite, deleteMateriel, deleteConsomable, deleteRapport, addReforme, updateReforme, deleteReforme, resetData, login, logout }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
