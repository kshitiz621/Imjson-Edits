"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Play, Type, Image as ImageIcon, Palette, Box } from "lucide-react";
import { editImage } from "@/lib/gemini";

export function FormEditor() {
  const {
    jsonSchema,
    setJsonSchema,
    currentImage,
    setIsProcessing,
    pushToHistory,
  } = useAppStore();
  const [localSchema, setLocalSchema] = useState<any>(null);

  useEffect(() => {
    if (jsonSchema) {
      setLocalSchema(JSON.parse(JSON.stringify(jsonSchema)));
    }
  }, [jsonSchema]);

  const handleApply = async () => {
    if (!localSchema || !jsonSchema) return;

    if (JSON.stringify(localSchema) === JSON.stringify(jsonSchema)) {
      return;
    }

    setIsProcessing(true);

    try {
      if (!currentImage) throw new Error("No image to edit");

      const newImage = await editImage(currentImage, jsonSchema, localSchema);

      setJsonSchema(localSchema);
      useAppStore.getState().setCurrentImage(newImage);
      pushToHistory(newImage, localSchema);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to apply changes");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleObjectChange = (index: number, field: string, value: string) => {
    const newSchema = { ...localSchema };
    newSchema.objects[index].attributes[field] = value;
    setLocalSchema(newSchema);
  };

  const handleTextChange = (index: number, field: string, value: string | number) => {
    const newSchema = { ...localSchema };
    newSchema.text_blocks[index][field] = value;
    setLocalSchema(newSchema);
  };

  const handleBackgroundChange = (field: string, value: string) => {
    const newSchema = { ...localSchema };
    newSchema.background[field] = value;
    setLocalSchema(newSchema);
  };

  const handleStyleChange = (field: string, value: string) => {
    const newSchema = { ...localSchema };
    newSchema.styles[field] = value;
    setLocalSchema(newSchema);
  };

  if (!localSchema) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
        Upload an image to generate editable fields.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50/50">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Visual Editor</h3>
          <p className="text-xs text-gray-500">Modify extracted properties</p>
        </div>
        <Button size="sm" onClick={handleApply} className="shadow-sm">
          <Play className="mr-2 h-4 w-4" />
          Apply Changes
        </Button>
      </div>
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-8 pb-8">
          
          {/* Objects Section */}
          {localSchema.objects && localSchema.objects.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-900">
                <Box className="h-4 w-4 text-blue-500" />
                <h4 className="font-semibold text-sm tracking-tight">Detected Objects</h4>
              </div>
              <div className="grid gap-4">
                {localSchema.objects.map((obj: any, index: number) => (
                  <div key={obj.id} className="rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm capitalize">{obj.type}</span>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{obj.id}</span>
                    </div>
                    <Separator className="mb-4" />
                    <div className="grid grid-cols-2 gap-4">
                      {obj.attributes && Object.entries(obj.attributes).map(([key, value]) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-xs text-gray-500 capitalize">{key.replace(/_/g, " ")}</Label>
                          {key.toLowerCase().includes("color") ? (
                            <div className="flex space-x-2">
                              <Input
                                type="color"
                                value={value as string || '#ffffff'}
                                onChange={(e) => handleObjectChange(index, key, e.target.value)}
                                className="h-8 w-8 p-1 cursor-pointer"
                              />
                              <Input
                                value={value as string}
                                onChange={(e) => handleObjectChange(index, key, e.target.value)}
                                className="h-8 text-sm flex-1 font-mono"
                              />
                            </div>
                          ) : (
                            <Input
                              value={value as string}
                              onChange={(e) => handleObjectChange(index, key, e.target.value)}
                              className="h-8 text-sm bg-gray-50/50"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text Blocks Section */}
          {localSchema.text_blocks && localSchema.text_blocks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-900">
                <Type className="h-4 w-4 text-orange-500" />
                <h4 className="font-semibold text-sm tracking-tight">Text Elements</h4>
              </div>
              <div className="grid gap-4">
                {localSchema.text_blocks.map((txt: any, index: number) => (
                  <div key={txt.id} className="rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">Content</Label>
                        <Input
                          value={txt.content}
                          onChange={(e) => handleTextChange(index, 'content', e.target.value)}
                          className="h-8 text-sm font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">Color</Label>
                          <div className="flex space-x-2">
                            <Input
                              type="color"
                              value={txt.color || '#000000'}
                              onChange={(e) => handleTextChange(index, 'color', e.target.value)}
                              className="h-8 w-8 p-1 cursor-pointer"
                            />
                            <Input
                              value={txt.color || '#000000'}
                              onChange={(e) => handleTextChange(index, 'color', e.target.value)}
                              className="h-8 text-sm flex-1 font-mono"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500 flex justify-between">
                            <span>Font Size</span>
                            <span className="text-gray-400">{txt.font_size || 16}px</span>
                          </Label>
                          <input
                            type="range"
                            min="8"
                            max="120"
                            value={txt.font_size || 16}
                            onChange={(e) => handleTextChange(index, 'font_size', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Styles Section */}
          {localSchema.styles && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-900">
                <Palette className="h-4 w-4 text-purple-500" />
                <h4 className="font-semibold text-sm tracking-tight">Global Styles</h4>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(localSchema.styles).map(([key, value]) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs text-gray-500 capitalize">{key.replace(/_/g, " ")}</Label>
                      <Input
                        value={value as string}
                        onChange={(e) => handleStyleChange(key, e.target.value)}
                        className="h-8 text-sm bg-gray-50/50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Background Section */}
          {localSchema.background && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-900">
                <ImageIcon className="h-4 w-4 text-green-500" />
                <h4 className="font-semibold text-sm tracking-tight">Background</h4>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(localSchema.background).map(([key, value]) => {
                    if (key === 'description') return null; // Hide description from simple UI
                    return (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-xs text-gray-500 capitalize">{key.replace(/_/g, " ")}</Label>
                        {key === 'color' ? (
                          <div className="flex space-x-2">
                            <Input
                              type="color"
                              value={value as string || '#ffffff'}
                              onChange={(e) => handleBackgroundChange(key, e.target.value)}
                              className="h-8 w-8 p-1 cursor-pointer"
                            />
                            <Input
                              value={value as string}
                              onChange={(e) => handleBackgroundChange(key, e.target.value)}
                              className="h-8 text-sm flex-1 font-mono"
                            />
                          </div>
                        ) : (
                          <Input
                            value={value as string}
                            onChange={(e) => handleBackgroundChange(key, e.target.value)}
                            className="h-8 text-sm bg-gray-50/50"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}
