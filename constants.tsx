
import { FunnelStage, WorkflowStage } from './types';

export const WORKFLOW_STAGES = [
  WorkflowStage.IdeaBacklog,
  WorkflowStage.CurrentlyInScripting,
  WorkflowStage.ScheduledToBeFilmed,
  WorkflowStage.NeedsPackaging,
  WorkflowStage.InEditing,
  WorkflowStage.ScheduledToBePublished,
  WorkflowStage.PublishedAnalyticsReview
];

export const FUNNEL_CONFIG = {
  [FunnelStage.TOF]: {
    label: 'TOF',
    name: 'Top of Funnel',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    formats: ['Pros & Cons', 'Listicles', 'Market Updates', 'Mistakes to Avoid', 'Truth / Warning'],
    runtimeRange: [18, 25],
    keywords: ['pros', 'cons', 'mistake', 'truth', 'warning', 'list', 'market', 'update', 'reasons', 'moving to']
  },
  [FunnelStage.MOF]: {
    label: 'MOF',
    name: 'Middle of Funnel',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    formats: ['Map Tours', 'In-Depth Rankings', 'City Tours', 'Neighborhood Tours', 'City vs City', 'Neighborhood Comparison', 'Everything You Need To Know'],
    runtimeRange: [20, 35],
    keywords: ['map', 'tour', 'ranking', 'neighborhood', 'city vs', 'everything', 'know about', 'compare']
  },
  [FunnelStage.BOF]: {
    label: 'BOF',
    name: 'Bottom of Funnel',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    formats: ['New Construction Tour', 'Builder Community Tour', 'Model Home Walkthrough', 'Area Spotlight'],
    runtimeRange: [30, 60],
    keywords: ['new construction', 'builder', 'model home', 'walkthrough', 'spotlight', 'community', 'buying', 'process']
  }
};
