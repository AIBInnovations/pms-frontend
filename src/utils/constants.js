export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  PROJECT_MANAGER: 'project_manager',
  DEVELOPER: 'developer',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  project_manager: 'Project Manager',
  developer: 'Developer',
};

export const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
};

// ─── Projects ────────────────────────────────────────

export const PROJECT_TYPES = {
  fixed_cost: 'Fixed Cost',
  time_and_material: 'Time & Material',
  retainer: 'Retainer',
};

export const PROJECT_STATUSES = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
};

export const PROJECT_STATUS_COLORS = {
  planning: 'default',
  active: 'success',
  on_hold: 'warning',
  completed: 'primary',
};

export const PROJECT_DOMAINS = {
  coded_website_static: 'Coded Website Static',
  coded_web_app: 'Coded Web App',
  coded_software_system: 'Coded Software System',
  coded_app: 'Coded App',
  shopify: 'Shopify',
  wordpress: 'WordPress',
  ai_development: 'AI Development',
  automation: 'Automation',
  blockchain: 'Blockchain',
  ecommerce: 'E-Commerce',
  api_integration: 'API Integration',
  cloud_infrastructure: 'Cloud Infrastructure',
  ui_ux_design: 'UI/UX Design',
  data_analytics: 'Data Analytics',
  devops: 'DevOps',
  cyber_security: 'Cyber Security',
};

export const PROJECT_DOMAIN_COLORS = {
  coded_website_static: '#3b82f6',
  coded_web_app: '#6366f1',
  coded_software_system: '#8b5cf6',
  coded_app: '#a855f7',
  shopify: '#84cc16',
  wordpress: '#0ea5e9',
  ai_development: '#f59e0b',
  automation: '#f97316',
  blockchain: '#14b8a6',
  ecommerce: '#ec4899',
  api_integration: '#64748b',
  cloud_infrastructure: '#06b6d4',
  ui_ux_design: '#e11d48',
  data_analytics: '#10b981',
  devops: '#78716c',
  cyber_security: '#dc2626',
};

// ─── Tasks ───────────────────────────────────────────

export const TASK_TYPES = {
  feature: 'Feature',
  bug: 'Bug',
  improvement: 'Improvement',
  research: 'Research',
  deployment: 'Deployment',
};

export const TASK_PRIORITIES = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const TASK_PRIORITY_COLORS = {
  critical: 'danger',
  high: 'warning',
  medium: 'primary',
  low: 'default',
};

export const TASK_STAGES = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  testing: 'Testing',
  done: 'Done',
  archived: 'Archived',
};

export const TASK_STAGE_COLORS = {
  backlog: 'default',
  todo: 'default',
  in_progress: 'primary',
  in_review: 'warning',
  testing: 'warning',
  done: 'success',
  archived: 'default',
};

export const KANBAN_COLUMNS = ['backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done'];

// ─── Milestones ──────────────────────────────────────

export const MILESTONE_STATUSES = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

// ─── Bugs ─────────────────────────────────────────────

export const BUG_SEVERITIES = {
  critical: 'Critical',
  major: 'Major',
  minor: 'Minor',
  trivial: 'Trivial',
};

export const BUG_SEVERITY_COLORS = {
  critical: 'danger',
  major: 'warning',
  minor: 'primary',
  trivial: 'default',
};

export const BUG_STATUSES = {
  open: 'Open',
  in_progress: 'In Progress',
  fixed: 'Fixed',
  verified: 'Verified',
  closed: 'Closed',
  reopened: 'Reopened',
  wont_fix: "Won't Fix",
};

export const BUG_STATUS_COLORS = {
  open: 'danger',
  in_progress: 'primary',
  fixed: 'warning',
  verified: 'success',
  closed: 'default',
  reopened: 'danger',
  wont_fix: 'default',
};
