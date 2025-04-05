import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark', // Set the overall mode to dark
    primary: {
      light: '#4FC3F7', // Light blue
      main: '#29B6F6', // Medium blue
      dark: '#0288D1', // Dark blue
      contrastText: '#fff',
    },
    secondary: {
      light: '#80CBC4', // Light teal
      main: '#4DB6AC', // Medium teal
      dark: '#00897B', // Dark teal
      contrastText: '#fff',
    },
    warning: {
      light: '#FFD54F', // Light amber
      main: '#FFC107', // Medium amber
      dark: '#FFA000', // Dark amber
      contrastText: '#333', // Dark text for better contrast on yellow
    },
    error: {
      light: '#F48FB1', // Light pink/red
      main: '#E57373', // Medium pink/red
      dark: '#D32F2F', // Dark red
      contrastText: '#fff',
    },
    text: {
      primary: '#fff', // Default white text on dark background
      secondary: 'rgba(255, 255, 255, 0.7)', // Slightly less prominent text
      disabled: '#c0c0c0', // Improved disabled text color (light grey)
    },
    background: {
      default: '#121212', // Dark background color
      paper: '#1e1e1e', // Slightly lighter for paper-like surfaces
    },
    action: {
      disabled: 'rgba(192, 192, 192, 0.26)', // Disabled opacity
      disabledBackground: '#404040', // Improved disabled background color
    },
  },
  shape: {
    borderRadius: 4, // Adjust for desired roundedness
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          // textTransform: 'none', // Prevent default uppercase
        },
        outlined: ({ theme, ownerState }) => {
          const color = ownerState.color || 'primary';
          return {
            color: theme.palette[color]?.light || theme.palette.grey[300],
            borderColor: theme.palette[color]?.light || theme.palette.grey[500],
            '&:hover': {
              borderColor: theme.palette[color]?.main || theme.palette.grey[400],
              backgroundColor: theme.palette[color]?.dark || theme.palette.grey[800],
              // Match text color on hover for better consistency
              color: theme.palette[color]?.contrastText || theme.palette.common.white,
            },
            '&.Mui-disabled': {
              color: theme.palette.text.disabled,
              borderColor: theme.palette.action.disabledBackground,
            },
          };
        },
        contained: ({ theme, ownerState }) => {
          const color = ownerState.color || 'primary';
          return {
            backgroundColor: theme.palette[color]?.light || theme.palette.primary.light,
            color: theme.palette[color]?.contrastText || theme.palette.common.white,
            '&:hover': {
              backgroundColor: theme.palette[color]?.main || theme.palette.primary.main,
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.text.disabled,
            },
          };
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.8125rem',
        },
      },
    },
  },
});
