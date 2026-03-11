import React, { useEffect, useState } from 'react';
import { useFundWallet, usePrivy, useWallets } from '@privy-io/react-auth';

type ModalAction = 'deposit' | 'withdraw';
type FiatProvider = 'coinbase' | 'onramper';

const TxModal: React.FC = () => {
    const [formAmount, setFormAmount] = useState('');
    const [formAsset, setFormAsset] = useState('USD');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'exchange'>('card');
    const [fiatProvider, setFiatProvider] = useState<FiatProvider>('coinbase');
    const [showMethodPicker, setShowMethodPicker] = useState(false);
    const [showProviderPicker, setShowProviderPicker] = useState(false);
    const [destinationAddress, setDestinationAddress] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalAction, setModalAction] = useState<ModalAction | null>(null);

    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();
    const { fundWallet } = useFundWallet();

    const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error && error.message) return error.message;
        if (typeof error === 'string') return error;
        return 'Failed to open funding provider. Please try again.';
    };

    const openOnramper = (walletAddress: string, amount: string, fiat: string) => {
        const apiKey = import.meta.env.VITE_ONRAMPER_API_KEY?.trim();
        if (!apiKey) {
            throw new Error('Missing VITE_ONRAMPER_API_KEY. Please set it in your .env file.');
        }

        const onramperUrl = new URL('https://buy.onramper.dev/');
        onramperUrl.searchParams.set('apiKey', apiKey);

 
        const normalizedFiat = fiat === 'EUR' ? 'EUR' : 'USD';
        onramperUrl.searchParams.set('defaultFiat', normalizedFiat);

        const numericAmount = Number(amount);
        if (Number.isFinite(numericAmount) && numericAmount > 0) {
            onramperUrl.searchParams.set('defaultAmount', String(numericAmount));
        }

        const popup = window.open(onramperUrl.toString(), '_blank', 'noopener,noreferrer');
        if (!popup) {
            throw new Error('Popup was blocked. Please allow popups and try again.');
        }
        void walletAddress;
    };

    const resetModalState = () => {
        setFormAmount('');
        setFormAsset('USD');
        setPaymentMethod('card');
        setFiatProvider('coinbase');
        setShowMethodPicker(false);
        setShowProviderPicker(false);
        setDestinationAddress('');
        setSubmitError(null);
        setIsSubmitting(false);
    };

    const walletList = (wallets ?? []) as Array<{ address?: string; walletClientType?: string }>;
    const privyWalletAddress = walletList.find((w) => w.walletClientType === 'privy' && Boolean(w.address))?.address;
    const fallbackWalletAddress = walletList.find((w) => Boolean(w.address))?.address;
    const targetAddress = privyWalletAddress ?? fallbackWalletAddress ?? '';

    useEffect(() => {
        const handleOpenModal = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail === 'deposit' || detail === 'withdraw') {
                setModalAction(detail);
                resetModalState();
            }
        };

        window.addEventListener('loka-open-modal', handleOpenModal);
        return () => window.removeEventListener('loka-open-modal', handleOpenModal);
    }, []);

    const handleClose = () => {
        setShowMethodPicker(false);
        setShowProviderPicker(false);
        setModalAction(null);
    };

    const handleModalSubmit = async () => {
        if (!formAmount || !modalAction) return;

        const isFiatMode = ['USD', 'EUR', 'CNY'].includes(formAsset);
        if (modalAction === 'deposit' && isFiatMode) {
            if (!ready || !authenticated) {
                setSubmitError('Please connect wallet first.');
                return;
            }

                if (!targetAddress) {
                setSubmitError('No wallet address found. Please reconnect and try again.');
                return;
            }

            setSubmitError(null);
            setIsSubmitting(true);
            if (paymentMethod === 'card' && fiatProvider === 'onramper') {
                try {
                    openOnramper(targetAddress, formAmount, formAsset);
                    handleClose();
                } catch (error) {
                    console.error('Onramper flow failed', { error });
                    setSubmitError(getErrorMessage(error));
                } finally {
                    setIsSubmitting(false);
                }
                return;
            }

            try {
                await fundWallet({
                    address: targetAddress,
                    options: {
                        amount: formAmount,
                        asset: 'USDC',
                        // 'manual' = direct to Receive funds (QR + address), skipping Pay with card / Receive funds choice
                        defaultFundingMethod: paymentMethod === 'exchange' ? 'manual' : paymentMethod,
                        card: paymentMethod === 'card' ? { preferredProvider: fiatProvider } : undefined
                    }
                });
                handleClose();
            } catch (error) {
                // Fallback to dashboard defaults in case local options are incompatible.
                try {
                    await fundWallet({ address: targetAddress });
                    handleClose();
                } catch (fallbackError) {
                    console.error('Privy fundWallet failed', { error, fallbackError });
                    setSubmitError(getErrorMessage(fallbackError));
                }
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        // Crypto (Web3) withdraw
        if (modalAction === 'withdraw' && formAsset === 'USDC') {
            const amount = parseFloat(formAmount);
            if (!Number.isFinite(amount) || amount <= 0) {
                setSubmitError('Please enter a valid amount.');
                return;
            }
            const dest = destinationAddress.trim();
            if (!dest) {
                setSubmitError('Please enter destination wallet address.');
                return;
            }
            if (!/^0x[a-fA-F0-9]{40}$/.test(dest)) {
                setSubmitError('Invalid Ethereum address. Expected 0x followed by 40 hex characters.');
                return;
            }
            setSubmitError(null);
            setIsSubmitting(true);
            try {
                // TODO: wire to actual withdraw tx (wallet.sendTransaction / backend)
                console.info('Withdraw requested', { amount: formAmount, destination: dest });
                handleClose();
            } catch (error) {
                setSubmitError(getErrorMessage(error));
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        setFormAmount('');
        setShowMethodPicker(false);
        setShowProviderPicker(false);
        setSubmitError(null);
        setModalAction(null);
    };

    if (!modalAction) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleClose} />
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-black">{modalAction === 'deposit' ? 'Deposit' : 'Withdraw'}</h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-black bg-gray-50 hover:bg-gray-100 transition-colors p-2 rounded-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex gap-2 p-1 bg-gray-50 border border-gray-100 rounded-xl mb-4">
                    <button onClick={() => setFormAsset('USD')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${['USD', 'EUR', 'CNY'].includes(formAsset) ? 'bg-white shadow-sm text-black border border-gray-100' : 'text-gray-500 hover:text-black border border-transparent'}`}>
                        🏦 Fiat (Bank/Card)
                    </button>
                    <button onClick={() => setFormAsset('USDC')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formAsset === 'USDC' ? 'bg-white shadow-sm text-black border border-gray-100' : 'text-gray-500 hover:text-black border border-transparent'}`}>
                        ⛓️ Crypto (Web3)
                    </button>
                </div>

                {['USD', 'EUR', 'CNY'].includes(formAsset) && (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            {modalAction === 'deposit' ? (
                                <>
                                    <input type="number" placeholder="Amount to deposit" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-black font-medium transition-colors text-sm" />
                                    <select value={formAsset} onChange={(e) => setFormAsset(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-black font-medium transition-colors min-w-[90px] text-sm">
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="CNY">CNY</option>
                                    </select>
                                </>
                            ) : (
                                <>
                                    <input type="number" placeholder="USDC amount to withdraw" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-black font-medium transition-colors text-sm" />
                                    <span className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 flex items-center">USDC</span>
                                </>
                            )}
                        </div>

                        {modalAction === 'deposit' && (
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[11px] text-gray-400 font-medium">≈ {formAmount ? (parseFloat(formAmount) * 0.997).toFixed(2) : '0.00'} USDC ↕</span>
                                <div className="flex gap-1.5">
                                    {(formAsset === 'CNY' ? ['¥100', '¥500', '¥1000'] : ['$25', '$50', '$100', '$500']).map(amt => (
                                        <button key={amt} onClick={() => setFormAmount(amt.replace(/[^0-9]/g, ''))} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-[10px] font-bold text-gray-500 hover:text-black transition-all">{amt}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {modalAction === 'withdraw' && (
                            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-gray-400 font-medium">Receive in</span>
                                    <select value={formAsset} onChange={(e) => setFormAsset(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 outline-none focus:border-black font-bold transition-colors text-xs">
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="CNY">CNY</option>
                                    </select>
                                </div>
                                <span className="text-sm font-bold text-black">
                                    ≈ {formAmount ? (parseFloat(formAmount) * (formAsset === 'CNY' ? 7.1 : formAsset === 'EUR' ? 0.92 : 1.0) * 0.997).toFixed(2) : '0.00'} {formAsset}
                                </span>
                            </div>
                        )}

                        <div>
                            <p className="text-[11px] font-semibold text-gray-400 mb-1.5 px-1">Payment Method</p>
                            <button onClick={() => { setShowMethodPicker(!showMethodPicker); setShowProviderPicker(false); }} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-300 transition-all group">
                                <div className="flex items-center gap-3">
                                    <span className="text-base">{paymentMethod === 'card' ? '💳' : '🏢'}</span>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-black">
                                            {paymentMethod === 'card' ? 'Pay with card' : 'Transfer from exchange'}
                                        </p>
                                        <p className="text-[10px] text-gray-400">Privy funding flow</p>
                                    </div>
                                </div>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${showMethodPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {showMethodPicker && (
                                <div className="mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                    <p className="px-4 pt-3 pb-2 text-[11px] font-semibold text-gray-400">{modalAction === 'deposit' ? 'Payment Method' : 'Withdrawal Method'}</p>
                                    {([
                                        { id: 'card' as const, icon: '💳', label: 'Pay with card' },
                                        { id: 'exchange' as const, icon: '🏢', label: 'Transfer from exchange' },
                                    ]).map((m) => (
                                        <button key={m.id} onClick={() => { setPaymentMethod(m.id); setShowMethodPicker(false); }} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-t border-gray-50 ${paymentMethod === m.id ? 'bg-gray-50' : ''}`}>
                                            <span className="text-lg w-8 text-center">{m.icon}</span>
                                            <div className="flex-1 text-left">
                                                <p className="text-xs font-bold text-black">{m.label}</p>
                                                <p className="text-[10px] text-gray-400">Privy supported method</p>
                                            </div>
                                            {paymentMethod === m.id && <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {paymentMethod === 'card' && (
                            <div>
                                <p className="text-[11px] font-semibold text-gray-400 mb-1.5 px-1">Card Provider</p>
                                <button onClick={() => { setShowProviderPicker(!showProviderPicker); setShowMethodPicker(false); }} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-300 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black ${
                                            fiatProvider === 'coinbase' ? 'bg-blue-600' : 'bg-orange-500'
                                        }`}>
                                            {fiatProvider === 'coinbase' ? 'C' : 'O'}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-black">
                                                {fiatProvider === 'coinbase' ? 'Coinbase Onramp' : 'Onramper'}
                                            </p>
                                            <p className="text-[10px] text-gray-400">{fiatProvider === 'onramper' ? 'Custom card flow' : 'Selected for Privy card flow'}</p>
                                        </div>
                                    </div>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showProviderPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {showProviderPicker && (
                                    <div className="mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                        <p className="px-4 pt-3 pb-2 text-[11px] font-semibold text-gray-400">Select Card Provider</p>
                                        {([
                                            { id: 'coinbase' as const, label: 'Coinbase Onramp', color: 'bg-blue-600' },
                                            { id: 'onramper' as const, label: 'Onramper (Custom)', color: 'bg-orange-500' },
                                        ]).map((p) => (
                                            <button key={p.id} onClick={() => { setFiatProvider(p.id); setShowProviderPicker(false); }} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-t border-gray-50 ${fiatProvider === p.id ? 'bg-gray-50' : ''}`}>
                                                <div className={`w-8 h-8 ${p.color} rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm`}>{p.label[0]}</div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-xs font-bold text-black">{p.label}</p>
                                                </div>
                                                {fiatProvider === p.id && <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {modalAction === 'withdraw' && (
                            <div className="flex justify-between items-center text-[10px] px-2">
                                <span className="text-gray-400 font-bold">Available USDC balance</span>
                                <span className="font-bold text-black border-b border-black cursor-pointer hover:bg-gray-100 px-1 rounded-sm transition-colors py-0.5" onClick={() => setFormAmount('12300')}>
                                    12,300.00 USDC
                                </span>
                            </div>
                        )}

                        <button onClick={handleModalSubmit} disabled={!formAmount || isSubmitting} className="w-full py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all tracking-wide disabled:opacity-40 disabled:cursor-not-allowed mt-1">
                            {isSubmitting
                                ? paymentMethod === 'card' && fiatProvider === 'onramper'
                                    ? 'Opening Onramper...'
                                    : 'Opening Privy onramp...'
                                : modalAction === 'deposit'
                                    ? paymentMethod === 'card' && fiatProvider === 'onramper'
                                        ? 'Continue with Onramper'
                                        : 'Continue with Privy Onramp'
                                    : 'Submit Withdrawal'}
                        </button>
                        <p className="text-[9px] text-gray-400 text-center">You will be redirected to complete payment on the provider&apos;s secure page.</p>
                        <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5 px-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Processed by selected funding provider. KYC may be required.</div>
                        {submitError && <p className="text-[11px] text-red-500 font-medium text-center">{submitError}</p>}
                    </div>
                )}

                {formAsset === 'USDC' && modalAction === 'deposit' && (
                    <div className="space-y-3">
                        {!ready || !authenticated ? (
                            <div className="py-6 text-center">
                                <p className="text-sm font-medium text-gray-600">Connect your wallet to receive USDC on Base.</p>
                                <p className="text-[11px] text-gray-400 mt-2">Your receive address will appear after connecting.</p>
                            </div>
                        ) : !targetAddress ? (
                            <div className="py-6 text-center">
                                <p className="text-sm font-medium text-gray-600">No wallet address found.</p>
                                <p className="text-[11px] text-gray-400 mt-2">Please reconnect your wallet and try again.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-white text-[9px] font-bold">⟠</span></div>
                                    <span className="text-xs font-bold text-black">Base Network</span>
                                </div>

                                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-3">
                                    <div className="bg-white p-3 rounded-xl shadow-sm">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(targetAddress)}`} alt="Wallet QR" className="w-28 h-28" />
                                    </div>
                                    <p className="text-xs font-mono text-black text-center leading-relaxed break-all px-2">
                                        <span className="font-bold">{targetAddress.slice(0, 6)}</span>...<span className="font-bold">{targetAddress.slice(-4)}</span>
                                    </p>
                                    <p className="text-[10px] font-mono text-gray-500 break-all px-1">{targetAddress}</p>
                                </div>

                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[11px] text-gray-400">Minimum Deposit</span>
                                    <span className="text-[11px] font-bold text-black">0.5 USDC</span>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                        Only send <span className="font-bold">USDC on Base</span> to this address.<br />
                                        Sending other tokens may result in loss of funds.
                                    </p>
                                </div>

                                <button onClick={() => navigator.clipboard?.writeText(targetAddress)} className="w-full py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">
                                    Copy address
                                </button>
                            </>
                        )}
                        {submitError && formAsset === 'USDC' && <p className="text-[11px] text-red-500 font-medium text-center">{submitError}</p>}
                    </div>
                )}

                {formAsset === 'USDC' && modalAction === 'withdraw' && (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <input type="number" placeholder="Amount to withdraw" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-black font-medium transition-colors text-sm" />
                            <span className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600">USDC</span>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <p className="text-[11px] font-semibold text-gray-400">Destination Wallet</p>
                            <input type="text" placeholder="Enter Web3 wallet address (0x...)" value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-xs outline-none focus:border-black transition-colors font-mono" />
                            <div className="flex items-center gap-2 pt-1">
                                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-white text-[8px] font-bold">⟠</span></div>
                                <span className="text-[11px] font-bold text-gray-500">Base Network</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] px-2">
                            <span className="text-gray-400 font-bold">Available USDC balance</span>
                            <span className="font-bold text-black border-b border-black cursor-pointer hover:bg-gray-100 px-1 rounded-sm transition-colors py-0.5" onClick={() => setFormAmount('12300')}>12,300.00 USDC</span>
                        </div>
                        <button onClick={handleModalSubmit} disabled={!formAmount || !destinationAddress.trim() || isSubmitting} className="w-full py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all tracking-wide disabled:opacity-40 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Processing...' : 'Submit Withdrawal'}
                        </button>
                        {submitError && formAsset === 'USDC' && modalAction === 'withdraw' && <p className="text-[11px] text-red-500 font-medium text-center">{submitError}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TxModal;
