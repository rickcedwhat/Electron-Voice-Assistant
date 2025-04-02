import { useState, useEffect } from 'react';

interface VoiceRecognitionHook {
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  permissionGranted: boolean;
  isActive: boolean;
}

export const useVoiceRecognition = (): VoiceRecognitionHook => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  useEffect(() => {
    const checkPermission = async (): Promise<void> => {
      try {
        console.log('Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted.');
        setPermissionGranted(true);
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.error('Microphone permission denied:', error);
        setPermissionGranted(false);
      }
    };
    checkPermission();
  }, []);
  useEffect(() => {
    if (permissionGranted) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const newRecognition = SpeechRecognition ? new SpeechRecognition() : null;
      if (newRecognition) {
        newRecognition.continuous = true;
        newRecognition.interimResults = true;
        newRecognition.lang = 'en-US';
        newRecognition.onstart = (): void => {
          console.log('Speech recognition started.');
          setIsActive(true);
        };
        newRecognition.onresult = (event): void => {
          console.log('Speech recognition result:', event);
          let currentTranscript = '';
          let currentInterimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              currentTranscript += result[0].transcript + ' ';
            } else {
              currentInterimTranscript += result[0].transcript + ' ';
            }
          }
          setTranscript((prev) => prev + currentTranscript);
          setInterimTranscript(currentInterimTranscript);
          console.log('Transcript:', currentTranscript);
          console.log('Interim Transcript:', currentInterimTranscript);
        };
        newRecognition.onerror = (event): void => {
          console.error('Speech recognition error:', event.error);
          setIsActive(false);
        };
        newRecognition.onend = (): void => {
          console.log('Speech recognition ended.');
          setIsActive(false);
        };
        setRecognition(newRecognition);
        return (): void => {
          if (newRecognition) {
            newRecognition.abort();
          }
        };
      }
    }
    return undefined; // to satisfy the return type of useEffect
  }, [permissionGranted]);

  const startListening = (): void => {
    if (recognition) {
      console.log('Starting listening...');
      recognition.start();
    } else {
      console.error('Recognition not initialized, cannot start listening.');
    }
  };
  const stopListening = (): void => {
    if (recognition) {
      console.log('Stopping listening...');
      recognition.stop();
      setInterimTranscript('');
    }
  };
  return {
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    permissionGranted,
    isActive,
  };
};
