import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui';

export default function CommentInput({
  onSubmit,
  loading = false,
  placeholder = 'Write a comment...',
  autoFocus = false,
  initialValue = '',
  onCancel,
}) {
  const [body, setBody] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed || submitting || loading) return;

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setBody('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSubmitting = submitting || loading;

  return (
    <div className="flex flex-col gap-2">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
        className="rounded-xl border border-slate-200 dark:border-slate-600 resize-none p-3 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          disabled={!body.trim() || isSubmitting}
          loading={isSubmitting}
          onClick={handleSubmit}
        >
          {onCancel ? 'Save' : 'Comment'}
        </Button>
      </div>
    </div>
  );
}
