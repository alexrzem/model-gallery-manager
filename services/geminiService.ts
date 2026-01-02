import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.API_KEY || '';
// Note: In a real environment, we check if key exists.
// For this demo, we assume the environment is set up correctly as per instructions.

const ai = new GoogleGenAI({ apiKey });

export const generateDescription = async (modelName: string, type: string, knownTriggers: string): Promise<string> => {
    if (!apiKey) return 'API Key missing. Cannot generate description.';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a short, professional description (max 2 sentences) for a Stable Diffusion ${type} model named "${modelName}". 
      Known trigger words: ${knownTriggers || 'None'}. 
      Focus on what kind of aesthetics it likely produces based on the name.`,
        });
        return response.text?.trim() || 'No description generated.';
    } catch (error) {
        console.error('Gemini API Error:', error);
        return 'Failed to generate description via Gemini.';
    }
};

export const enhancePrompt = async (originalPrompt: string): Promise<string> => {
    if (!apiKey) return 'API Key missing.';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Optimize this Stable Diffusion prompt for better artistic quality, detail, and lighting. Keep it comma-separated.
      Original: "${originalPrompt}"`,
        });
        return response.text?.trim() || originalPrompt;
    } catch (error) {
        console.error('Gemini API Error:', error);
        return originalPrompt;
    }
};

export const findImageForModel = async (modelName: string): Promise<string | undefined> => {
    if (!apiKey) return undefined;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Find a direct URL for the main preview image or cover art for the Stable Diffusion model "${modelName}". 
      Prefer Civitai or HuggingFace images.
      Return ONLY the raw URL string. Do not include markdown or explanations.`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        // Attempt to extract URL from text response
        const text = response.text?.trim();
        if (text && (text.startsWith('http') || text.startsWith('https'))) {
            return text.split(/\s+/)[0]; // Return first token if it looks like a URL
        }

        // Fallback: Check grounding chunks if text extraction fails (though text usually contains the answer)
        // Note: The structure of grounding chunks is complex, relying on text is often simpler for "answer with URL".

        return undefined;
    } catch (e) {
        console.error('Search failed', e);
        return undefined;
    }
};

export const generateThumbnailForModel = async (modelName: string, type: string): Promise<string | undefined> => {
    if (!apiKey) return undefined;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: `A high quality, artistic, abstract square thumbnail image representing a Stable Diffusion ${type} model named "${modelName}". 
      Futuristic, digital art, vibrant colors, 8k resolution, centered composition.`,
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return undefined;
    } catch (e) {
        console.error('Generation failed', e);
        return undefined;
    }
};
