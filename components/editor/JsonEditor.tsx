"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useAppStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import { editImage } from "@/lib/gemini";

export function JsonEditor() {
  const {
    jsonSchema,
    setJsonSchema,
    currentImage,
    setIsProcessing,
    pushToHistory,
  } = useAppStore();
  const [localJson, setLocalJson] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jsonSchema) {
      setLocalJson(JSON.stringify(jsonSchema, null, 2));
    }
  }, [jsonSchema]);

  const handleApply = async () => {
    try {
      setError(null);
      const parsed = JSON.parse(localJson);

      // If no changes, just return
      if (JSON.stringify(parsed) === JSON.stringify(jsonSchema)) {
        return;
      }

      setIsProcessing(true);

      if (!currentImage) throw new Error("No image to edit");

      const newImage = await editImage(currentImage, jsonSchema, parsed);

      // Update state
      setJsonSchema(parsed);
      useAppStore.getState().setCurrentImage(newImage);
      pushToHistory(newImage, parsed);
    } catch (err: any) {
      setError(err.message || "Invalid JSON format");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!jsonSchema) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
        Upload an image to generate its JSON representation.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-sm font-medium">JSON Schema</h3>
        <Button size="sm" onClick={handleApply}>
          <Play className="mr-2 h-4 w-4" />
          Apply Changes
        </Button>
      </div>
      {error && (
        <div className="bg-destructive/10 p-3 text-xs text-destructive border-b border-destructive/20">
          {error}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={localJson}
          onChange={(val) => setLocalJson(val || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            wordWrap: "on",
            formatOnPaste: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
