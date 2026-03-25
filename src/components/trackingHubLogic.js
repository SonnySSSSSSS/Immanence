import { ARCHIVE_TABS } from './tracking/archiveLinkConstants.js';
import { addDaysToDateKey, getLocalDateKey } from '../utils/dateUtils.js';

export const TRACKING_DOMAINS = [
  { id: 'breathwork', label: 'Breathwork', iconName: 'breathwork' },
  { id: 'visualization', label: 'Visualization', iconName: 'visualization' },
  { id: 'wisdom', label: 'Wisdom', iconName: 'wisdom' },
];

export const TRACKING_T_REF = 12;
export const TRACKING_HEATMAP_DAYS = 84;

export function getInitialHeatmapOpen(trackerItemsRaw) {
  return trackerItemsRaw.length > 0;
}

export function getTrackingArchiveTab(primaryDomainId) {
  return primaryDomainId === 'wisdom' ? ARCHIVE_TABS.WISDOM : ARCHIVE_TABS.PRACTICE;
}

export function getTrackingHubCoordinatorState({
  trackerItemsRaw,
  getTrackerRange,
  getPrimaryDomain,
  now = new Date(),
}) {
  const trackerItems = [...trackerItemsRaw].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const todayDateKey = getLocalDateKey(now);
  const endDateKey = todayDateKey;
  const startDateKey = addDaysToDateKey(endDateKey, -(TRACKING_HEATMAP_DAYS - 1));
  const trackerRange = getTrackerRange({ startDateKey, endDateKey });
  const primaryDomain = getPrimaryDomain();
  const primaryDomainObj = TRACKING_DOMAINS.find((domain) => domain.id === primaryDomain) || TRACKING_DOMAINS[0];

  return {
    trackerItems,
    todayDateKey,
    trackerRange,
    primaryDomain,
    primaryDomainObj,
  };
}
