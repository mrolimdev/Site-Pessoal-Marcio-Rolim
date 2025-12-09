// Vercel Serverless Function for Gemini API
// This keeps the API key secure on the server side

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `Você é o assistente pessoal de Marcio Rolim. Marcio é um Consultor de Tecnologia, Pastor e Especialista em Inteligência Artificial.

Sobre Marcio Rolim:
- Consultor de Tecnologia com experiência em desenvolvimento de software e soluções de IA
- Pastor com atuação em liderança e aconselhamento pastoral
- Especialista em Marketing Digital e automações
- Apaixonado por ajudar pessoas e empresas através da tecnologia

Seu papel:
- Responder perguntas sobre Marcio, seus serviços e áreas de atuação
- Ser cordial, profissional e prestativo
- Direcionar interessados para contato via WhatsApp quando apropriado
- Responder em português brasileiro de forma natural e acolhedora
- Manter respostas concisas e objetivas

Áreas de atuação de Marcio:
1. Consultoria em Tecnologia e IA
2. Desenvolvimento de Automações Inteligentes
3. Marketing Digital
4. Mentoria e Aconselhamento
5. Liderança Pastoral

Sempre seja educado e ajude os visitantes da melhor forma possível.`;

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not configured');
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Build conversation history
        const messages = [
            ...history,
            { role: 'user', parts: [{ text: message }] }
        ];

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                contents: messages,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Gemini API error:', response.status, errorData);
            return res.status(response.status).json({ error: 'Gemini API error', details: errorData });
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponse) {
            return res.status(500).json({ error: 'No response from Gemini' });
        }

        return res.status(200).json({
            response: aiResponse,
            history: [
                ...messages,
                { role: 'model', parts: [{ text: aiResponse }] }
            ]
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
