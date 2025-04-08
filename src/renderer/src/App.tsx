import { Box, Button, CircularProgress, Container, Typography } from '@mui/material';
import { VoiceAssistant } from './components/VoiceAssistantNEW'; // Updated import
import Versions from './components/Versions';
import { useEffect, useState } from 'react';
import { BrowserID, ProcessStatus } from '@shared/types'; // Adjust the import path as necessary
import { CheckCircleOutline as CheckCircleOutlineIcon } from '@mui/icons-material';

const ipcRenderer = window.electron.ipcRenderer;

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
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.INACTIVE);

  const handleLaunch = () => {
    setStatus(ProcessStatus.LOADING);
    ipcRenderer.send('create-login-browser', browserID, username, password, securityAnswer);
    console.log('sending:', { browserID, username, password, securityAnswer });
  };

  useEffect(() => {
    const browserWindowCreationListener = (
      _event,
      receivedBrowserID: BrowserID,
      processStatus: ProcessStatus,
    ) => {
      console.log({ receivedBrowserID, processStatus, browserID });
      if (receivedBrowserID === browserID) {
        console.log(`Received process status: ${processStatus}`);
        setStatus(processStatus);
        if (processStatus === ProcessStatus.COMPLETE) {
          ipcRenderer.removeAllListeners('browser-window-creation');
        }
      }
    };

    console.log({ ipcRenderer });
    ipcRenderer.on('browser-window-creation', browserWindowCreationListener);

    return () => {
      ipcRenderer.removeAllListeners('browser-window-creation');
    };
  });

  useEffect(() => {
    if (status === ProcessStatus.COMPLETE) {
      const timer = setTimeout(() => {
        setStatus(ProcessStatus.INACTIVE);
      }, 5000); // Reset status after 1 seconds
      return () => clearTimeout(timer);
    }
    return;
  }, [status]);
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleLaunch}
        disabled={[ProcessStatus.LOADING, ProcessStatus.COMPLETE].includes(status)}
      >
        {browserID}
      </Button>
      {status === ProcessStatus.LOADING && <CircularProgress />}

      {status === ProcessStatus.COMPLETE && <CheckCircleOutlineIcon color="success" />}
      <Typography variant="body1" textTransform={'capitalize'}>
        {status}
      </Typography>
      <br />
    </>
  );
};

function App(): JSX.Element {
  return (
    <Container maxWidth="md">
      {' '}
      {/* Use Container for responsive layout */}
      <Box sx={{ my: 4 }}>
        {' '}
        {/* Add vertical margin */}
        {/* <VoiceAssistant /> */}
      </Box>
      <LaunchBrowserButton
        browserID={BrowserID.PEARSON}
        username="paulina.araujo02@gmail.com"
        password="2Rubiesrubies"
      />
      <LaunchBrowserButton
        browserID={BrowserID.CANVAS_FIU}
        username="sinno009"
        password="Northmiamibaby305!"
      />
      <Versions />
    </Container>
  );
}

export default App;
