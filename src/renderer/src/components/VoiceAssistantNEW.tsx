// src/renderer/src/components/VoiceAssistant.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Typography, Container, Box, Alert } from '@mui/material';
import { useMicVAD } from '@ricky0123/vad-react';
import { encodeWAV } from '../utils';

export const VoiceAssistant: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [listeningState, setListeningState] = useState<'inactive' | 'recording' | null>(null);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const websocket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (window.electron?.ipcRenderer) {
      if (process.env.NODE_ENV === 'development') {
        window.electron.ipcRenderer.invoke('get-debug-mode').then((mode) => {
          setDebugMode(mode);
        });
      }
    }
  }, []);

  const {
    listening,
    errored,
    loading,
    userSpeaking,
    start: startVAD,
    pause: pauseVAD,
  } = useMicVAD({
    onSpeechStart: () => {
      if (listeningState === 'recording') {
        console.log('Speech started by VAD');
        setError(null);
      }
    },
    onSpeechEnd: (audio) => {
      if (
        audio &&
        websocket.current?.readyState === WebSocket.OPEN &&
        listeningState === 'recording'
      ) {
        console.log('User stopped talking');
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

  useEffect(() => {
    const startRecording = (): void => {
      setError(null);
      setTranscript('');
      setListeningState('recording');
      startVAD();
      console.log('VAD started');
    };

    const stopRecording = (): void => {
      setListeningState('inactive');
      pauseVAD();
      console.log('VAD paused');
    };

    const toggleRecording = (): void => {
      console.log('Toggle recording');
      if (listeningState !== 'recording') {
        startRecording();
      } else {
        stopRecording();
      }
    };

    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('toggle-recording', toggleRecording);

      return (): void => {
        window.electron.ipcRenderer.removeAllListeners('toggle-recording');
      };
    }

    return undefined;
  }, [pauseVAD, listeningState, startVAD]);

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Voice Assistant
        </Typography>
        {/* Removed the start/stop buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {listeningState === 'recording' && (
            <>
              <Typography variant="body2" style={{ color: 'grey' }}>
                Listening...
              </Typography>
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
          {/* Removed "Transcript: " label */}
          {transcript}
        </Typography>
        {debugMode && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ ml: 2 }}>
              Listening State: {listeningState ?? 'null'}
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
              VAD Listening: {listening ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
              User Speaking: {userSpeaking ? 'Yes' : 'No'}
            </Typography>
            {loading && (
              <Typography variant="body2" sx={{ ml: 2 }}>
                VAD Loading...
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default VoiceAssistant;
