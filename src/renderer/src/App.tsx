import { Box, Container } from '@mui/material';
// import { VoiceAssistant } from './components/VoiceAssistantNEW'; // Updated import
import Versions from './components/Versions';
import { StudentsView } from './views/StudentsView';

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
      <StudentsView />
      <Versions />
    </Container>
  );
}

export default App;
