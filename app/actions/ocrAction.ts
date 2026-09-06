'use server';

export async function processPassportImageWithGemini(base64Image: string) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set. Falling back to Tesseract.');
    return { success: false, error: 'API key not configured' };
  }
  // Extract just the base64 data without the prefix
  const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  
  const prompt = `
Extract the following information from this passport image. 
Return ONLY a raw JSON object (no markdown formatting) with these exact keys:
{
  "fullName": "extract full name, prioritize MRZ line 1, uppercase",
  "passportNumber": "extract passport number",
  "nationality": "extract country name (e.g. INDONESIA)",
  "dateOfBirth": "extract date of birth in YYYY-MM-DD format",
  "gender": "Male or Female"
}
If any field cannot be clearly read, leave it as an empty string "".
Focus on the MRZ (Machine Readable Zone) at the bottom if available, as it is most accurate.
`;

  try {
    const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=\${GEMINI_API_KEY}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              fullName: { type: "STRING" },
              passportNumber: { type: "STRING" },
              nationality: { type: "STRING" },
              dateOfBirth: { type: "STRING", description: "YYYY-MM-DD format" },
              gender: { type: "STRING", description: "Male or Female" }
            },
            required: ["fullName", "passportNumber", "nationality", "dateOfBirth", "gender"]
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      throw new Error('Gagal memproses gambar melalui AI Gemini: ' + response.statusText);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResult) {
      throw new Error('Tidak ada teks yang dikembalikan oleh AI Gemini');
    }

    const json = JSON.parse(textResult);
    return { success: true, data: json };
  } catch (error: any) {
    console.error('OCR Action Error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
