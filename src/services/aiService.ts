import { GoogleGenAI, Type } from "@google/genai";
import { GenerationSettings } from "../types";
import { SYSTEM_PROMPT } from "../constants";

const getAI = () => {
  // Ưu tiên lấy key từ Local Storage nếu người dùng đã nhập
  const customKey = localStorage.getItem('custom_gemini_api_key');
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  
  if (!apiKey) throw new Error("Vui lòng cấu hình API Key trong phần cài đặt.");
  return new GoogleGenAI({ apiKey });
};

export const enhancePrompt = async (userPrompt: string) => {
  console.log("🚀 Đang tối ưu hóa prompt...");
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enhancedPrompt: { type: Type.STRING },
            suggestedNegativePrompt: { type: Type.STRING },
          },
          required: ["enhancedPrompt", "suggestedNegativePrompt"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    console.log("✅ Tối ưu hóa xong:", result);
    return result;
  } catch (e) {
    console.error("❌ Lỗi tối ưu hóa prompt:", e);
    return { enhancedPrompt: userPrompt, suggestedNegativePrompt: "" };
  }
};

export const generateImage = async (prompt: string, settings: GenerationSettings) => {
  console.log("🎨 Đang bắt đầu tạo ảnh với prompt:", prompt);
  const ai = getAI();
  
  try {
    // Sử dụng gemini-2.5-flash-image là mô hình tạo ảnh mạnh mẽ và ổn định nhất hiện tại
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: settings.aspectRatio,
        },
      },
    });

    console.log("📥 Phản hồi từ API:", response);

    // Tìm phần dữ liệu hình ảnh trong các candidates
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts || []) {
        if (part.inlineData) {
          console.log("✨ Đã nhận được dữ liệu ảnh!");
          const base64Data = part.inlineData.data;
          return `data:image/png;base64,${base64Data}`;
        }
      }
    }

    throw new Error("Không tìm thấy dữ liệu hình ảnh trong phản hồi từ AI.");
  } catch (e) {
    console.error("❌ Lỗi tạo ảnh:", e);
    throw e;
  }
};
