export interface FileNode {
  id: string;
  name: string;
  content: string;
  isFolder: boolean;
  children?: FileNode[];
  parentId: string | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  toolCalls?: {
    id: string;
    name: string;
    args: any;
  }[];
  tool_call_id?: string;
  name?: string;
  parts?: any[];
  tool_calls?: any[];
}

export type Provider = 'google' | 'openai' | 'custom';
export type AgentMode = 'ask' | 'plan' | 'agent';
export type PowerMode = 'lite' | 'economic' | 'power';

export interface CustomModel {
  id: string;
  name: string;
  provider: Provider;
  modelId: string;
  apiKey: string;
  baseUrl?: string;
  status?: string;
}

export interface AppSettings {
  provider: Provider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  useSearchGrounding: boolean;
  highThinking: boolean;
  agentMode: AgentMode;
  powerMode: PowerMode;
  customModels: CustomModel[];
  activeCustomModelId?: string;
}

