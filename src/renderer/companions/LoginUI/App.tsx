import { useEffect, useState } from 'react';
import { Stack, Typography } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const ipcRenderer = window.electron.ipcRenderer;

export const App = () => {
  const [error, setError] = useState<string | null>();

  useEffect(() => {
    const loginUpdateListener = (_event, message: string) => {
      toast.info(message);
    };

    const loginErrorHandler = (_event, errorMessage: string) => {
      toast.error(`Error: ${errorMessage}`);
      setError(errorMessage);
    };

    ipcRenderer.on('login-update', loginUpdateListener);
    ipcRenderer.on('login-error', loginErrorHandler);

    return () => {
      console.log('cleaning up ipc handlers in LoginUI');
      ipcRenderer.removeAllListeners('login-update');
      ipcRenderer.removeAllListeners('login-error');
    };
  }, []);

  return (
    <div>
      {/* Render the ToastContainer to display toasts */}
      <ToastContainer />
      {/* You might still want to keep the error display in the component */}
      {error && (
        <Stack sx={{ padding: 2 }}>
          <Typography variant="body1" color="error">
            Last Error: {error}
          </Typography>
        </Stack>
      )}
      {/* You can remove the previous messages display */}
    </div>
  );
};
