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
  role: 'user' | 'assistant';
  content: string;
}

export type Provider = 'google' | 'openai' | 'custom';
export type AgentMode = 'ask' | 'plan' | 'agent';
export type PowerMode = 'lite' | 'economic' | 'power';

export interface AppSettings {
  provider: Provider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  useSearchGrounding: boolean;
  highThinking: boolean;
  agentMode: AgentMode;
  powerMode: PowerMode;
}

