import { NextRequest, NextResponse } from 'next/server';

// HuggingFace Serverless Inference API (via the router endpoint)
const HF_API_URL = 'https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo';

async function callWhisper(apiKey: string, audioBuffer: ArrayBuffer, contentType: string) {
    const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': contentType,
        },
        body: audioBuffer,
    });
    return response;
}

export async function POST(request: NextRequest) {
    const apiKey = process.env.HUGGING_FACE_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Transcription service is not configured. Please add HUGGING_FACE_API_KEY to your environment.' },
            { status: 500 }
        );
    }

    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File | null;
        const task = (formData.get('task') as string) || 'transcribe';

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 });
        }

        // Validate file size (max 25MB)
        if (audioFile.size > 25 * 1024 * 1024) {
            return NextResponse.json({ error: 'Audio file is too large. Maximum size is 25MB.' }, { status: 400 });
        }

        console.log('[Transcribe] Received audio:', {
            name: audioFile.name,
            type: audioFile.type,
            size: audioFile.size,
            task,
        });

        // Reject very small files (likely silence or too brief)
        if (audioFile.size < 1000) {
            return NextResponse.json(
                { error: 'Recording is too short. Please speak for at least 1-2 seconds.' },
                { status: 400 }
            );
        }

        // Convert File to ArrayBuffer for the HF API
        const audioBuffer = await audioFile.arrayBuffer();

        // Use the file's MIME type; fallback to audio/webm
        const contentType = audioFile.type || 'audio/webm';

        // First attempt
        let hfResponse = await callWhisper(apiKey, audioBuffer, contentType);

        // Handle model loading state (503) — wait and retry once
        if (hfResponse.status === 503) {
            let retryData;
            try {
                retryData = await hfResponse.json();
            } catch {
                retryData = {};
            }
            const waitTime = retryData.estimated_time || 20;
            console.log(`[Transcribe] Model loading, waiting ${waitTime}s...`);

            await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime * 1000, 30000)));

            hfResponse = await callWhisper(apiKey, audioBuffer, contentType);

            if (!hfResponse.ok) {
                const errorText = await hfResponse.text();
                console.error('[Transcribe] HF retry failed:', hfResponse.status, errorText);
                return NextResponse.json(
                    { error: 'Transcription model is warming up. Please try again in a moment.' },
                    { status: 503 }
                );
            }
        }

        if (!hfResponse.ok) {
            const errorText = await hfResponse.text();
            console.error('[Transcribe] HF API error:', hfResponse.status, errorText);

            if (hfResponse.status === 401) {
                return NextResponse.json(
                    { error: 'Invalid API key. Please check your HUGGING_FACE_API_KEY.' },
                    { status: 401 }
                );
            }

            // Try to parse the error for a more helpful message
            try {
                const errorJson = JSON.parse(errorText);
                const msg = errorJson.error || errorJson.message || 'Transcription failed.';
                console.error('[Transcribe] Parsed HF error:', msg);
                return NextResponse.json(
                    { error: `Transcription service error: ${msg}` },
                    { status: 500 }
                );
            } catch {
                return NextResponse.json(
                    { error: `Transcription failed (status ${hfResponse.status}). Please try again.` },
                    { status: 500 }
                );
            }
        }

        // Parse the response
        let result;
        const responseText = await hfResponse.text();
        console.log('[Transcribe] Raw HF response:', responseText.substring(0, 500));

        try {
            result = JSON.parse(responseText);
        } catch {
            console.error('[Transcribe] Failed to parse HF response as JSON:', responseText.substring(0, 200));
            return NextResponse.json(
                { error: 'Received an unexpected response from the transcription service. Please try again.' },
                { status: 500 }
            );
        }

        let transcribedText = result.text || '';

        // Clean up common Whisper artifacts
        transcribedText = transcribedText
            .replace(/^\s*\[.*?\]\s*/g, '')  // Remove [Music], [Applause], etc.
            .replace(/\s+/g, ' ')             // Normalize whitespace
            .trim();

        // Log for debugging
        console.log('[Transcribe] Result:', { task, text: transcribedText, length: transcribedText.length });

        if (!transcribedText) {
            return NextResponse.json(
                { error: 'No speech detected. Please speak clearly and try again.' },
                { status: 422 }
            );
        }

        return NextResponse.json({ text: transcribedText });
    } catch (err) {
        console.error('[Transcribe] Unexpected error:', err);
        return NextResponse.json(
            { error: 'An unexpected error occurred during transcription. Please try again.' },
            { status: 500 }
        );
    }
}

// Increase body size limit for audio uploads
export const config = {
    api: {
        bodyParser: false,
    },
};
