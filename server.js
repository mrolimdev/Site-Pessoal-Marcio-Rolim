import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatHandler from './api/chat.js';
import ttsHandler from './api/tts.js';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Adapter function to handle Vercel-style function signatures in Express
const adaptHandler = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error('Handler error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

app.post('/api/chat', adaptHandler(chatHandler));
app.post('/api/tts', adaptHandler(ttsHandler));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
