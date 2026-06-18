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
}

export function ChatPanel({
  settings,
  onUpdateSettings,
  fileContext,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let highThinking = settings.highThinking;
    if (settings.provider === "google" && settings.powerMode === "power") {
      highThinking = true;
    } else if (settings.provider === "google") {
      highThinking = false;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: settings.provider,
          model: settings.model,
          apiKey: settings.apiKey,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          options: {
            baseUrl: settings.baseUrl,
            useSearchGrounding: settings.useSearchGrounding,
            highThinking,
            systemInstruction: `You are TXAN-AGENT operating in ${settings.agentMode.toUpperCase()} mode. Current file context:\n${fileContext}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("API Error: " + (await response.text()));
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.text || "No response.",
        },
      ]);
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
        {messages.map((m) => (
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
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded flex items-center justify-center bg-[#2a2a2d] shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-[#1c1c1f] border border-[#2a2a2d] rounded p-3 flex items-center">
              <Loader2 size={16} className="animate-spin text-[#a1a1a1]" />
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
