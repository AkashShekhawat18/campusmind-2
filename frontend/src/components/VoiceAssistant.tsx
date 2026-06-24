'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Square } from 'lucide-react';
import { VoiceWave } from './VoiceWave';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceAssistant({ isOpen, onClose }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("Hi there! I am CampusMind AI. Click the microphone and start speaking.");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim().length > 0) {
             setTranscript(currentTranscript);
             setIsSpeaking(true); // Simulate speaking animation when receiving audio
          }
        };

        recognition.onspeechend = () => {
          setIsSpeaking(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
          setIsSpeaking(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setIsSpeaking(false);
    } else {
      setTranscript("Listening...");
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition error:", e);
        setTranscript("Speech recognition failed to start.");
      }
    }
  };

  const handleClose = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setIsSpeaking(false);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-8 right-8 z-50 w-80 md:w-96 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6 flex flex-col items-center"
        >
          {/* Header */}
          <div className="w-full flex justify-between items-center mb-6">
            <span className="text-white/60 text-sm font-medium tracking-wide">AI Assistant</span>
            <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Voice Orb */}
          <div className="my-8">
            <VoiceWave isListening={isListening} isSpeaking={isSpeaking} />
          </div>

          {/* Transcript */}
          <div className="h-24 w-full overflow-y-auto mb-6 text-center [&::-webkit-scrollbar]:hidden">
            <p className="text-white/90 text-lg font-light leading-relaxed">
              {transcript}
            </p>
          </div>

          {/* Controls */}
          <button
            onClick={toggleListening}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full transition-all cursor-pointer ${
              isListening 
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50' 
                : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            }`}
          >
            {isListening ? (
              <>
                <Square size={18} className="fill-current" />
                <span className="font-semibold">Stop</span>
              </>
            ) : (
              <>
                <Mic size={18} />
                <span className="font-semibold">Start Speaking</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
