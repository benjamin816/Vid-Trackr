
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Archive, 
  Layout, 
  Calendar as CalendarIcon, 
  Sparkles,
  Undo2,
  Trash2,
  X as CloseIcon,
  Cloud,
  CloudOff,
  CloudDownload,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Globe,
  Settings
} from 'lucide-react';
import { VideoCard, ViewMode, WorkflowStage, FunnelStage } from './types';
import KanbanBoard from './components/KanbanBoard';
import CalendarView from './components/CalendarView';
import ArchiveView from './components/ArchiveView';
import TrashView from './components/TrashView';
import IdeaInput from './components/IdeaInput';
import CardModal from './components/CardModal';

/**
 * CLIENT ID CONFIGURATION
 */
const CLIENT_ID = "979572069887-6c96876re4v9udofbpqbfmqjru2q91q3.apps.googleusercontent.com";

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

type SyncStatus = 'disconnected' | 'connecting' | 'synced' | 'syncing' | 'error' | 'unauthorized';

const App: React.FC = () => {
  const [cards, setCards] = useState<VideoCard[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [funnelFilter, setFunnelFilter] = useState<FunnelStage | undefined>(undefined);
  
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [inputDefaultStatus, setInputDefaultStatus] = useState<WorkflowStage | undefined>(undefined);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disconnected');
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const tokenClientRef = useRef<any>(null);
  const driveFileIdRef = useRef<string | null>(null);

  const [undoToast, setUndoToast] = useState<{ visible: boolean; cardId: string | null; action: 'delete' | 'archive' | null }>({ visible: false, cardId: null, action: null });
  const undoTimerRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // --- Initial Load Logic ---
  useEffect(() => {
    const saved = localStorage.getItem('video_funnel_tracker_cards');
    if (saved) {
      try {
        setCards(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local cards", e);
      }
    } else {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const templateCard: VideoCard = {
        id: crypto.randomUUID(),
        title: "Template: Why Raleigh is Booming in 2025",
        funnelStage: FunnelStage.TOF,
        formatType: "Pros & Cons",
        targetRuntime: 22,
        status: WorkflowStage.IdeaBacklog,
        notes: "Welcome! Connect your Google Drive to sync this board with your team.",
        neighborhood: "Raleigh, NC",
        createdDate: new Date().toISOString(),
        targetShootDate: today.toISOString().split('T')[0],
        targetPublishDate: nextWeek.toISOString().split('T')[0],
        targetPublishTime: "10:00",
        inspirationLinks: [{ url: '' }, { url: '' }, { url: '' }],
        externalDocs: [],
        isArchived: false,
        isTrashed: false
      };
      setCards([templateCard]);
    }

    const initGapi = async () => {
      try {
        // @ts-ignore
        gapi.load('client', async () => {
          // @ts-ignore
          await gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
          });
          setIsGapiLoaded(true);
        });

        // @ts-ignore
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: async (response: any) => {
            if (response.error !== undefined) {
              setSyncStatus('error');
              return;
            }
            await handleSyncWithDrive();
          },
        });
      } catch (err) {
        console.error("GAPI initialization failed:", err);
      }
    };

    if (CLIENT_ID && !CLIENT_ID.includes("YOUR_CLIENT_ID")) {
      initGapi();
    }
  }, []);

  // --- Auto-Save Sync Engine ---
  useEffect(() => {
    if (cards.length >= 0) {
      localStorage.setItem('video_funnel_tracker_cards', JSON.stringify(cards));
      
      if (syncStatus === 'synced' || syncStatus === 'syncing') {
        if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = window.setTimeout(() => {
          saveToDrive(cards);
        }, 2500);
      }
    }
  }, [cards, syncStatus]);

  const handleSyncWithDrive = async () => {
    setSyncStatus('connecting');
    try {
      // @ts-ignore
      const response = await gapi.client.drive.files.list({
        q: "name = 'video_pipeline_data.json' and trashed = false",
        fields: 'files(id, name)',
      });

      const files = response.result.files;
      if (files && files.length > 0) {
        driveFileIdRef.current = files[0].id;
        // @ts-ignore
        const fileContent = await gapi.client.drive.files.get({
          fileId: driveFileIdRef.current,
          alt: 'media',
        });
        if (fileContent.result) {
          setCards(fileContent.result);
          setSyncStatus('synced');
        }
      } else {
        await saveToDrive(cards, true);
      }
    } catch (err: any) {
      console.error("Cloud Sync Operation Failed:", err);
      if (err.status === 401 || err.status === 403) {
        setSyncStatus('unauthorized');
      } else {
        setSyncStatus('error');
      }
    }
  };

  const saveToDrive = async (data: VideoCard[], isNew: boolean = false) => {
    if (!isGapiLoaded) return;
    setSyncStatus('syncing');
    try {
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const metadata = {
        'name': 'video_pipeline_data.json',
        'mimeType': 'application/json',
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(data) +
        close_delim;

      if (isNew || !driveFileIdRef.current) {
        // @ts-ignore
        const response = await gapi.client.request({
          'path': '/upload/drive/v3/files',
          'method': 'POST',
          'params': { 'uploadType': 'multipart' },
          'headers': { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
          'body': multipartRequestBody
        });
        driveFileIdRef.current = response.result.id;
      } else {
        // @ts-ignore
        await gapi.client.request({
          'path': '/upload/drive/v3/files/' + driveFileIdRef.current,
          'method': 'PATCH',
          'params': { 'uploadType': 'multipart' },
          'headers': { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
          'body': multipartRequestBody
        });
      }
      setSyncStatus('synced');
    } catch (err: any) {
      console.error("Cloud Save Failed:", err);
      setSyncStatus('error');
    }
  };

  const connectToDrive = () => {
    if (CLIENT_ID.includes("YOUR_CLIENT_ID")) {
      alert("⚠️ Action Required: Update the CLIENT_ID in App.tsx to enable cloud sync.");
      return;
    }
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    }
  };

  // --- Handlers ---
  const addCards = useCallback((newCards: VideoCard[]) => setCards(prev => [...prev, ...newCards]), []);
  const updateCard = useCallback((updatedCard: VideoCard) => setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c)), []);
  const deleteCardToTrash = useCallback((id: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, isTrashed: true, deletedDate: new Date().toISOString(), originalStatus: c.status } : c));
    setUndoToast({ visible: true, cardId: id, action: 'delete' });
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = window.setTimeout(() => setUndoToast({ visible: false, cardId: null, action: null }), 5000);
  }, []);

  const archiveCard = useCallback((id: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, isArchived: true, status: WorkflowStage.PublishedAnalyticsReview, actualPublishDate: new Date().toISOString(), originalStatus: c.status } : c));
    setUndoToast({ visible: true, cardId: id, action: 'archive' });
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = window.setTimeout(() => setUndoToast({ visible: false, cardId: null, action: null }), 5000);
  }, []);

  const moveCard = useCallback((id: string, newStatus: WorkflowStage) => {
    setCards(prev => prev.map(c => {
      if (c.id === id) {
        const isFinal = newStatus === WorkflowStage.PublishedAnalyticsReview;
        return { ...c, status: newStatus, isArchived: isFinal, actualPublishDate: isFinal ? new Date().toISOString() : c.actualPublishDate, originalStatus: c.status };
      }
      return c;
    }));
  }, []);

  const rescheduleCard = useCallback((id: string, date: string, type: 'shoot' | 'publish') => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, [type === 'shoot' ? 'targetShootDate' : 'targetPublishDate']: date } : c));
  }, []);

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) || (card.neighborhood || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (viewMode === 'trash') return card.isTrashed;
      if (viewMode === 'archive') return card.isArchived && !card.isTrashed;
      return !card.isTrashed && !card.isArchived;
    });
  }, [cards, searchQuery, viewMode]);

  const activeCard = useMemo(() => cards.find(c => c.id === selectedCardId), [cards, selectedCardId]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Video Funnel</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Production HQ</p>
          </div>
        </div>
        
        <div className="flex-1 max-w-xl px-12 hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search ideas, locations..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 transition-all" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Cloud Sync Status Button */}
          <div className="relative group">
            <button 
              onClick={connectToDrive}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all shadow-sm ${
                syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                syncStatus === 'syncing' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                (syncStatus === 'error' || syncStatus === 'unauthorized') ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-500 hover:text-indigo-600'
              }`}
            >
              {syncStatus === 'synced' && <Cloud size={16} />}
              {syncStatus === 'syncing' && <RefreshCw size={16} className="animate-spin" />}
              {syncStatus === 'disconnected' && <CloudOff size={16} />}
              {syncStatus === 'connecting' && <CloudDownload size={16} className="animate-pulse-soft" />}
              {(syncStatus === 'error' || syncStatus === 'unauthorized') && <AlertCircle size={16} />}
              <span className="hidden sm:inline">
                {syncStatus === 'synced' ? 'Cloud Synced' : syncStatus === 'syncing' ? 'Saving...' : 
                 syncStatus === 'unauthorized' ? 'Verify Auth' : 'Connect Drive'}
              </span>
            </button>
            
            {(syncStatus === 'error' || syncStatus === 'unauthorized' || syncStatus === 'disconnected') && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white p-4 rounded-xl shadow-2xl border border-slate-200 z-50 invisible group-hover:visible transition-all">
                <p className="text-xs font-bold text-indigo-600 mb-2 flex items-center gap-2"><Globe size={14} /> Security Whitelist</p>
                <p className="text-[10px] leading-relaxed text-slate-500 mb-3">
                  Google blocks sign-ins unless your URL is whitelisted in your Cloud Console.
                </p>
                <div className="space-y-2">
                   <div>
                    <label className="text-[8px] font-bold text-slate-400 uppercase">Authorized Origin:</label>
                    <code className="block bg-slate-100 p-1 rounded text-[9px] break-all font-mono select-all">https://benjamin816.github.io</code>
                   </div>
                   <div>
                    <label className="text-[8px] font-bold text-slate-400 uppercase">Authorized Redirect URI:</label>
                    <code className="block bg-slate-100 p-1 rounded text-[9px] break-all font-mono select-all">https://benjamin816.github.io/Vid-Trackr/</code>
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setViewMode('board')} className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><Layout size={18} /></button>
            <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><CalendarIcon size={18} /></button>
            <button onClick={() => setViewMode('archive')} className={`p-1.5 rounded-md transition-all ${viewMode === 'archive' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><Archive size={18} /></button>
            <button onClick={() => setViewMode('trash')} className={`p-1.5 rounded-md transition-all ${viewMode === 'trash' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}><Trash2 size={18} /></button>
          </div>
          
          <button 
            onClick={() => { setInputDefaultStatus(undefined); setIsInputOpen(true); }} 
            className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            <Plus size={18} /> New Idea
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {viewMode === 'board' && <KanbanBoard cards={filteredCards} onMoveCard={moveCard} onSelectCard={setSelectedCardId} onAddAtStage={(stage) => { setInputDefaultStatus(stage); setIsInputOpen(true); }} onArchiveCard={archiveCard} funnelFilter={funnelFilter} onFunnelFilterChange={setFunnelFilter} />}
        {viewMode === 'calendar' && <CalendarView cards={filteredCards} onSelectCard={setSelectedCardId} onReschedule={rescheduleCard} />}
        {viewMode === 'archive' && <ArchiveView cards={filteredCards} onSelectCard={setSelectedCardId} onUnarchive={(id) => { const c = cards.find(card => card.id === id); if (c) updateCard({ ...c, isArchived: false, status: c.originalStatus || WorkflowStage.IdeaBacklog }); }} />}
        {viewMode === 'trash' && <TrashView cards={filteredCards} onRestore={(id) => { const c = cards.find(card => card.id === id); if (c) updateCard({ ...c, isTrashed: false, status: c.originalStatus || WorkflowStage.IdeaBacklog, deletedDate: undefined }); }} onPermanentDelete={(id) => setCards(prev => prev.filter(c => c.id !== id))} />}
        
        {undoToast.visible && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 min-w-[320px]">
              <p className="text-sm font-bold capitalize flex-1">{undoToast.action === 'delete' ? 'Moved to trash' : 'Moved to archive'}</p>
              <button onClick={() => { 
                if (undoToast.cardId) {
                  setCards(prev => prev.map(c => c.id === undoToast.cardId ? { ...c, isTrashed: false, isArchived: false, status: c.originalStatus || WorkflowStage.IdeaBacklog, deletedDate: undefined } : c));
                  setUndoToast({ visible: false, cardId: null, action: null });
                }
              }} className="text-indigo-400 hover:text-indigo-300 text-sm font-bold uppercase">Undo</button>
              <button onClick={() => setUndoToast({ visible: false, cardId: null, action: null })} className="text-slate-500 hover:text-white"><CloseIcon size={18} /></button>
            </div>
          </div>
        )}
      </main>

      <IdeaInput isOpen={isInputOpen} onClose={() => setIsInputOpen(false)} onAdd={addCards} defaultStatus={inputDefaultStatus} />
      {activeCard && <CardModal card={activeCard} isOpen={!!selectedCardId} onClose={() => setSelectedCardId(null)} onUpdate={updateCard} onDelete={deleteCardToTrash} />}
    </div>
  );
};

export default App;
