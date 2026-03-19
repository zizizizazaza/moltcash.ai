/**
 * useVoice — unified voice input (ASR) + output (TTS) hook
 *
 * Strategy:
 * - ASR: Web Speech API via react-speech-recognition (Chrome/Edge/Android)
 *        Falls back to MediaRecorder + backend Whisper for iOS/Firefox
 * - TTS: Native speechSynthesis API (all browsers)
 * - Voice Mode: continuous listen → speak → listen loop
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// ─── ASR (Speech-to-Text) ───────────────────────────────────────────

interface UseVoiceOptions {
  language?: string;
  onTranscript?: (text: string) => void;
  onRecordingEnd?: (text: string) => void;
  autoSendOnSilence?: boolean;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const { language = 'en-US', onTranscript, onRecordingEnd, autoSendOnSilence = true } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false); // continuous voice conversation mode
  const [useFallback, setUseFallback] = useState(false); // iOS/Firefox fallback

  // MediaRecorder fallback refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranscriptRef = useRef('');

  // Web Speech API
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Detect if we need fallback
  useEffect(() => {
    // Capacitor WebView reports Web Speech API as available but it doesn't actually work
    const isCapacitor = !!(window as any).Capacitor;
    const isMobileBrowser = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!browserSupportsSpeechRecognition || isCapacitor || isMobileBrowser) {
      setUseFallback(true);
    }
  }, [browserSupportsSpeechRecognition]);

  // ─── Web Speech API path ─────────────────────────────

  // Track transcript changes during recording
  useEffect(() => {
    if (!isRecording || useFallback) return;
    if (transcript) {
      lastTranscriptRef.current = transcript;
      onTranscript?.(transcript);

      // Reset silence timer (auto-send after 2s of silence)
      if (autoSendOnSilence && silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (autoSendOnSilence) {
        silenceTimerRef.current = setTimeout(() => {
          if (isRecording && lastTranscriptRef.current) {
            stopRecording();
          }
        }, 2000);
      }
    }
  }, [transcript, isRecording, useFallback]);

  // When listening stops (Web Speech), finalize
  useEffect(() => {
    if (!useFallback && !listening && isRecording && lastTranscriptRef.current) {
      const finalText = lastTranscriptRef.current;
      setIsRecording(false);
      onRecordingEnd?.(finalText);
      resetTranscript();
      lastTranscriptRef.current = '';
    }
  }, [listening, isRecording, useFallback]);

  // ─── MediaRecorder fallback (iOS/Firefox) ────────────

  const startMediaRecorder = useCallback(async () => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('[Voice] getUserMedia not available. mediaDevices:', !!navigator.mediaDevices);
        setIsRecording(false);
        return;
      }

      console.log('[Voice] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Voice] ✅ Got audio stream, tracks:', stream.getAudioTracks().length);
      
      // Determine best supported mime type
      // Prefer mp4 over webm because some Whisper providers (e.g. lingyaai) don't support webm
      let mimeType = 'audio/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/wav';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser pick default
          }
        }
      }
      console.log('[Voice] Using mimeType:', mimeType || 'browser default');

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('[Voice] Audio chunk:', event.data.size, 'bytes, total chunks:', audioChunksRef.current.length);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('[Voice] MediaRecorder error:', event.error?.name, event.error?.message);
      };

      mediaRecorder.onstop = async () => {
        console.log('[Voice] MediaRecorder stopped. Chunks:', audioChunksRef.current.length);
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        console.log('[Voice] Audio blob size:', audioBlob.size, 'bytes, type:', audioBlob.type);
        
        if (audioBlob.size < 1000) {
          console.log('[Voice] Audio too short, ignoring');
          setIsRecording(false);
          return;
        }
        // Send to backend for Whisper transcription
        try {
          console.log('[Voice] Sending to Whisper for transcription...');
          const text = await transcribeAudio(audioBlob);
          console.log('[Voice] ✅ Transcription result:', text);
          if (text) {
            onRecordingEnd?.(text);
          }
        } catch (err) {
          console.error('[Voice] ❌ Transcription failed:', err);
        }
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // collect in 250ms chunks
      console.log('[Voice] ✅ MediaRecorder started, state:', mediaRecorder.state);
    } catch (err: any) {
      console.error('[Voice] ❌ Microphone access error:', err?.name, err?.message, err);
      setIsRecording(false);
    }
  }, [onRecordingEnd]);

  const stopMediaRecorder = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ─── Backend Whisper transcription ───────────────────

  async function transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    const ext = audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('webm') ? 'webm' : 'wav';
    formData.append('audio', audioBlob, `recording.${ext}`);
    formData.append('language', language);

    const token = sessionStorage.getItem('loka_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/chat/transcribe`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const result = await response.json();
    return result.text || '';
  }

  // ─── Public API ──────────────────────────────────────

  const startRecording = useCallback(() => {
    console.log('[Voice] startRecording called, useFallback:', useFallback);
    lastTranscriptRef.current = '';
    resetTranscript();

    if (useFallback) {
      console.log('[Voice] Using MediaRecorder fallback path');
      setIsRecording(true);
      startMediaRecorder();
    } else {
      console.log('[Voice] Using Web Speech API path');
      setIsRecording(true);
      SpeechRecognition.startListening({ continuous: true, language });
    }
  }, [useFallback, language, startMediaRecorder, resetTranscript]);

  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (useFallback) {
      stopMediaRecorder();
    } else {
      SpeechRecognition.stopListening();
      // Finalization happens in the listening effect above
      if (lastTranscriptRef.current) {
        const finalText = lastTranscriptRef.current;
        setIsRecording(false);
        onRecordingEnd?.(finalText);
        resetTranscript();
        lastTranscriptRef.current = '';
      } else {
        setIsRecording(false);
      }
    }
  }, [useFallback, stopMediaRecorder, onRecordingEnd, resetTranscript]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // ─── TTS (Text-to-Speech) ───────────────────────────

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to pick a nicer voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      v => v.lang.startsWith(language.split('-')[0]) && v.name.includes('Google')
    ) || voices.find(
      v => v.lang.startsWith(language.split('-')[0]) && !v.localService
    ) || voices.find(
      v => v.lang.startsWith(language.split('-')[0])
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // In voice mode, auto-restart listening after TTS ends
      if (voiceMode) {
        setTimeout(() => startRecording(), 300);
      }
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [language, voiceMode, startRecording]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // ─── Voice Mode (continuous conversation) ────────────

  const toggleVoiceMode = useCallback(() => {
    if (voiceMode) {
      // Exiting voice mode
      setVoiceMode(false);
      stopRecording();
      stopSpeaking();
    } else {
      setVoiceMode(true);
      startRecording();
    }
  }, [voiceMode, startRecording, stopRecording, stopSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopMediaRecorder();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [stopMediaRecorder]);

  return {
    // Recording state
    isRecording,
    transcript: useFallback ? '' : transcript,
    listening: useFallback ? isRecording : listening,

    // TTS state
    isSpeaking,
    speak,
    stopSpeaking,

    // Voice mode
    voiceMode,
    toggleVoiceMode,

    // Controls
    startRecording,
    stopRecording,
    toggleRecording,

    // Capabilities
    hasSpeechRecognition: browserSupportsSpeechRecognition,
    hasSpeechSynthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
    useFallback,
  };
}
