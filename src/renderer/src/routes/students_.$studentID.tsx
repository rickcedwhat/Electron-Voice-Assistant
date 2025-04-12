import { StudentPage } from '@renderer/pages/StudentPage';
import { supaClient } from '@renderer/services/supabase/supaClient';
import { Student, ThirdPartyCredentialWithBrowser } from '@renderer/services/supabase/types';
import { createFileRoute } from '@tanstack/react-router';

const getQueryOptions = (studentID: Student['id']) => {
  return {
    queryKey: ['thirdPartyCredential', { studentID }],
    queryFn: async () => {
      console.log('loading student third party credential');
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
  };
};

export const Route = createFileRoute('/students_/$studentID')({
  loader: async ({ context: { queryClient }, params: { studentID } }) => {
    return queryClient.ensureQueryData(getQueryOptions(studentID));
  },
  component: StudentPage,
});
