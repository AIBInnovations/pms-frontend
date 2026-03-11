import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { Button, Badge, Avatar, Input, Select, EmptyState, Skeleton } from '../../components/ui';
import { PROJECT_TYPES, PROJECT_STATUSES, PROJECT_STATUS_COLORS, PROJECT_DOMAINS, PROJECT_DOMAIN_COLORS, ROLES } from '../../utils/constants';
import CreateProjectModal from './CreateProjectModal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canCreate = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.PROJECT_MANAGER;

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (domainFilter) params.domain = domainFilter;
      const response = await projectService.getAll(params);
      setProjects(response.data);
      setMeta(response.meta);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter, domainFilter, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Projects
            {meta && <span className="text-sm font-normal text-slate-400 ml-2">{meta.total}</span>}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your projects and track progress</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <Input
              className="pl-10"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            options={Object.entries(PROJECT_TYPES).map(([value, label]) => ({ value, label }))}
            placeholder="All types"
          />
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={Object.entries(PROJECT_STATUSES).map(([value, label]) => ({ value, label }))}
            placeholder="All statuses"
          />
          <Select
            value={domainFilter}
            onChange={(e) => { setDomainFilter(e.target.value); setPage(1); }}
            options={Object.entries(PROJECT_DOMAINS).map(([value, label]) => ({ value, label }))}
            placeholder="All domains"
          />
        </div>
      </div>

      {/* Project Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" className="w-20" />
                <Skeleton variant="button" className="w-16" />
              </div>
              <Skeleton variant="text" className="w-3/4 mt-3" />
              <Skeleton variant="text" className="w-full mt-2" />
              <Skeleton variant="text" className="w-2/3 mt-1" />
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <Skeleton variant="button" className="w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton variant="circle" className="w-6 h-6" />
                  <Skeleton variant="text" className="w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Try adjusting your filters or create a new project."
          action={canCreate ? <Button onClick={() => setShowCreateModal(true)} size="sm">New Project</Button> : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project._id}
              className="card p-5 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-200 cursor-pointer"
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              {/* Top row: code + status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">{project.code}</span>
                <Badge color={PROJECT_STATUS_COLORS[project.status] || 'default'}>
                  {PROJECT_STATUSES[project.status] || project.status}
                </Badge>
              </div>

              {/* Project name */}
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-2 line-clamp-1">{project.name}</h3>

              {/* Description */}
              {project.description ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{project.description}</p>
              ) : (
                <p className="text-xs text-slate-400 mt-1 italic">No description</p>
              )}

              {/* Domain tags */}
              {project.domains?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.domains.slice(0, 3).map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                      style={{ backgroundColor: PROJECT_DOMAIN_COLORS[d] || '#64748b' }}
                    >
                      {PROJECT_DOMAINS[d] || d}
                    </span>
                  ))}
                  {project.domains.length > 3 && (
                    <span className="text-[10px] text-slate-400 self-center">+{project.domains.length - 3}</span>
                  )}
                </div>
              )}

              {/* Bottom row: type + PM */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <Badge color="default">{PROJECT_TYPES[project.type] || project.type}</Badge>
                {project.projectManager && (
                  <div className="flex items-center gap-2">
                    <Avatar name={project.projectManager.name} size="sm" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{project.projectManager.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 card">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {(meta.page - 1) * meta.limit + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { setShowCreateModal(false); fetchProjects(); }}
      />
    </div>
  );
}
