import { createFileRoute } from '@tanstack/react-router';
import { StudentsPage } from '../pages/StudentsPage';
import { supaClient } from '@renderer/services/supabase/supaClient';
import { StudentWithUser } from '@renderer/services/supabase/types';

// export const Route = createFileRoute('/students')({
//   loader: async () => {
//     const { data, error } = await supaClient
//       .from('student') // Replace 'student' with your actual table name
//       .select(
//         `
//           *,
//           user (
//             *
//           )
//         `,
//       ); // Selecting all student fields and related user data

//     if (error) {
//       throw new Error(error.message);
//     }

//     return data as unknown as StudentWithUser[];
//   },
//   component: StudentsPage,
// });

const studentsQueryOptions = {
  queryKey: ['students'],
  queryFn: async () => {
    console.log('loading students data');
    const { data, error } = await supaClient.from('student').select(
      `
          *,
          user (
            *
          )
        `,
    );

    if (error) {
      throw new Error(error.message);
    }

    return data as unknown as StudentWithUser[];
  },
};

export const Route = createFileRoute('/students')({
  loader: async ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData(studentsQueryOptions);
  },
  component: StudentsPage,
});
