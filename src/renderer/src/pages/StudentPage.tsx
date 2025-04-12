// should be independent eventually

import { Stack } from '@mui/material';
import { LaunchBrowserButton } from '@renderer/components/LaunchBrowserButton';
import { Route as studentRoute } from '../routes/students_.$studentID';

export const StudentPage = () => {
  const thirdPartyCredentialWithBrowser = studentRoute.useLoaderData();
  console.log({ thirdPartyCredentialWithBrowser });

  return (
    <Stack direction="row">
      hi
      {thirdPartyCredentialWithBrowser.map(({ browser, ...credential }) => {
        const { enc_password, enc_username, id } = credential;
        if (!enc_password || !enc_username) return null;
        return (
          <LaunchBrowserButton
            key={id}
            browser={browser}
            username={enc_username}
            password={enc_password}
          />
        );
      })}
    </Stack>
  );
};
