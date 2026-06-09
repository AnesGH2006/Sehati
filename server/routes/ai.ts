import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are MediAssist, a helpful AI medical assistant for a healthcare platform.
Your role:
1. Help patients understand their symptoms empathetically (never diagnose)
2. Recommend the right medical specialty based on what they describe
3. Guide patients to book an appointment

Available specialties: General Practice, Cardiology, Dermatology, Neurology,
Pediatrics, Orthopedics, Gastroenterology, Psychiatry, ENT, Ophthalmology.

Rules:
- Always be calm, warm, and empathetic
- Remind users you are an AI, not a doctor, when relevant
- For serious symptoms (chest pain, difficulty breathing), urge emergency care immediately
- Never prescribe or recommend specific medications
- Keep responses concise and conversational (2-4 sentences max)
- When you recommend a specialty, offer to help book an appointment`;

router.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // All messages except the last go into history
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });

    // Send only the latest user message
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);

    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "AI error, please try again." });
  }
});

export default router;