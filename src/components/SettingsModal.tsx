import React, { useState } from "react";
import { Settings, X, Plus, Trash2, Check, Sparkles, Server } from "lucide-react";
import { AppSettings, Provider, CustomModel } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);

  // Form state for adding a custom model
  const [newModelName, setNewModelName] = useState("");
  const [newModelProvider, setNewModelProvider] = useState<Provider>("google");
  const [newModelId, setNewModelId] = useState("");
  const [newModelApiKey, setNewModelApiKey] = useState("");
  const [newModelBaseUrl, setNewModelBaseUrl] = useState("");

  if (!isOpen) return null;

  const handleAddCustomModel = () => {
    if (!newModelName.trim() || !newModelId.trim()) {
      alert("Please enter both a display name and Model ID.");
      return;
    }

    const newObj: CustomModel = {
      id: "custom-" + Date.now().toString(),
      name: newModelName.trim(),
      provider: newModelProvider,
      modelId: newModelId.trim(),
      apiKey: newModelApiKey.trim(),
      baseUrl: newModelProvider === "custom" ? newModelBaseUrl.trim() : undefined,
    };

    const updatedCustoms = [...(localSettings.customModels || []), newObj];
    setLocalSettings((s) => ({
      ...s,
      customModels: updatedCustoms,
    }));

    // Reset inputs
    setNewModelName("");
    setNewModelId("");
    setNewModelApiKey("");
    setNewModelBaseUrl("");
  };

  const handleDeleteCustomModel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalSettings((s) => ({
      ...s,
      customModels: (s.customModels || []).filter((m) => m.id !== id),
    }));
  };

  const handleSelectCustomModel = (model: CustomModel) => {
    setLocalSettings((s) => ({
      ...s,
      provider: model.provider,
      model: model.modelId,
      apiKey: model.apiKey,
      baseUrl: model.baseUrl || "",
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141417] border border-[#2a2a2d] rounded-lg w-full max-w-4xl shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2d] bg-[#1a1a1e]">
          <h2 className="text-sm font-bold text-white flex items-center">
            <Settings size={16} className="text-cyan-400 mr-2 animate-spin-slow" />
            Workspace Model Configuration suite
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#6a6a6e] transition-colors hover:bg-[#2a2a2d] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Active Workspace Model Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center">
                <Sparkles size={14} className="mr-1.5" /> Active workspace configuration
              </span>
              <span className="text-[10px] text-gray-500 font-mono">BYOK system</span>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#6a6a6e] mb-1">
                Provider
              </label>
              <select
                value={localSettings.provider}
                onChange={(e) =>
                  setLocalSettings((s) => ({
                    ...s,
                    provider: e.target.value as Provider,
                    // Auto reset baseUrl if not custom
                    baseUrl: e.target.value !== "custom" ? undefined : s.baseUrl
                  }))
                }
                className="w-full bg-[#0c0c0e] border border-[#3a3a3e] text-[#e0e0e0] rounded p-2 text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              >
                <option value="google">Google Gemini</option>
                <option value="openai">OpenAI API</option>
                <option value="custom">Custom Endpoint / Ollama / Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#6a6a6e] mb-1">
                API API-Key
              </label>
              <input
                type="password"
                value={localSettings.apiKey}
                onChange={(e) =>
                  setLocalSettings((s) => ({ ...s, apiKey: e.target.value }))
                }
                placeholder="Enter model API authorization secret key"
                className="w-full bg-[#0c0c0e] border border-[#3a3a3e] rounded p-2 text-xs text-[#e0e0e0] placeholder-[#4a4a4e] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              />
              <p className="text-[10px] text-[#6a6a6e] mt-1">
                Leave blank to fallback to the sandbox env variables.
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#6a6a6e] mb-1">
                Model Identifier
              </label>
              <input
                type="text"
                value={localSettings.model}
                onChange={(e) =>
                  setLocalSettings((s) => ({ ...s, model: e.target.value }))
                }
                placeholder="gemini-3.5-flash or gpt-4o-mini"
                className="w-full bg-[#0c0c0e] border border-[#3a3a3e] rounded p-2 text-xs text-[#e0e0e0] placeholder-[#4a4a4e] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              />
            </div>

            {localSettings.provider === "custom" && (
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#6a6a6e] mb-1">
                  Custom Base URL
                </label>
                <input
                  type="text"
                  value={localSettings.baseUrl || ""}
                  onChange={(e) =>
                    setLocalSettings((s) => ({ ...s, baseUrl: e.target.value }))
                  }
                  placeholder="https://api.your-endpoint.com/v1"
                  className="w-full bg-[#0c0c0e] border border-[#3a3a3e] rounded p-2 text-xs text-[#e0e0e0] placeholder-[#4a4a4e] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
            )}

            {localSettings.provider === "google" && (
              <div className="space-y-2 mt-4 pt-4 border-t border-[#2a2a2d]">
                <label className="block text-[10px] uppercase font-bold text-[#6a6a6e] mb-2">
                  Grounding settings
                </label>
                <label className="flex items-center space-x-2 text-xs text-[#d0d0d0] cursor-pointer selection:bg-transparent">
                  <input
                    type="checkbox"
                    checked={localSettings.useSearchGrounding || false}
                    onChange={(e) =>
                      setLocalSettings((s) => ({
                        ...s,
                        useSearchGrounding: e.target.checked,
                      }))
                    }
                    className="w-3.5 h-3.5 rounded border border-[#3a3a3e] bg-[#0c0c0e] text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>Retrieve live web information using Google Search Grounding</span>
                </label>
              </div>
            )}
          </div>

          {/* Right Column: Dynamic Saved Custom Models list & Creator */}
          <div className="space-y-4 border-t md:border-t-0 md:border-l md:pl-8 border-[#2a2a2d] flex flex-col min-h-0">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center">
              <Server size={14} className="mr-1.5" /> Save custom API architectures
            </span>

            {/* Custom selection list */}
            <div className="flex-1 border border-[#2a2a2d] bg-[#0c0c0e] rounded p-3 overflow-y-auto space-y-2 max-h-[220px]">
              {(!localSettings.customModels || localSettings.customModels.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center py-8 text-center text-gray-500 text-xs">
                  <span>No custom models added yet.</span>
                  <span className="text-[10px] opacity-60 mt-1">Add one using the panel below!</span>
                </div>
              ) : (
                 localSettings.customModels.map((m) => {
                  const isActive = localSettings.model === m.modelId && localSettings.provider === m.provider;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectCustomModel(m)}
                      className={`flex items-center justify-between p-2.5 rounded cursor-pointer transition-colors ${isActive ? "bg-cyan-950/40 border border-cyan-500/30 text-white" : "bg-[#141417]/80 hover:bg-[#1a1a1f] border border-transparent text-[#a1a1a1]"}`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          {m.name}
                          {isActive && <Check size={12} className="text-cyan-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] opacity-60 truncate font-mono mt-0.5">
                          [{m.provider}] {m.modelId}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteCustomModel(m.id, e)}
                        className="p-1 hover:text-red-400 text-gray-600 transition-colors shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dynamic model registerer suite */}
            <div className="bg-[#1a1a1e] border border-[#2e2e33] rounded p-4 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center">
                <Plus size={14} className="mr-1" /> Dynamic Custom Model Builder
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Display Name</label>
                  <input
                    type="text"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder="e.g. DeepSeek R1"
                    className="w-full bg-[#0c0c0e] border border-[#3a3a3e] rounded p-1.5 text-[11px] text-[#e0e0e0] placeholder-[#4a4a4e] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Select Provider</label>
                  <select
                    value={newModelProvider}
                    onChange={(e) => setNewModelProvider(e.target.value as Provider)}
                    className="w-full bg-[#0c0c0e] border border-[#3a3a3e] text-[#e0e0e0] rounded p-1.5 text-[11px] focus:border-cyan-500 focus:ring-1 focus:focus:ring-cyan-500 outline-none"
                  >
                    <option value="google">Google</option>
                    <option value="openai">OpenAI</option>
                    <option value="custom">Custom Endpoint</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Model ID</label>
                  <input
                    type="text"
                    value={newModelId}
                    onChange={(e) => setNewModelId(e.target.value)}
                    placeholder="e.g. deepseek-r1"
                    className="w-full bg-[#0c0c0e] border border-[#3a3a3e] rounded p-1.5 text-[11px] text-[#e0e0e0] placeholder-[#4a4a4e] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Secret key</label>
                  <input
                    type="password"
                    value={newModelApiKey}
                    onChange={(e) => setNewModelApiKey(e.target.value)}
                    placeholder="Paste key secret"
                    className="w-full bg-[#0c0c0e] border border-[#3a3a3e] rounded p-1.5 text-[11px] text-[#e0e0e0] placeholder-[#4a4a4e] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>
              </div>

              {newModelProvider === "custom" && (
                <div>
                  <label className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Custom Base URL</label>
                  <input
                    type="text"
                    value={newModelBaseUrl}
                    onChange={(e) => setNewModelBaseUrl(e.target.value)}
                    placeholder="https://api.together.xyz/v1"
                    className="w-full bg-[#0c0c0e] border border-[#3a3a3e] rounded p-1.5 text-[11px] text-[#e0e0e0] placeholder-[#4a4a4e] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleAddCustomModel}
                className="w-full py-1.5 bg-[#2a2a2d] hover:bg-[#343438] text-cyan-400 font-semibold rounded text-[10px] transition-colors uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <Plus size={12} /> Add to list
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a2d] bg-[#1a1a1e] flex items-center justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#a1a1a1] hover:text-white hover:bg-[#2a2a2d] rounded text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(localSettings)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2 rounded text-xs shadow-lg shadow-cyan-900/20 transition-colors"
          >
            Apply & Save Configuration
          </button>
        </div>

      </div>
    </div>
  );
}
