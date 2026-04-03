import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui';

const TOOLS = {
  select: { label: 'Select', icon: 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59' },
  rect: { label: 'Rectangle', icon: 'M3 3h18v18H3z' },
  circle: { label: 'Circle', icon: 'M12 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25z' },
  text: { label: 'Text', icon: 'M4.5 3.75H19.5M12 3.75v16.5M8.25 20.25h7.5' },
};

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ffffff', '#000000'];

function hitTest(a, px, py) {
  if (a.type === 'rect') {
    const x1 = Math.min(a.x, a.x + a.w), x2 = Math.max(a.x, a.x + a.w);
    const y1 = Math.min(a.y, a.y + a.h), y2 = Math.max(a.y, a.y + a.h);
    return px >= x1 - 8 && px <= x2 + 8 && py >= y1 - 8 && py <= y2 + 8;
  }
  if (a.type === 'circle') {
    const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
    const rx = Math.abs(a.w) / 2 + 8, ry = Math.abs(a.h) / 2 + 8;
    return ((px - cx) ** 2) / (rx ** 2) + ((py - cy) ** 2) / (ry ** 2) <= 1;
  }
  if (a.type === 'text') {
    const fontSize = Math.max(16, a.strokeWidth * 6);
    const approxWidth = a.text.length * fontSize * 0.6;
    return px >= a.x - 4 && px <= a.x + approxWidth + 4 && py >= a.y - fontSize && py <= a.y + 8;
  }
  return false;
}

export default function ImageAnnotator({ imageUrl, onSave, onClose, saving }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('rect');
  const [color, setColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [annotations, setAnnotations] = useState([]);
  const [drawing, setDrawing] = useState(null);
  const [textInput, setTextInput] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [dragging, setDragging] = useState(null); // { startX, startY, origX, origY }
  const imgRef = useRef(null);

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
      if (i === highlightIdx) drawSelectionBox(ctx, a);
    });
    if (drawing) drawAnnotation(ctx, drawing);
  }, [annotations, drawing]);

  useEffect(() => { if (imgLoaded) render(selectedIdx); }, [imgLoaded, render, selectedIdx]);

  function drawAnnotation(ctx, a) {
    ctx.strokeStyle = a.color;
    ctx.lineWidth = a.strokeWidth;
    ctx.fillStyle = a.color;
    ctx.font = `bold ${Math.max(16, a.strokeWidth * 6)}px sans-serif`;

    if (a.type === 'rect') {
      ctx.strokeRect(a.x, a.y, a.w, a.h);
    } else if (a.type === 'circle') {
      const rx = Math.abs(a.w) / 2, ry = Math.abs(a.h) / 2;
      ctx.beginPath();
      ctx.ellipse(a.x + a.w / 2, a.y + a.h / 2, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (a.type === 'text' && a.text) {
      ctx.fillText(a.text, a.x, a.y);
    }
  }

  function drawSelectionBox(ctx, a) {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    if (a.type === 'text') {
      const fontSize = Math.max(16, a.strokeWidth * 6);
      const w = a.text.length * fontSize * 0.6;
      ctx.strokeRect(a.x - 4, a.y - fontSize, w + 8, fontSize + 8);
    } else {
      const x1 = Math.min(a.x, a.x + a.w), y1 = Math.min(a.y, a.y + a.h);
      const w = Math.abs(a.w), h = Math.abs(a.h);
      ctx.strokeRect(x1 - 4, y1 - 4, w + 8, h + 8);
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
      // Find topmost hit annotation (reverse order)
      for (let i = annotations.length - 1; i >= 0; i--) {
        if (hitTest(annotations[i], pos.x, pos.y)) {
          setSelectedIdx(i);
          const a = annotations[i];
          setDragging({ startX: pos.x, startY: pos.y, origX: a.x, origY: a.y });
          return;
        }
      }
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
    if (dragging !== null && selectedIdx !== null) {
      const pos = getPos(e);
      const dx = pos.x - dragging.startX;
      const dy = pos.y - dragging.startY;
      setAnnotations((prev) => prev.map((a, i) =>
        i === selectedIdx ? { ...a, x: dragging.origX + dx, y: dragging.origY + dy } : a
      ));
      return;
    }
    if (!drawing) return;
    const pos = getPos(e);
    setDrawing((prev) => ({ ...prev, w: pos.x - prev.x, h: pos.y - prev.y }));
  };

  const handlePointerUp = () => {
    if (dragging) { setDragging(null); return; }
    if (!drawing) return;
    if (Math.abs(drawing.w) > 5 || Math.abs(drawing.h) > 5) {
      setAnnotations((prev) => [...prev, drawing]);
    }
    setDrawing(null);
  };

  const handleTextSubmit = (text) => {
    if (text.trim()) {
      setAnnotations((prev) => [...prev, { type: 'text', x: textInput.x, y: textInput.y, text: text.trim(), color, strokeWidth }]);
    }
    setTextInput(null);
  };

  // Keyboard: delete selected, escape deselect
  useEffect(() => {
    const handleKey = (e) => {
      if (selectedIdx === null) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setAnnotations((prev) => prev.filter((_, i) => i !== selectedIdx));
        setSelectedIdx(null);
      }
      if (e.key === 'Escape') setSelectedIdx(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIdx]);

  const deleteSelected = () => {
    if (selectedIdx === null) return;
    setAnnotations((prev) => prev.filter((_, i) => i !== selectedIdx));
    setSelectedIdx(null);
  };

  const undo = () => { setAnnotations((prev) => prev.slice(0, -1)); setSelectedIdx(null); };
  const clearAll = () => { setAnnotations([]); setSelectedIdx(null); };

  const handleSave = () => {
    setSelectedIdx(null); // remove selection highlight before saving
    setTimeout(() => {
      render(null);
      setTimeout(() => {
        const dataUrl = canvasRef.current.toDataURL('image/png');
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
          <input type="range" min="1" max="8" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-16 h-1.5 accent-primary-600" />
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        {selectedIdx !== null && (
          <button onClick={deleteSelected} className="text-xs font-medium text-danger-600 hover:text-danger-700 px-2 py-1">
            Delete Selected
          </button>
        )}
        <button onClick={undo} disabled={annotations.length === 0} className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:text-slate-300 px-2 py-1">Undo</button>
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
            <TextInputPopup x={textInput.screenX} y={textInput.screenY} onSubmit={handleTextSubmit} onCancel={() => setTextInput(null)} />
          )}
        </div>
      </div>
    </div>
  );
}

function TextInputPopup({ x, y, onSubmit, onCancel }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="fixed z-[60] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 flex gap-1.5"
      style={{ left: Math.min(x, window.innerWidth - 240), top: Math.min(y, window.innerHeight - 50) }}>
      <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(text); if (e.key === 'Escape') onCancel(); }}
        placeholder="Type text..." className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-transparent text-slate-700 dark:text-slate-300 outline-none focus:border-primary-500 w-40" />
      <button onClick={() => onSubmit(text)} className="text-xs font-medium text-primary-600 px-1.5">Add</button>
      <button onClick={onCancel} className="text-xs text-slate-400 px-1">Cancel</button>
    </div>
  );
}
