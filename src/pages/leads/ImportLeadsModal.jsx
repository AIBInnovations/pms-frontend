import { useState, useRef } from 'react';
import { leadService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { Modal, Button } from '../../components/ui';

export default function ImportLeadsModal({ isOpen, onClose, onImported }) {
  const toast = useToast();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('upload'); // upload | preview | committing | done
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFile(null);
    setStep('upload');
    setPreview(null);
    setResult(null);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (f) => {
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) {
      toast.error('Please upload a .csv file (Save your Excel sheet as CSV first)');
      return;
    }
    setFile(f);
    setBusy(true);
    try {
      const res = await leadService.previewImport(f);
      setPreview(res.data);
      setStep('preview');
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to preview file');
      setFile(null);
    } finally {
      setBusy(false);
    }
  };

  const handleCommit = async () => {
    setBusy(true);
    setStep('committing');
    try {
      const res = await leadService.commitImport(file);
      setResult(res.data);
      setStep('done');
      onImported && onImported();
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Import failed');
      setStep('preview');
    } finally {
      setBusy(false);
    }
  };

  const downloadErrors = () => {
    if (!result?.errors?.length) return;
    const csv = 'line,name,error\n' + result.errors.map((e) =>
      `${e.line || ''},"${(e.name || '').replace(/"/g, '""')}","${(e.error || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Leads from CSV" size="lg">
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Expected columns</p>
            <p className="text-xs">
              <code>Date</code>, <code>Name</code>, <code>Project/Post Link</code>, <code>Conversation Link</code>, <code>Technology</code>, <code>Proposal</code>
            </p>
            <p className="text-xs mt-2">
              Date format: <code>DD-MM-YYYY</code> (e.g., <code>18-08-2025</code>). Save your Excel sheet as CSV before uploading.
              Duplicates are detected by Conversation Link.
            </p>
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center cursor-pointer hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
          >
            <svg className="w-10 h-10 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {busy ? 'Reading file...' : 'Click to choose a CSV file'}
            </p>
            <p className="text-xs text-slate-400 mt-1">or drag and drop</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{file?.name}</p>
              <p className="text-xs text-slate-500">{preview.total} row{preview.total === 1 ? '' : 's'} found</p>
            </div>
            <button onClick={reset} className="text-xs text-slate-500 hover:text-primary-600">Choose a different file</button>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Preview (first 5 rows)</p>
            <div className="card overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    {preview.headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {preview.sample.map((row, i) => (
                    <tr key={i}>
                      {preview.headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{row[h] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">
            All imported rows will be created as <strong>new leads</strong> with <code>source = cold_outreach</code>,
            assigned to you. Duplicates (matching Conversation Link) will be skipped.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose} disabled={busy}>Cancel</Button>
            <Button onClick={handleCommit} disabled={busy}>Import {preview.total} Leads</Button>
          </div>
        </div>
      )}

      {step === 'committing' && (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Importing leads, please wait...</p>
        </div>
      )}

      {step === 'done' && result && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Import Complete</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase">Created</p>
              <p className="text-2xl font-bold text-emerald-600">{result.created}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase">Skipped</p>
              <p className="text-2xl font-bold text-slate-500">{result.skipped}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase">Errors</p>
              <p className="text-2xl font-bold text-red-600">{result.errors?.length || 0}</p>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div>
              <button onClick={downloadErrors} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Download error report (CSV)
              </button>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
