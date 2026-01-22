
import React, { useRef } from 'react';
import { VideoCard, WorkflowStage, FunnelStage } from '../types';
import { WORKFLOW_STAGES } from '../constants';
import VideoCardItem from './VideoCard';
import { Plus, Filter } from 'lucide-react';

interface KanbanBoardProps {
  cards: VideoCard[];
  onMoveCard: (id: string, newStatus: WorkflowStage) => void;
  onSelectCard: (id: string) => void;
  onAddAtStage: (stage: WorkflowStage) => void;
  onArchiveCard?: (id: string) => void;
  funnelFilter?: FunnelStage;
  onFunnelFilterChange: (stage: FunnelStage | undefined) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  cards, 
  onMoveCard, 
  onSelectCard, 
  onAddAtStage, 
  onArchiveCard,
  funnelFilter,
  onFunnelFilterChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleSliderScroll = () => {
    if (sliderRef.current && containerRef.current) {
      containerRef.current.scrollLeft = sliderRef.current.scrollLeft;
    }
  };

  const handleContainerScroll = () => {
    if (sliderRef.current && containerRef.current) {
      sliderRef.current.scrollLeft = containerRef.current.scrollLeft;
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, status: WorkflowStage) => {
    const cardId = e.dataTransfer.getData('cardId');
    onMoveCard(cardId, status);
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div 
        ref={sliderRef}
        onScroll={handleSliderScroll}
        className="w-full h-4 overflow-x-auto overflow-y-hidden border-b border-slate-200 bg-slate-100 flex items-center custom-scrollbar shrink-0"
      >
        <div style={{ width: `${WORKFLOW_STAGES.length * 256}px` }} className="h-1" />
      </div>

      <div 
        ref={containerRef}
        onScroll={handleContainerScroll}
        className="flex-1 flex overflow-x-auto overflow-y-hidden p-6 gap-4 items-start custom-scrollbar bg-slate-50/30"
      >
        {WORKFLOW_STAGES.map((stage) => {
          let stageCards = cards.filter(c => c.status === stage);
          const isBacklog = stage === WorkflowStage.IdeaBacklog;
          
          // Apply localized funnel filter for Idea Backlog column
          if (isBacklog && funnelFilter) {
            stageCards = stageCards.filter(c => c.funnelStage === funnelFilter);
          }
          
          return (
            <div 
              key={stage}
              className="flex-shrink-0 w-60 flex flex-col max-h-full"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column Header */}
              <div className="flex flex-col mb-3 bg-white rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10 shrink-0">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-50">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <h3 className="font-bold text-[8.5px] uppercase tracking-wider text-slate-500 truncate">{stage}</h3>
                    <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200 shrink-0">
                      {stageCards.length}
                    </span>
                  </div>
                  {!isBacklog && (
                    <button onClick={() => onAddAtStage(stage)} className="p-1 hover:bg-indigo-50 rounded-md text-slate-400 hover:text-indigo-600 transition-colors shrink-0">
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {/* Localized Filter for Idea Backlog */}
                {isBacklog && (
                  <div className="px-3 py-1.5 bg-slate-50/50 flex items-center gap-2 rounded-b-xl">
                    <Filter size={10} className="text-slate-400 shrink-0" />
                    <select 
                      className="w-full text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                      value={funnelFilter || ''}
                      onChange={(e) => onFunnelFilterChange(e.target.value as FunnelStage || undefined)}
                    >
                      <option value="">All Funnels</option>
                      <option value={FunnelStage.TOF}>TOF (Top)</option>
                      <option value={FunnelStage.MOF}>MOF (Middle)</option>
                      <option value={FunnelStage.BOF}>BOF (Bottom)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto min-h-[200px] flex flex-col gap-3 pb-8 pr-1.5 custom-scrollbar">
                {stageCards.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl py-10 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-20 text-center">
                      {funnelFilter ? `No ${funnelFilter} Ideas` : 'Empty'}
                    </span>
                  </div>
                ) : (
                  stageCards.map(card => (
                    <VideoCardItem 
                      key={card.id} 
                      card={card} 
                      onSelect={() => onSelectCard(card.id)} 
                      onArchive={onArchiveCard}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
        <div className="flex-shrink-0 w-12" />
      </div>
    </div>
  );
};

export default KanbanBoard;
