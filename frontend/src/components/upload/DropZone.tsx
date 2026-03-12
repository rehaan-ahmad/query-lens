"use client";
import React, { useCallback, useState } from "react";
import { UploadCloud, FileType } from "lucide-react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

export default function DropZone({ onFileSelect }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
        onFileSelect(file);
      } else {
        alert("Please upload a .csv file");
      }
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={`w-full p-12 rounded-[20px] border-2 border-dashed transition-all duration-200 ease-in-out flex flex-col items-center justify-center cursor-pointer bg-surface hover:bg-cream/50
        ${isDragging ? "border-olive bg-olive/5" : "border-muted/30"}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById("fileDrop")?.click()}
    >
      <input
        id="fileDrop"
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleChange}
      />
      
      <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? "bg-olive/20 text-olive" : "bg-cream text-muted"}`}>
        {isDragging ? <UploadCloud className="w-8 h-8" /> : <FileType className="w-8 h-8" />}
      </div>
      
      <p className="text-lg font-medium text-navy mb-1">
        {isDragging ? "Drop CSV here..." : "Drag & Drop your CSV file"}
      </p>
      <p className="text-sm text-muted">
        or click to browse your computer
      </p>
      
      <div className="mt-8 flex items-center space-x-2 text-xs font-mono text-muted/60 bg-cream/50 px-3 py-1.5 rounded-md">
        <span>Max size: 10MB</span>
        <span>•</span>
        <span>.csv only</span>
      </div>
    </div>
  );
}
