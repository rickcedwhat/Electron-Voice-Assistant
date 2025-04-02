import { Box, Container } from '@mui/material';
import { VoiceAssistant } from './components/VoiceAssistant';
import Versions from './components/Versions';

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
      <Versions />
    </Container>
  );
}

export default App;
