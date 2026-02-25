'use client';

import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Shield, Clock, BarChart3 } from 'lucide-react';
import { signIn } from '@/app/auth/actions';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await signIn(formData);
        if (result?.error) { setError(result.error); setLoading(false); }
    };

    const features = [
        { icon: Shield, text: 'Role-based access with approval workflows' },
        { icon: Clock, text: 'Real-time tracking from request to completion' },
        { icon: BarChart3, text: 'Insights & reports for smarter decisions' },
    ];

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
        .feature-item { display: flex; align-items: center; gap: 14px; }
        .feature-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.1); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; transition: background 0.2s; }
        .feature-item:hover .feature-icon { background: rgba(255,255,255,0.2); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.15); border-top-color: #1A1A1A; border-radius: 50%; animation: spin 0.6s linear infinite; }
      `}</style>

            <div className="login-root">
                {/* Left Hero Panel — Warm Amber Theme */}
                <div className="login-hero" style={{
                    position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #2A2117 0%, #4A3520 30%, #8B6914 60%, #F6CE71 100%)',
                }}>
                    {/* Decorative orbs */}
                    <div style={{ position: 'absolute', inset: 0 }}>
                        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,206,113,0.3) 0%, transparent 70%)', opacity: 0.5 }} />
                        <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,206,113,0.2) 0%, transparent 70%)', opacity: 0.4 }} />
                        <div style={{
                            position: 'absolute', inset: 0,
                            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
                            backgroundSize: '40px 40px',
                        }} />
                    </div>

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', width: '100%' }}>
                        {/* Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#F6CE71', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: '#1A1A1A', fontSize: '15px', fontWeight: 700 }}>F</span>
                            </div>
                            <span style={{ color: '#FFF8E7', fontSize: '17px', fontWeight: 600, letterSpacing: '-0.01em' }}>Facility Management</span>
                        </div>

                        {/* Headline */}
                        <div style={{ maxWidth: '480px' }}>
                            <h1 style={{ fontSize: '38px', fontWeight: 700, color: '#FFF8E7', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '16px' }}>
                                Streamline your facility operations
                            </h1>
                            <p style={{ fontSize: '16px', color: 'rgba(255,248,231,0.7)', lineHeight: 1.6, marginBottom: '40px' }}>
                                Manage work orders, assets, vendors, and spaces — all in one unified platform built for non-profit excellence.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {features.map((f, i) => (
                                    <div key={i} className="feature-item">
                                        <div className="feature-icon">
                                            <f.icon style={{ width: 18, height: 18, color: '#F6CE71' }} />
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,248,231,0.85)' }}>{f.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p style={{ fontSize: '12px', color: 'rgba(255,248,231,0.3)' }}>© 2026 FMS · Built for non-profit foundations</p>
                    </div>
                </div>

                {/* Right Form Panel */}
                <div className="login-form-panel">
                    <div className="login-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#F6CE71', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: '#1A1A1A', fontSize: '14px', fontWeight: 700 }}>F</span>
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #1A1A1A)' }}>FMS</span>
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
