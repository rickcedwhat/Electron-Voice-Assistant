import { Box, Button, Container } from '@mui/material';
// import { VoiceAssistant } from './components/VoiceAssistant';
import { VoiceAssistant } from './components/VoiceAssistantNEW'; // Updated import
import Versions from './components/Versions';

function App(): JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping');

  const handleOpenNewWindow = (): void => {
    if (window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('launch-secondary-browser');
    } else {
      console.error('electronAPI not available');
    }
  };

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
      <Button variant="contained" onClick={handleOpenNewWindow}>
        Open New Window
      </Button>
      <Versions />
    </Container>
  );
}

export default App;
