import { ImagePreview } from "@/components/editor/ImagePreview";
import { JsonEditor } from "@/components/editor/JsonEditor";
import { FormEditor } from "@/components/editor/FormEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Code2, LayoutTemplate } from "lucide-react";

export default function Home() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 items-center border-b px-6">
        <div className="flex items-center space-x-2">
          <Layers className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">StructEdit AI</h1>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel: Image Preview */}
        <div className="w-1/2 border-r">
          <ImagePreview />
        </div>

        {/* Right Panel: Editor */}
        <div className="flex w-1/2 flex-col bg-muted/10">
          <Tabs defaultValue="form" className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <TabsList>
                <TabsTrigger
                  value="form"
                  className="flex items-center space-x-2"
                >
                  <LayoutTemplate className="h-4 w-4" />
                  <span>Form UI</span>
                </TabsTrigger>
                <TabsTrigger
                  value="json"
                  className="flex items-center space-x-2"
                >
                  <Code2 className="h-4 w-4" />
                  <span>JSON Editor</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent
                value="form"
                className="h-full m-0 border-none p-0 outline-none"
              >
                <FormEditor />
              </TabsContent>
              <TabsContent
                value="json"
                className="h-full m-0 border-none p-0 outline-none"
              >
                <JsonEditor />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
