import { useState, useEffect, useCallback } from 'react';
import { projectService, reportService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Avatar, Skeleton } from '../../components/ui';
import ProjectProgressReport from './ProjectProgressReport';
import BugSummaryReport from './BugSummaryReport';
import DeveloperAnalyticsReport from './DeveloperAnalyticsReport';

const tabs = [
  { id: 'progress', label: 'Project Progress' },
  { id: 'bugs', label: 'Bug Summary' },
  { id: 'developer', label: 'Developer Analytics' },
];

const EXPORT_TYPES = {
  progress: 'project-progress',
  bugs: 'bug-summary',
  developer: 'developer-analytics',
};

export default function ReportsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('progress');
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        const res = await projectService.getAll({ limit: 100 });
        setProjects(res.data || []);
        if (res.data?.length > 0) {
          setSelectedProject(res.data[0]._id);
        }
      } catch {
        toast.error('Failed to load projects');
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjects();
  }, [toast]);

  const handleExport = useCallback(async () => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }
    setExporting(true);
    try {
      const params = { project: selectedProject };
      await reportService.exportCSV(EXPORT_TYPES[activeTab], params);
      toast.success('Report exported successfully');
    } catch {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  }, [selectedProject, activeTab, toast]);

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze project progress, team performance, and track key metrics.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          loading={exporting}
          disabled={!selectedProject}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
        <div className="flex flex-wrap items-end gap-4">
          {/* Project selector */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Project</label>
            {projectsLoading ? (
              <Skeleton className="h-10 w-full rounded-xl" />
            ) : (
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%2394a3b8%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M4.646%206.646a.5.5%200%200%201%20.708%200L8%209.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10"
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

        </div>
      </div>

      {/* Pill tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-full p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'progress' && (
        <ProjectProgressReport project={selectedProject} />
      )}
      {activeTab === 'bugs' && (
        <BugSummaryReport project={selectedProject} />
      )}
      {activeTab === 'developer' && (
        <DeveloperAnalyticsReport project={selectedProject} />
      )}
    </div>
  );
}
