import React, { useMemo, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { PackageOpen, AlertTriangle, CheckCircle2, Download, X, Edit, MessageSquare, ChevronRight, Info, ArrowLeft, Trash2 } from 'lucide-react';
import { MultiImagePicker } from './MultiImagePicker';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Instrument, Boite, ReformeItem } from '../types';

export const InventoryView: React.FC = () => {
    const { state, updateBoite, deleteReforme, updateReforme } = useStore();
    const [activeTab, setActiveTab] = useState<'boites' | 'tambours' | 'instruments' | 'reformes'>('boites');
    
    // View navigation states
    const [selectedBoiteId, setSelectedBoiteId] = useState<string | null>(null);
    const [selectedInstForDetail, setSelectedInstForDetail] = useState<(Instrument & { boiteId: string, boiteName: string }) | null>(null);

    const [selectedInstStatus, setSelectedInstStatus] = useState<'Good' | 'Fair' | 'Bad' | null>(null);
    
    // Temporary states for editing
    const [editStatus, setEditStatus] = useState<'Good' | 'Fair' | 'Bad'>('Good');
    const [editComment, setEditComment] = useState('');
    const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
    const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
    
    const [editingReforme, setEditingReforme] = useState<ReformeItem | null>(null);

    const inventoryData = useMemo(() => {
        const boitesAndTambours = state.boites.reduce((acc, boite) => {
            const isTambour = boite.name.toLowerCase().includes('tambour');
            const target = isTambour ? acc.tambours : acc.boites;
            target[boite.status] = (target[boite.status] || 0) + 1;
            return acc;
        }, { boites: { Good: 0, Fair: 0, Bad: 0 }, tambours: { Good: 0, Fair: 0, Bad: 0 } });

        const instruments = state.boites.flatMap(b => b.instruments.map(i => ({ ...i, boiteName: b.name, boiteId: b.id })));
        
        return { boites: state.boites, tambours: state.boites.filter(b => b.name.toLowerCase().includes('tambour')), boitesAndTambours, instruments };
    }, [state.boites]);

    const getStatusStyle = (status: 'Good' | 'Fair' | 'Bad') => {
        switch(status) {
            case 'Good': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Fair': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Bad': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const handleSaveBoite = () => {
        const boite = state.boites.find(b => b.id === selectedBoiteId);
        if (boite) {
            updateBoite({ 
                ...boite, 
                status: editStatus, 
                comment: editComment, 
                imageUrl: editImageUrls[0] || editImageUrl || boite.imageUrl,
                imageUrls: editImageUrls
            });
        }
        setSelectedBoiteId(null);
    };

    const handleSaveInstrument = () => {
        if (!selectedInstForDetail) return;
        const boite = state.boites.find(b => b.id === selectedInstForDetail.boiteId);
        if (boite) {
            const newInstruments = boite.instruments.map(i => i.id === selectedInstForDetail.id ? {
                ...i, 
                status: editStatus, 
                comment: editComment, 
                imageUrl: editImageUrls[0] || editImageUrl || i.imageUrl,
                imageUrls: editImageUrls
            } : i);
            updateBoite({ ...boite, instruments: newInstruments });
        }
        setSelectedInstForDetail(null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveReforme = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingReforme) {
            updateReforme(editingReforme);
            setEditingReforme(null);
        }
    };

    const exportReformePDF = () => {
        if (!state.reformes || state.reformes.length === 0) return;
        const doc = new jsPDF();
        
        // Professional Header
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Date : ${new Date().toLocaleDateString()}`, 14, 20);
        doc.text("Ville d'Agadir", 14, 25);
        doc.text("Polyclinique ADDAMAN Agadir", 14, 30);
        doc.text("Service de stérilisation", 14, 35);
        doc.text("Auteur : Fatihi Anas", 14, 40);

        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.text("Liste des Matériels Réformés", 14, 55);
        autoTable(doc, {
            head: [['Date', 'Type', 'Désignation', 'Réf / SN', 'Motif']],
            body: state.reformes.map(r => [
                new Date(r.dateAdded).toLocaleDateString(),
                r.type,
                r.name,
                r.reference || '-',
                r.comment || '-'
            ]),
            startY: 65,
        });
        doc.save('Liste_Reformes.pdf');
    };

    const exportReformeWord = () => {
        if (!state.reformes || state.reformes.length === 0) return;
        
        let htmlTable = `
            <div style="font-family: Arial, sans-serif; margin-bottom: 20px; color: #64748b; font-size: 14px;">
                <p style="margin: 2px 0;">Date : ${new Date().toLocaleDateString()}</p>
                <p style="margin: 2px 0;">Ville d'Agadir</p>
                <p style="margin: 2px 0;">Polyclinique ADDAMAN Agadir</p>
                <p style="margin: 2px 0;">Service de stérilisation</p>
                <p style="margin: 2px 0;">Auteur : Fatihi Anas</p>
            </div>
            <h2 style="font-family: Arial, sans-serif; color: #0f172a;">Liste des Matériels Réformés</h2>
            <table border="1" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
                <tr>
                    <th style="padding: 8px; background-color: #f8fafc; text-align: left;">Date</th>
                    <th style="padding: 8px; background-color: #f8fafc; text-align: left;">Type</th>
                    <th style="padding: 8px; background-color: #f8fafc; text-align: left;">Désignation</th>
                    <th style="padding: 8px; background-color: #f8fafc; text-align: left;">Réf / SN</th>
                    <th style="padding: 8px; background-color: #f8fafc; text-align: left;">Motif</th>
                </tr>
        `;
        
        state.reformes.forEach(r => {
            htmlTable += `
                <tr>
                    <td style="padding: 8px;">${new Date(r.dateAdded).toLocaleDateString()}</td>
                    <td style="padding: 8px;">${r.type}</td>
                    <td style="padding: 8px;">${r.name}</td>
                    <td style="padding: 8px;">${r.reference || '-'}</td>
                    <td style="padding: 8px;">${r.comment || '-'}</td>
                </tr>
            `;
        });
        htmlTable += "</table>";

        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Matériels Réformés</title></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + htmlTable + footer;
        
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = 'Liste_Reformes.doc';
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    const exportStatsPDF = () => {
        const doc = new jsPDF();

        // Professional Header
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Date : ${new Date().toLocaleDateString()}`, 14, 20);
        doc.text("Ville d'Agadir", 14, 25);
        doc.text("Polyclinique ADDAMAN Agadir", 14, 30);
        doc.text("Service de stérilisation", 14, 35);
        doc.text("Auteur : Fatihi Anas", 14, 40);

        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.text("Rapport d'Inventaire et Statistiques", 14, 55);
        
        doc.setFontSize(14);
        doc.text("1. Résumé des Boîtes et Tambours", 14, 65);
        autoTable(doc, {
            head: [['Type', 'Bon État', 'État Moyen', 'Mauvais État']],
            body: [
                ['Boîtes', inventoryData.boitesAndTambours.boites.Good, inventoryData.boitesAndTambours.boites.Fair, inventoryData.boitesAndTambours.boites.Bad],
                ['Tambours', inventoryData.boitesAndTambours.tambours.Good, inventoryData.boitesAndTambours.tambours.Fair, inventoryData.boitesAndTambours.tambours.Bad],
            ],
            startY: 70,
        });

        const instrumentsByStatus = {
            Good: inventoryData.instruments.filter(i => i.status === 'Good').length,
            Fair: inventoryData.instruments.filter(i => i.status === 'Fair').length,
            Bad: inventoryData.instruments.filter(i => i.status === 'Bad').length,
        };

        const currentY = (doc as any).lastAutoTable.finalY + 10;
        
        doc.text("2. Résumé des Instruments", 14, currentY);
        autoTable(doc, {
            head: [['État', 'Quantité']],
            body: [
                ['Bon', instrumentsByStatus.Good],
                ['Moyen', instrumentsByStatus.Fair],
                ['Mauvais', instrumentsByStatus.Bad],
                ['Total', inventoryData.instruments.length]
            ],
            startY: currentY + 5,
        });
        doc.save('Inventaire_Statistiques_Complet.pdf');
    };

    const exportStatsWord = () => {
        let htmlContent = `
            <div style="font-family: Arial, sans-serif; margin-bottom: 20px; color: #64748b; font-size: 14px;">
                <p style="margin: 2px 0;">Date : ${new Date().toLocaleDateString()}</p>
                <p style="margin: 2px 0;">Ville d'Agadir</p>
                <p style="margin: 2px 0;">Polyclinique ADDAMAN Agadir</p>
                <p style="margin: 2px 0;">Service de stérilisation</p>
                <p style="margin: 2px 0;">Auteur : Fatihi Anas</p>
            </div>
            <div style="font-family: Arial, sans-serif;">
                <h1 style="color: #0d9488;">Rapport d'Inventaire et Statistiques</h1>
                <h2>1. Résumé des Boîtes et Tambours</h2>
                <table border="1" style="border-collapse: collapse; width: 100%; text-align: left;">
                    <tr><th style="padding: 8px;">Type</th><th style="padding: 8px;">Bon État</th><th style="padding: 8px;">État Moyen</th><th style="padding: 8px;">Mauvais État</th></tr>
                    <tr><td style="padding: 8px;">Boîtes</td><td style="padding: 8px;">${inventoryData.boitesAndTambours.boites.Good}</td><td style="padding: 8px;">${inventoryData.boitesAndTambours.boites.Fair}</td><td style="padding: 8px;">${inventoryData.boitesAndTambours.boites.Bad}</td></tr>
                    <tr><td style="padding: 8px;">Tambours</td><td style="padding: 8px;">${inventoryData.boitesAndTambours.tambours.Good}</td><td style="padding: 8px;">${inventoryData.boitesAndTambours.tambours.Fair}</td><td style="padding: 8px;">${inventoryData.boitesAndTambours.tambours.Bad}</td></tr>
                </table>
        `;
        
        const instrumentsByStatus = {
            Good: inventoryData.instruments.filter(i => i.status === 'Good').length,
            Fair: inventoryData.instruments.filter(i => i.status === 'Fair').length,
            Bad: inventoryData.instruments.filter(i => i.status === 'Bad').length,
        };

        htmlContent += `
                <h2>2. Résumé des Instruments</h2>
                <table border="1" style="border-collapse: collapse; width: 100%; text-align: left;">
                    <tr><th>État</th><th>Quantité</th></tr>
                    <tr><td>Bon</td><td>${instrumentsByStatus.Good}</td></tr>
                    <tr><td>Moyen</td><td>${instrumentsByStatus.Fair}</td></tr>
                    <tr><td>Mauvais</td><td>${instrumentsByStatus.Bad}</td></tr>
                    <tr><td>Total</td><td>${inventoryData.instruments.length}</td></tr>
                </table>
            </div>
        `;

        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Statistiques Inventaire</title></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + htmlContent + footer;
        
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = 'Inventaire_Statistiques_Complet.doc';
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    const renderInstrumentDetail = () => {
        if (!selectedInstForDetail) return null;
        const currentImageUrl = editImageUrl || selectedInstForDetail.imageUrl;
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-2xl text-slate-900">Détails: {selectedInstForDetail.name}</h3>
                        <button onClick={() => setSelectedInstForDetail(null)} className='p-2 hover:bg-slate-100 rounded-full'><X/></button>
                    </div>
                    
                    {editImageUrls && editImageUrls.length > 0 ? (
                        <div className="space-y-2 mb-6">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Photos actuelles ({editImageUrls.length})</label>
                            <div className="flex gap-2.5 overflow-x-auto pb-1.5">
                                {editImageUrls.map((imgUrl, imgIdx) => (
                                    <div key={imgIdx} className="relative h-28 w-28 rounded-2xl overflow-hidden border border-slate-100 shadow-sm shrink-0">
                                        <img src={imgUrl} alt={`ins-img-${imgIdx}`} className="h-full w-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        currentImageUrl && (
                            <img src={currentImageUrl} alt={selectedInstForDetail.name} className='w-full h-48 object-cover rounded-2xl mb-6' />
                        )
                    )}
                    <p className="text-slate-500 mb-6">Boîte: {selectedInstForDetail.boiteName} • Référence: {selectedInstForDetail.serialNumber || 'N/A'}</p>

                    <label className="block mb-2 font-medium text-slate-700">État</label>
                    <select className="w-full border-2 border-slate-200 p-3 rounded-xl mb-6 bg-slate-50 focus:border-teal-500 transition" value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}>
                        <option value="Good">Bien</option>
                        <option value="Fair">Moyen</option>
                        <option value="Bad">Mauvais</option>
                    </select>

                    <div className="mb-6">
                        <MultiImagePicker images={editImageUrls} onChange={setEditImageUrls} label="Changer ou ajouter des photos" />
                    </div>

                    <label className="block mb-2 font-medium text-slate-700">Commentaire</label>
                    <textarea className="w-full border-2 border-slate-200 p-3 rounded-xl mb-6 bg-slate-50 focus:border-teal-500 transition" rows={3} value={editComment} onChange={(e) => setEditComment(e.target.value)} placeholder="Ajouter un commentaire..." />
                    
                    <button onClick={handleSaveInstrument} className="bg-teal-700 text-white p-4 w-full rounded-2xl font-bold hover:bg-teal-800 transition text-lg shadow-lg">Enregistrer les modifications</button>
                </div>
            </div>
        );
    };

    const renderBoiteDetail = () => {
        const boite = state.boites.find(b => b.id === selectedBoiteId);
        if (!boite) return null;
        const currentImageUrl = editImageUrl || boite.imageUrl;

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 border-b pb-4">
                    <button onClick={() => {setSelectedBoiteId(null);}} className="p-2 hover:bg-slate-200 rounded-full transition">
                        <ArrowLeft className="h-6 w-6 text-slate-600" />
                    </button>
                    <h2 className="text-3xl font-bold text-slate-900">{boite.name}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
                        <h3 className="font-bold text-xl text-slate-800">Détails Boîte</h3>
                        
                        {editImageUrls && editImageUrls.length > 0 ? (
                            <div className="space-y-2 mb-6">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Photos actuelles ({editImageUrls.length})</label>
                                <div className="flex gap-2.5 overflow-x-auto pb-1.5">
                                    {editImageUrls.map((imgUrl, imgIdx) => (
                                        <div key={imgIdx} className="relative h-28 w-28 rounded-2xl overflow-hidden border border-slate-100 shadow-sm shrink-0">
                                            <img src={imgUrl} alt={`boite-img-${imgIdx}`} className="h-full w-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            currentImageUrl && (
                                <img src={currentImageUrl} alt={boite.name} className='w-full h-48 object-cover rounded-2xl' />
                            )
                        )}

                        <div>
                            <label className="block mb-2 font-medium text-slate-700">État</label>
                            <select className="w-full border-2 border-slate-200 p-3 rounded-xl bg-slate-50 focus:border-teal-500 transition" value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}>
                                <option value="Good">Bien</option>
                                <option value="Fair">Moyen</option>
                                <option value="Bad">Mauvais</option>
                            </select>
                        </div>
                        
                        <div className="mb-6">
                            <MultiImagePicker images={editImageUrls} onChange={setEditImageUrls} label="Changer ou ajouter des photos" />
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-slate-700">Commentaire</label>
                            <textarea className="w-full border-2 border-slate-200 p-3 rounded-xl bg-slate-50 focus:border-teal-500 transition" rows={3} value={editComment} onChange={(e) => setEditComment(e.target.value)} placeholder="Ajouter un commentaire..." />
                        </div>
                        <button onClick={handleSaveBoite} className="bg-teal-700 text-white p-4 w-full rounded-xl font-bold hover:bg-teal-800 transition shadow-md">Enregistrer la boîte</button>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
                        <h3 className="font-bold text-xl text-slate-800 mb-4">Instruments ({boite.instruments.length})</h3>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                            {boite.instruments.map(inst => (
                                <button key={inst.id} onClick={() => {
                                    setSelectedInstForDetail({...inst, boiteId: boite.id, boiteName: boite.name});
                                    setEditStatus(inst.status);
                                    setEditComment(inst.comment || '');
                                    setEditImageUrl(inst.imageUrl || null);
                                    setEditImageUrls(inst.imageUrls || (inst.imageUrl ? [inst.imageUrl] : []));
                                }} className="w-full flex justify-between items-center p-3 hover:bg-slate-50 border rounded-xl transition">
                                    <div className="flex items-center gap-3 text-left">
                                        {inst.imageUrl ? <img src={inst.imageUrl} alt={inst.name} className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">N/A</div>}
                                        <div>
                                            <p className="font-semibold text-slate-800">{inst.name}</p>
                                            <p className="text-xs text-slate-500">Réf: {inst.serialNumber || '-'}</p>
                                        </div>
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusStyle(inst.status)}`}>{inst.status}</span>
                                        <ChevronRight size={18} className="text-slate-400" />
                                    </div>
                                </button>
                            ))}
                            {boite.instruments.length === 0 && (
                                <p className="text-slate-500 text-center py-4">Aucun instrument.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (selectedBoiteId) {
        return (
            <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
                {renderBoiteDetail()}
                {renderInstrumentDetail()}
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen z-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <h2 className="text-3xl font-bold text-slate-900">Suivi et Inventaire</h2>
                {activeTab !== 'reformes' ? (
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button onClick={exportStatsWord} className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow-sm transition">
                            <Download className="h-4 w-4" /> Stats Word
                        </button>
                        <button onClick={exportStatsPDF} className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-xl hover:bg-teal-800 shadow-sm transition">
                            <Download className="h-4 w-4" /> Stats PDF
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button onClick={exportReformeWord} className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow-sm transition">
                            <Download className="h-4 w-4" /> Word
                        </button>
                        <button onClick={exportReformePDF} className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 shadow-sm transition">
                            <Download className="h-4 w-4" /> PDF
                        </button>
                    </div>
                )}
            </div>
            
            <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border shadow-sm w-full sm:w-max overflow-x-auto">
                {(['boites', 'tambours', 'instruments', 'reformes'] as const).map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => {setActiveTab(tab); setSelectedInstStatus(null)}} 
                      className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl capitalize font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${activeTab === tab ? 'bg-teal-600 text-white shadow-md transform scale-[1.02]' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {tab === 'reformes' ? 'Réformes' : tab}
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            {(activeTab === 'boites' || activeTab === 'tambours') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    {Object.entries(inventoryData.boitesAndTambours[activeTab === 'boites' ? 'boites' : 'tambours']).map(([status, count]) => (
                        <div key={status} className={`p-4 sm:p-6 rounded-2xl shadow-sm border ${getStatusStyle(status as 'Good'|'Fair'|'Bad')}`}>
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-75 mb-1 text-center sm:text-left">{status}</p>
                            <p className="text-3xl sm:text-4xl font-black text-center sm:text-left">{count}</p>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'instruments' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    {['Good', 'Fair', 'Bad'].map(status => (
                        <button key={status} onClick={() => setSelectedInstStatus(status as any)} className={`p-4 sm:p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${getStatusStyle(status as any)} ${selectedInstStatus === status ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}>
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-75 mb-1 text-center sm:text-left">{status}</p>
                            <p className="text-3xl sm:text-4xl font-black text-center sm:text-left">{inventoryData.instruments.filter(i => i.status === status).length}</p>
                        </button>
                    ))}
                </div>
            )}

            {/* Content Lists */}
            {activeTab !== 'reformes' && (
                <div className="bg-white rounded-2xl border shadow-sm p-2">
                    {(activeTab === 'boites' || activeTab === 'tambours') && inventoryData[activeTab].map(b => (
                        <button key={b.id} onClick={() => {
                            setSelectedBoiteId(b.id); 
                            setEditStatus(b.status); 
                            setEditComment(b.comment || ''); 
                            setEditImageUrl(b.imageUrl || null);
                            setEditImageUrls(b.imageUrls || (b.imageUrl ? [b.imageUrl] : []));
                        }} className="w-full flex justify-between items-center p-4 hover:bg-slate-50 border-b last:border-b-0 rounded-lg transition">
                            <span className="font-semibold text-slate-800">{b.name}</span>
                            <div className='flex items-center gap-3'>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(b.status)}`}>{b.status}</span>
                                <ChevronRight size={20} className='text-slate-400'/>
                            </div>
                        </button>
                    ))}
                    
                    {activeTab === 'instruments' && selectedInstStatus && inventoryData.instruments.filter(i => i.status === selectedInstStatus).map(i => (
                        <button key={i.id} onClick={() => {
                            setSelectedInstForDetail({...i, boiteId: i.boiteId, boiteName: i.boiteName}); 
                            setEditStatus(i.status); 
                            setEditComment(i.comment || ''); 
                            setEditImageUrl(i.imageUrl || null);
                            setEditImageUrls(i.imageUrls || (i.imageUrl ? [i.imageUrl] : []));
                        }} className="w-full flex justify-between items-center p-4 hover:bg-slate-50 border-b last:border-b-0 rounded-lg transition">
                            <div className='flex items-center gap-4'>
                                {i.imageUrl ? <img src={i.imageUrl} alt={i.name} className='h-12 w-12 rounded-lg object-cover'/> : <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">N/A</div>}
                                <div className='text-left'>
                                    <p className="font-semibold text-slate-800">{i.name}</p>
                                    <p className="text-xs text-slate-500">Boîte: {i.boiteName} • Réf: {i.serialNumber || 'N/A'}</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className='text-slate-400'/>
                        </button>
                    ))}
                    {activeTab === 'instruments' && !selectedInstStatus && (
                        <div className="p-8 text-center text-slate-500">
                            Cliquez sur un état (Bien, Moyen, ou Mauvais) ci-dessus pour afficher la liste des instruments correspondants.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'reformes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {state.reformes?.length > 0 ? state.reformes.map(reforme => (
                        <div key={reforme.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
                            {reforme.imageUrl ? (
                                <img src={reforme.imageUrl} alt={reforme.name} className="w-full h-40 object-cover bg-slate-100" />
                            ) : (
                                <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-slate-400">Pas d'image</div>
                            )}
                            <div className="p-4 flex-1">
                                <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-[10px] font-bold rounded mb-2">{reforme.type}</span>
                                <h4 className="font-bold text-slate-900 line-clamp-1">{reforme.name}</h4>
                                <p className="text-xs text-slate-500 mb-2">Réf: {reforme.reference || '-'} • {new Date(reforme.dateAdded).toLocaleDateString()}</p>
                                <p className="text-sm text-slate-700 line-clamp-2">{reforme.comment || 'Sans motif'}</p>
                            </div>
                            <div className="p-3 border-t bg-slate-50 flex justify-end gap-2">
                                <button onClick={() => setEditingReforme(reforme)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Modifier">
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button onClick={() => deleteReforme(reforme.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition" title="Supprimer">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-dashed rounded-2xl">
                            Aucun matériel réformé pour le moment.
                        </div>
                    )}
                </div>
            )}

            {editingReforme && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="font-bold text-xl text-slate-900">Modifier Réforme</h3>
                            <button onClick={() => setEditingReforme(null)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
                        </div>
                        <form onSubmit={handleSaveReforme} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Désignation</label>
                                <input type="text" value={editingReforme.name} onChange={(e) => setEditingReforme({...editingReforme, name: e.target.value})} className="w-full border p-2 rounded-xl" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Référence</label>
                                <input type="text" value={editingReforme.reference || ''} onChange={(e) => setEditingReforme({...editingReforme, reference: e.target.value})} className="w-full border p-2 rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Motif</label>
                                <textarea rows={3} value={editingReforme.comment || ''} onChange={(e) => setEditingReforme({...editingReforme, comment: e.target.value})} className="w-full border p-2 rounded-xl" />
                            </div>
                            <button type="submit" className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition">Enregistrer</button>
                        </form>
                    </div>
                </div>
            )}

            {renderInstrumentDetail()}
        </div>
    );
};


