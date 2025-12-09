// Vercel Serverless Function for MiniMax TTS API
// This keeps the API key secure on the server side

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || '';

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

    if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
        console.error('MiniMax credentials not configured');
        return res.status(500).json({ error: 'TTS service not configured' });
    }

    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const url = `https://api.minimax.io/v1/t2a_v2?GroupId=${MINIMAX_GROUP_ID}`;

        const payload = {
            model: "speech-2.5-hd-preview",
            text,
            stream: false,
            voice_setting: {
                voice_id: "moss_audio_0b954a1b-c0a1-11ef-aeac-3e1feda129b7",
                speed: 1.1,
                vol: 1,
                pitch: 0
            },
            audio_setting: {
                sample_rate: 32000,
                bitrate: 128000,
                format: "mp3",
                channel: 1
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MINIMAX_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('MiniMax API error:', response.status, errorData);
            return res.status(response.status).json({ error: 'MiniMax API error', details: errorData });
        }

        const data = await response.json();

        if (data.base_resp?.status_code !== 0) {
            return res.status(500).json({ error: data.base_resp?.status_msg || 'MiniMax error' });
        }

        const audioHex = data.data?.audio;
        if (!audioHex) {
            return res.status(500).json({ error: 'No audio data received' });
        }

        return res.status(200).json({ audio: audioHex });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
