// src/renderer/src/components/VoiceAssistant.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Container, Box, Alert } from '@mui/material';
import { useMicVAD } from '@ricky0123/vad-react';
import { encodeWAV } from '../utils';

export const VoiceAssistant: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const websocket = useRef<WebSocket | null>(null);
  const [recordingState, setRecordingState] = useState<'inactive' | 'recording' | null>(null);

  const {
    listening,
    errored,
    loading,
    userSpeaking,
    start: startVAD,
    pause: pauseVAD,
  } = useMicVAD({
    onSpeechStart: () => {
      console.log('Speech started by VAD');
      setTranscript(''); // Clear previous transcript when speech starts
    },
    onSpeechEnd: (audio) => {
      console.log('User stopped talking');
      if (audio && websocket.current?.readyState === WebSocket.OPEN) {
        const wavBuffer = encodeWAV(audio, 1, 16000, 1, 16);

        websocket.current?.send(wavBuffer);
        console.log('Sent WAV audio segment to backend');
      }
    },
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8765');
    websocket.current = ws;

    ws.onopen = (): void => {
      console.log('WebSocket Client Connecting');
    };

    ws.onmessage = (message: MessageEvent): void => {
      try {
        const data = JSON.parse(message.data as string);
        if (data.text) {
          setTranscript((prevTranscript) => prevTranscript + ' ' + data.text);
        } else if (data.error) {
          setError(data.error);
        }
      } catch {
        setError('Error parsing message.');
      }
    };

    ws.onclose = (): void => {
      console.log('WebSocket Client Disconnected');
    };

    ws.onerror = (): void => {
      setError('WebSocket connection error.');
    };

    return (): void => {
      if (websocket.current?.readyState === WebSocket.OPEN) {
        websocket.current.close();
      }
    };
  }, []); // Empty dependency array for one-time setup

  const startRecording = (): void => {
    setError(null);
    setTranscript('');
    setRecordingState('recording');
    startVAD();
    console.log('VAD started');
  };

  const stopRecording = (): void => {
    setRecordingState('inactive');
    pauseVAD();
    console.log('VAD paused');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Voice Assistant
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {recordingState === 'recording' ? (
            <Button variant="contained" color="secondary" onClick={stopRecording}>
              Stop Recording
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={startRecording}>
              Start Recording
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {recordingState === 'recording' && (
            <>
              <Typography variant="body2">VAD Listening: {listening ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                User Speaking: {userSpeaking ? 'Yes' : 'No'}
              </Typography>
              {loading && (
                <Typography variant="body2" sx={{ ml: 2 }}>
                  VAD Loading...
                </Typography>
              )}
              {errored && (
                <Typography variant="body2" color="error" sx={{ ml: 2 }}>
                  VAD Error: {errored}
                </Typography>
              )}
            </>
          )}
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography variant="body1" component="p">
          Transcript: {transcript}
        </Typography>
      </Box>
    </Container>
  );
};

export default VoiceAssistant;
