import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { provider, model, apiKey, messages, options } = req.body;

    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }

    // Modern Workspace Tool Declarations
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
        description: "Reads the contents of an existing file in the virtual workspace.",
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
        description: "Lists all files and folders in the workspace.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "run_code",
        description: "Executes the current runnable .js code in the sandbox environment and returns output.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      }
    ];

    const openaiTools = [
      {
        type: "function",
        function: {
          name: "create_file",
          description: "Creates a new file in the virtual workspace with the specified name and content.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "The file name to create (e.g. index.js, package.json)." },
              content: { type: "string", description: "The file content to write." }
            },
            required: ["name", "content"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "edit_file",
          description: "Modifies an existing file in the virtual workspace by overwriting its content.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "The file name to edit." },
              content: { type: "string", description: "The new complete content of the file." }
            },
            required: ["name", "content"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "read_file",
          description: "Reads the contents of an existing file in the virtual workspace.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "The file name to read." }
            },
            required: ["name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "list_files",
          description: "Lists all files and folders in the workspace.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "run_code",
          description: "Executes the current runnable .js code in the sandbox environment and returns output.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      }
    ];

    if (provider === 'google') {
      const actualKey = apiKey || process.env.GEMINI_API_KEY;
      if (!actualKey) {
        return res.status(401).json({ error: 'API key is required for Google provider' });
      }

      const ai = new GoogleGenAI({ apiKey: actualKey });
      
      const formattedMessages = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: m.parts || [{ text: m.content }]
      }));

      const systemInstruction = options?.systemInstruction ? {
        parts: [{ text: options.systemInstruction }]
      } : undefined;

      // Declare workspace tools + search grounding if requested
      const tools: any[] = [{ functionDeclarations }];
      if (options?.useSearchGrounding) {
         tools.push({ googleSearch: {} });
      }

      const aiOptions: any = {
         systemInstruction,
         tools,
      };

      if (options?.highThinking) {
         aiOptions.thinkingConfig = { thinkingBudgetTokens: 1024 };
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: formattedMessages,
        config: aiOptions
      });

      // Check if candidate has function / tool calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        return res.json({
          toolCalls: response.functionCalls.map((fc: any) => ({
            id: fc.id || `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: fc.name,
            args: fc.args
          }))
        });
      }

      return res.json({ text: response.text });
    } else if (provider === 'openai' || provider === 'custom') {
       if (!apiKey) {
          return res.status(401).json({ error: 'API key is required for this provider' });
       }
       const baseUrl = options?.baseUrl || 'https://api.openai.com/v1';
       
       const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
             model: model,
             messages: messages.map((m: any) => ({
                role: m.role,
                content: m.content,
                tool_calls: m.tool_calls,
                name: m.name
             })),
             tools: openaiTools,
             tool_choice: "auto"
          })
       });
       
       if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorData}`);
       }
       
       const data = await response.json();
       const message = data.choices[0].message;

       if (message.tool_calls && message.tool_calls.length > 0) {
          return res.json({
             toolCalls: message.tool_calls.map((tc: any) => ({
                id: tc.id,
                name: tc.function.name,
                args: typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments
             }))
          });
       }

       return res.json({ text: message.content });
    } else {
       return res.status(400).json({ error: 'Unsupported provider' });
    }
  } catch (error: any) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
