import { useEffect } from 'react';

// shortcuts is an array of { key, ctrl, shift, alt, handler }
// Example: [{ key: 'k', ctrl: true, handler: () => openPalette() }]
export default function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input/textarea/contenteditable
      const tag = e.target.tagName;
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (e.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
          // Allow ctrl shortcuts even when editing
          if (isEditing && !shortcut.ctrl && !shortcut.alt) continue;
          e.preventDefault();
          shortcut.handler(e);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
