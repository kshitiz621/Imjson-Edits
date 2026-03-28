"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAppStore } from "@/store/useStore";
import { UploadCloud, Loader2, Undo2, Redo2, Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { analyzeImage } from "@/lib/gemini";

export function ImagePreview() {
  const {
    originalImage,
    currentImage,
    setOriginalImage,
    setJsonSchema,
    setIsProcessing,
    isProcessing,
    undo,
    redo,
    historyIndex,
    history,
    jsonSchema
  } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [showBoxes, setShowBoxes] = useState(true);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setError(null);
      setIsProcessing(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        setOriginalImage(base64Image);

        try {
          const schema = await analyzeImage(base64Image);
          setJsonSchema(schema);
          useAppStore.getState().pushToHistory(base64Image, schema);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    },
    [setOriginalImage, setJsonSchema, setIsProcessing],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
  });

  const handleDownload = () => {
    if (!currentImage) return;
    const a = document.createElement("a");
    a.href = currentImage;
    a.download = "edited-image.png";
    a.click();
  };

  if (!originalImage) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 bg-gray-50/50">
        <div
          {...getRootProps()}
          className={`flex h-64 w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="rounded-full bg-blue-50 p-4 mb-4">
            <UploadCloud className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {isDragActive
              ? "Drop the image here..."
              : "Click or drag to upload"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            SVG, PNG, JPG or WEBP (max. 800x400px)
          </p>
        </div>
        {error && <p className="mt-6 text-sm text-red-500 bg-red-50 px-4 py-2 rounded-md">{error}</p>}
        {isProcessing && (
          <div className="mt-8 flex items-center space-x-3 text-sm text-gray-600 bg-white px-6 py-3 rounded-full shadow-sm border">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="font-medium">Extracting structured data via Gemini...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50/50">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Live Preview</h2>
          <p className="text-xs text-gray-500">View changes in real-time</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowBoxes(!showBoxes)}
            title="Toggle Bounding Boxes"
            className="h-8 w-8 text-gray-500"
          >
            {showBoxes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <Button
            variant="outline"
            size="icon"
            onClick={undo}
            disabled={historyIndex <= 0 || isProcessing}
            title="Undo"
            className="h-8 w-8"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={redo}
            disabled={historyIndex >= history.length - 1 || isProcessing}
            title="Redo"
            className="h-8 w-8"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            disabled={isProcessing}
            className="h-8 ml-2 shadow-sm"
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden bg-gray-100/50 p-6">
        <div className="relative h-full w-full rounded-xl border bg-white shadow-sm overflow-hidden flex items-center justify-center">
          {currentImage && (
            <div className="relative w-full h-full">
              <Image
                src={currentImage}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized
              />
              
              {/* Render Bounding Boxes Conceptually */}
              {showBoxes && jsonSchema && jsonSchema.objects && jsonSchema.objects.map((obj: any) => {
                if (!obj.bounding_box) return null;
                return (
                  <div 
                    key={obj.id}
                    className="absolute border-2 border-blue-500/50 bg-blue-500/10 pointer-events-none transition-all"
                    style={{
                      left: `${obj.bounding_box.x}%`,
                      top: `${obj.bounding_box.y}%`,
                      width: `${obj.bounding_box.width}%`,
                      height: `${obj.bounding_box.height}%`,
                    }}
                  >
                    <span className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                      {obj.type}
                    </span>
                  </div>
                )
              })}

              {showBoxes && jsonSchema && jsonSchema.text_blocks && jsonSchema.text_blocks.map((txt: any) => {
                if (!txt.bounding_box) return null;
                return (
                  <div 
                    key={txt.id}
                    className="absolute border-2 border-orange-500/50 bg-orange-500/10 pointer-events-none transition-all"
                    style={{
                      left: `${txt.bounding_box.x}%`,
                      top: `${txt.bounding_box.y}%`,
                      width: `${txt.bounding_box.width}%`,
                      height: `${txt.bounding_box.height}%`,
                    }}
                  >
                    <span className="absolute -top-6 left-0 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                      Text
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          {isProcessing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="mt-4 text-sm font-medium text-gray-700">Applying changes...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
