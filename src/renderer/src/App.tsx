import { Box, Container } from '@mui/material';
// import { VoiceAssistant } from './components/VoiceAssistantNEW'; // Updated import
import Versions from './components/Versions';

function App(): JSX.Element {
  return (
    <Container maxWidth="md">
      {' '}
      {/* Use Container for responsive layout */}
      <Box sx={{ my: 4 }}>
        {' '}
        {/* Add vertical margin */}
        {/* <VoiceAssistant /> */}
        Welcome to the App!
      </Box>
      <Versions />
    </Container>
  );
}

export default App;
