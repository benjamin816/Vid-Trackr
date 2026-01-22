
import React from 'react';
import { VideoCard, WorkflowStage } from '../types';
import { FUNNEL_CONFIG } from '../constants';
import { Clock, MapPin, Calendar, ExternalLink, Camera, CheckCircle2 } from 'lucide-react';

interface VideoCardItemProps {
  card: VideoCard;
  onSelect: () => void;
  onArchive?: (id: string) => void;
}

const VideoCardItem: React.FC<VideoCardItemProps> = ({ card, onSelect, onArchive }) => {
  const funnel = FUNNEL_CONFIG[card.funnelStage];
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('cardId', card.id);
  };

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArchive) {
      onArchive(card.id);
    }
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer select-none active:scale-95"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${funnel.color}`}>
          {funnel.label}
        </span>
      </div>

      <h4 className="font-semibold text-sm text-slate-800 leading-snug mb-3 group-hover:text-indigo-600">
        {card.title}
      </h4>

      <div className="space-y-2">
        {card.neighborhood && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium truncate">
            <MapPin size={12} className="text-slate-400" />
            <span>{card.neighborhood}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <Clock size={12} className="text-slate-400" />
          <span>{card.targetRuntime}m Target</span>
        </div>

        {card.targetShootDate && (
          <div className="flex items-center gap-2 text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md inline-flex">
            <Camera size={12} className="text-indigo-400" />
            <span>Shoot: {new Date(card.targetShootDate).toLocaleDateString()}</span>
          </div>
        )}

        {card.targetPublishDate && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <Calendar size={12} className="text-slate-400" />
            <span>Publish: {new Date(card.targetPublishDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {card.status === WorkflowStage.PublishedAnalyticsReview && (
        <button 
          onClick={handleArchiveClick}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-bold py-2 rounded-lg transition-all shadow-lg shadow-slate-200"
        >
          <CheckCircle2 size={14} /> COMPLETE & ARCHIVE
        </button>
      )}

      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          {card.formatType}
        </span>
        <div className="flex gap-2">
           {card.externalDocs?.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Has Docs"></span>}
           {card.inspirationLinks?.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Has Inspo"></span>}
           {card.youtubeLink && <ExternalLink size={12} className="text-slate-300" />}
        </div>
      </div>
    </div>
  );
};

export default VideoCardItem;
