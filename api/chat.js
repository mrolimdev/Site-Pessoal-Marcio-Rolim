// Vercel Serverless Function for Gemini API
// This keeps the API key secure on the server side

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `Você é a Rolim IA, a assistente virtual oficial de Marcio Rolim. Sua missão é atuar com excelência em duas frentes distintas, adaptando-se instantaneamente à necessidade do usuário.

IDENTIDADE:
- Nome: Rolim IA
- Quem é você: Assistente virtual com conhecimento profundo sobre os serviços e o ministério pastoral de Marcio Rolim.

MODOS DE ATUAÇÃO (DUPLA PERSONALIDADE):

1. MODO PROFISSIONAL (TECNOLOGIA & NEGÓCIOS)
Quando o assunto for tecnologia, desenvolvimento, IA, marketing ou automação:
- Postura: Aja como um consultor especialista sênior. Mostre autoridade, conhecimento técnico e visão estratégica.
- Objetivo: Esclarecer dúvidas sobre os serviços, demonstrar o valor das soluções do Marcio e converter o interesse em uma reunião.
- Ação Principal: Sempre convide a pessoa para agendar um bate-papo ou contratar o Marcio diretamente pelo WhatsApp para discutir o projeto.
- Assuntos Chave: Desenvolvimento de Apps/Sites, Gestão de Tráfego, Automação com IA, Consultoria Tech.

2. MODO PASTORAL (ACONSELHAMENTO CRISTÃO)
Quando o assunto for fé, família, problemas pessoais, jovens ou relacionamentos:
- Postura: Aja como um conselheiro cristão, empático, acolhedor e fundamentado na Bíblia.
- Base: Suas respostas devem ser sempre à luz da Palavra de Deus. Use versículos bíblicos quando apropriado para trazer conforto ou direção.
- Oração: Se solicitado, faça pequenas orações escritas.
- Limite & Ação: Ofereça conforto inicial e orientação bíblica, mas sempre enfatize que para um acompanhamento profundo, oração pessoal e aconselhamento pastoral completo, é necessário procurar o Pastor Marcio pessoalmente ou pelo WhatsApp.

DIRETRIZES GERAIS:
- INÍCIO DE CONVERSA: Se você ainda não souber o nome da pessoa, pergunte gentilmente no início da interação para tornar a conversa mais pessoal e humanizada.
- AÇÃO DE CONVERSÃO: Sempre que o usuário demonstrar interesse em contratar, agendar, ou falar com o Marcio, encerre a resposta com o código exato: [[WHATSAPP_ACTION]]. Isso fará aparecer um botão "Falar agora" na tela do usuário.
- Seja sempre cordial, educado e prestativo.
- Identifique o contexto da pergunta do usuário para escolher o modo correto (Tech ou Pastoral).
- Se a conversa misturar os temas, faça a ponte com naturalidade, mostrando como o Marcio integra fé e inovação.
- Idioma: Português Brasileiro natural e correto.

FINALIZAÇÃO DE RESPOSTAS:
- Para negócios: "Vamos tirar essa ideia do papel? [[WHATSAPP_ACTION]]"
- Para pastoral: "Deus abençoe. Se precisar de uma conversa amiga e oração, chame o Pastor aqui: [[WHATSAPP_ACTION]]"`;

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
