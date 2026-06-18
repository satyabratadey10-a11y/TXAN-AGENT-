import React from "react";
import { Settings, X } from "lucide-react";
import { AppSettings, Provider } from "../types";

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
  const [localSettings, setLocalSettings] =
    React.useState<AppSettings>(settings);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#141417] border border-[#2a2a2d] rounded-lg p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded p-1 text-[#6a6a6e] transition-colors hover:bg-[#1c1c1f] hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-sm font-bold text-white mb-6 flex items-center">
          <Settings size={16} className="text-cyan-400 mr-2" />
          Agent Config (BYOK)
        </h2>

        <div className="space-y-4">
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
                }))
              }
              className="w-full bg-[#0c0c0e] border border-[#3a3a3e] text-[#e0e0e0] rounded p-2 text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
            >
              <option value="google">Google (Gemini)</option>
              <option value="openai">OpenAI</option>
              <option value="custom">Custom Endpoint</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#6a6a6e] mb-1">
              API Key
            </label>
            <input
              type="password"
              value={localSettings.apiKey}
              onChange={(e) =>
                setLocalSettings((s) => ({ ...s, apiKey: e.target.value }))
              }
              placeholder="Leave blank to use environment default"
              className="w-full bg-[#0c0c0e] border border-[#3a3a3e] rounded p-2 text-xs text-[#e0e0e0] placeholder-[#4a4a4e] focus:ring-1 focus:ring-cyan-500 outline-none"
            />
            <p className="text-[10px] text-[#6a6a6e] mt-1">
              Keys are stored locally in your workspace.
            </p>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#6a6a6e] mb-1">
              Model ID
            </label>
            <input
              type="text"
              value={localSettings.model}
              onChange={(e) =>
                setLocalSettings((s) => ({ ...s, model: e.target.value }))
              }
              placeholder="gemini-3.5-flash or ... "
              className="w-full bg-[#0c0c0e] border border-[#3a3a3e] rounded p-2 text-xs text-[#e0e0e0] placeholder-[#4a4a4e] focus:ring-1 focus:ring-cyan-500 outline-none"
            />
          </div>

          {localSettings.provider === "custom" && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#6a6a6e] mb-1">
                Base URL
              </label>
              <input
                type="text"
                value={localSettings.baseUrl || ""}
                onChange={(e) =>
                  setLocalSettings((s) => ({ ...s, baseUrl: e.target.value }))
                }
                placeholder="https://api.example.com/v1"
                className="w-full bg-[#0c0c0e] border border-[#3a3a3e] rounded p-2 text-xs text-[#e0e0e0] placeholder-[#4a4a4e] focus:ring-1 focus:ring-cyan-500 outline-none"
              />
            </div>
          )}

          {localSettings.provider === "google" && (
            <div className="space-y-2 mt-4 pt-4 border-t border-[#2a2a2d]">
              <label className="block text-[10px] uppercase font-bold text-[#6a6a6e] mb-2">
                Agent Capabilities
              </label>
              <label className="flex items-center space-x-2 text-xs text-[#d0d0d0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.useSearchGrounding}
                  onChange={(e) =>
                    setLocalSettings((s) => ({
                      ...s,
                      useSearchGrounding: e.target.checked,
                    }))
                  }
                  className="w-3 h-3 rounded bg-cyan-500 text-cyan-600 focus:ring-cyan-500"
                />
                <span>Enable Google Search Grounding</span>
              </label>
            </div>
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={() => onSave(localSettings)}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded text-xs shadow-lg shadow-cyan-900/20 transition-colors"
          >
            Save Workspace Config
          </button>
        </div>
      </div>
    </div>
  );
}
