// should be independent eventually

import { Stack } from '@mui/material';
import { LaunchBrowserButton } from '@renderer/components/LaunchBrowserButton';
import { supaClient } from '@renderer/services/supabase/supaClient';
import { ThirdPartyCredentialWithBrowser } from '@renderer/services/supabase/types';
import { BrowserID } from '@shared/types';
import { useSuspenseQuery } from '@tanstack/react-query';

export const StudentView = ({ studentID }: { studentID: string }) => {
  const { data: thirdPartyCredentialsWithBrowser } = useSuspenseQuery<
    ThirdPartyCredentialWithBrowser[],
    Error
  >({
    queryKey: ['thirdPartyCredentialsWithBrowser'],
    queryFn: async () => {
      const { data, error } = await supaClient
        .from('third_party_credential') // Replace 'student' with your actual table name
        .select(
          `
              *,
              browser(
                *
              )
            `,
        )
        .eq('student_id', studentID); // Selecting all student fields and related user data

      if (error) {
        throw new Error(error.message);
      }

      return data as unknown as ThirdPartyCredentialWithBrowser[];
    },
  });

  return (
    <Stack direction="row">
      {thirdPartyCredentialsWithBrowser.map(({ browser, ...credential }) => {
        const { enc_password, enc_username, id } = credential;
        if (!enc_password || !enc_username) return null;
        return (
          <LaunchBrowserButton
            key={id}
            browserID={browser.id as BrowserID}
            username={enc_username}
            password={enc_password}
          />
        );
      })}
    </Stack>
  );
};
