import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiAI {
  private readonly genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  async generate(prompt: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.error('Gemini error:', err);
      throw new Error('Gemini API request failed');
    }
  }
}
