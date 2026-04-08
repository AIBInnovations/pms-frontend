export const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', color: 'bg-pink-500', initial: 'IG' },
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-600', initial: 'IN' },
  { value: 'twitter', label: 'X (Twitter)', color: 'bg-slate-900', initial: 'X' },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.value, p]));

export const STATUSES = [
  { value: 'idea', label: 'Idea', color: 'default' },
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'pending_approval', label: 'Pending', color: 'warning' },
  { value: 'scheduled', label: 'Scheduled', color: 'primary' },
  { value: 'published', label: 'Published', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'danger' },
  { value: 'archived', label: 'Archived', color: 'default' },
];

export const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.value, s]));

// Status dot colors for calendar chips
export const STATUS_DOT = {
  idea: 'bg-slate-300',
  draft: 'bg-slate-400',
  pending_approval: 'bg-amber-500',
  scheduled: 'bg-blue-500',
  published: 'bg-emerald-500',
  rejected: 'bg-red-500',
  archived: 'bg-slate-300',
};
