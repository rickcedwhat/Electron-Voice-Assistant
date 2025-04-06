import { useEffect, useState } from 'react';
import { Paper, Stack, Typography } from '@mui/material';
const ipcRenderer = window.electron.ipcRenderer;

export const App = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>();

  useEffect(() => {
    console.log('setting up ipc handlers');
    const handleUpdate = (_event, message: string) => {
      setMessages((prev) => [...prev, message]);
      console.log(`sending message login-update ${message}\n`);
    };
    const handleError = (_event, erroMessage: string) => setError(erroMessage);

    ipcRenderer.on('login-update', handleUpdate);
    ipcRenderer.on('login-error', handleError);

    return () => {
      console.log('cleaning up ipc handlers');
      ipcRenderer.removeAllListeners('login-update');
      ipcRenderer.removeAllListeners('login-error');
    };
  }, []);

  // ipcRenderer.on('request-otp', () => {
  //   if (otpInputContainer) {
  //     otpInputContainer.style.display = 'block';
  //   }
  // });
  return (
    <Stack direction="column" spacing={2} sx={{ padding: 2 }}>
      {messages.map((message, index) => (
        <Paper key={index} elevation={3} sx={{ padding: 2 }}>
          <Typography variant="body1">{message}</Typography>
        </Paper>
      ))}
      {error && (
        <Paper elevation={3} sx={{ padding: 2, backgroundColor: '#ffe0b2' }}>
          <Typography variant="body1" color="error">
            Error: {error}
          </Typography>
        </Paper>
      )}
    </Stack>
  );
};
