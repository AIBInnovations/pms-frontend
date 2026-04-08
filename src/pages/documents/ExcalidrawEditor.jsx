import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Excalidraw, serializeAsJSON } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { documentService, projectService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Button, Skeleton } from '../../components/ui';

const CATEGORY_OPTIONS = [
  { value: 'design', label: 'Design' },
  { value: 'requirement', label: 'Requirement' },
  { value: 'technical', label: 'Technical' },
  { value: 'meeting_notes', label: 'Meeting Notes' },
  { value: 'guide', label: 'Guide' },
  { value: 'other', label: 'Other' },
];

export default function ExcalidrawEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;

  const excalidrawAPIRef = useRef(null);
  const sceneRef = useRef(null); // latest scene snapshot

  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('Untitled Diagram');
  const [category, setCategory] = useState('design');
  const [project, setProject] = useState(searchParams.get('project') || '');
  const [projects, setProjects] = useState([]);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Fetch projects for create form
  useEffect(() => {
    if (!isEditMode) {
      projectService.getAll({ limit: 100 }).then((res) => setProjects(res.data || [])).catch(() => {});
    }
  }, [isEditMode]);

  // Load existing document
  useEffect(() => {
    if (!isEditMode) {
      setInitialData({ elements: [], appState: { viewBackgroundColor: '#ffffff' } });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await documentService.getById(id);
        if (cancelled) return;
        const data = res.data;
        setDoc(data);
        setTitle(data.title || 'Untitled Diagram');
        setCategory(data.category || 'design');
        setProject(data.project?._id || data.project || '');
        let parsed = { elements: [], appState: { viewBackgroundColor: '#ffffff' } };
        if (data.content) {
          try {
            const j = JSON.parse(data.content);
            parsed = { elements: j.elements || [], appState: j.appState || { viewBackgroundColor: '#ffffff' }, files: j.files || {} };
          } catch {
            // legacy / corrupt content — start blank
          }
        }
        setInitialData(parsed);
      } catch {
        toast.error('Failed to load diagram');
        navigate(-1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEditMode, navigate, toast]);

  const handleChange = useCallback((elements, appState, files) => {
    sceneRef.current = { elements, appState, files };
    setDirty(true);
  }, []);

  const buildPayload = () => {
    const scene = sceneRef.current;
    if (!scene) return null;
    // serializeAsJSON strips ephemeral state (collaborators, scrollX, etc.)
    const json = serializeAsJSON(scene.elements, scene.appState, scene.files || {}, 'local');
    return json;
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!project) { toast.error('Pick a project'); return; }

    setSaving(true);
    try {
      const content = buildPayload() ?? doc?.content ?? '{}';
      if (isEditMode) {
        await documentService.update(id, { title: title.trim(), content, category });
        toast.success('Diagram saved');
      } else {
        const res = await documentService.create({
          title: title.trim(),
          content,
          category,
          type: 'excalidraw',
          project,
        });
        toast.success('Diagram created');
        navigate(`/documents/excalidraw/${res.data._id}`, { replace: true });
      }
      setDirty(false);
      setLastSavedAt(new Date());
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Warn on unload if dirty
  useEffect(() => {
    const handler = (e) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  if (loading) return <div className="p-6"><Skeleton variant="card" className="h-[600px]" /></div>;

  const projectName = doc?.project?.name || projects.find((p) => p._id === project)?.name;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] -mx-4 -my-4 lg:-mx-6 lg:-my-6">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
          placeholder="Diagram title"
          className="text-lg font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 dark:text-slate-100 min-w-[200px] flex-1 max-w-md"
        />

        {!isEditMode && (
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="">Select project...</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.code} — {p.name}</option>)}
          </select>
        )}
        {isEditMode && projectName && (
          <span className="text-xs text-slate-500">{projectName}</span>
        )}

        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setDirty(true); }}
          className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-3">
          {dirty ? (
            <span className="text-xs text-amber-600">● Unsaved changes</span>
          ) : lastSavedAt ? (
            <span className="text-xs text-slate-400">Saved {lastSavedAt.toLocaleTimeString()}</span>
          ) : null}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Excalidraw canvas */}
      <div className="flex-1 min-h-0">
        {initialData && (
          <Excalidraw
            initialData={initialData}
            onChange={handleChange}
            excalidrawAPI={(api) => { excalidrawAPIRef.current = api; }}
          />
        )}
      </div>
    </div>
  );
}
