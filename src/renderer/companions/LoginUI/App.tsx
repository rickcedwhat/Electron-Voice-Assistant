import { useEffect, useState } from 'react';
import { Stack, Typography } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const ipcRenderer = window.electron.ipcRenderer;

export const App = () => {
  const [error, setError] = useState<string | null>();

  useEffect(() => {
    console.log('setting up ipc handlers');
    const handleUpdate = (_event, message: string) => {
      toast.info(message); // Use toast.info for informational messages
      console.log(`sending message login-update ${message}\n`);
    };
    const handleError = (_event, erroMessage: string) => {
      toast.error(`Error: ${erroMessage}`); // Use toast.error for error messages
      setError(erroMessage); // You might still want to store the last error in state for other purposes
    };

    ipcRenderer.on('login-update', handleUpdate);
    ipcRenderer.on('login-error', handleError);

    return () => {
      console.log('cleaning up ipc handlers');
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
