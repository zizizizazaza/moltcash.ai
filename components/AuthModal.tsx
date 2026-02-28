import React from 'react';

interface AuthModalProps {
    onLogin: () => void;
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-8 space-y-8 transform transition-all">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-black text-white rounded-xl mx-auto flex items-center justify-center font-serif text-2xl italic mb-4">M</div>
                    <h2 className="text-2xl font-bold text-black tracking-tight">Sign In</h2>
                    <p className="text-sm text-gray-500 font-medium">Create a smart wallet or connect your own.</p>
                </div>

                {/* Auth Options */}
                <div className="space-y-3">
                    <button
                        onClick={onLogin}
                        className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl text-sm font-bold text-black transition-all"
                    >
                        <span className="text-lg">G</span> Continue with Google
                    </button>

                    <button
                        onClick={onLogin}
                        className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl text-sm font-bold text-black transition-all"
                    >
                        <span className="text-lg font-serif tracking-tighter">𝕏</span> Continue with X
                    </button>



                    <div className="relative flex items-center py-4">
                        <div className="flex-grow border-t border-gray-100"></div>
                        <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-gray-400 tracking-widest">OR</span>
                        <div className="flex-grow border-t border-gray-100"></div>
                    </div>

                    <button
                        onClick={onLogin}
                        className="w-full flex items-center justify-center gap-3 py-3.5 bg-black text-white hover:bg-gray-800 rounded-2xl text-sm font-bold transition-all"
                    >
                        Connect Wallet
                    </button>
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
