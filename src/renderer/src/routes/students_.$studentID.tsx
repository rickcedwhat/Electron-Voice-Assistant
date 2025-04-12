import { StudentPage } from '@renderer/pages/StudentPage';
import { supaClient } from '@shared/services/supabase/supaClient';
import {
  Student,
  StudentWithUser,
  ThirdPartyCredentialWithBrowser,
} from '@shared/services/supabase/types';
import { createFileRoute } from '@tanstack/react-router';

const getStudentWithUser = (studentID: Student['id']) => {
  return {
    queryKey: ['student', { studentID }],
    queryFn: async () => {
      console.log('loading student information');
      const { data, error } = await supaClient
        .from('student')
        .select(
          `
            *,
            user (
              *
            )
          `,
        )
        .eq('id', studentID)
        .single(); // Assuming you only want one student

      if (error) {
        throw new Error(error.message);
      }

      return data as StudentWithUser;
    },
  };
};

const getThirdPartyCredentialWithBrowser = (studentID: Student['id']) => {
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
    // return queryClient.ensureQueryData(getQueryOptions(studentID));
    // Use queryClient.ensureQueryData to fetch or get cached student information
    const studentWithUserPromise = queryClient.ensureQueryData(getStudentWithUser(studentID));

    // Use queryClient.ensureQueryData to fetch or get cached third-party credentials
    const thirdPartyCredentialWithBrowserPromise = queryClient.ensureQueryData(
      getThirdPartyCredentialWithBrowser(studentID),
    );

    // Wait for both queries to resolve
    const [studentWithUser, thirdPartyCredentialWithBrowser] = await Promise.all([
      studentWithUserPromise,
      thirdPartyCredentialWithBrowserPromise,
    ]);

    return {
      studentWithUser,
      thirdPartyCredentialWithBrowser,
    };
  },
  component: StudentPage,
});
