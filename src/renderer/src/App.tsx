import { Box, Button, Container } from '@mui/material';
// import { VoiceAssistant } from './components/VoiceAssistant';
import { VoiceAssistant } from './components/VoiceAssistantNEW'; // Updated import
import Versions from './components/Versions';
import { useState } from 'react';
import { BrowserID } from '@shared/types'; // Adjust the import path as necessary
import styles from './App.module.css'; // Import your CSS module

interface LaunchBrowserButtonProps {
  browserID: BrowserID;
  username: string;
  password: string;
  securityAnswer?: string;
}

const LaunchBrowserButton: React.FC<LaunchBrowserButtonProps> = ({
  browserID,
  username,
  password,
  securityAnswer,
}: LaunchBrowserButtonProps) => {
  const [loading, setLoading] = useState(false);
  const handleLaunch = (): void => {
    setLoading(true);
    window.electron.ipcRenderer.send(
      'launch-secondary-browser',
      browserID,
      username,
      password,
      securityAnswer,
    );
    window.electron.ipcRenderer.on('browser-window-created', (_event, browserID) => {
      if (browserID === BrowserID.PEARSON) {
        setLoading(false);
      }
    });
  };
  return (
    <Button variant="contained" onClick={handleLaunch} disabled={loading} color="primary">
      Log in to {browserID}
    </Button>
  );
};

function App(): JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping');

  return (
    <Container maxWidth="md">
      {' '}
      {/* Use Container for responsive layout */}
      <Box sx={{ my: 4 }}>
        {' '}
        {/* Add vertical margin */}
        <VoiceAssistant />
      </Box>
      <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
        Send IPC
      </a>
      <LaunchBrowserButton
        browserID={BrowserID.PEARSON}
        username="andresbruck"
        password="Bruckstein2006"
      />
      <Versions />
    </Container>
  );
}

export default App;
