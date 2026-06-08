// server/routes/ai.ts
import { Router, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

// تعريف المساعد الذكي مع التحقق من وجود المفتاح لتفادي انهيار السيرفر
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// استخدام الواجهة الرسمية المتوافقة تماماً مع Typescript لـ Express
router.post("/api/ai-triage", async (req: Request, res: Response): Promise<any> => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || String(symptoms).trim() === "") {
      return res.status(400).json({ error: "الرجاء كتابة الأعراض أولاً" });
    }

    if (!ai) {
      console.error("AI Error: GEMINI_API_KEY is missing in env variables.");
      return res.status(500).json({ error: "مفتاح الذكاء الاصطناعي غير معرف على السيرفر" });
    }

    // استدعاء الموديل بالطريقة المتوافقة تماماً مع الـ Type Definitions للمكتبة
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: String(symptoms),
      config: {
        systemInstruction: `أنت مساعد طبي ذكي وموجه خبير في منصة "صحتي" بالجزائر. 
        مهمتك الأساسية هي الاستماع لشكوى المريض بالعامية الجزائرية (الدارجة) أو العربية الفصحى، وتحليلها لتوجيهه للتخصص الطبي المناسب المتوفر في العيادات.

        قواعد الإجابة الصارمة التي يجب أن تلتزم بها:
        1. الرد بلهجة محترمة، قريبة، ومطمئنة، تمزج بين العربية المفهومة والكلمات الطبية المتداولة في الجزائر (مثل: السطر، الحريق، الفشلة، التنمال، طبيب العظام، السبيطار...).
        2. حدد للمريض التخصص الطبي المناسب لحالته بوضوح (مثال: طبيب أمراض النساء، طبيب القلب، طبيب الأطفال، طبيب جراحة العظام، طب عام...).
        3. ممنوع منعاً باتاً إعطاء أسماء أدوية أو جرعات (لا تكتب باراسيتامول، مضادات حيوية، أو أي دواء آخر)، واكتفِ بنصائح عامة مثل الراحة أو شرب الماء.
        4. إذا سألك المستخدم عن أي شيء خارج النطاق الطبي تماماً (مثل الطبخ، السياسة، البرمجة، الرياضة، أو النكت)، ارفض الإجابة فوراً وبكل أدب باستخدام الصيغة: "عذراً، أنا مساعد ذكي مخصص للإجابة على استفساراتكم الطبية وتوجيهكم للتخصص المناسب فقط. كيف يمكنني مساعدتك بخصوص حالتك الصحية اليوم؟".
        5. لا تذكر عبارة "إخلاء مسؤولية" كعنوان، بل اجعل التوجيه يبدو ودياً وانصحه في نهاية الكلام بحجز تذكرة (Ticket) عبر المنصة لرؤية الأطباء المتاحين.`
      }
    });

    return res.json({ reply: response.text });

  } catch (error) {
    console.error("AI Triage Error:", error);
    return res.status(500).json({ error: "فشل السيرفر في الاتصال بالمساعد الذكي" });
  }
});

export default router;