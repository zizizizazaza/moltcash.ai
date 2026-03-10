import React, { useState } from 'react';

interface AuthModalProps {
    onLogin: () => void;
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin, onClose }) => {
    const [email, setEmail] = useState('');

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            onLogin();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-8 space-y-8 transform transition-all">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-black text-white rounded-xl mx-auto flex items-center justify-center font-serif text-2xl italic mb-4">L</div>
                    <h2 className="text-2xl font-bold text-black tracking-tight">Sign In</h2>
                    <p className="text-sm text-gray-500 font-medium">Create a smart wallet or connect your own.</p>
                </div>

                {/* Auth Options */}
                <div className="space-y-3">
                    {/* Google */}
                    <button
                        onClick={onLogin}
                        className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl text-sm font-bold text-black transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>

                    {/* Apple */}
                    <button
                        onClick={onLogin}
                        className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl text-sm font-bold text-black transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        Continue with Apple
                    </button>

                    {/* X (Twitter) */}
                    <button
                        onClick={onLogin}
                        className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl text-sm font-bold text-black transition-all"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Continue with X
                    </button>

                    <div className="relative flex items-center py-3">
                        <div className="flex-grow border-t border-gray-100"></div>
                        <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-gray-400 tracking-widest">OR</span>
                        <div className="flex-grow border-t border-gray-100"></div>
                    </div>

                    {/* Email */}
                    <form onSubmit={handleEmailSubmit} className="space-y-3">
                        <div className="relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                            </svg>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                className="w-full py-3.5 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-black placeholder-gray-400 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                            />
                        </div>
                        {email.trim() && (
                            <button
                                type="submit"
                                className="w-full py-3.5 bg-black text-white hover:bg-gray-800 rounded-2xl text-sm font-bold transition-all"
                            >
                                Continue
                            </button>
                        )}
                    </form>

                </div>

                {/* Footer */}
                <div className="text-center pt-2">
                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                        By connecting, you agree to our Terms of Service and Privacy Policy. Fiat deposits require KYC verification.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
