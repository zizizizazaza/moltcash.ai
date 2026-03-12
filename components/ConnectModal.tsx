import React, { useState } from 'react';
import { useLoginWithOAuth, useConnectWallet } from '@privy-io/react-auth';

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Wallet icons as inline SVGs for zero dependencies
const WalletIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6v6zm0 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5" />
    </svg>
);

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const XIcon = () => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const MetaMaskIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 35 33">
        <path d="M32.96 1l-13.14 9.72 2.45-5.73L32.96 1z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.66 1l13.02 9.82L13.35 4.99 2.66 1zm25.57 22.53l-3.5 5.34 7.49 2.06 2.14-7.28-6.13-.12zm-26.96.12l2.13 7.28 7.47-2.06-3.48-5.34-6.12.12z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.47 14.51l-2.08 3.14 7.4.34-.24-7.97-5.08 4.49zm14.68 0l-5.16-4.59-.17 8.07 7.4-.34-2.07-3.14zM11.3 28.87l4.49-2.16-3.86-3.01-.63 5.17zm8.04-2.16l4.49 2.16-.64-5.17-3.85 3.01z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PhantomIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 128 128" fill="none">
        <rect width="128" height="128" rx="26" fill="#AB9FF2" />
        <path d="M110.58 64.58c0-2.05-.16-4.08-.47-6.08a42.48 42.48 0 00-84.22 0c-.31 2-.47 4.03-.47 6.08 0 2.72.28 5.38.8 7.96a2.01 2.01 0 003.83-.5 38.48 38.48 0 0175.9 0 2.01 2.01 0 003.83.5c.52-2.58.8-5.24.8-7.96z" fill="white" fillOpacity=".95" />
        <circle cx="50" cy="60" r="6" fill="white" fillOpacity=".95" />
        <circle cx="78" cy="60" r="6" fill="white" fillOpacity=".95" />
    </svg>
);

const OKXIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 40 40">
        <rect width="40" height="40" rx="8" fill="black" />
        <rect x="8" y="8" width="10" height="10" rx="1" fill="white" />
        <rect x="22" y="8" width="10" height="10" rx="1" fill="white" />
        <rect x="8" y="22" width="10" height="10" rx="1" fill="white" />
        <rect x="22" y="22" width="10" height="10" rx="1" fill="white" />
        <rect x="15" y="15" width="10" height="10" rx="1" fill="white" />
    </svg>
);

const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
    const { initOAuth, loading: oauthLoading } = useLoginWithOAuth();
    const { connectWallet } = useConnectWallet();
    const [activeMethod, setActiveMethod] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGoogle = async () => {
        setActiveMethod('google');
        try {
            await initOAuth({ provider: 'google' });
            onClose();
        } catch (e) {
            console.error('Google login failed:', e);
        } finally {
            setActiveMethod(null);
        }
    };

    const handleTwitter = async () => {
        setActiveMethod('twitter');
        try {
            await initOAuth({ provider: 'twitter' });
            onClose();
        } catch (e) {
            console.error('Twitter login failed:', e);
        } finally {
            setActiveMethod(null);
        }
    };

    const handleWallet = () => {
        onClose();
        connectWallet();
    };

    const isLoading = oauthLoading || activeMethod !== null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-[6px] z-[60]"
                style={{ animation: 'fadeIn 0.2s ease-out' }}
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal Container - scrollable if needed */}
            <div
                className="fixed inset-0 z-[61] overflow-y-auto"
                onClick={!isLoading ? onClose : undefined}
            >
                <div className="min-h-full flex items-center justify-center p-4">
                    <div
                        className="bg-white rounded-[28px] w-full max-w-[400px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25)] relative overflow-hidden"
                        style={{ animation: 'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top gradient accent */}
                        <div className="h-1 bg-gradient-to-r from-[#a3ff12] via-[#12ffa3] to-[#12a3ff]" />

                        {/* Content */}
                        <div className="px-7 pt-5 pb-6">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all cursor-pointer disabled:opacity-40"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Header */}
                            <div className="text-center mb-5">
                                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-3 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]">
                                    <span className="text-white text-base font-black">M</span>
                                </div>
                                <h2 className="text-lg font-black text-black tracking-[-0.02em]">
                                    Sign in to MoltCash
                                </h2>
                                <p className="text-gray-400 text-xs mt-1">
                                    Connect your wallet or social account
                                </p>
                            </div>

                            {/* Social Login — Primary */}
                            <div className="space-y-2.5 mb-4">
                                <button
                                    onClick={handleGoogle}
                                    disabled={isLoading}
                                    className="group w-full h-[46px] bg-white border border-gray-200 rounded-2xl font-semibold text-[13px] text-gray-700 flex items-center justify-center gap-2.5 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm active:scale-[0.97] transition-all cursor-pointer disabled:opacity-60"
                                >
                                    {activeMethod === 'google' ? (
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                    ) : (
                                        <GoogleIcon />
                                    )}
                                    Continue with Google
                                </button>

                                <button
                                    onClick={handleTwitter}
                                    disabled={isLoading}
                                    className="group w-full h-[46px] bg-white border border-gray-200 rounded-2xl font-semibold text-[13px] text-gray-700 flex items-center justify-center gap-2.5 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm active:scale-[0.97] transition-all cursor-pointer disabled:opacity-60"
                                >
                                    {activeMethod === 'twitter' ? (
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                    ) : (
                                        <XIcon />
                                    )}
                                    Continue with X
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                                <span className="text-[11px] text-gray-300 font-medium">or</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                            </div>

                            {/* Wallet — Secondary */}
                            <button
                                onClick={handleWallet}
                                disabled={isLoading}
                                className="group w-full h-[46px] bg-black text-white rounded-2xl font-semibold text-[13px] flex items-center justify-center gap-2.5 hover:bg-gray-800 active:scale-[0.98] transition-all cursor-pointer shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)] disabled:opacity-60"
                            >
                                <WalletIcon />
                                Connect Wallet
                            </button>

                            {/* Footer */}
                            <p className="text-center text-gray-300 text-[10px] mt-4 leading-relaxed">
                                By continuing, you agree to our{' '}
                                <span className="text-gray-400 underline underline-offset-2 cursor-pointer hover:text-gray-500">Terms</span>
                                {' & '}
                                <span className="text-gray-400 underline underline-offset-2 cursor-pointer hover:text-gray-500">Privacy Policy</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(8px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </>
    );
};

export default ConnectModal;
