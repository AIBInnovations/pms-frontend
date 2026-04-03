import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui';

const TOOLS = {
  rect: { label: 'Rectangle', icon: 'M3 3h18v18H3z' },
  circle: { label: 'Circle', icon: 'M12 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25z' },
  text: { label: 'Text', icon: 'M4.5 3.75H19.5M12 3.75v16.5M8.25 20.25h7.5' },
};

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ffffff', '#000000'];

export default function ImageAnnotator({ imageUrl, onSave, onClose, saving }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [tool, setTool] = useState('rect');
  const [color, setColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [annotations, setAnnotations] = useState([]);
  const [drawing, setDrawing] = useState(null);
  const [textInput, setTextInput] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    // Draw all annotations
    for (const a of annotations) {
      drawAnnotation(ctx, a);
    }
    // Draw current in-progress shape
    if (drawing) {
      drawAnnotation(ctx, drawing);
    }
  }, [annotations, drawing]);

  useEffect(() => { if (imgLoaded) render(); }, [imgLoaded, render]);

  function drawAnnotation(ctx, a) {
    ctx.strokeStyle = a.color;
    ctx.lineWidth = a.strokeWidth;
    ctx.fillStyle = a.color;
    ctx.font = `bold ${Math.max(16, a.strokeWidth * 6)}px sans-serif`;

    if (a.type === 'rect') {
      ctx.strokeRect(a.x, a.y, a.w, a.h);
    } else if (a.type === 'circle') {
      const rx = Math.abs(a.w) / 2;
      const ry = Math.abs(a.h) / 2;
      const cx = a.x + a.w / 2;
      const cy = a.y + a.h / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (a.type === 'text' && a.text) {
      ctx.fillText(a.text, a.x, a.y);
    }
  }

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  const handlePointerDown = (e) => {
    if (tool === 'text') {
      const pos = getPos(e);
      setTextInput({ x: pos.x, y: pos.y, screenX: e.clientX, screenY: e.clientY });
      return;
    }
    const pos = getPos(e);
    setDrawing({ type: tool, x: pos.x, y: pos.y, w: 0, h: 0, color, strokeWidth });
  };

  const handlePointerMove = (e) => {
    if (!drawing) return;
    const pos = getPos(e);
    setDrawing((prev) => ({
      ...prev,
      w: pos.x - prev.x,
      h: pos.y - prev.y,
    }));
  };

  const handlePointerUp = () => {
    if (!drawing) return;
    if (Math.abs(drawing.w) > 5 || Math.abs(drawing.h) > 5) {
      setAnnotations((prev) => [...prev, drawing]);
    }
    setDrawing(null);
  };

  const handleTextSubmit = (text) => {
    if (text.trim()) {
      setAnnotations((prev) => [...prev, {
        type: 'text', x: textInput.x, y: textInput.y, text: text.trim(), color, strokeWidth,
      }]);
    }
    setTextInput(null);
  };

  const undo = () => setAnnotations((prev) => prev.slice(0, -1));
  const clearAll = () => setAnnotations([]);

  const handleSave = () => {
    render(); // ensure latest render
    // Small delay to ensure render completes
    setTimeout(() => {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
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
        {/* Tools */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {Object.entries(TOOLS).map(([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() => setTool(key)}
              className={`p-2 rounded-md transition-colors ${tool === key ? 'bg-white dark:bg-slate-600 shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title={label}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
            </button>
          ))}
        </div>

        {/* Colors */}
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

        {/* Stroke width */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Size</span>
          <input
            type="range" min="1" max="8" value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-16 h-1.5 accent-primary-600"
          />
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        {/* Actions */}
        <button onClick={undo} disabled={annotations.length === 0} className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:text-slate-300 disabled:dark:text-slate-600 px-2 py-1">
          Undo
        </button>
        <button onClick={clearAll} disabled={annotations.length === 0} className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:text-slate-300 disabled:dark:text-slate-600 px-2 py-1">
          Clear
        </button>

        <div className="flex-1" />

        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSave} loading={saving} disabled={annotations.length === 0}>
          Save Annotated
        </Button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4" ref={overlayRef}>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[calc(100vh-80px)] cursor-crosshair rounded-lg shadow-2xl"
            style={{ imageRendering: 'auto' }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />

          {/* Text input popup */}
          {textInput && (
            <TextInputPopup
              x={textInput.screenX}
              y={textInput.screenY}
              onSubmit={handleTextSubmit}
              onCancel={() => setTextInput(null)}
            />
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSubmit(text);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div
      className="fixed z-[60] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 flex gap-1.5"
      style={{ left: Math.min(x, window.innerWidth - 240), top: Math.min(y, window.innerHeight - 50) }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type text..."
        className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-transparent text-slate-700 dark:text-slate-300 outline-none focus:border-primary-500 w-40"
      />
      <button onClick={() => onSubmit(text)} className="text-xs font-medium text-primary-600 hover:text-primary-700 px-1.5">Add</button>
      <button onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-600 px-1">Cancel</button>
    </div>
  );
}
