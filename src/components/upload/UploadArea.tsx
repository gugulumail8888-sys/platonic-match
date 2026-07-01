'use client';

import { useRef } from 'react';
import { Upload, X } from 'lucide-react';

export default function UploadArea({
  label,
  preview,
  onFile,
  onClear,
}: {
  label: string;
  preview: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onFile(file);
  };

  return (
    <div>
      <p className="text-sm font-medium text-zinc-300 mb-2">{label}</p>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-zinc-600 bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="w-full h-40 object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 bg-zinc-900/80 rounded-full flex items-center justify-center text-zinc-300 hover:bg-red-900/80 hover:text-red-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 inset-x-0 bg-teal-900/80 py-1 text-center text-xs text-teal-300">
            ✓ アップロード済み
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-zinc-600 rounded-xl p-6 text-center cursor-pointer hover:border-teal-600 hover:bg-teal-950/20 transition-all"
        >
          <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-zinc-400 text-sm">クリックまたはドラッグ&amp;ドロップ</p>
          <p className="text-zinc-600 text-xs mt-1">JPG・PNG・HEIC（最大10MB）</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
