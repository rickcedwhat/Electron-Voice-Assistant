import React from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { Box, Button, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { Mic as MicIcon, Stop as StopIcon } from '@mui/icons-material';

export const VoiceAssistant: React.FC = () => {
  const {
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    permissionGranted,
    isActive,
  } = useVoiceRecognition();

  return (
    <Paper elevation={2} sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Voice Assistant
      </Typography>

      {!permissionGranted && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Microphone permission is required. Please grant permission to use voice recognition.
        </Alert>
      )}

      {permissionGranted && (
        <Button
          variant="contained"
          startIcon={isActive ? <StopIcon /> : <MicIcon />}
          onClick={isActive ? stopListening : startListening}
          color={isActive ? 'secondary' : 'primary'}
          sx={{ mb: 2 }}
        >
          {isActive ? 'Stop Listening' : 'Start Listening'}
        </Button>
      )}

      {isActive && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Listening...</Typography>
        </Box>
      )}

      <Box>
        <Typography variant="h6" component="h3" gutterBottom>
          Transcript:
        </Typography>
        <Typography variant="body1" paragraph sx={{ minHeight: '2.5em', whiteSpace: 'pre-wrap' }}>
          {transcript || '...'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', minHeight: '1.5em' }}>
          <i>{interimTranscript}</i>
        </Typography>
      </Box>
    </Paper>
  );
};
