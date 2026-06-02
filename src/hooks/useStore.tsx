import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Boite, Materiel, Consomable, Rapport, Checklist, Notification, ReformeItem } from '../types';
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
      alert('Erreur: Impossible d\'enregistrer les modifications (mémoire saturée). Réduisez le nombre de photos ou videz des anciens rapports.');
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
      if (oldMat) {
        if (oldMat.status !== materiel.status) {
          logMsg = `Changement d'état du matériel "${materiel.name}": ${oldMat.status} -> ${materiel.status}.`;
        } else if (oldMat.name !== materiel.name) {
          logMsg = `Renommage du matériel: "${oldMat.name}" -> "${materiel.name}".`;
        } else {
          logMsg = `Mise à jour du matériel "${materiel.name}".`;
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
    <StoreContext.Provider value={{ state, updateBoite, addBoite, updateMateriel, addMateriel, updateConsomable, addConsomable, addRapport, updateRapport, addChecklist, addNotification, markNotificationAsRead, deleteBoite, deleteMateriel, deleteConsomable, deleteRapport, addReforme, updateReforme, deleteReforme, resetData, login, logout }}>
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
