'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, X, Play, Pause, Loader2, RotateCcw, Check } from 'lucide-react';

type RecorderState = 'idle' | 'recording' | 'review' | 'transcribing';

interface VoiceRecorderProps {
    /** Called with the transcribed text when transcription completes */
    onTranscriptionComplete: (text: string) => void;
    /** Whether the recorder should be disabled */
    disabled?: boolean;
    /** Enable Krio → English translation mode */
    translateToEnglish?: boolean;
    /** Compact mode for inline use */
    compact?: boolean;
}

export default function VoiceRecorder({
    onTranscriptionComplete,
    disabled = false,
    translateToEnglish = false,
    compact = false,
}: VoiceRecorderProps) {
    const [state, setState] = useState<RecorderState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioBlobRef = useRef<Blob | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, [audioUrl]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = useCallback(async () => {
        setError(null);
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                },
            });

            // Choose best available format — webm/opus has widest browser support
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/mp4';

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                // Stop all tracks to release mic
                stream.getTracks().forEach((track) => track.stop());

                const blob = new Blob(chunksRef.current, { type: mimeType });
                audioBlobRef.current = blob;

                // Create playback URL
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                setState('review');
            };

            recorder.onerror = () => {
                stream.getTracks().forEach((track) => track.stop());
                setError('Recording failed. Please try again.');
                setState('idle');
            };

            recorder.start(250); // Collect data every 250ms
            setState('recording');
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                setError('Microphone access denied. Please allow microphone access in your browser settings.');
            } else if (err instanceof DOMException && err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone and try again.');
            } else {
                setError('Could not start recording. Please try again.');
            }
            setState('idle');
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const cancelRecording = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        // Reset everything
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        audioBlobRef.current = null;
        setRecordingTime(0);
        setState('idle');
        setError(null);
    }, [audioUrl]);

    const togglePlayback = useCallback(() => {
        if (!audioPlayerRef.current || !audioUrl) return;

        if (isPlaying) {
            audioPlayerRef.current.pause();
            setIsPlaying(false);
        } else {
            audioPlayerRef.current.play();
            setIsPlaying(true);
        }
    }, [isPlaying, audioUrl]);

    const transcribe = useCallback(async () => {
        if (!audioBlobRef.current) return;

        // Warn if recording is very short
        if (recordingTime < 1) {
            setError('Recording is too short. Please speak for at least 1-2 seconds.');
            return;
        }

        setState('transcribing');
        setError(null);

        try {
            const formData = new FormData();

            // Determine extension from MIME type
            const mimeType = audioBlobRef.current.type || 'audio/webm';
            const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
            formData.append('audio', audioBlobRef.current, `recording.${ext}`);

            if (translateToEnglish) {
                formData.append('task', 'translate');
            }

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                // Surface the real error from the API
                setError(data.error || 'Transcription failed. Please try again.');
                setState('review');
                return;
            }

            if (data.text && data.text.trim()) {
                onTranscriptionComplete(data.text.trim());
                // Reset after successful transcription
                if (audioUrl) URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
                audioBlobRef.current = null;
                setRecordingTime(0);
                setState('idle');
            } else {
                setError('No speech detected. Please speak clearly and try again.');
                setState('review');
            }
        } catch (err) {
            console.error('[VoiceRecorder] Transcription error:', err);
            setError(err instanceof Error ? err.message : 'Transcription failed. Please check your connection and try again.');
            setState('review');
        }
    }, [audioUrl, onTranscriptionComplete, translateToEnglish, recordingTime]);

    // ──────────────── Render ────────────────

    // IDLE state
    if (state === 'idle') {
        return (
            <div className="voice-recorder voice-recorder-idle">
                <button
                    type="button"
                    onClick={startRecording}
                    disabled={disabled}
                    className="voice-btn voice-btn-start"
                    title="Record voice message"
                >
                    <Mic style={{ width: 15, height: 15 }} />
                    {!compact && <span>Record Voice</span>}
                </button>
                {error && (
                    <div className="voice-error">
                        <span>{error}</span>
                        <button type="button" onClick={() => setError(null)} className="voice-error-dismiss">
                            <X style={{ width: 12, height: 12 }} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // RECORDING state
    if (state === 'recording') {
        return (
            <div className="voice-recorder voice-recorder-active">
                <div className="voice-recording-indicator">
                    <span className="voice-pulse" />
                    <span className="voice-recording-text">Recording…</span>
                    <span className="voice-timer">{formatTime(recordingTime)}</span>
                </div>
                <div className="voice-recording-controls">
                    <button type="button" onClick={stopRecording} className="voice-btn voice-btn-stop" title="Stop recording">
                        <Square style={{ width: 13, height: 13 }} />
                        <span>Stop</span>
                    </button>
                    <button type="button" onClick={cancelRecording} className="voice-btn voice-btn-cancel" title="Cancel recording">
                        <X style={{ width: 14, height: 14 }} />
                    </button>
                </div>
            </div>
        );
    }

    // REVIEW or TRANSCRIBING state
    return (
        <div className="voice-recorder voice-recorder-review">
            {/* Hidden audio element for playback */}
            {audioUrl && (
                <audio
                    ref={audioPlayerRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    style={{ display: 'none' }}
                />
            )}

            <div className="voice-review-row">
                <button
                    type="button"
                    onClick={togglePlayback}
                    className="voice-btn voice-btn-play"
                    disabled={state === 'transcribing'}
                    title={isPlaying ? 'Pause' : 'Play recording'}
                >
                    {isPlaying
                        ? <Pause style={{ width: 14, height: 14 }} />
                        : <Play style={{ width: 14, height: 14 }} />
                    }
                </button>

                <span className="voice-duration">{formatTime(recordingTime)}</span>

                <div className="voice-review-actions">
                    <button
                        type="button"
                        onClick={transcribe}
                        disabled={state === 'transcribing'}
                        className="voice-btn voice-btn-transcribe"
                    >
                        {state === 'transcribing' ? (
                            <>
                                <Loader2 style={{ width: 14, height: 14 }} className="voice-spinner" />
                                <span>Transcribing…</span>
                            </>
                        ) : (
                            <>
                                <Check style={{ width: 14, height: 14 }} />
                                <span>Use Recording</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={cancelRecording}
                        disabled={state === 'transcribing'}
                        className="voice-btn voice-btn-discard"
                        title="Discard recording"
                    >
                        <RotateCcw style={{ width: 13, height: 13 }} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="voice-error">
                    <span>{error}</span>
                    <button type="button" onClick={() => { setError(null); }} className="voice-error-dismiss">
                        <X style={{ width: 12, height: 12 }} />
                    </button>
                </div>
            )}
        </div>
    );
}
