import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parser with increased limit for large text pastes
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI draw parsing features will be disabled.");
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!ai });
});

// AI Draw Parsing Endpoint
app.post("/api/parse-draw", async (req, res) => {
  try {
    const { text, titleHint } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Missing or invalid raw draw text." });
    }

    if (!ai) {
      return res.status(503).json({
        error: "AI parsing service is currently unavailable (Missing API key in environment). Please configure your GEMINI_API_KEY.",
      });
    }

    const systemInstruction = `
You are an expert data parsing assistant specializing in Bangladesh Bank Prize Bond raffle results.
Your job is to read messy, copy-pasted text from official result PDFs, newspapers, or websites, and extract the winning 7-digit numbers into a structured JSON response.

Bangladesh prize bonds are 7-digit numbers (e.g., '0123456'). They are usually organized in 5 tiers of prizes:
1st Prize: 1 number (Amount BDT 6,00,000)
2nd Prize: 1 number (Amount BDT 3,25,000)
3rd Prize: 2 numbers (Amount BDT 1,00,000 each)
4th Prize: 2 numbers (Amount BDT 50,000 each)
5th Prize: 40 numbers (Amount BDT 10,000 each)

IMPORTANT INSTRUCTIONS:
1. Extract ALL 7-digit numbers. Ensure they are strings of exactly 7 digits (like "0432105", "0071822").
2. Standardize numbers: remove any trailing/leading spaces, letters, or Bengali characters inside the numbers. Each must be 7 characters of digits '0'-'9'.
3. Correctly classify each number into firstPrize, secondPrize, thirdPrize, fourthPrize, or fifthPrize based on the surrounding headers in the text.
4. If some prizes are not mentioned, return empty arrays.
5. Extract or estimate the title (e.g. "116th Prize Bond Draw") and draw date in YYYY-MM-DD format (e.g. "2026-07-31"). Use current year 2026 or parse it from text if found. If the user provided a title hint, use it or adapt it.
`;

    const prompt = `
Please parse the following raw text copy-paste of a prize bond raffle draw. 
Title Hint: ${titleHint || "Unknown Draw"}

=== RAW TEXT START ===
${text}
=== RAW TEXT END ===
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The official name of the raffle draw, e.g., '116th Prize Bond Draw'",
            },
            date: {
              type: Type.STRING,
              description: "The date of the draw in standard YYYY-MM-DD format",
            },
            firstPrize: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array containing the 1st prize winning 7-digit number(s)",
            },
            secondPrize: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array containing the 2nd prize winning 7-digit number(s)",
            },
            thirdPrize: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array containing the 3rd prize winning 7-digit numbers (usually 2)",
            },
            fourthPrize: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array containing the 4th prize winning 7-digit numbers (usually 2)",
            },
            fifthPrize: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array containing the 5th prize winning 7-digit numbers (usually 40)",
            },
          },
          required: ["title", "date", "firstPrize", "secondPrize", "thirdPrize", "fourthPrize", "fifthPrize"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response returned from Gemini.");
    }

    const parsedData = JSON.parse(responseText.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in parse-draw route:", error);
    res.status(500).json({
      error: "Failed to parse draw results using Gemini AI.",
      details: error.message || error,
    });
  }
});

// Configure Vite or Static Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware to serve client asset files
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Express fullstack server running on http://localhost:${PORT}`);
  });
}

startServer();
