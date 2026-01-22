
export enum FunnelStage {
  TOF = 'TOF',
  MOF = 'MOF',
  BOF = 'BOF'
}

export enum WorkflowStage {
  IdeaBacklog = 'Idea Backlog',
  CurrentlyInScripting = 'Currently in Scripting',
  ScheduledToBeFilmed = 'Scheduled to be Filmed',
  NeedsPackaging = 'Needs Packaging',
  InEditing = 'In Editing',
  ScheduledToBePublished = 'Scheduled to be Published',
  PublishedAnalyticsReview = 'Published & Analytics Review'
}

export interface InspirationLink {
  url: string;
  title?: string;
  thumbnail?: string;
}

export interface ExternalDoc {
  name: string;
  url: string; 
  type: 'pdf' | 'doc' | 'other';
}

export interface VideoCard {
  id: string;
  title: string;
  funnelStage: FunnelStage;
  formatType: string;
  targetRuntime: number; 
  status: WorkflowStage;
  notes: string;
  location?: string;
  neighborhood?: string;
  createdDate: string;
  targetShootDate?: string;
  targetPublishDate?: string;
  targetPublishTime?: string; 
  actualPublishDate?: string;
  deletedDate?: string;
  originalStatus?: WorkflowStage;
  youtubeLink?: string;
  inspirationLinks: InspirationLink[];
  externalDocs: ExternalDoc[];
  isArchived: boolean;
  isTrashed: boolean;
}

export type ViewMode = 'board' | 'calendar' | 'archive' | 'trash';
export type CalendarMode = 'month' | 'week' | 'day';
