import React, { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Rapport } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, Plus, Calendar, X, Image as ImageIcon, Paperclip, CheckCircle2, Trash2, Edit2, Mail, Download, Eye, ArrowLeft, Tags } from 'lucide-react';
import jsPDF from 'jspdf';

export const RapportsView: React.FC = () => {
  const { state, addRapport, deleteRapport, updateRapport } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRapport, setEditingRapport] = useState<Rapport | null>(null);
  const [selectedPdfRapport, setSelectedPdfRapport] = useState<Rapport | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'menu' | 'Report' | 'Instruction'>('menu');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const categories = ['Maintenance', 'Panne', 'Vérification incomplète', 'Réforme', 'Test Bowie-Dick non réussite', 'Autre'];

  const generatePDF = (rapport: Rapport, action: 'view' | 'download') => {
    const doc = new jsPDF();

    // Professional Header
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date : ${new Date().toLocaleDateString()}`, 14, 20);
    doc.text("Ville d'Agadir", 14, 25);
    doc.text("Polyclinique ADDAMAN Agadir", 14, 30);
    doc.text("Service de stérilisation", 14, 35);
    doc.text("Auteur : Fatihi Anas", 14, 40);

    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); 
    doc.text("Document de Stérilisation", 14, 55);
    
    doc.setFontSize(16);
    doc.setTextColor(13, 148, 136);
    doc.text(rapport.type === 'Report' ? "Rapport d'intervention" : 'Consigne', 14, 65);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Titre: ${rapport.title}`, 14, 75);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date du document: ${rapport.date}`, 14, 85);
    doc.text(`Enregistré par: ${rapport.author || 'Système'}`, 14, 95);
    let yPos = 105;
    if (rapport.type === 'Report' && rapport.category) {
       doc.text(`Catégorie: ${rapport.category}`, 14, 105);
       yPos = 115;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    const splitContent = doc.splitTextToSize(rapport.content, 180);
    
    for (let i = 0; i < splitContent.length; i++) {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(splitContent[i], 14, yPos);
      yPos += 7;
    }
    
    if (rapport.attachmentUrl && rapport.attachmentUrl.startsWith('data:image')) {
      try {
        if (yPos + 110 > 280) {
          doc.addPage();
          yPos = 20;
        } else {
          yPos += 10;
        }
        const imgType = rapport.attachmentUrl.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(rapport.attachmentUrl, imgType, 14, yPos, 100, 100, undefined, 'FAST');
      } catch (e) {
        console.error("Could not add image to PDF", e);
      }
    }
    
    if (action === 'download') {
      doc.save(`Document_${rapport.title.replace(/\s+/g, '_')}_${rapport.date}.pdf`);
    } else {
      const url = doc.output('datauristring');
      setPdfUrl(url);
      setSelectedPdfRapport(rapport);
    }
  };

  const generateWord = (rapport: Rapport) => {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; margin-bottom: 20px; color: #64748b; font-size: 14px;">
          <p style="margin: 2px 0;">Date : ${new Date().toLocaleDateString()}</p>
          <p style="margin: 2px 0;">Ville d'Agadir</p>
          <p style="margin: 2px 0;">Polyclinique ADDAMAN Agadir</p>
          <p style="margin: 2px 0;">Service de stérilisation</p>
          <p style="margin: 2px 0;">Auteur : Fatihi Anas</p>
      </div>
      <div style="font-family: Arial, sans-serif;">
        <h1 style="color: #0d9488;">Document de Stérilisation</h1>
        <h2>${rapport.type === 'Report' ? "Rapport d'intervention" : "Consigne"}</h2>
        <p><strong>Titre:</strong> ${rapport.title}</p>
        <p><strong>Date du document:</strong> ${rapport.date}</p>
        <p><strong>Enregistré par:</strong> ${rapport.author || 'Système'}</p>
        ${rapport.category ? '<p><strong>Catégorie:</strong> ' + rapport.category + '</p>' : ''}
        <hr/>
        <p style="white-space: pre-wrap;">${rapport.content}</p>
      </div>
    `;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Document_${rapport.title.replace(/\\s+/g, '_')}_${rapport.date}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const handleEmailRapport = (rapport: Rapport) => {
    const subject = encodeURIComponent(`[Stérilisation] ${rapport.title}`);
    const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-dessous les détails du document:\n\nTitre: ${rapport.title}\nDate: ${rapport.date}\nCatégorie: ${rapport.category || '-'}\nAuteur: ${rapport.author || 'Système'}\n\nContenu:\n${rapport.content}\n\nCordialement,\nPolyclinique Addaman`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const [newRapport, setNewRapport] = useState({
    title: '',
    content: '',
    type: 'Report' as 'Report' | 'Instruction',
    category: 'Autre',
    attachmentUrl: ''
  });

  const filteredRapports = React.useMemo(() => {
    return [...state.rapports]
      .filter((r) => r.type === viewMode)
      .filter((r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.category && r.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.rapports, searchQuery, viewMode]);

  const uniqueDates = React.useMemo(() => {
    const dates = filteredRapports.map(r => r.date);
    return Array.from(new Set(dates));
  }, [filteredRapports]);

  const documentsForDate = React.useMemo(() => {
    if (!selectedDate) return [];
    return filteredRapports.filter(r => r.date === selectedDate);
  }, [selectedDate, filteredRapports]);

  const renderRapportCard = (rapport: Rapport) => (
    <motion.div
      key={rapport.id}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => generatePDF(rapport, 'view')}
    >
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${rapport.type === 'Report' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-teal-600 transition-colors line-clamp-1">{rapport.title}</h3>
              <div className="flex items-center text-[10px] sm:text-xs text-slate-500 mt-1">
                <Calendar className="h-3 w-3 mr-1" /> {rapport.date}
                {rapport.author && <span className="ml-2">• {rapport.author}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {state.currentUser === 'Fatihi Anas' && (
              <>
                <button
                  onClick={() => setEditingRapport(rapport)}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteRapport(rapport.id)}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
        
        {rapport.type === 'Report' && rapport.category && (
            <div className="mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                    <Tags className="h-3 w-3" /> {rapport.category}
                </span>
            </div>
        )}
        
        <p className="text-slate-600 text-sm line-clamp-2 overflow-hidden mb-4 flex-1">{rapport.content}</p>
        
        <div className="pt-3 border-t border-slate-50 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <button
              onClick={() => generateWord(rapport)}
              className="px-2 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
              title="Télécharger Word"
            >
              Word
            </button>
            <button
              onClick={() => generatePDF(rapport, 'download')}
              className="px-2 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
              title="Télécharger PDF"
            >
              PDF
            </button>
            <button
              onClick={() => generatePDF(rapport, 'view')}
              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-teal-100"
              title="Aperçu"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={() => handleEmailRapport(rapport)}
            className="flex items-center text-[10px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors"
          >
            <Mail className="h-3 w-3 mr-1" /> Email
          </button>
        </div>
      </div>
    </motion.div>
  );

  const handleAddRapport = (e: React.FormEvent) => {
    e.preventDefault();
    const rapport: Rapport = {
      id: `r${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: newRapport.title,
      content: newRapport.content,
      type: newRapport.type,
      category: newRapport.type === 'Report' ? newRapport.category : undefined,
      attachmentUrl: newRapport.attachmentUrl || undefined,
      author: state.currentUser || 'Système'
    };
    addRapport(rapport);
    setShowAddModal(false);
    setNewRapport({ title: '', content: '', type: 'Report', category: 'Autre', attachmentUrl: '' });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRapport) return;
    updateRapport({
      ...editingRapport,
      author: state.currentUser || 'Système'
    });
    setEditingRapport(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRapport({ ...newRapport, attachmentUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {viewMode !== 'menu' && !selectedDate && (
            <button 
              onClick={() => {setViewMode('menu'); setSelectedDate(null);}}
              className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}
          {viewMode !== 'menu' && selectedDate && (
            <button 
              onClick={() => setSelectedDate(null)}
              className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-slate-900">
            {viewMode === 'menu' ? 'Gestion Documentaire' : viewMode === 'Report' ? "Rapports d'intervention" : 'Consignes de service'}
            {selectedDate && <span className="text-teal-600 ml-2">({selectedDate})</span>}
          </h1>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          {viewMode !== 'menu' && (
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
          )}
          <button
            onClick={() => {
              setNewRapport({ ...newRapport, type: viewMode === 'menu' ? 'Report' : viewMode });
              setShowAddModal(true);
            }}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-sm transition-colors"
          >
            <Plus className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Nouveau</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'menu' ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10"
          >
            <button
              onClick={() => setViewMode('Report')}
              className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border-2 border-slate-100 hover:border-teal-500 hover:shadow-xl transition-all group"
            >
              <div className="p-6 rounded-2xl bg-blue-100 text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                <FileText className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Rapports</h2>
              <p className="text-slate-500 text-center">Historique des interventions et maintenances par date.</p>
              <div className="mt-8 px-6 py-2 bg-slate-50 rounded-full text-slate-600 font-bold text-sm">
                {state.rapports.filter(r => r.type === 'Report').length} documents
              </div>
            </button>

            <button
              onClick={() => setViewMode('Instruction')}
              className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border-2 border-slate-100 hover:border-amber-500 hover:shadow-xl transition-all group"
            >
              <div className="p-6 rounded-2xl bg-amber-100 text-amber-600 mb-6 group-hover:scale-110 transition-transform">
                <FileText className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Consignes</h2>
              <p className="text-slate-500 text-center">Protocoles, instructions et suivi des modifications.</p>
              <div className="mt-8 px-6 py-2 bg-slate-50 rounded-full text-slate-600 font-bold text-sm">
                {state.rapports.filter(r => r.type === 'Instruction').length} documents
              </div>
            </button>
          </motion.div>
        ) : !selectedDate ? (
            <motion.div
              key="datesGrid"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6"
            >
                {uniqueDates.length > 0 ? uniqueDates.map(date => {
                    const count = filteredRapports.filter(r => r.date === date).length;
                    return (
                        <button
                            key={date}
                            onClick={() => setSelectedDate(date)}
                            className="bg-white border hover:border-teal-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="bg-teal-50 text-teal-600 p-4 rounded-full group-hover:scale-110 transition-transform">
                                <Calendar className="h-8 w-8" />
                            </div>
                            <span className="font-bold text-slate-900">{date}</span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{count} document{count > 1 ? 's' : ''}</span>
                        </button>
                    )
                }) : (
                    <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Aucune date trouvée.</p>
                    </div>
                )}
            </motion.div>
        ) : (
          <motion.div
            key="documentsList"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {documentsForDate.map((rapport) => renderRapportCard(rapport))}
            </AnimatePresence>
            
            {documentsForDate.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Aucun document trouvé pour cette date.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-bold text-lg text-slate-900">Nouveau Document</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddRapport} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={newRapport.type}
                    onChange={(e) => setNewRapport({ ...newRapport, type: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="Report">Rapport</option>
                    <option value="Instruction">Consigne</option>
                  </select>
                </div>
                {newRapport.type === 'Report' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                        <select
                            value={newRapport.category}
                            onChange={(e) => setNewRapport({ ...newRapport, category: e.target.value })}
                            className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                  <input
                    type="text"
                    required
                    value={newRapport.title}
                    onChange={(e) => setNewRapport({ ...newRapport, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Titre du document..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contenu</label>
                  <textarea
                    required
                    value={newRapport.content}
                    onChange={(e) => setNewRapport({ ...newRapport, content: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    rows={5}
                    placeholder="Écrivez le contenu ici..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pièce jointe (Image/PDF)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors cursor-pointer relative">
                    <div className="space-y-1 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                      <div className="flex text-sm text-slate-600 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                          <span>Télécharger un fichier</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf" />
                        </label>
                      </div>
                      <p className="text-xs text-slate-500">PNG, JPG, PDF jusqu'à 10MB</p>
                    </div>
                  </div>
                  {newRapport.attachmentUrl && (
                    <p className="mt-2 text-sm text-emerald-600 font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Fichier attaché avec succès
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors">Publier</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingRapport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-bold text-lg text-slate-900">Modifier le document</h3>
                <button onClick={() => setEditingRapport(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-6 overflow-y-auto">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type de document</label>
                    <div className="flex gap-4 mt-2">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio text-teal-600 focus:ring-teal-500 h-4 w-4"
                          name="edit-type"
                          value="Report"
                          checked={editingRapport.type === 'Report'}
                          onChange={() => setEditingRapport({ ...editingRapport, type: 'Report' })}
                        />
                        <span className="ml-2 text-sm text-slate-700">Rapport</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio text-amber-600 focus:ring-amber-500 h-4 w-4"
                          name="edit-type"
                          value="Instruction"
                          checked={editingRapport.type === 'Instruction'}
                          onChange={() => setEditingRapport({ ...editingRapport, type: 'Instruction' })}
                        />
                        <span className="ml-2 text-sm text-slate-700">Consigne</span>
                      </label>
                    </div>
                  </div>
                </div>
                {editingRapport.type === 'Report' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                        <select
                            value={editingRapport.category || 'Autre'}
                            onChange={(e) => setEditingRapport({ ...editingRapport, category: e.target.value })}
                            className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                  <input
                    type="text"
                    required
                    value={editingRapport.title}
                    onChange={(e) => setEditingRapport({ ...editingRapport, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Titre du document..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contenu</label>
                  <textarea
                    required
                    value={editingRapport.content}
                    onChange={(e) => setEditingRapport({ ...editingRapport, content: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    rows={5}
                    placeholder="Écrivez le contenu ici..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pièce jointe (Image/PDF)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors cursor-pointer relative">
                    <div className="space-y-1 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                      <div className="flex text-sm text-slate-600 justify-center">
                        <label htmlFor="edit-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                          <span>Télécharger un fichier</span>
                          <input id="edit-file-upload" name="edit-file-upload" type="file" className="sr-only" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditingRapport({ ...editingRapport, attachmentUrl: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }} accept="image/*,.pdf" />
                        </label>
                      </div>
                      <p className="text-xs text-slate-500">PNG, JPG, PDF jusqu'à 10MB</p>
                    </div>
                  </div>
                  {editingRapport.attachmentUrl && (
                    <p className="mt-2 text-sm text-emerald-600 font-medium flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Fichier attaché avec succès
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setEditingRapport(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors">Enregistrer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {selectedPdfRapport && pdfUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-teal-600" />
                  Aperçu du PDF: {selectedPdfRapport.title}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generateWord(selectedPdfRapport)}
                    className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4 mr-1.5" /> Word
                  </button>
                  <button
                    onClick={() => generatePDF(selectedPdfRapport, 'download')}
                    className="flex items-center text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4 mr-1.5" /> PDF
                  </button>
                  <button onClick={() => { setSelectedPdfRapport(null); setPdfUrl(null); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors ml-2">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-100 p-4">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full rounded-xl border border-slate-300 shadow-sm"
                  title="PDF Preview"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
