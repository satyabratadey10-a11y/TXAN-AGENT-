import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Zap,
  Brain,
  MessageSquare,
  Layers,
  Code2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Message, AppSettings, AgentMode, PowerMode } from "../types";

interface ChatPanelProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  fileContext: string;
  onCreateFile: (name: string, content: string) => string;
  onEditFile: (name: string, content: string) => string;
  onReadFile: (name: string) => string;
  onListFiles: () => string;
  onRunCode: () => string;
}

export function ChatPanel({
  settings,
  onUpdateSettings,
  fileContext,
  onCreateFile,
  onEditFile,
  onReadFile,
  onListFiles,
  onRunCode,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "start",
      role: "assistant",
      content: "Hello! I am TXAN-AGENT. How can I help you code today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, executionLogs]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    
    let activeHistory = [...messages, userMessage];
    setMessages(activeHistory);
    setInput("");
    setIsLoading(true);
    setExecutionLogs([]);

    let highThinking = settings.highThinking;
    if (settings.provider === "google" && settings.powerMode === "power") {
      highThinking = true;
    } else if (settings.provider === "google") {
      highThinking = false;
    }

    try {
      let loopCount = 0;
      const maxLoops = 6;
      let shouldContinue = true;

      while (shouldContinue && loopCount < maxLoops) {
        setExecutionLogs(prev => [...prev, `🤖 Contacting API (turn ${loopCount + 1})...`]);
        
        let actualApiKey = settings.apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";
        
        let data: any = {};
        
        // Fast-path client-side call for Google provider if we have an API key inside Capacitor or Browser
        if (settings.provider === "google" && actualApiKey) {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: actualApiKey });
          
          const formattedMessages = activeHistory.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: m.parts || [{ text: m.content || "" }]
          }));

          const functionDeclarations = [
            {
              name: "create_file",
              description: "Creates a new file in the virtual workspace with the specified name and content.",
              parameters: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING", description: "The file name to create (e.g. index.js, package.json)." },
                  content: { type: "STRING", description: "The file content to write." }
                },
                required: ["name", "content"]
              }
            },
            {
              name: "edit_file",
              description: "Modifies an existing file in the virtual workspace by overwriting its content.",
              parameters: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING", description: "The file name to edit." },
                  content: { type: "STRING", description: "The new complete content of the file." }
                },
                required: ["name", "content"]
              }
            },
            {
              name: "read_file",
              description: "Reads the contents of an existing file.",
              parameters: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING", description: "The file name to read." }
                },
                required: ["name"]
              }
            },
            {
              name: "list_files",
              description: "Lists all files and folders.",
              parameters: { type: "OBJECT", properties: {} }
            },
            {
              name: "run_code",
              description: "Executes the current runnable .js code.",
              parameters: { type: "OBJECT", properties: {} }
            }
          ];

          const tools: any[] = [{ functionDeclarations }];
          if (settings.useSearchGrounding) tools.push({ googleSearch: {} });

          const aiOptions: any = {
             systemInstruction: { parts: [{ text: `You are TXAN-AGENT running in ${settings.agentMode.toUpperCase()} mode. You have access to native sandbox terminal operations and a dynamic workspace filesystem. Use your tools whenever needed to list files, read, write, edit, or execute code. Address user instructions directly.` }] },
             tools,
          };
          
          if (highThinking) aiOptions.thinkingConfig = { thinkingBudgetTokens: 1024 };

          try {
            const response = await ai.models.generateContent({
              model: settings.model || "gemini-2.5-flash",
              contents: formattedMessages,
              config: aiOptions
            });

            if (response.functionCalls && response.functionCalls.length > 0) {
              data.toolCalls = response.functionCalls.map((fc: any) => ({
                id: fc.id || `gemini-${Date.now()}`,
                name: fc.name,
                args: fc.args
              }));
            } else {
              data.text = response.text;
            }
          } catch(err: any) {
             throw new Error("Local Generation Error: " + err.message);
          }
        } else {
          // Fallback to Express backend
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              provider: settings.provider,
              model: settings.model,
              apiKey: settings.apiKey,
              messages: activeHistory.map((m) => {
                if (m.parts) {
                  return { role: m.role, parts: m.parts };
                }
                if (m.tool_calls) {
                  return { role: m.role, content: m.content || null, tool_calls: m.tool_calls };
                }
                if (m.role === 'tool') {
                  return { role: m.role, content: m.content, tool_call_id: m.tool_call_id, name: m.name };
                }
                return { role: m.role, content: m.content };
              }),
              options: {
                baseUrl: settings.baseUrl,
                useSearchGrounding: settings.useSearchGrounding,
                highThinking,
                systemInstruction: `You are TXAN-AGENT running in ${settings.agentMode.toUpperCase()} mode. You have access to native sandbox terminal operations and a dynamic workspace filesystem. Use your tools whenever needed to list files, read, write, edit, or execute code. Address user instructions directly.`,
              },
            }),
          });

          let data;
          if (!response.ok) {
            throw new Error("API Error: " + (await response.text()));
          }

          const textData = await response.text();
          try {
            data = JSON.parse(textData);
          } catch (e) {
            throw new Error(`Invalid JSON from backend. The server might have restarted or returned an error page. Preview: ${textData.substring(0, 100)}`);
          }
        }

        if (data.toolCalls && data.toolCalls.length > 0) {
          // LLM wants us to run tools!
          const assistantToolCallMessage: Message = {
            id: (Date.now() + Math.random()).toString(),
            role: "assistant",
            content: "Executing requested operations in your sandbox...",
            toolCalls: data.toolCalls,
            // Format for OpenAI API compatibility
            tool_calls: data.toolCalls.map((tc: any) => ({
              id: tc.id,
              type: "function",
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.args)
              }
            })),
            // Format for Gemini API compliance
            parts: data.toolCalls.map((tc: any) => ({
              functionCall: {
                name: tc.name,
                args: tc.args
              }
            }))
          };

          const logItems = data.toolCalls.map((tc: any) => `🛠️ Call: ${tc.name}(${JSON.stringify(tc.args)})`);
          setExecutionLogs(prev => [...prev, ...logItems]);

          activeHistory = [...activeHistory, assistantToolCallMessage];
          setMessages(activeHistory);

          // Perform actual tools and append results
          const toolResultsList: Message[] = [];
          for (const tc of data.toolCalls) {
            let outputText = "";
            try {
              if (tc.name === "create_file") {
                outputText = onCreateFile(tc.args.name, tc.args.content);
              } else if (tc.name === "edit_file") {
                outputText = onEditFile(tc.args.name, tc.args.content);
              } else if (tc.name === "read_file") {
                outputText = onReadFile(tc.args.name);
              } else if (tc.name === "list_files") {
                outputText = onListFiles();
              } else if (tc.name === "run_code") {
                outputText = onRunCode();
              } else {
                outputText = `Error: Unknown tool '${tc.name}'`;
              }
            } catch (err: any) {
              outputText = `Exception executing tool: ${err.message}`;
            }

            setExecutionLogs(prev => [...prev, `✅ Result: ${outputText.substring(0, 120)}${outputText.length > 120 ? '...' : ''}`]);

            const toolResultMessage: Message = {
              id: (Date.now() + Math.random()).toString(),
              role: "tool",
              content: outputText,
              tool_call_id: tc.id,
              name: tc.name,
              parts: [
                {
                  functionResponse: {
                    name: tc.name,
                    response: { result: outputText }
                  }
                }
              ]
            };
            toolResultsList.push(toolResultMessage);
          }

          activeHistory = [...activeHistory, ...toolResultsList];
          setMessages(activeHistory);
          loopCount++;
        } else {
          // Final Text Answer!
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: data.text || "No response.",
            },
          ]);
          shouldContinue = false;
        }
      }

      if (loopCount >= maxLoops) {
        setExecutionLogs(prev => [...prev, `⚠️ Max agent lookup limit reached.`]);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#141417] border-l border-[#2a2a2d] text-[#e0e0e0]">
      <div className="p-3 border-b border-[#2a2a2d] bg-[#1a1a1e] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center">
            <Bot size={16} className="text-cyan-400 mr-2" /> TXAN-AGENT
          </h2>
          <div className="flex text-xs bg-[#0c0c0e] rounded border border-[#2a2a2d] p-0.5">
            {(["lite", "economic", "power"] as PowerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  let newModel = settings.model;
                  if (settings.provider === "google") {
                    if (mode === "lite") newModel = "gemini-3.1-flash-lite";
                    if (mode === "economic") newModel = "gemini-3.5-flash";
                    if (mode === "power")
                      newModel = "models/gemini-3.1-pro-preview";
                  }
                  onUpdateSettings({
                    ...settings,
                    powerMode: mode,
                    model: newModel,
                  });
                }}
                className={`px-2 py-1 flex items-center rounded transition-colors ${settings.powerMode === mode ? "bg-[#2a2a2d] text-white shadow-sm" : "text-[#a1a1a1] hover:text-white hover:bg-[#1c1c1f]"}`}
              >
                {mode === "lite" && <Zap size={12} className="mr-1" />}
                {mode === "economic" && <Layers size={12} className="mr-1" />}
                {mode === "power" && <Brain size={12} className="mr-1" />}
                <span className="capitalize">{mode}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex text-xs bg-[#0c0c0e] rounded border border-[#2a2a2d] p-0.5">
          {(["plan", "agent", "ask"] as AgentMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onUpdateSettings({ ...settings, agentMode: mode })}
              className={`flex-1 flex justify-center items-center py-1.5 rounded transition-colors ${settings.agentMode === mode ? "bg-cyan-600 text-white shadow" : "text-[#6a6a6e] hover:text-white hover:bg-[#1c1c1f]"}`}
            >
              {mode === "plan" && <Layers size={14} className="mr-1.5" />}
              {mode === "agent" && <Code2 size={14} className="mr-1.5" />}
              {mode === "ask" && <MessageSquare size={14} className="mr-1.5" />}
              <span className="capitalize font-medium">{mode}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
        {messages.filter(m => m.role === 'user' || (m.role === 'assistant' && !m.toolCalls)).map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-cyan-600" : "bg-[#2a2a2d]"}`}
            >
              {m.role === "user" ? (
                <User size={14} className="text-white" />
              ) : (
                <Bot size={14} className="text-white" />
              )}
            </div>
            <div
              className={`max-w-[85%] rounded p-3 ${m.role === "user" ? "bg-cyan-600/10 border border-cyan-500/20 text-cyan-50" : "bg-[#1c1c1f] border border-[#2a2a2d] text-[#d0d0d0]"}`}
            >
              <div className="markdown-body prose prose-invert max-w-none text-sm prose-pre:bg-[#0c0c0e] prose-pre:border prose-pre:border-[#2a2a2d]">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {executionLogs.length > 0 && (
          <div className="bg-[#0c0c0e]/60 border border-cyan-500/20 text-cyan-400 p-3 rounded text-xs space-y-1 font-mono">
            <div className="font-semibold text-[10px] text-cyan-500 flex items-center gap-1.5 uppercase tracking-wider mb-2">
              <Bot size={12} className="animate-pulse" /> Sandbox Console Logs
            </div>
            {executionLogs.map((log, idx) => (
              <div key={idx} className="truncate select-none opacity-80">{log}</div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded flex items-center justify-center bg-[#2a2a2d] shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-[#1c1c1f] border border-[#2a2a2d] rounded p-3 flex items-center">
              <Loader2 size={16} className="animate-spin text-cyan-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[#2a2a2d] bg-[#141417]">
        <div className="relative flex items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Ask TXAN-AGENT to write code using ${settings.powerMode} power in ${settings.agentMode} mode...`}
            className="w-full bg-[#0c0c0e] text-[#e0e0e0] border border-[#3a3a3e] rounded p-3 pr-10 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none max-h-32 min-h-[44px] text-xs placeholder-[#4a4a4e]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-1.5 bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-transparent disabled:text-[#6a6a6e] transition-colors rounded"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
