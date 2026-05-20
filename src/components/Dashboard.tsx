import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PackageOpen, Wrench, Syringe, FileText, LogOut, Menu, X, User, ChevronDown, Bell, Archive, Upload, Camera, LayoutDashboard } from 'lucide-react';
import { BoitesView } from './BoitesView';
import { MaterielsView } from './MaterielsView';
import { ConsomablesView } from './ConsomablesView';
import { RapportsView } from './RapportsView';
import { InventoryView } from './InventoryView';
import { MultiImagePicker } from './MultiImagePicker';
import { useStore } from '../hooks/useStore';
import { ReformeType } from '../types';

type Tab = 'boites' | 'materiels' | 'consomables' | 'rapports' | 'inventaire';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('rapports');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showReformeModal, setShowReformeModal] = useState(false);

  // Reforme Form State
  const [reformeType, setReformeType] = useState<ReformeType>('Boite');
  const [reformeName, setReformeName] = useState('');
  const [reformeReference, setReformeReference] = useState('');
  const [reformeImageUrl, setReformeImageUrl] = useState('');
  const [reformeImageUrls, setReformeImageUrls] = useState<string[]>([]);
  const [reformeComment, setReformeComment] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { state, logout, markNotificationAsRead, addReforme } = useStore();

  const handleAddReforme = (e: React.FormEvent) => {
    e.preventDefault();
    const firstImageUrl = reformeImageUrls.length > 0 ? reformeImageUrls[0] : reformeImageUrl;
    addReforme({
      id: `ref${Date.now()}`,
      type: reformeType,
      name: reformeName,
      reference: reformeReference,
      imageUrl: firstImageUrl,
      imageUrls: reformeImageUrls,
      dateAdded: new Date().toISOString(),
      comment: reformeComment
    });
    setReformeName('');
    setReformeReference('');
    setReformeImageUrl('');
    setReformeImageUrls([]);
    setReformeComment('');
    setShowReformeModal(false);
    alert('Élément ajouté aux réformes avec succès !');
  };

  const unreadNotifications = (state.notifications || []).filter(n => !n.read);

  const tabs = [
    { id: 'boites', name: 'Boîtes et Instrumentation', icon: PackageOpen },
    { id: 'materiels', name: 'Matériels', icon: Wrench },
    { id: 'consomables', name: 'Consommables', icon: Syringe },
    { id: 'rapports', name: 'Rapports et Consignes', icon: FileText },
    { id: 'inventaire', name: 'Suivi et Inventaire', icon: LayoutDashboard },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'boites': return <BoitesView />;
      case 'materiels': return <MaterielsView />;
      case 'consomables': return <ConsomablesView />;
      case 'rapports': return <RapportsView />;
      case 'inventaire': return <InventoryView />;
      default: return null;
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-teal-700 text-white shadow-md sticky top-0 z-50">
        {/* Top Bar: Logo (Center) and Profile (Right) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 sm:h-20">
            {/* Mobile menu button (Left) */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-teal-100 hover:text-white hover:bg-teal-600 focus:outline-none transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Logo (Center on mobile, Left on desktop) */}
            <div className="flex-1 flex justify-center md:justify-start">
              <div 
                className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setActiveTab('boites')}
              >
                <div className="bg-white p-1 sm:p-1.5 rounded-lg shadow-sm shrink-0">
                  <PackageOpen className="h-5 w-5 sm:h-6 sm:w-6 text-teal-700" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="font-bold text-base sm:text-lg tracking-tight whitespace-nowrap">
                    Addaman
                  </span>
                  <span className="hidden sm:inline font-bold text-lg tracking-tight">Stérilisation</span>
                  <span className="inline sm:hidden font-medium text-[10px] uppercase tracking-wider opacity-80 -mt-1">Stérilisation</span>
                </div>
              </div>
            </div>
            
            {/* Profile Menu (Right) */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Reforme Button */}
              <button
                onClick={() => setShowReformeModal(true)}
                className="p-1.5 sm:p-2 rounded-full hover:bg-teal-600 transition-colors focus:outline-none"
                title="Ajouter une Réforme"
              >
                <Archive className="h-5 w-5 text-teal-100" />
              </button>

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-teal-600 transition-colors focus:outline-none relative"
                >
                  <Bell className="h-5 w-5 text-teal-100" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-teal-700"></span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900">Notifications</h3>
                        <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                          {unreadNotifications.length}
                        </span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {(state.notifications || []).length > 0 ? (
                          (state.notifications || []).map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                              onClick={() => markNotificationAsRead(notif.id)}
                            >
                              <div className="flex gap-3">
                                <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                <div>
                                  <p className={`text-sm ${!notif.read ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                    {notif.message}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {new Date(notif.date).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-slate-500 text-sm">
                            Aucune notification
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-full hover:bg-teal-600 transition-colors focus:outline-none"
                >
                  <div className="bg-teal-800 p-1 rounded-full">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-teal-100" />
                  </div>
                  <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 text-teal-200 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Connecté en tant que</p>
                        <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{state.currentUser}</p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Déconnexion
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Tabs (Desktop) */}
        <div className="hidden md:block border-t border-teal-600 bg-teal-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center space-x-2 py-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-white text-teal-800 shadow-sm' 
                        : 'text-teal-50 hover:bg-teal-600 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-teal-600' : ''}`} />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-teal-800 border-t border-teal-600"
            >
              <div className="px-2 py-3 space-y-1 sm:px-3">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center px-3 py-3 rounded-xl text-base font-medium ${
                        isActive 
                          ? 'bg-white text-teal-800 shadow-sm' 
                          : 'text-teal-100 hover:bg-teal-700 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-teal-600' : ''}`} />
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Reforme Modal */}
      <AnimatePresence>
        {showReformeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Archive className="h-5 w-5 text-teal-600" />
                  Ajouter à la Réforme
                </h3>
                <button type="button" onClick={() => setShowReformeModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddReforme} className="p-4 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type d'élément</label>
                  <select
                    value={reformeType}
                    onChange={(e) => setReformeType(e.target.value as ReformeType)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  >
                    <option value="Boite">Boîte</option>
                    <option value="Tambour">Tambour</option>
                    <option value="Instrument">Instrument</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Désignation (Nom)</label>
                  <input
                    type="text"
                    required
                    value={reformeName}
                    onChange={(e) => setReformeName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Référence / SN (Optionnel)</label>
                  <input
                    type="text"
                    value={reformeReference}
                    onChange={(e) => setReformeReference(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <MultiImagePicker
                    images={reformeImageUrls}
                    onChange={setReformeImageUrls}
                    label="Photos de l'élément (Optionnelles)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Raison de la réforme / Commentaire</label>
                  <textarea
                    rows={3}
                    value={reformeComment}
                    onChange={(e) => setReformeComment(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4 pt-4">
                  <button type="button" onClick={() => setShowReformeModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors">Ajouter à la réforme</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
