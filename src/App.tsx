import { useState } from 'react';
import { Box, Container, Paper, Typography, CircularProgress, Grid, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const PasteArea = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  minHeight: '200px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  border: `2px dashed ${theme.palette.primary.main}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ResultContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  overflow: 'auto',
}));

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setIsLoading(true);
          setError(null);
          setImageUrl(URL.createObjectURL(file));

          const formData = new FormData();
          formData.append('image_file', file);

          try {
            const response = await axios.post(
              'https://electron-voice-assistant-production.up.railway.app/generate-html-from-image/',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
            );
            setHtmlContent(response.data);
          } catch (err) {
            setError('Failed to process image. Please try again.');
            console.error(err);
          } finally {
            setIsLoading(false);
          }
        }
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Homework Solver
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!htmlContent && !isLoading && (
        <PasteArea onPaste={handlePaste} elevation={3}>
          <Typography variant="h6" gutterBottom>
            Paste your homework screenshot here
          </Typography>
          <Typography variant="body2" color="text.secondary">
            (Ctrl+V or Cmd+V)
          </Typography>
        </PasteArea>
      )}

      {isLoading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      )}

      {(htmlContent || imageUrl) && (
        <Grid container spacing={3} mt={2}>
          <Grid item xs={12} md={6}>
            <ResultContainer elevation={3}>
              <Typography variant="h6" gutterBottom>
                Solution
              </Typography>
              {htmlContent && <div dangerouslySetInnerHTML={{ __html: htmlContent }} />}
            </ResultContainer>
          </Grid>
          <Grid item xs={12} md={6}>
            <ResultContainer elevation={3}>
              <Typography variant="h6" gutterBottom>
                Original Image
              </Typography>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Pasted homework"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              )}
            </ResultContainer>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

export default App;
