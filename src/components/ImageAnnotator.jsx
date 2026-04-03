import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui';

const TOOLS = {
  select: { label: 'Select (V)', icon: 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59' },
  rect: { label: 'Rectangle (R)', icon: 'M3 3h18v18H3z' },
  circle: { label: 'Circle (C)', icon: 'M12 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25z' },
  text: { label: 'Text (T)', icon: 'M4.5 3.75H19.5M12 3.75v16.5M8.25 20.25h7.5' },
};

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ffffff', '#000000'];
const HANDLE_SIZE = 10;

function getBounds(a) {
  if (a.type === 'text') {
    const fontSize = Math.max(20, a.strokeWidth * 5);
    const w = a.text.length * fontSize * 0.6;
    return { x: a.x - 4, y: a.y - fontSize, w: w + 8, h: fontSize + 8 };
  }
  const x = Math.min(a.x, a.x + a.w), y = Math.min(a.y, a.y + a.h);
  return { x, y, w: Math.abs(a.w), h: Math.abs(a.h) };
}

function hitTest(a, px, py) {
  const b = getBounds(a);
  return px >= b.x - 10 && px <= b.x + b.w + 10 && py >= b.y - 10 && py <= b.y + b.h + 10;
}

function getResizeHandle(a, px, py) {
  if (a.type === 'text') return null;
  const b = getBounds(a);
  const handles = [
    { name: 'nw', x: b.x, y: b.y },
    { name: 'ne', x: b.x + b.w, y: b.y },
    { name: 'sw', x: b.x, y: b.y + b.h },
    { name: 'se', x: b.x + b.w, y: b.y + b.h },
  ];
  for (const h of handles) {
    if (Math.abs(px - h.x) <= HANDLE_SIZE && Math.abs(py - h.y) <= HANDLE_SIZE) return h.name;
  }
  return null;
}

export default function ImageAnnotator({ imageUrl, onSave, onClose, saving }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('rect');
  const [color, setColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(6);
  const [annotations, setAnnotations] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [drawing, setDrawing] = useState(null);
  const [textInput, setTextInput] = useState(null);
  const [editingTextIdx, setEditingTextIdx] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [dragState, setDragState] = useState(null); // { mode: 'move'|'resize', handle?, startX, startY, orig }
  const imgRef = useRef(null);
  const lastClickRef = useRef({ time: 0, idx: null });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; setImgLoaded(true); };
    img.src = imageUrl;
  }, [imageUrl]);

  const render = useCallback((highlightIdx) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    annotations.forEach((a, i) => {
      drawAnnotation(ctx, a);
      if (i === highlightIdx) drawSelection(ctx, a);
    });
    if (drawing) drawAnnotation(ctx, drawing);
  }, [annotations, drawing]);

  useEffect(() => { if (imgLoaded) render(selectedIdx); }, [imgLoaded, render, selectedIdx]);

  function drawAnnotation(ctx, a) {
    ctx.strokeStyle = a.color;
    ctx.lineWidth = a.strokeWidth;
    ctx.fillStyle = a.color;
    const fontSize = Math.max(20, a.strokeWidth * 5);
    ctx.font = `bold ${fontSize}px sans-serif`;

    if (a.type === 'rect') {
      ctx.strokeRect(a.x, a.y, a.w, a.h);
    } else if (a.type === 'circle') {
      const rx = Math.abs(a.w) / 2, ry = Math.abs(a.h) / 2;
      ctx.beginPath();
      ctx.ellipse(a.x + a.w / 2, a.y + a.h / 2, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (a.type === 'text' && a.text) {
      ctx.fillText(a.text, a.x, a.y);
    }
  }

  function drawSelection(ctx, a) {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    const b = getBounds(a);
    ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
    ctx.setLineDash([]);

    // Resize handles (not for text)
    if (a.type !== 'text') {
      const corners = [
        [b.x - 4, b.y - 4], [b.x + b.w + 4, b.y - 4],
        [b.x - 4, b.y + b.h + 4], [b.x + b.w + 4, b.y + b.h + 4],
      ];
      for (const [cx, cy] of corners) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 5, cy - 5, 10, 10);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 5, cy - 5, 10, 10);
      }
    }
    ctx.restore();
  }

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  }

  const handlePointerDown = (e) => {
    const pos = getPos(e);

    if (tool === 'select') {
      // Check if clicking on a resize handle of selected annotation
      if (selectedIdx !== null) {
        const a = annotations[selectedIdx];
        const handle = getResizeHandle(a, pos.x, pos.y);
        if (handle) {
          setDragState({
            mode: 'resize', handle,
            startX: pos.x, startY: pos.y,
            orig: { x: a.x, y: a.y, w: a.w, h: a.h },
          });
          return;
        }
      }

      // Check for double-click on text to edit
      const now = Date.now();
      for (let i = annotations.length - 1; i >= 0; i--) {
        if (hitTest(annotations[i], pos.x, pos.y)) {
          // Double click detection
          if (annotations[i].type === 'text' && lastClickRef.current.idx === i && now - lastClickRef.current.time < 400) {
            // Open edit popup
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const scaleX = rect.width / canvas.width;
            const scaleY = rect.height / canvas.height;
            setEditingTextIdx(i);
            setTextInput({
              x: annotations[i].x, y: annotations[i].y,
              screenX: rect.left + annotations[i].x * scaleX,
              screenY: rect.top + annotations[i].y * scaleY,
              existingText: annotations[i].text,
            });
            lastClickRef.current = { time: 0, idx: null };
            return;
          }

          lastClickRef.current = { time: now, idx: i };
          setSelectedIdx(i);
          setDragState({
            mode: 'move',
            startX: pos.x, startY: pos.y,
            orig: { x: annotations[i].x, y: annotations[i].y },
          });
          return;
        }
      }
      lastClickRef.current = { time: 0, idx: null };
      setSelectedIdx(null);
      return;
    }

    setSelectedIdx(null);
    if (tool === 'text') {
      setTextInput({ x: pos.x, y: pos.y, screenX: e.clientX, screenY: e.clientY });
      return;
    }
    setDrawing({ type: tool, x: pos.x, y: pos.y, w: 0, h: 0, color, strokeWidth });
  };

  const handlePointerMove = (e) => {
    if (dragState && selectedIdx !== null) {
      const pos = getPos(e);
      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;

      if (dragState.mode === 'move') {
        setAnnotations((prev) => prev.map((a, i) =>
          i === selectedIdx ? { ...a, x: dragState.orig.x + dx, y: dragState.orig.y + dy } : a
        ));
      } else if (dragState.mode === 'resize') {
        const { handle, orig } = dragState;
        setAnnotations((prev) => prev.map((a, i) => {
          if (i !== selectedIdx) return a;
          let { x, y, w, h } = orig;
          if (handle.includes('e')) w += dx;
          if (handle.includes('w')) { x += dx; w -= dx; }
          if (handle.includes('s')) h += dy;
          if (handle.includes('n')) { y += dy; h -= dy; }
          return { ...a, x, y, w, h };
        }));
      }
      return;
    }
    if (!drawing) return;
    const pos = getPos(e);
    setDrawing((prev) => ({ ...prev, w: pos.x - prev.x, h: pos.y - prev.y }));
  };

  const handlePointerUp = () => {
    if (dragState) { setDragState(null); setRedoStack([]); return; }
    if (!drawing) return;
    if (Math.abs(drawing.w) > 5 || Math.abs(drawing.h) > 5) {
      pushAnnotations((prev) => [...prev, drawing]);
      setTool('select');
      setSelectedIdx(annotations.length);
    }
    setDrawing(null);
  };

  const handleTextSubmit = (text) => {
    if (editingTextIdx !== null) {
      // Editing existing text
      if (text.trim()) {
        pushAnnotations((prev) => prev.map((a, i) => i === editingTextIdx ? { ...a, text: text.trim() } : a));
      }
      setEditingTextIdx(null);
    } else if (text.trim()) {
      // New text
      pushAnnotations((prev) => [...prev, { type: 'text', x: textInput.x, y: textInput.y, text: text.trim(), color, strokeWidth }]);
      setTool('select');
      setSelectedIdx(annotations.length);
    }
    setTextInput(null);
  };

  const handleTextCancel = () => {
    setTextInput(null);
    setEditingTextIdx(null);
  };

  const pushAnnotations = useCallback((updater) => {
    setAnnotations((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setRedoStack([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setAnnotations((prev) => {
      if (prev.length === 0) return prev;
      setRedoStack((rs) => [...rs, prev[prev.length - 1]]);
      return prev.slice(0, -1);
    });
    setSelectedIdx(null);
  }, []);

  const redo = useCallback(() => {
    setRedoStack((rs) => {
      if (rs.length === 0) return rs;
      const item = rs[rs.length - 1];
      setAnnotations((prev) => [...prev, item]);
      return rs.slice(0, -1);
    });
    setSelectedIdx(null);
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedIdx === null) return;
    pushAnnotations((prev) => prev.filter((_, i) => i !== selectedIdx));
    setSelectedIdx(null);
  }, [selectedIdx, pushAnnotations]);

  const clearAll = () => { pushAnnotations([]); setSelectedIdx(null); };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (textInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }

      if (e.key === 'v' || e.key === 'V') { setTool('select'); return; }
      if (e.key === 'r' || e.key === 'R') { setTool('rect'); setSelectedIdx(null); return; }
      if (e.key === 'c' || e.key === 'C') { setTool('circle'); setSelectedIdx(null); return; }
      if (e.key === 't' || e.key === 'T') { setTool('text'); setSelectedIdx(null); return; }
      if (selectedIdx === null) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === 'Escape') setSelectedIdx(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIdx, textInput, undo, redo, deleteSelected]);

  const handleSave = () => {
    setSelectedIdx(null);
    setTimeout(() => {
      render(null);
      setTimeout(() => {
        // Use JPEG at 0.8 quality to stay under Vercel's 4.5MB proxy limit
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        onSave(dataUrl);
      }, 50);
    }, 50);
  };

  if (!imgLoaded) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center">
        <div className="text-white text-sm">Loading image...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col">
      {/* Toolbar */}
      <div className="shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {Object.entries(TOOLS).map(([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() => { setTool(key); if (key !== 'select') setSelectedIdx(null); }}
              className={`p-2 rounded-md transition-colors ${tool === key ? 'bg-white dark:bg-slate-600 shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title={label}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 items-center">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c ? 'border-primary-500 scale-125' : 'border-slate-300 dark:border-slate-600'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Size</span>
          <input type="range" min="2" max="24" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-20 h-1.5 accent-primary-600" />
          <span className="text-xs text-slate-500 w-5">{strokeWidth}</span>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        {selectedIdx !== null && (
          <button onClick={deleteSelected} className="text-xs font-medium text-danger-600 hover:text-danger-700 px-2 py-1">Delete</button>
        )}
        <button onClick={undo} disabled={annotations.length === 0} title="Undo (Ctrl+Z)" className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:text-slate-300 px-2 py-1">Undo</button>
        <button onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)" className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:text-slate-300 px-2 py-1">Redo</button>
        <button onClick={clearAll} disabled={annotations.length === 0} className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:text-slate-300 px-2 py-1">Clear</button>

        <div className="flex-1" />

        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSave} loading={saving} disabled={annotations.length === 0}>Save Annotated</Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`max-w-full max-h-[calc(100vh-80px)] rounded-lg shadow-2xl ${tool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
          {textInput && (
            <TextInputPopup
              x={textInput.screenX} y={textInput.screenY}
              initialText={textInput.existingText || ''}
              onSubmit={handleTextSubmit}
              onCancel={handleTextCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TextInputPopup({ x, y, initialText, onSubmit, onCancel }) {
  const [text, setText] = useState(initialText);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  return (
    <div className="fixed z-[60] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 flex gap-1.5"
      style={{ left: Math.min(x, window.innerWidth - 260), top: Math.min(y, window.innerHeight - 50) }}>
      <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(text); if (e.key === 'Escape') onCancel(); }}
        placeholder="Type text..." className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-transparent text-slate-700 dark:text-slate-300 outline-none focus:border-primary-500 w-44" />
      <button onClick={() => onSubmit(text)} className="text-xs font-medium text-primary-600 px-1.5">{initialText ? 'Update' : 'Add'}</button>
      <button onClick={onCancel} className="text-xs text-slate-400 px-1">Cancel</button>
    </div>
  );
}
