import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isSupportedFile } from '../lib/extractors';
import { useCourtCoach } from '../context/CourtCoachContext';

export default function UploadPage() {
  const navigate = useNavigate();
  const { setUpload, setError } = useCourtCoach();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');

  const canAnalyze = Boolean(selectedFile || pastedText.trim());

  const applyFile = (file) => {
    if (!file) {
      return;
    }

    if (!isSupportedFile(file)) {
      setLocalError('Unsupported file type. Please use PDF, TXT, DOCX, JPG, PNG, or WEBP.');
      return;
    }

    setSelectedFile(file);
    setLocalError('');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    applyFile(event.dataTransfer.files?.[0]);
  };

  const onAnalyze = () => {
    if (!canAnalyze) {
      return;
    }

    setUpload({ file: selectedFile, pastedText });
    setError('');
    navigate('/analyzing');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-mist to-white px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-border bg-white p-5 shadow-card sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link to="/" className="font-heading text-2xl font-bold text-navy">
            Court Date Coach
          </Link>
          <p className="text-sm text-slate-500">Step 1 of 3 - Upload your notice</p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full rounded-2xl border-2 border-dashed p-8 text-left transition ${
            dragging
              ? 'border-primary bg-sky-50'
              : selectedFile
                ? 'border-success bg-emerald-50'
                : 'border-slate-300 bg-slate-50 hover:border-primary'
          }`}
        >
          <p className="text-lg font-semibold text-ink">Drop your court notice here, or click to browse</p>
          <p className="mt-2 text-sm text-slate-600">
            Accepted: PDF, Word doc, photo, or plain text. Nothing is saved or stored.
          </p>
          {selectedFile ? (
            <p className="mt-4 inline-flex items-center rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success">
              <span className="mr-2">OK</span>
              {selectedFile.name}
            </p>
          ) : null}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.docx,.jpg,.jpeg,.png,.webp"
          onChange={(event) => applyFile(event.target.files?.[0])}
        />

        <div className="my-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-sm font-medium uppercase tracking-wide text-slate-500">Or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <label htmlFor="notice-text" className="mb-2 block text-sm font-semibold text-ink">
          Paste text from your notice
        </label>
        <textarea
          id="notice-text"
          className="min-h-40 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-ink placeholder:text-slate-400"
          placeholder="Or paste the text from your court notice here..."
          value={pastedText}
          onChange={(event) => setPastedText(event.target.value)}
        />

        {(localError || canAnalyze === false) && (
          <p className="mt-3 text-sm text-warning">{localError || 'Add a file or paste text to continue.'}</p>
        )}

        <button
          type="button"
          disabled={!canAnalyze}
          onClick={onAnalyze}
          className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-base font-semibold text-white transition enabled:hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Analyze My Notice &rarr;
        </button>

        <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Your document is analyzed privately and never saved. We don&apos;t collect your name, case number, or any
          personal information.
        </p>
      </div>
    </main>
  );
}
