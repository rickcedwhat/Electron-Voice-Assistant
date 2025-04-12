import { createFileRoute } from '@tanstack/react-router';
import { StudentsPage } from '../pages/StudentsPage';
import { supaClient } from '@shared/services/supabase/supaClient';
import { StudentWithUser } from '@shared/services/supabase/types';

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
