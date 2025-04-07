import { useEffect, useState } from 'react';
import { Stack, Typography } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const ipcRenderer = window.electron.ipcRenderer;

export const App = () => {
  const [error, setError] = useState<string | null>();
  const [browserInstance, setBrowserInstance] = useState<string | null>();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setBrowserInstance(searchParams.get('instance'));
  }, []);

  useEffect(() => {
    console.log('setting up ipc handlers');
    const handleUpdate = (_event, instance: string, message: string) => {
      if (browserInstance !== instance) return;
      toast.info(message); // Use toast.info for informational messages
      console.log(`received message login-update ${message}\n`);
    };
    // [ ] somehow not listening
    const handleError = (_event, instance: string, errorMessage: string) => {
      console.log('handling error', { browserInstance, instance, errorMessage });
      if (browserInstance !== instance) return;
      toast.error(`Error: ${errorMessage}`); // Use toast.error for error messages
      setError(errorMessage); // You might still want to store the last error in state for other purposes
      console.log(`received message login-error ${errorMessage}\n`);
    };

    ipcRenderer.on('login-update', handleUpdate);
    ipcRenderer.on('login-error', handleError);

    return () => {
      console.log('cleaning up ipc handlers');
      ipcRenderer.removeAllListeners('login-update');
      ipcRenderer.removeAllListeners('login-error');
    };
  }, [browserInstance]);

  return (
    <div>
      Browser Instance: {browserInstance}
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
