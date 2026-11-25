const AppError = require('../utils/AppError');

// Kaunse providers try karne hain, kis order mein (.env se):
//   AI_PROVIDER=gemini ya anthropic -> sirf wahi
//   AI_PROVIDER khali -> jinki key .env mein hai, woh order mein: pehle Gemini, phir Claude
//   Ek fail ho jaye to agla try hota hai
const availableProviders = () => {
    const chosen = (process.env.AI_PROVIDER || '').toLowerCase();
    if (chosen === 'gemini' || chosen === 'anthropic') return [chosen];
    const list = [];
    if (process.env.GEMINI_API_KEY) list.push('gemini');
    if (process.env.ANTHROPIC_API_KEY) list.push('anthropic');
    return list;
};

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GENERIC_ERROR = 'AI is not available right now. Please try again';

// Google se models ki list leta hai (flash wale, naya version pehle). Ek baar mangwakar yaad rakhta hai
let modelList;
const listModels = async () => {
    if (modelList) return modelList;

    const res = await fetch(`${GEMINI_URL}/models?pageSize=200`, {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        console.error('AI error (gemini models):', res.status, JSON.stringify(data.error || data).slice(0, 300));
        throw new AppError(GENERIC_ERROR, 502);
    }

    modelList = (data.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => m.name.replace('models/', ''))
        .filter((n) => /flash/i.test(n) && !/image|tts|audio|live|embedding|lite|thinking|exp/i.test(n))
        // pehle stable models, phir preview; naya version pehle
        .sort((a, b) => {
            const pa = /preview/i.test(a) ? 1 : 0;
            const pb = /preview/i.test(b) ? 1 : 0;
            return pa - pb || b.localeCompare(a, undefined, { numeric: true });
        });
    return modelList;
};

const callGemini = (model, { system, user, maxTokens }) =>
    fetch(`${GEMINI_URL}/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            // kuch models soch (thinking) mein bhi tokens kharch karte hain, isliye limit chhoti nahi rakhi
            generationConfig: { maxOutputTokens: Math.max(maxTokens, 1024) },
        }),
    });

const MAX_MODEL_TRIES = 5;
let workingModel; // jo model chal gaya, agli baar pehle wahi try hoga

const askGemini = async (args) => {
    if (!process.env.GEMINI_API_KEY) throw new AppError('AI features are not configured', 503);

    // pehle .env wala model, ya jo pichli baar chala tha
    const first = (process.env.GEMINI_MODEL || '').trim() || workingModel;
    const queue = first ? [first] : [];
    const tried = [];
    let listLoaded = false;
    let lastStatus;
    let lastData;

    while (tried.length < MAX_MODEL_TRIES) {
        if (queue.length === 0) {
            if (listLoaded) break;
            listLoaded = true;
            (await listModels()).filter((m) => !tried.includes(m)).forEach((m) => queue.push(m));
            if (queue.length === 0) break;
        }

        const model = queue.shift();
        if (tried.includes(model)) continue;
        tried.push(model);

        const res = await callGemini(model, args);
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
            const text = parts.map((p) => p.text || '').join('').trim();
            if (!text) throw new AppError('AI did not return an answer. Please try again', 502);
            if (workingModel !== model) {
                workingModel = model;
                console.log('Gemini model in use:', model);
            }
            return text;
        }

        lastStatus = res.status;
        lastData = data;
        // model nahi mila ya uska quota khatam -> agla model try
        if (res.status === 404 || res.status === 429) {
            console.error(`AI: model "${model}" par ${res.status} aaya, agla model try ho raha hai`);
            if (workingModel === model) workingModel = undefined;
            continue;
        }
        break;
    }

    console.error('AI error (gemini):', lastStatus, JSON.stringify((lastData && lastData.error) || lastData || {}).slice(0, 300), '| tried:', tried.join(', '));
    if (lastStatus === 429) throw new AppError('AI limit reached for now. Please try again later', 429);
    throw new AppError(GENERIC_ERROR, 502);
};

let anthropicClient;
const askAnthropic = async ({ system, user, maxTokens }) => {
    if (!process.env.ANTHROPIC_API_KEY) throw new AppError('AI features are not configured', 503);
    try {
        if (!anthropicClient) {
            const Anthropic = require('@anthropic-ai/sdk');
            anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, authToken: null });
        }
        const res = await anthropicClient.messages.create({
            model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
            max_tokens: maxTokens,
            system,
            messages: [{ role: 'user', content: user }],
        });
        return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    } catch (err) {
        if (err instanceof AppError) throw err;
        console.error('AI error (anthropic):', err.message);
        throw new AppError('AI is not available right now. Please try again', 502);
    }
};

exports.askClaude = async ({ system, user, maxTokens = 500 }) => {
    const providers = availableProviders();
    if (providers.length === 0) throw new AppError('AI features are not configured', 503);

    let lastError;
    for (const provider of providers) {
        try {
            return provider === 'gemini'
                ? await askGemini({ system, user, maxTokens })
                : await askAnthropic({ system, user, maxTokens });
        } catch (err) {
            lastError = err instanceof AppError ? err : new AppError('AI is not available right now. Please try again', 502);
            if (!(err instanceof AppError)) console.error('AI error:', err.message);
        }
    }
    throw lastError;
};

// AI ke jawab se JSON nikalta hai (kabhi kabhi ```json ke saath aata hai)
exports.parseJson = (text) => {
    const clean = String(text).replace(/```json|```/g, '').trim();
    try {
        return JSON.parse(clean);
    } catch {
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) {
            try { return JSON.parse(match[0]); } catch { return null; }
        }
        return null;
    }
};