
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Trash2, 
  Save, 
  Clock, 
  MapPin, 
  Calendar, 
  Link as LinkIcon, 
  FileText,
  Hash,
  Activity,
  Sparkles,
  Camera,
  Youtube,
  Plus,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { VideoCard, WorkflowStage, FunnelStage } from '../types';
import { WORKFLOW_STAGES, FUNNEL_CONFIG } from '../constants';
import { GoogleGenAI } from "@google/genai";

interface CardModalProps {
  card: VideoCard;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (card: VideoCard) => void;
  onDelete: (id: string) => void;
}

const CardModal: React.FC<CardModalProps> = ({ card, isOpen, onClose, onUpdate, onDelete }) => {
  const getInitialLinks = () => {
    const links = [...(card.inspirationLinks || [])];
    while (links.length < 3) links.push({ url: '' });
    return links.slice(0, 3);
  };

  const [edited, setEdited] = useState<VideoCard>({ 
    ...card,
    inspirationLinks: getInitialLinks(),
    externalDocs: card.externalDocs || []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [fetchingIndices, setFetchingIndices] = useState<Set<number>>(new Set());
  const fetchedUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    edited.inspirationLinks.forEach((link, index) => {
      const url = link.url.trim();
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
      if (url && isYouTube && !link.title && !fetchingIndices.has(index) && !fetchedUrls.current.has(url)) {
        autoFetchMetadata(index, url);
      }
    });
  }, [edited.inspirationLinks]);

  const autoFetchMetadata = async (index: number, url: string) => {
    if (!process.env.API_KEY) return;
    setFetchingIndices(prev => new Set(prev).add(index));
    fetchedUrls.current.add(url);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Find the exact video title and a thumbnail URL for this YouTube video: ${url}. Return ONLY a JSON object: {"title": "String", "thumbnail": "String"}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });
      
      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setEdited(prev => {
          const updated = [...prev.inspirationLinks];
          updated[index] = { ...updated[index], ...data };
          return { ...prev, inspirationLinks: updated };
        });
      }
    } catch (err) {
      console.error("AI Fetch Error:", err);
    } finally {
      setFetchingIndices(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const generateAIOutline = async () => {
    if (!process.env.API_KEY) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Create a YouTube script outline for a real estate video. Title: "${edited.title}". Funnel: ${edited.funnelStage}. Format: ${edited.formatType}. Include a hook, 4 main points, and a CTA. Use Markdown.`;
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-pro-preview', 
        contents: prompt 
      });
      if (response.text) {
        setEdited(prev => ({ 
          ...prev, 
          notes: (prev.notes ? prev.notes + "\n\n" : "") + "### ✨ AI SCRIPT STRATEGY\n" + response.text 
        }));
      }
    } catch (err) {
      console.error("AI Outline Generation Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = () => { onUpdate(edited); onClose(); };

  const updateInspirationLink = (index: number, url: string) => {
    const updated = [...edited.inspirationLinks];
    updated[index] = { url, title: undefined, thumbnail: undefined };
    if (edited.inspirationLinks[index].url) fetchedUrls.current.delete(edited.inspirationLinks[index].url);
    setEdited(prev => ({ ...prev, inspirationLinks: updated }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase border ${FUNNEL_CONFIG[edited.funnelStage].color}`}>
              {edited.funnelStage}
            </span>
            <div className="flex items-center gap-1 text-slate-400">
               <Activity size={14} />
               <span className="text-[10px] font-bold uppercase tracking-widest">{edited.status}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { onDelete(card.id); onClose(); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={20} /></button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <input 
            type="text" 
            className="w-full text-3xl font-bold text-slate-800 border-none bg-transparent focus:ring-0 px-0 mb-8 outline-none"
            value={edited.title}
            onChange={(e) => setEdited(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Working Title..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Strategy & Format</label>
                <div className="flex gap-3">
                  <select className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={edited.funnelStage} onChange={(e) => setEdited(prev => ({ ...prev, funnelStage: e.target.value as FunnelStage }))}>
                    {Object.values(FunnelStage).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={edited.formatType} onChange={(e) => setEdited(prev => ({ ...prev, formatType: e.target.value }))}>
                    {FUNNEL_CONFIG[edited.funnelStage].formats.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Target Mins</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 outline-none" value={edited.targetRuntime} onChange={(e) => setEdited(prev => ({ ...prev, targetRuntime: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Neighborhood</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm p-3 outline-none" value={edited.neighborhood || ''} onChange={(e) => setEdited(prev => ({ ...prev, neighborhood: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-center">
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-4 flex items-center gap-2"><Calendar size={14} /> Important Dates</label>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">Filming:</span>
                  <input type="date" className="bg-white border border-indigo-100 rounded-lg p-1" value={edited.targetShootDate || ''} onChange={(e) => setEdited(prev => ({ ...prev, targetShootDate: e.target.value }))} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">Publishing:</span>
                  <input type="date" className="bg-white border border-indigo-100 rounded-lg p-1" value={edited.targetPublishDate || ''} onChange={(e) => setEdited(prev => ({ ...prev, targetPublishDate: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          <button onClick={generateAIOutline} disabled={isGenerating} className="w-full mb-8 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50 transition-all">
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isGenerating ? 'AI Architecting...' : 'Build AI Content Strategy'}
          </button>

          <div className="mb-8">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Competitor Reference (Auto-Fetching)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {edited.inspirationLinks.map((link, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 overflow-hidden">
                  <div className="h-20 bg-slate-200 rounded-xl mb-3 overflow-hidden relative">
                    {fetchingIndices.has(idx) ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm"><Loader2 size={16} className="animate-spin text-indigo-600" /></div>
                    ) : link.thumbnail ? (
                      <img src={link.thumbnail} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400"><Youtube size={24} /></div>
                    )}
                  </div>
                  <input type="text" placeholder="YouTube Link..." className="w-full bg-transparent border-none p-0 text-[10px] font-bold text-slate-600 focus:ring-0 truncate" value={link.url} onChange={(e) => updateInspirationLink(idx, e.target.value)} />
                  {link.title && <p className="text-[9px] text-slate-400 mt-1 line-clamp-1">{link.title}</p>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Notes & Scripting Area</label>
            <textarea rows={10} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none font-mono" value={edited.notes} onChange={(e) => setEdited(prev => ({ ...prev, notes: e.target.value }))} placeholder="Draft your content here..." />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Workflow:</label>
            <select className="bg-white border border-slate-200 rounded-xl text-xs font-bold p-2" value={edited.status} onChange={(e) => setEdited(prev => ({ ...prev, status: e.target.value as WorkflowStage }))}>
              {WORKFLOW_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500">Discard</button>
            <button onClick={handleSave} className="bg-slate-900 text-white px-10 py-2.5 rounded-xl font-bold shadow-lg hover:bg-black transition-all active:scale-95 flex items-center gap-2"><Save size={18} /> Save Board</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
