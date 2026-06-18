import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
  Settings,
  FileCode2,
  Play,
  Terminal,
  Plus,
  Folder,
  File,
  Cpu,
} from "lucide-react";
import { SettingsModal } from "./components/SettingsModal";
import { ChatPanel } from "./components/ChatPanel";
import { AppSettings, FileNode } from "./types";

const INITIAL_FILES: FileNode[] = [];

export default function App() {
  const [files, setFiles] = useState<FileNode[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [output, setOutput] = useState<string>(
    "TXAN-AGENT Terminal v1.0.0\\nReady.\\n",
  );

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("txanSettings");
    if (saved) return JSON.parse(saved);
    return {
      provider: "google",
      apiKey: "",
      model: "gemini-3.5-flash",
      useSearchGrounding: true,
      highThinking: false,
      agentMode: "agent",
      powerMode: "economic",
    };
  });

  useEffect(() => {
    localStorage.setItem("txanSettings", JSON.stringify(settings));
  }, [settings]);

  const activeFile = files.find((f) => f.id === activeFileId);

  const handleEditorChange = (value: string | undefined) => {
    if (!value || !activeFileId) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: value } : f)),
    );
  };

  const handleRun = () => {
    if (activeFile?.name.endsWith(".js")) {
      setOutput((prev) => prev + "\\n> Running " + activeFile.name + "...\\n");
      try {
        // Simple safe eval for mock running
        let result;
        const safeConsoleLog = (...args: any[]) => {
          setOutput((prev) => prev + args.join(" ") + "\\n");
        };
        const originalLog = console.log;
        console.log = safeConsoleLog;

        try {
          // Use Function instead of eval for slightly better scoping in this mock
          const fn = new Function(activeFile.content);
          result = fn();
        } finally {
          console.log = originalLog;
        }

        if (result !== undefined) {
          setOutput((prev) => prev + "Return: " + result + "\\n");
        }
      } catch (e: any) {
        setOutput((prev) => prev + "Error: " + e.message + "\\n");
      }
    } else {
      setOutput(
        (prev) =>
          prev +
          "\\n> Cannot run " +
          (activeFile?.name || "unknown") +
          ". Only .js files are runnable in this mock environment.\\n",
      );
    }
  };

  const handleCreateFile = () => {
    const name = prompt("Enter file name:");
    if (!name) return;
    const newFile: FileNode = {
      id: Date.now().toString(),
      name,
      content:
        name.endsWith(".js") || name.endsWith(".ts") ? "// new file" : "",
      isFolder: false,
      parentId: null,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleCreateFolder = () => {
    const name = prompt("Enter folder name:");
    if (!name) return;
    const newFolder: FileNode = {
      id: Date.now().toString(),
      name,
      content: "",
      isFolder: true,
      parentId: null,
    };
    setFiles((prev) => [...prev, newFolder]);
  };

  const renderFileTree = (parentId: string | null = null, depth = 0) => {
    const layerFiles = files.filter((f) => f.parentId === parentId);
    return layerFiles.map((file) => (
      <div key={file.id}>
        <div
          className={
            "flex items-center space-x-2 py-1 px-3 cursor-pointer hover:bg-[#1c1c1f] " +
            (activeFileId === file.id
              ? "bg-[#1c1c1f] text-white border-r-2 border-cyan-500"
              : "text-[#a1a1a1]")
          }
          style={{ paddingLeft: depth * 12 + 12 + "px" }}
          onClick={() => !file.isFolder && setActiveFileId(file.id)}
        >
          {file.isFolder ? (
            <span className="text-orange-400 text-xs">📁</span>
          ) : (
            <span className="text-blue-400 font-mono text-[10px] w-5 inline-block text-center">
              {file.name.split(".").pop()?.toUpperCase()?.substring(0, 2)}
            </span>
          )}
          <span className="text-sm truncate select-none">{file.name}</span>
        </div>
        {file.isFolder && renderFileTree(file.id, depth + 1)}
      </div>
    ));
  };

  // Compile context for the agent
  const fileContext = files
    .filter((f) => !f.isFolder)
    .map((f) => "\\n--- " + f.name + " ---\\n" + f.content)
    .join("");

  return (
    <div className="h-screen w-full flex flex-col bg-[#0c0c0e] text-[#e0e0e0] overflow-hidden font-sans">
      {/* Top Nav */}
      <div className="h-12 border-b border-[#2a2a2d] flex items-center justify-between px-4 shrink-0 bg-[#141417]">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center font-bold text-black text-xs">
              TX
            </div>
            <span className="font-bold text-sm tracking-tight">TXAN-AGENT</span>
          </div>
          <div className="h-4 w-[1px] bg-[#2a2a2d] mx-2" />
          <div className="flex items-center space-x-2 text-xs text-[#a1a1a1]">
            <span className="hover:text-white cursor-pointer">workspace</span>
            <span>/</span>
            <span className="text-white font-medium">txan-project</span>
            <span className="ml-2 text-xs bg-[#2a2a2d] px-2 py-1 rounded border border-[#3e3e42] flex items-center space-x-2 text-[#e0e0e0]">
              <span>
                Model:{" "}
                <span className="text-cyan-400 font-mono">
                  {settings.model}
                </span>
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRun}
            className="flex items-center space-x-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-3 py-1.5 rounded text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
          >
            <Play size={12} fill="currentColor" />
            <span>Run</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-[#2a2a2d] hover:bg-[#3a3a3e] px-3 py-1.5 rounded text-xs font-medium border border-[#3e3e42] text-[#e0e0e0] flex items-center space-x-1 transition-colors hover:text-cyan-400 hover:border-cyan-500/50"
          >
            <Settings size={14} />
            <span>Config</span>
          </button>
          <div className="w-7 h-7 bg-gradient-to-tr from-cyan-600 to-blue-500 rounded-full border border-white/20"></div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-[#2a2a2d] bg-[#0c0c0e] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#2a2a2d] flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6a6a6e] uppercase tracking-widest">
              Files
            </span>
            <div className="flex space-x-1">
              <button
                onClick={handleCreateFile}
                className="p-1 text-[#6a6a6e] hover:text-white hover:bg-[#1c1c1f] transition-colors rounded"
              >
                <File size={14} />
              </button>
              <button
                onClick={handleCreateFolder}
                className="p-1 text-[#6a6a6e] hover:text-white hover:bg-[#1c1c1f] transition-colors rounded"
              >
                <Folder size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">{renderFileTree()}</div>
        </div>

        {/* Center - Editor & Terminal */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e]">
          {/* Editor Header */}
          <div className="h-9 border-b border-[#2a2a2d] bg-[#141417] flex items-center px-2 shrink-0 space-x-1">
            {activeFile && (
              <div className="flex items-center space-x-2 text-xs text-white bg-[#0c0c0e] px-3 py-2 rounded-t border-t border-x border-[#2a2a2d] -mb-[1px] z-10">
                <span className="text-blue-400 font-mono text-[10px] uppercase w-4 text-center">
                  {activeFile.name.split(".").pop()?.substring(0, 2)}
                </span>
                <span>{activeFile.name}</span>
              </div>
            )}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            {activeFile ? (
              <Editor
                height="100%"
                language={
                  activeFile.name.endsWith(".css")
                    ? "css"
                    : activeFile.name.endsWith(".json")
                      ? "json"
                      : activeFile.name.endsWith(".php")
                        ? "php"
                        : activeFile.name.endsWith(".rb")
                          ? "ruby"
                          : "javascript"
                }
                theme="vs-dark"
                value={activeFile.content}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: '"JetBrains Mono", monospace',
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  formatOnPaste: true,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a file to edit
              </div>
            )}
          </div>

          {/* Terminal Panel */}
          <div className="h-48 border-t border-[#2a2a2d] bg-[#0c0c0e] flex flex-col shrink-0">
            <div className="h-8 border-b border-[#2a2a2d] flex items-center justify-between px-4 bg-[#141417]">
              <span className="text-[10px] uppercase tracking-widest text-[#6a6a6e] font-bold">
                Terminal
              </span>
              <span className="text-[10px] text-cyan-500">● connected</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-cyan-500 opacity-80 whitespace-pre-wrap">
              {output}
            </div>
          </div>
        </div>

        {/* Right - Agent Panel */}
        <div className="w-[320px] flex flex-col shrink-0">
          <ChatPanel
            settings={settings}
            onUpdateSettings={setSettings}
            fileContext={fileContext}
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-6 border-t border-[#2a2a2d] bg-[#141417] flex items-center justify-between px-3 text-[10px] text-[#6a6a6e] shrink-0 font-sans cursor-default">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-cyan-500 rounded-full mr-1.5"></span>{" "}
            main*
          </span>
          <span className="hover:text-white cursor-pointer">0 ▲ 1 ▽</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>TypeScript</span>
          <span>UTF-8</span>
          <span className="text-[#e0e0e0]">Space: 2</span>
          <span className="bg-cyan-600/20 text-cyan-400 px-1 rounded">
            BYOK: Active
          </span>
        </div>
      </footer>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(s) => {
          setSettings(s);
          setIsSettingsOpen(false);
        }}
      />
    </div>
  );
}
