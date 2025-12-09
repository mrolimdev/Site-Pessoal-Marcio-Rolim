// Gemini API Service - Secure Backend Version
// Calls the serverless API route that keeps the API key hidden

interface GeminiMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface ConversationHistory {
    messages: GeminiMessage[];
}

// Store conversation history per chat session
const conversationHistories: Map<string, ConversationHistory> = new Map();

// Determine API URL based on environment
const getApiUrl = () => {
    // In production (Vercel), use relative path
    // In development, use the Vite proxy or direct path
    if (typeof window !== 'undefined') {
        return '/api/chat';
    }
    return '/api/chat';
};

export async function sendMessageToGemini(
    message: string,
    chatId: string
): Promise<string> {
    // Get or create conversation history for this chat
    let history = conversationHistories.get(chatId);
    if (!history) {
        history = { messages: [] };
        conversationHistories.set(chatId, history);
    }

    try {
        const response = await fetch(getApiUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                history: history.messages
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API error:', response.status, errorData);
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.response) {
            throw new Error('No response from API');
        }

        // Update local history with the server's response
        if (data.history) {
            history.messages = data.history;
        } else {
            // Manually update if server doesn't return history
            history.messages.push(
                { role: 'user', parts: [{ text: message }] },
                { role: 'model', parts: [{ text: data.response }] }
            );
        }

        return data.response;

    } catch (error) {
        console.error('Error calling chat API:', error);
        return 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
    }
}

export function clearConversationHistory(chatId: string): void {
    conversationHistories.delete(chatId);
}
