'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { signIn } from '@/app/auth/actions';

const slides = [
    {
        image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&q=80',
        quote: '"Management is, above all, a practice where art, science, and craft meet."',
        author: '— Henry Mintzberg',
    },
    {
        image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1200&q=80',
        quote: '"The art of management is the capacity to handle complexity."',
        author: '— Peter Drucker',
    },
    {
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
        quote: '"Efficiency is doing things right; effectiveness is doing the right things."',
        author: '— Peter Drucker',
    },
];

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSlide, setActiveSlide] = useState(0);

    const nextSlide = useCallback(() => {
        setActiveSlide((prev) => (prev + 1) % slides.length);
    }, []);

    useEffect(() => {
        const timer = setInterval(nextSlide, 6000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await signIn(formData);
        if (result?.error) { setError(result.error); setLoading(false); }
    };

    return (
        <>
            <style>{`
        .login-root { display: flex; min-height: 100vh; }
        .login-hero { display: none; }
        @media (min-width: 1024px) {
          .login-hero { display: flex; width: 55%; }
        }
        .login-form-panel { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px 48px; background: var(--bg, #FAFAF8); }
        .login-card { width: 100%; max-width: 420px; }
        .login-input { width: 100%; padding: 11px 14px; background: var(--surface, #fff); border: 1px solid var(--border, #E8E8E4); border-radius: 10px; font-size: 13px; font-family: inherit; color: var(--text-primary, #1A1A1A); outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .login-input:focus { border-color: #F6CE71; box-shadow: 0 0 0 3px rgba(246, 206, 113, 0.2); }
        .login-input::placeholder { color: var(--text-muted, #A0A09C); }
        .login-btn { width: 100%; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: inherit; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; }
        .login-btn-primary { background: #F6CE71; color: #1A1A1A; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .login-btn-primary:hover { background: #E5BD60; }
        .login-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-btn-secondary { background: var(--surface, #fff); color: var(--text-primary, #1A1A1A); border: 1px solid var(--border, #E8E8E4); }
        .login-btn-secondary:hover { background: var(--surface-raised, #F5F5F3); }
        .login-label { display: block; font-size: 13px; font-weight: 500; color: var(--text-secondary, #6B6B6B); margin-bottom: 6px; }
        .login-error { padding: 12px 14px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; font-size: 13px; color: #DC2626; margin-bottom: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.15); border-top-color: #1A1A1A; border-radius: 50%; animation: spin 0.6s linear infinite; }

        /* Slider styles */
        .slide-image {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          opacity: 0; transition: opacity 1.2s ease-in-out;
        }
        .slide-image.active { opacity: 1; }
        .slide-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.35);
          border: none; cursor: pointer; padding: 0;
          transition: all 0.3s ease;
        }
        .slide-dot.active {
          background: #fff;
          width: 24px; border-radius: 4px;
        }
      `}</style>

            <div className="login-root">
                {/* Left Panel — Image Slider */}
                <div className="login-hero" style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Slide images */}
                    {slides.map((slide, i) => (
                        <div
                            key={i}
                            className={`slide-image ${i === activeSlide ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${slide.image})` }}
                        />
                    ))}

                    {/* Gradient overlay for text legibility */}
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 1,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.05) 100%)',
                    }} />

                    {/* Quote overlay */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
                        padding: '48px', display: 'flex', flexDirection: 'column', gap: '16px',
                    }}>
                        {slides.map((slide, i) => (
                            <div
                                key={i}
                                style={{
                                    position: i === activeSlide ? 'relative' : 'absolute',
                                    opacity: i === activeSlide ? 1 : 0,
                                    transform: i === activeSlide ? 'translateY(0)' : 'translateY(12px)',
                                    transition: 'opacity 0.8s ease, transform 0.8s ease',
                                    pointerEvents: i === activeSlide ? 'auto' : 'none',
                                }}
                            >
                                <p style={{
                                    fontSize: '22px', fontWeight: 300, color: '#fff',
                                    lineHeight: 1.5, letterSpacing: '-0.01em',
                                    fontStyle: 'italic', maxWidth: '480px',
                                }}>
                                    {slide.quote}
                                </p>
                                <p style={{
                                    fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)',
                                    marginTop: '12px', letterSpacing: '0.02em',
                                }}>
                                    {slide.author}
                                </p>
                            </div>
                        ))}

                        {/* Dot navigation */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    className={`slide-dot ${i === activeSlide ? 'active' : ''}`}
                                    onClick={() => setActiveSlide(i)}
                                    aria-label={`Go to slide ${i + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Form Panel */}
                <div className="login-form-panel">
                    <div className="login-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>

                        </div>

                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary, #1A1A1A)', letterSpacing: '-0.02em' }}>Welcome back</h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary, #6B6B6B)', marginTop: '6px', marginBottom: '28px' }}>
                            Enter your credentials to access the dashboard
                        </p>

                        {error && <div className="login-error">{error}</div>}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div>
                                <label htmlFor="login-email" className="login-label">Email address</label>
                                <input id="login-email" name="email" type="email" placeholder="you@foundation.org" required className="login-input" />
                            </div>

                            <div>
                                <label htmlFor="login-password" className="login-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required className="login-input" style={{ paddingRight: '44px' }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted, #A0A09C)' }}>
                                        {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                    <input type="checkbox" style={{ width: 15, height: 15, accentColor: '#F6CE71' }} />
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary, #6B6B6B)' }}>Remember me</span>
                                </label>
                                <a href="#" style={{ fontSize: '13px', fontWeight: 500, color: '#D4A843', textDecoration: 'none' }}>Forgot password?</a>
                            </div>

                            <button type="submit" disabled={loading} className="login-btn login-btn-primary">
                                {loading ? <><span className="spinner" /> Signing in…</> : <>Sign in <ArrowRight style={{ width: 16, height: 16 }} /></>}
                            </button>
                        </form>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '20px 0' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border, #E8E8E4)' }} />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted, #A0A09C)' }}>or</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border, #E8E8E4)' }} />
                        </div>

                        <button type="button" className="login-btn login-btn-secondary">Continue with Single Sign-On</button>

                        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted, #A0A09C)', marginTop: '24px' }}>
                            Protected by 256-bit encryption · Session timeout: 30 min
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
