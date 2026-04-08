import { useState, useEffect, useRef } from 'react';
import { socialPostService, userService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Modal, Button, Input, Select } from '../../components/ui';
import { PLATFORMS } from './postConstants';

function toLocalInputValue(d) {
  if (!d) return '';
  const dt = new Date(d);
  const tz = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - tz).toISOString().slice(0, 16);
}

export default function PostFormModal({ isOpen, onClose, editing, defaultDate, onSaved }) {
  const toast = useToast();
  const fileRef = useRef();
  const [form, setForm] = useState({
    title: '', content: '', platforms: [], hashtags: '', link: '',
    scheduledAt: '', assignee: '', campaign: '', notes: '', media: [],
  });
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setForm({
        title: editing.title || '',
        content: editing.content || '',
        platforms: editing.platforms || [],
        hashtags: (editing.hashtags || []).join(' '),
        link: editing.link || '',
        scheduledAt: toLocalInputValue(editing.scheduledAt),
        assignee: editing.assignee?._id || '',
        campaign: editing.campaign || '',
        notes: editing.notes || '',
        media: editing.media || [],
      });
    } else {
      setForm({
        title: '', content: '', platforms: [], hashtags: '', link: '',
        scheduledAt: defaultDate ? toLocalInputValue(defaultDate) : '',
        assignee: '', campaign: '', notes: '', media: [],
      });
    }
  }, [isOpen, editing, defaultDate]);

  useEffect(() => {
    if (!isOpen) return;
    userService.getAll({ limit: 200 }).then((res) => {
      const list = res.data || res.users || [];
      setUsers(list.filter((u) => ['super_admin', 'project_manager', 'sales_executive'].includes(u.role)));
    }).catch(() => {});
  }, [isOpen]);

  const togglePlatform = (val) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(val) ? f.platforms.filter((p) => p !== val) : [...f.platforms, val],
    }));
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const res = await socialPostService.uploadMedia(file);
        setForm((f) => ({ ...f, media: [...f.media, res.data] }));
      }
      toast.success(`${files.length} file(s) uploaded`);
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeMedia = (idx) => {
    setForm((f) => ({ ...f, media: f.media.filter((_, i) => i !== idx) }));
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    content: form.content.trim(),
    platforms: form.platforms,
    hashtags: form.hashtags.split(/[\s,]+/).map((h) => h.replace(/^#/, '').trim()).filter(Boolean),
    link: form.link.trim(),
    scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
    assignee: form.assignee || null,
    campaign: form.campaign.trim(),
    notes: form.notes.trim(),
    media: form.media,
  });

  const validate = () => {
    if (!form.title.trim()) return 'Title is required';
    if (!form.content.trim()) return 'Content is required';
    if (form.platforms.length === 0) return 'Select at least one platform';
    return null;
  };

  const save = async (submitForApproval = false) => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (!editing) payload.status = 'draft';
      let result;
      if (editing) {
        result = await socialPostService.update(editing._id, payload);
      } else {
        result = await socialPostService.create(payload);
      }
      if (submitForApproval && result.data?._id) {
        await socialPostService.submit(result.data._id);
        toast.success('Submitted for approval');
      } else {
        toast.success(editing ? 'Post updated' : 'Post created');
      }
      onSaved && onSaved();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `Edit ${editing.postId}` : 'New Post'}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="secondary" onClick={() => save(false)} disabled={saving}>Save Draft</Button>
          <Button onClick={() => save(true)} disabled={saving}>
            {saving ? 'Saving...' : 'Save & Submit'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Internal label for this post"
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Content <span className="text-xs text-slate-400 font-normal">({form.content.length}/5000)</span>
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={6}
            maxLength={5000}
            placeholder="Write your post caption here..."
            className="input-base resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Platforms</label>
          <div className="flex gap-2 flex-wrap">
            {PLATFORMS.map((p) => {
              const selected = form.platforms.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePlatform(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selected
                      ? `${p.color} text-white border-transparent`
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Media</label>
          <div className="flex gap-2 flex-wrap mb-2">
            {form.media.map((m, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                {m.type === 'image' ? (
                  <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 p-1 text-center">
                    {m.type === 'video' ? '🎬' : '📎'} <br />{m.name?.slice(0, 12)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-slate-900/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-primary-400 hover:text-primary-500 transition text-xs"
            >
              {uploading ? '...' : '+ Add'}
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Hashtags"
            value={form.hashtags}
            onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
            placeholder="#marketing #social"
          />
          <Input
            label="Link (CTA)"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Scheduled For</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              className="input-base"
            />
          </div>
          <Select
            label="Assignee"
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            options={users.map((u) => ({ value: u._id, label: u.name }))}
            placeholder="Unassigned"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Campaign"
            value={form.campaign}
            onChange={(e) => setForm({ ...form, campaign: e.target.value })}
            placeholder="e.g., Diwali 2026"
          />
          <Input
            label="Internal Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes for the team"
          />
        </div>
      </div>
    </Modal>
  );
}
