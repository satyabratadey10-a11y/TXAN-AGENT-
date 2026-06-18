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

    if (provider === 'google') {
      const actualKey = apiKey || process.env.GEMINI_API_KEY;
      if (!actualKey) {
        return res.status(401).json({ error: 'API key is required for Google provider' });
      }

      const ai = new GoogleGenAI({ apiKey: actualKey });
      
      const formattedMessages = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const systemInstruction = options?.systemInstruction ? {
        parts: [{ text: options.systemInstruction }]
      } : undefined;

      // Ensure Search Grounding is used for flash models if requested
      const tools = [];
      if (options?.useSearchGrounding) {
         tools.push({ googleSearch: {} });
      }

      const aiOptions: any = {
         systemInstruction,
         tools: tools.length > 0 ? tools : undefined,
      };

      if (options?.highThinking) {
         aiOptions.thinkingConfig = { thinkingBudgetTokens: 1024 }; // Provide a budget to enable high thinking
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: formattedMessages,
        config: aiOptions
      });

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
             messages: messages,
          })
       });
       
       if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorData}`);
       }
       
       const data = await response.json();
       return res.json({ text: data.choices[0].message.content });
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
