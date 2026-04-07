import { NextRequest, NextResponse } from 'next/server';

// Try multiple models in order of preference
const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
];

function getGeminiUrl(model: string) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

// ── Form schemas for each form type ──

const FORM_SCHEMAS: Record<string, { description: string; fields: string }> = {
    expense: {
        description: 'An expense/expenditure submission form for a facility',
        fields: `{
  "description": "string — what the expense was for",
  "amount": "number — the monetary amount (just the number, no currency symbols)",
  "category": "string — MUST be one of: maintenance_repairs, cleaning_supplies, vendor_payments, utilities, equipment_purchase, miscellaneous",
  "vendor_payee": "string — vendor or payee name, or empty string if unknown",
  "expense_date": "string — date in YYYY-MM-DD format. Use today's date if not specified"
}`,
    },
    work_order: {
        description: 'A maintenance or service request (work order) for a facility',
        fields: `{
  "description": "string — detailed description of the issue or request",
  "category": "string — MUST be one of: plumbing, electrical, hvac, structural, general, other",
  "urgency": "string — MUST be one of: low, medium, high, emergency",
  "location_hint": "string — any location or area mentioned, e.g. 'lobby', 'bathroom', '3rd floor'. Empty string if none"
}`,
    },
    supply_request: {
        description: 'A request for supplies or materials for a facility',
        fields: `{
  "items": [
    {
      "item_name": "string — the name of the supply item",
      "quantity": "number — how many, default 1",
      "unit": "string — MUST be one of: pieces, boxes, cases, gallons, liters, rolls, bags, packs"
    }
  ],
  "priority": "string — MUST be one of: low, medium, high, urgent",
  "notes": "string — any additional context"
}`,
    },
    consumable_new: {
        description: 'A form to register a new consumable supply item to track in inventory',
        fields: `{
  "name": "string — the item name, e.g. 'Dispenser Water 18.9L', 'Paper Towels'",
  "category": "string — MUST be one of: water, cleaning, office, kitchen, hygiene, other",
  "unit": "string — MUST be one of: bottles, packs, rolls, liters, pieces, boxes, bags, gallons, cases",
  "current_stock": "number — initial stock count, default 0",
  "reorder_threshold": "number — when to reorder, default 5",
  "notes": "string — optional description"
}`,
    },
    consumption_log: {
        description: 'A form to log consumption (usage) or restocking of a supply item',
        fields: `{
  "item_hint": "string — the item name or keyword mentioned, for matching against existing items",
  "action": "string — MUST be one of: consumed, restocked. 'consumed' means used up, 'restocked' means added/received",
  "quantity": "number — how many used or added, default 1",
  "notes": "string — any additional context about the usage"
}`,
    },
};

function buildPrompt(transcription: string, formType: string, contextHints?: Record<string, string[]>): string {
    const schema = FORM_SCHEMAS[formType];
    if (!schema) throw new Error(`Unknown form type: ${formType}`);

    let contextSection = '';
    if (contextHints && Object.keys(contextHints).length > 0) {
        contextSection = '\n\nAVAILABLE OPTIONS FOR FUZZY MATCHING:\n';
        for (const [field, options] of Object.entries(contextHints)) {
            contextSection += `- ${field}: ${JSON.stringify(options)}\n`;
        }
        contextSection += '\nWhen a field has available options, try to match the user\'s words to the closest option from the list above.\n';
    }

    return `You are an AI assistant that extracts structured data from spoken requests for a facility management system.

FORM TYPE: ${schema.description}

EXPECTED OUTPUT SCHEMA:
${schema.fields}
${contextSection}
RULES:
1. Return ONLY valid JSON matching the schema above. No markdown, no explanation, no wrapping.
2. Extract as many fields as possible from what the user said.
3. For enum fields, pick the closest match from the allowed values.
4. If a field cannot be determined from the speech, use sensible defaults or empty strings.
5. For dates, interpret relative terms like "today", "yesterday", "last Monday" relative to the current date.
6. For amounts/quantities, extract numbers even if spoken as words ("fifty" → 50).
7. The user may speak in Krio, Pidgin English, or standard English. Understand all of them.
8. Today's date is ${new Date().toISOString().split('T')[0]}.

USER'S SPOKEN REQUEST:
"${transcription}"

Respond with ONLY the JSON object:`;
}

export async function POST(request: NextRequest) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'AI parsing service is not configured. Please add GOOGLE_GEMINI_API_KEY to your environment.' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const { text, formType, contextHints } = body as {
            text: string;
            formType: string;
            contextHints?: Record<string, string[]>;
        };

        if (!text || !formType) {
            return NextResponse.json(
                { error: 'Missing required fields: text and formType' },
                { status: 400 }
            );
        }

        if (!FORM_SCHEMAS[formType]) {
            return NextResponse.json(
                { error: `Unknown form type: ${formType}. Supported: ${Object.keys(FORM_SCHEMAS).join(', ')}` },
                { status: 400 }
            );
        }

        console.log('[AI Parse] Request:', { formType, textLength: text.length, text: text.substring(0, 200) });

        const prompt = buildPrompt(text, formType, contextHints);

        // Try models in order until one works
        let geminiResponse: Response | null = null;
        let lastError = '';
        let usedModel = '';

        for (const model of GEMINI_MODELS) {
            console.log(`[AI Parse] Trying model: ${model}`);
            try {
                geminiResponse = await fetch(`${getGeminiUrl(model)}?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: prompt }],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.1,
                            topP: 0.8,
                            maxOutputTokens: 1024,
                        },
                    }),
                });

                if (geminiResponse.ok) {
                    usedModel = model;
                    break; // Success!
                }

                const errorText = await geminiResponse.text();
                console.error(`[AI Parse] Model ${model} failed:`, geminiResponse.status, errorText.substring(0, 500));
                lastError = errorText;

                // Don't retry on auth errors — key is wrong
                if (geminiResponse.status === 401 || geminiResponse.status === 403) {
                    return NextResponse.json(
                        { error: 'AI API key is invalid or expired. Please check your GOOGLE_GEMINI_API_KEY.' },
                        { status: 500 }
                    );
                }

                // Try next model for 404 (model not found), 429 (rate limit), or 400 (bad request)
            } catch (fetchErr) {
                console.error(`[AI Parse] Fetch error for ${model}:`, fetchErr);
                lastError = String(fetchErr);
            }
        }

        if (!geminiResponse?.ok) {
            console.error('[AI Parse] All models failed. Last error:', lastError.substring(0, 500));
            // Parse the error to give a more useful message
            let userMessage = 'AI parsing failed after trying all available models. Please try again.';
            try {
                const parsed = JSON.parse(lastError);
                if (parsed?.error?.message) {
                    userMessage = `AI error: ${parsed.error.message}`;
                }
            } catch { /* use default message */ }
            return NextResponse.json({ error: userMessage }, { status: 500 });
        }

        console.log(`[AI Parse] Success with model: ${usedModel}`);

        const geminiData = await geminiResponse.json();

        // Extract the text content from Gemini's response
        const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            console.error('[AI Parse] No text in Gemini response:', JSON.stringify(geminiData).substring(0, 500));
            return NextResponse.json(
                { error: 'AI returned an empty response. Please try again.' },
                { status: 500 }
            );
        }

        console.log('[AI Parse] Gemini raw response:', responseText.substring(0, 500));

        // Parse the JSON — Gemini sometimes wraps in ```json blocks
        let parsed;
        try {
            // Strip any markdown code fences if present
            const cleaned = responseText
                .replace(/^```json?\s*/i, '')
                .replace(/\s*```\s*$/i, '')
                .trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error('[AI Parse] Failed to parse Gemini JSON:', responseText.substring(0, 300));
            return NextResponse.json(
                { error: 'AI returned invalid data. Please try again.' },
                { status: 500 }
            );
        }

        console.log('[AI Parse] Parsed result:', JSON.stringify(parsed).substring(0, 500));

        return NextResponse.json({ data: parsed, rawTranscription: text });
    } catch (err) {
        console.error('[AI Parse] Unexpected error:', err);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
