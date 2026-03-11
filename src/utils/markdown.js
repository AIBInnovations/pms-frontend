/**
 * Simple regex-based markdown renderer.
 * Converts basic markdown syntax to HTML strings.
 * Supports: bold, italic, inline code, code blocks, links, @mentions.
 */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderMarkdown(text) {
  if (!text) return '';

  let html = escapeHtml(text);

  // Code blocks (```...```)
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto my-1">$1</pre>');

  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');

  // Bold (**...**)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');

  // Italic (*...*)
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:underline">$1</a>'
  );

  // @mentions
  html = html.replace(
    /@([a-zA-Z\s]+?)(?=\s@|\s|$|[.,!?;:])/g,
    '<span class="text-primary-600 font-medium">@$1</span>'
  );

  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  return html;
}
