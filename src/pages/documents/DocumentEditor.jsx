import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService, projectService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Badge, Skeleton } from '../../components/ui';

const CATEGORY_LABELS = {
  requirement: 'Requirement',
  design: 'Design',
  technical: 'Technical',
  meeting_notes: 'Meeting Notes',
  guide: 'Guide',
  other: 'Other',
};

const CATEGORY_COLORS = {
  requirement: 'primary',
  design: 'success',
  technical: 'warning',
  meeting_notes: 'default',
  guide: 'primary',
  other: 'default',
};

const categoryOptions = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

export default function DocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('other');
  const [tags, setTags] = useState('');
  const [project, setProject] = useState('');
  const [projects, setProjects] = useState([]);
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Fetch project options for the create form
  useEffect(() => {
    if (!isEditMode) {
      projectService.getAll({ limit: 100 }).then((res) => setProjects(res.data)).catch(() => {});
    }
  }, [isEditMode]);

  // Fetch document in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchDocument = async () => {
      setLoading(true);
      try {
        const response = await documentService.getById(id);
        const data = response.data;
        setDoc(data);
        setTitle(data.title || '');
        setContent(data.content || '');
        setCategory(data.category || 'other');
        setTags(data.tags ? data.tags.join(', ') : '');
        setProject(data.project?._id || '');
      } catch {
        toast.error('Failed to load document');
        navigate('/documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, isEditMode, navigate, toast]);

  // Fetch version history
  const fetchVersions = useCallback(async () => {
    if (!id) return;
    setLoadingVersions(true);
    try {
      const response = await documentService.getVersionHistory(id);
      setVersions(response.data);
    } catch {
      toast.error('Failed to load version history');
    } finally {
      setLoadingVersions(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (showVersions && isEditMode) {
      fetchVersions();
    }
  }, [showVersions, isEditMode, fetchVersions]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    if (!isEditMode && !project) {
      toast.error('Please select a project');
      return;
    }

    setSaving(true);
    try {
      const tagsArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (isEditMode) {
        await documentService.update(id, { title, content, category, tags: tagsArray });
        toast.success('Document updated successfully');
        // Refresh document data
        const response = await documentService.getById(id);
        setDoc(response.data);
      } else {
        const response = await documentService.create({
          project,
          title,
          content,
          category,
          tags: tagsArray,
        });
        toast.success('Document created successfully');
        navigate(`/documents/${response.data._id}`, { replace: true });
      }
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to save document';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (versionNumber) => {
    try {
      await documentService.restoreVersion(id, versionNumber);
      toast.success(`Restored to version ${versionNumber}`);
      // Refresh document + versions
      const [docRes, verRes] = await Promise.all([
        documentService.getById(id),
        documentService.getVersionHistory(id),
      ]);
      const data = docRes.data;
      setDoc(data);
      setTitle(data.title || '');
      setContent(data.content || '');
      setCategory(data.category || 'other');
      setTags(data.tags ? data.tags.join(', ') : '');
      setVersions(verRes.data);
    } catch {
      toast.error('Failed to restore version');
    }
  };

  const projectOptions = projects.map((p) => ({ value: p._id, label: `${p.code} — ${p.name}` }));

  // Loading state for edit mode
  if (isEditMode && loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton variant="button" className="w-20" />
          <Skeleton variant="title" className="w-64" />
        </div>
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5 space-y-4">
          <Skeleton variant="title" className="w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton variant="text" className="w-full h-10" />
            <Skeleton variant="text" className="w-full h-10" />
          </div>
          <Skeleton variant="card" className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate('/documents')}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isEditMode ? 'Edit Document' : 'New Document'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditMode
                ? `Editing version ${doc?.version || 1}`
                : 'Create a new project document'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <Button
              variant={showVersions ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowVersions(!showVersions)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              History
            </Button>
          )}
          <Button onClick={handleSave} loading={saving}>
            {isEditMode ? 'Save Changes' : 'Create Document'}
          </Button>
        </div>
      </div>

      <div className={`flex gap-5 ${showVersions ? '' : ''}`}>
        {/* Main Editor */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Title */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
            <input
              type="text"
              className="w-full text-lg font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 border-0 outline-none bg-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
            />
          </div>

          {/* Meta fields */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
            <div className={`grid gap-4 ${isEditMode ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {/* Project select (create mode only) */}
              {!isEditMode && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Project</label>
                  <select
                    className="input-base appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%2394a3b8%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M4.646%206.646a.5.5%200%200%201%20.708%200L8%209.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10 text-sm"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                  >
                    <option value="">Select project</option>
                    {projectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
                <select
                  className="input-base appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%2394a3b8%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M4.646%206.646a.5.5%200%200%201%20.708%200L8%209.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Tags</label>
                <input
                  type="text"
                  className="input-base text-sm"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Comma-separated tags (e.g., api, v2, auth)"
                />
              </div>
            </div>

            {/* Edit mode info bar */}
            {isEditMode && doc && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400">
                <Badge size="sm" color={CATEGORY_COLORS[doc.category] || 'default'}>
                  {CATEGORY_LABELS[doc.category] || doc.category}
                </Badge>
                <Badge size="sm" color="default">v{doc.version || 1}</Badge>
                {doc.project && (
                  <span>{doc.project.code} — {doc.project.name}</span>
                )}
                {doc.lastEditedBy?.name && (
                  <span className="ml-auto">Last edited by {doc.lastEditedBy.name}</span>
                )}
              </div>
            )}
          </div>

          {/* Content textarea */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Content</label>
            <textarea
              className="input-base min-h-[400px] font-mono text-sm resize-y w-full"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your document content here (Markdown supported)..."
            />
          </div>
        </div>

        {/* Version History Sidebar */}
        {showVersions && isEditMode && (
          <div className="w-80 shrink-0">
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden sticky top-5">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Version History</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
                {loadingVersions ? (
                  <div className="flex items-center justify-center py-12">
                    <svg
                      className="animate-spin h-5 w-5 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </div>
                ) : versions.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-400">
                    No version history available
                  </div>
                ) : (
                  versions.map((version) => (
                    <div
                      key={version.versionNumber ?? version.version}
                      className="px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge size="sm" color={version.versionNumber === doc?.version || version.version === doc?.version ? 'primary' : 'default'}>
                          v{version.versionNumber ?? version.version}
                        </Badge>
                        {(version.versionNumber ?? version.version) !== doc?.version && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(version.versionNumber ?? version.version)}
                          >
                            Restore
                          </Button>
                        )}
                        {(version.versionNumber ?? version.version) === doc?.version && (
                          <span className="text-[10px] font-medium text-primary-600">Current</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {version.updatedBy?.name || version.editedBy?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(version.updatedAt || version.createdAt)
                          ? new Date(version.updatedAt || version.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '\u2014'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
