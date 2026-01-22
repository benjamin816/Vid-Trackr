
import { FunnelStage, VideoCard, WorkflowStage } from '../types';
import { FUNNEL_CONFIG } from '../constants';

export const categorizeIdea = (text: string): Partial<VideoCard> => {
  const lowerText = text.toLowerCase();
  let detectedStage = FunnelStage.TOF; 
  let detectedFormat = 'Custom';
  let detectedRuntime = 22;

  // Improved Location Extraction
  let detectedLocation = '';
  
  // Regex to find "touring [X]", "in [X]", "of [X]", "exploring [X]"
  // Also looks for "[X] NC" or patterns like "Preserve in Wake Forest"
  const locationPatterns = [
    /(?:touring|toured|explore|exploring|in|of|about|to)\s+(the\s+)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s+in\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/, // "The Preserve in Wake Forest"
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s+NC)/i, // "Apex NC" or "Cary NC"
    /(?:touring|toured|explore|exploring|in|of|about|to)\s+(the\s+)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/ // Generic City/Area
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Get the capture group that isn't "the"
      const loc = match[match.length - 1];
      if (loc) {
        detectedLocation = loc.trim();
        // Append NC if not present and not already a complex location
        if (!detectedLocation.toUpperCase().includes('NC')) {
          detectedLocation += ', NC';
        }
        break;
      }
    }
  }

  // Refined Format Detection
  const isWalkingOrDriving = lowerText.includes('walking') || 
                             lowerText.includes('driving') || 
                             lowerText.includes('we toured') || 
                             lowerText.includes('full tour') || 
                             lowerText.includes('touring') ||
                             lowerText.includes('toured');
                             
  const isMap = lowerText.includes('map tour') || lowerText.includes('explained');
  const isNewConst = lowerText.includes('new construction') || lowerText.includes('builder') || lowerText.includes('model home');

  if (isNewConst) {
    detectedStage = FunnelStage.BOF;
    detectedRuntime = 45;
    detectedFormat = lowerText.includes('builder') ? 'Builder Community Tour' : 'New Construction Tour';
  } else if (isWalkingOrDriving && !isMap) {
    // touring/walking/driving takes priority over Map unless "map" is explicitly said
    detectedStage = FunnelStage.MOF;
    const isNeighborhood = lowerText.includes('neighborhood') || lowerText.includes('community') || lowerText.includes('preserve');
    detectedFormat = isNeighborhood ? 'Neighborhood Tours' : 'City Tours';
    detectedRuntime = isNeighborhood ? 28 : 45;
  } else if (isMap) {
    detectedStage = FunnelStage.MOF;
    detectedRuntime = 25;
    detectedFormat = 'Map Tours';
  } else {
    // Fallback to keyword matching from config
    if (FUNNEL_CONFIG.BOF.keywords.some(k => lowerText.includes(k))) {
      detectedStage = FunnelStage.BOF;
      detectedFormat = FUNNEL_CONFIG.BOF.formats[0];
    } else if (FUNNEL_CONFIG.MOF.keywords.some(k => lowerText.includes(k))) {
      detectedStage = FunnelStage.MOF;
      detectedFormat = FUNNEL_CONFIG.MOF.formats[0];
    } else {
      detectedStage = FunnelStage.TOF;
      detectedFormat = FUNNEL_CONFIG.TOF.formats[0];
    }
  }

  return {
    id: crypto.randomUUID(),
    title: text,
    funnelStage: detectedStage,
    formatType: detectedFormat,
    targetRuntime: detectedRuntime,
    status: WorkflowStage.IdeaBacklog,
    notes: '',
    neighborhood: detectedLocation,
    createdDate: new Date().toISOString(),
    inspirationLinks: [
      { url: '' },
      { url: '' },
      { url: '' }
    ],
    externalDocs: [],
    isArchived: false
  };
};
