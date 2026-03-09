"use client";

import { useCallback, useState, type DragEvent } from "react";

interface FileUploadProps {
  onFile: (file: File) => void;
  accept?: string;
  loading?: boolean;
}

export default function FileUpload({
  onFile,
  accept = ".csv,.xlsx,.xls",
  loading = false,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
        dragOver
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-gray-700 hover:border-gray-600"
      }`}
    >
      <p className="mb-2 text-sm text-gray-400">
        {loading ? "Uploading..." : "Drag & drop your file here, or"}
      </p>
      <label className="cursor-pointer rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700">
        Browse Files
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
          disabled={loading}
        />
      </label>
      <p className="mt-2 text-xs text-gray-600">
        CSV or Excel with columns: Ticker, Shares, CostBasis (optional)
      </p>
    </div>
  );
}
