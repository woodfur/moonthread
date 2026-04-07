'use client';

import { useState, useCallback } from 'react';
import { Mic, PenLine, Loader2, Sparkles } from 'lucide-react';
import VoiceRecorder from '@/components/ui/VoiceRecorder';

type EntryMode = 'choose' | 'voice' | 'parsing' | 'form';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface FormEntrySelectorProps {
    /** Called with structured data extracted by AI — the parent fills ALL form fields */
    onFormDataExtracted: (data: Record<string, any>) => void;
    /** The form UI (passed as children) */
    children: React.ReactNode;
    /** Form type identifier sent to /api/ai-parse */
    formType: 'expense' | 'work_order' | 'supply_request' | 'consumable_new' | 'consumption_log';
    /** Enable Krio → English translation */
    translateToEnglish?: boolean;
    /** Optional context hints for fuzzy matching (e.g. available area names, item names) */
    contextHints?: Record<string, string[]>;
}

export default function FormEntrySelector({
    onFormDataExtracted,
    children,
    formType,
    translateToEnglish = false,
    contextHints,
}: FormEntrySelectorProps) {
    const [mode, setMode] = useState<EntryMode>('choose');
    const [parseError, setParseError] = useState<string | null>(null);
    const [rawTranscription, setRawTranscription] = useState<string | null>(null);

    const handleTranscription = useCallback(
        async (text: string) => {
            setRawTranscription(text);
            setMode('parsing');
            setParseError(null);

            try {
                const response = await fetch('/api/ai-parse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, formType, contextHints }),
                });

                const result = await response.json();

                if (!response.ok) {
                    setParseError(result.error || 'AI parsing failed. Please try again.');
                    setMode('form');
                    // Still switch to form, user can fill manually
                    return;
                }

                if (result.data) {
                    onFormDataExtracted(result.data);
                }
                setMode('form');
            } catch (err) {
                console.error('[FormEntrySelector] AI parse error:', err);
                setParseError('Could not reach AI service. You can fill the form manually.');
                setMode('form');
            }
        },
        [formType, contextHints, onFormDataExtracted]
    );

    // ── Choice screen ──
    if (mode === 'choose') {
        return (
            <div className="entry-selector">
                <p className="entry-selector-label">How would you like to submit?</p>
                <div className="entry-selector-options">
                    <button
                        type="button"
                        className="entry-option entry-option-voice"
                        onClick={() => setMode('voice')}
                    >
                        <span className="entry-option-icon entry-option-icon-voice">
                            <Mic style={{ width: 28, height: 28 }} />
                        </span>
                        <span className="entry-option-title">Record Voice</span>
                        <span className="entry-option-desc">
                            Speak your request and AI will fill in all the details
                        </span>
                    </button>

                    <button
                        type="button"
                        className="entry-option entry-option-form"
                        onClick={() => setMode('form')}
                    >
                        <span className="entry-option-icon entry-option-icon-form">
                            <PenLine style={{ width: 28, height: 28 }} />
                        </span>
                        <span className="entry-option-title">Fill Form</span>
                        <span className="entry-option-desc">
                            Type the details in manually
                        </span>
                    </button>
                </div>
            </div>
        );
    }

    // ── Voice recording screen ──
    if (mode === 'voice') {
        return (
            <div className="entry-voice-panel">
                <div className="entry-voice-header">
                    <h3 className="entry-voice-title">🎤 Record Your Request</h3>
                    <p className="entry-voice-subtitle">
                        Speak naturally — describe your request with as much detail as possible.
                        <br />
                        AI will understand and <em>fill in all the form fields</em> for you.
                    </p>
                </div>

                <div className="entry-voice-recorder">
                    <VoiceRecorder
                        onTranscriptionComplete={handleTranscription}
                        translateToEnglish={translateToEnglish}
                    />
                </div>

                <button
                    type="button"
                    className="btn btn-ghost btn-sm entry-voice-skip"
                    onClick={() => setMode('form')}
                >
                    Skip — fill in the form instead
                </button>
            </div>
        );
    }

    // ── AI Parsing loading screen ──
    if (mode === 'parsing') {
        return (
            <div className="entry-voice-panel">
                <div className="entry-parsing-indicator">
                    <div className="entry-parsing-icon">
                        <Sparkles style={{ width: 28, height: 28 }} />
                    </div>
                    <h3 className="entry-voice-title" style={{ marginTop: '16px' }}>AI is reading your request…</h3>
                    <p className="entry-voice-subtitle" style={{ maxWidth: '340px' }}>
                        Understanding the details and filling in the form for you.
                    </p>
                    <Loader2
                        style={{ width: 24, height: 24, color: 'var(--accent-muted)', marginTop: '12px' }}
                        className="voice-spinner"
                    />
                </div>
                {rawTranscription && (
                    <div className="entry-transcription-preview">
                        <span className="entry-transcription-label">You said:</span>
                        <span className="entry-transcription-text">&ldquo;{rawTranscription}&rdquo;</span>
                    </div>
                )}
            </div>
        );
    }

    // ── Form mode (children) ──
    return (
        <>
            {/* AI info banners */}
            {parseError && (
                <div style={{
                    padding: '10px 14px', marginBottom: '16px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--warning-light)', border: '1px solid #FDE68A',
                    fontSize: '13px', color: '#92400E', lineHeight: '1.5',
                }}>
                    ⚠️ {parseError}
                </div>
            )}
            {rawTranscription && !parseError && (
                <div style={{
                    padding: '10px 14px', marginBottom: '16px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-light)', border: '1px solid #FDE68A',
                    fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5',
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                }}>
                    <Sparkles style={{ width: 16, height: 16, color: 'var(--accent-muted)', flexShrink: 0, marginTop: '1px' }} />
                    <span>
                        <strong style={{ color: 'var(--text-primary)' }}>AI filled the form</strong> from your voice.
                        Review the fields below and adjust if needed.
                    </span>
                </div>
            )}
            {children}
        </>
    );
}
