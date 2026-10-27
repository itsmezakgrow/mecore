import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // API Route for Gemini action-coach proxy
  app.post("/api/chat", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: {
            message: "GEMINI_API_KEY environment variable is not configured on the server. Please verify your settings in the AI Studio cloud panel."
          }
        });
      }

      const { contents, systemInstruction, generationConfig } = req.body;
      
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: generationConfig?.temperature,
          topP: generationConfig?.topP,
        }
      });

      return res.json(response);
    } catch (error: any) {
      console.error("Gemini server proxy error:", error);
      return res.status(500).json({
        error: {
          message: error.message || "Failed to establish secure proxy channel to Gemini API."
        }
      });
    }
  });

  // Serve static assets or mount Vite dev server based on runtime environment
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development server with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production build from dist/ directory...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
