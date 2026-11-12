import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// In-memory runtime keys configuration
let runtimeKeys = {
  gemini: process.env.GEMINI_API_KEY || "",
  groq: process.env.GROQ_API_KEY || "",
};

function maskKey(key?: string): string {
  if (!key || key.length < 8) return "";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json({ limit: "5mb" }));

  // GET /api/chat/keys - Read provider status & masked keys
  app.get("/api/chat/keys", (req, res) => {
    return res.json({
      geminiConfigured: Boolean(runtimeKeys.gemini && runtimeKeys.gemini.trim().length > 0),
      groqConfigured: Boolean(runtimeKeys.groq && runtimeKeys.groq.trim().length > 0),
      geminiMasked: maskKey(runtimeKeys.gemini),
      groqMasked: maskKey(runtimeKeys.groq),
      tier1Model: "gemini-3.5-flash",
      tier2Model: "llama-3.3-70b-versatile",
    });
  });

  // POST /api/chat/test-key - Test connectivity for a provider
  app.post("/api/chat/test-key", async (req, res) => {
    const { provider, key } = req.body;
    const cleanKey = (key || "").trim();
    if (!cleanKey) return res.status(400).json({ error: { message: "No key provided" } });

    if (provider === "gemini") {
      try {
        const ai = new GoogleGenAI({ apiKey: cleanKey });
        // Test with current models
        const testModels = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest"];
        let lastErr: any = null;
        let ok = false;
        for (const m of testModels) {
          try {
            await ai.models.generateContent({ model: m, contents: "Hello, reply with OK" });
            ok = true;
            break;
          } catch (e: any) {
            lastErr = e;
          }
        }
        if (ok) return res.json({ success: true });
        throw lastErr || new Error("Gemini test failed");
      } catch (e: any) {
        const msg = e?.message || "Invalid Gemini API key or connection error.";
        return res.status(401).json({ error: { message: msg } });
      }
    } else if (provider === "groq") {
      try {
        // Supported active Groq models (mixtral-8x7b-32768 has been decommissioned by Groq)
        const testGroqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "qwen/qwen3.8-27b"];
        let lastErr: any = null;
        let ok = false;
        let lastStatus = 400;

        for (const gm of testGroqModels) {
          try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json", 
                Authorization: `Bearer ${cleanKey}` 
              },
              body: JSON.stringify({ 
                model: gm, 
                messages: [{ role: "user", content: "hi" }], 
                max_tokens: 2 
              }),
              signal: AbortSignal.timeout(7000),
            });

            if (response.ok) {
              ok = true;
              break;
            } else {
              lastStatus = response.status;
              const errBody = await response.json().catch(() => ({}));
              lastErr = new Error(errBody?.error?.message || `Groq status ${response.status}`);
            }
          } catch (fetchErr: any) {
            lastErr = fetchErr;
          }
        }

        if (ok) return res.json({ success: true });
        return res.status(lastStatus === 401 ? 401 : 400).json({ 
          error: { message: lastErr?.message || "Groq key verification failed." } 
        });
      } catch (e: any) {
        return res.status(401).json({ error: { message: e.message || "Failed to connect to Groq" } });
      }
    }
    return res.status(400).json({ error: { message: "Invalid provider" } });
  });

  // POST /api/chat/keys - Update custom runtime keys
  app.post("/api/chat/keys", (req, res) => {
    const { geminiApiKey, groqApiKey } = req.body || {};
    if (typeof geminiApiKey === "string") {
      runtimeKeys.gemini = geminiApiKey.trim();
    }
    if (typeof groqApiKey === "string") {
      runtimeKeys.groq = groqApiKey.trim();
    }

    return res.json({
      success: true,
      message: "AI Provider API keys successfully updated.",
      geminiConfigured: Boolean(runtimeKeys.gemini && runtimeKeys.gemini.trim().length > 0),
      groqConfigured: Boolean(runtimeKeys.groq && runtimeKeys.groq.trim().length > 0),
      geminiMasked: maskKey(runtimeKeys.gemini),
      groqMasked: maskKey(runtimeKeys.groq),
    });
  });

  // POST /api/chat - 2-Tier Multi-Provider Failover Proxy
  app.post("/api/chat", async (req, res) => {
    const {
      messages,
      contents,
      systemInstruction,
      dataSnapshot,
      generationConfig,
      customKeys,
    } = req.body || {};

    const activeGeminiKey = (customKeys?.gemini || runtimeKeys.gemini || process.env.GEMINI_API_KEY || "").trim();
    const activeGroqKey = (customKeys?.groq || runtimeKeys.groq || process.env.GROQ_API_KEY || "").trim();

    // Prepare system instruction with live data snapshot
    let fullSystemInstruction = "";
    if (typeof systemInstruction === "string") {
      fullSystemInstruction = systemInstruction;
    } else if (systemInstruction?.parts?.[0]?.text) {
      fullSystemInstruction = systemInstruction.parts[0].text;
    }

    if (dataSnapshot && typeof dataSnapshot === "string") {
      fullSystemInstruction += `\n\n=== REAL-TIME USER PERFORMANCE & TELEMETRY SNAPSHOT ===\n${dataSnapshot}\n=======================================================\n`;
    }

    // Prepare unified messages array
    interface UnifiedMsg {
      role: "user" | "assistant" | "model";
      content: string;
    }
    let unifiedMessages: UnifiedMsg[] = [];

    if (Array.isArray(messages) && messages.length > 0) {
      unifiedMessages = messages.map((m: any) => ({
        role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
        content: m.content || m.parts?.[0]?.text || "",
      }));
    } else if (Array.isArray(contents) && contents.length > 0) {
      unifiedMessages = contents.map((c: any) => ({
        role: c.role === "model" ? "assistant" : "user",
        content: c.parts?.[0]?.text || "",
      }));
    }

    let tier1Error: any = null;

    // --- TIER 1: Google Gemini (gemini-2.5-flash with gemini-3.8-flash upgrade) ---
    if (activeGeminiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: activeGeminiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const geminiContents = unifiedMessages.map((m) => ({
          role: m.role === "assistant" ? ("model" as const) : ("user" as const),
          parts: [{ text: m.content }],
        }));

        // Candidate models for Tier 1: gemini-3.8-flash, gemini-2.5-flash, gemini-flash-latest
        const geminiModels = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-3.5-flash"];
        let response: any = null;
        let successfulGeminiModel = "";

        for (const candidateModel of geminiModels) {
          try {
            const apiCall = ai.models.generateContent({
              model: candidateModel,
              contents: geminiContents,
              config: {
                systemInstruction: fullSystemInstruction || undefined,
                temperature: generationConfig?.temperature ?? 0.7,
                topP: generationConfig?.topP,
              },
            });
            const timer = new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout on ${candidateModel}`)), 7000)
            );
            response = await Promise.race([apiCall, timer]);
            if (response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text) {
              successfulGeminiModel = candidateModel;
              break;
            }
          } catch (mErr: any) {
            // try next model candidate if deprecated or failed
          }
        }

        const text =
          response?.text ||
          response?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "";

        if (text) {
          return res.json({
            text,
            provider: "gemini",
            model: successfulGeminiModel || "gemini-3.8-flash",
            tier: 1,
            failover: false,
            candidates: response.candidates,
          });
        }
      } catch (err: any) {
        tier1Error = err;
        console.log(
          "[Core Chat Info] Tier 1 cascade event:",
          err?.message || err,
          "-> Continuing to Tier 2 (Groq Cloud)..."
        );
      }
    } else {
      tier1Error = new Error("Gemini API key is not configured.");
    }

    // --- TIER 2: Groq Cloud (llama-3.3-70b-versatile with multi-model fallback) ---
    if (activeGroqKey) {
      try {
        const groqMessages = [
          ...(fullSystemInstruction
            ? [{ role: "system", content: fullSystemInstruction }]
            : []),
          ...unifiedMessages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        ];

        // Candidate models on Groq: user requested first, with high-speed models fallback
        const candidateModels = [
          "llama-3.3-70b-versatile",
          "openai/gpt-oss-120b",
          "qwen/qwen3.8-27b",
          "allam-2-7b",
        ];

        let groqText = "";
        let successfulModel = "";
        let lastGroqErr: any = null;

        for (const modelCandidate of candidateModels) {
          try {
            const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${activeGroqKey}`,
              },
              body: JSON.stringify({
                model: modelCandidate,
                messages: groqMessages,
                temperature: generationConfig?.temperature ?? 0.7,
                max_tokens: 2048,
              }),
              signal: AbortSignal.timeout(5000),
            });

            if (!groqResponse.ok) {
              const errBody = await groqResponse.json().catch(() => ({}));
              throw new Error(errBody?.error?.message || `Status ${groqResponse.status}`);
            }

            const groqData = (await groqResponse.json()) as any;
            const content = groqData.choices?.[0]?.message?.content;
            if (content) {
              groqText = content;
              successfulModel = modelCandidate;
              break;
            }
          } catch (mErr: any) {
            lastGroqErr = mErr;
            // continue immediately to next candidate
          }
        }

        if (groqText) {
          return res.json({
            text: groqText,
            provider: "groq",
            model: successfulModel,
            tier: 2,
            failover: true,
            failoverReason:
              tier1Error?.message || "Tier 1 (Gemini) unavailable or rate-limited.",
            candidates: [
              {
                content: {
                  parts: [{ text: groqText }],
                },
              },
            ],
          });
        } else {
          throw lastGroqErr || new Error("Failed to retrieve completion from Groq Cloud.");
        }
      } catch (tier2Error: any) {
        console.error("[Core Chat] Tier 2 (Groq Cloud) also failed:", tier2Error?.message || tier2Error);
        return res.status(502).json({
          error: {
            message: `All AI providers failed. Tier 1 (Gemini): ${tier1Error?.message || "Unavailable"}. Tier 2 (Groq): ${tier2Error?.message || "Unavailable"}`,
            tier1Error: tier1Error?.message,
            tier2Error: tier2Error?.message,
          },
        });
      }
    }

    return res.status(500).json({
      error: {
        message: tier1Error?.message || "No functional AI provider configured.",
      },
    });
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
