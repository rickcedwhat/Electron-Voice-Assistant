import { Button, CircularProgress, Typography } from '@mui/material';
import { ProcessStatus } from '@shared/types';
import { useState, useEffect } from 'react';
import { CheckCircleOutline as CheckCircleOutlineIcon } from '@mui/icons-material';
import { Browser, BrowserID } from '@shared/services/supabase/types';
import { toast } from 'react-toastify';

const ipcRenderer = window.electron.ipcRenderer;

interface LaunchBrowserButtonProps {
  browser: Browser;
  username: string;
  password: string;
  securityAnswer?: string;
}

export const LaunchBrowserButton: React.FC<LaunchBrowserButtonProps> = ({
  browser,
  username,
  password,
  securityAnswer,
}: LaunchBrowserButtonProps) => {
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.INACTIVE);

  const handleLaunch = () => {
    setStatus(ProcessStatus.LOADING);
    ipcRenderer.send('create-login-browser', browser.id, username, password, securityAnswer);
  };

  useEffect(() => {
    const browserWindowCreationListener = (
      _event,
      receivedBrowserID: BrowserID,
      processStatus: ProcessStatus,
    ) => {
      if (receivedBrowserID === browser.id) {
        console.log(`Received process status: ${processStatus}`);
        setStatus(processStatus);
        switch (processStatus) {
          case ProcessStatus.ERROR:
            ipcRenderer.removeAllListeners('browser-window-creation');
            toast.error("Couldn't launch browser");
            break;
          case ProcessStatus.COMPLETE:
            ipcRenderer.removeAllListeners('browser-window-creation');
            break;
        }
      }
    };

    ipcRenderer.on('browser-window-creation', browserWindowCreationListener);

    return () => {
      ipcRenderer.removeAllListeners('browser-window-creation');
    };
  });

  useEffect(() => {
    if ([ProcessStatus.COMPLETE, ProcessStatus.ERROR].includes(status)) {
      const timer = setTimeout(() => {
        setStatus(ProcessStatus.INACTIVE);
      }, 5000); // Reset status after 1 seconds
      return () => clearTimeout(timer);
    }
    return;
  }, [status]);
  return (
    <Button
      variant="contained"
      color={status === ProcessStatus.ERROR ? 'error' : 'primary'}
      size="small"
      onClick={handleLaunch}
      disabled={[ProcessStatus.LOADING, ProcessStatus.COMPLETE].includes(status)}
      endIcon={
        status === ProcessStatus.LOADING ? (
          <CircularProgress size={20} color="inherit" />
        ) : status === ProcessStatus.COMPLETE ? (
          <CheckCircleOutlineIcon color="success" />
        ) : null
      }
    >
      {browser.name}
    </Button>
  );
};
