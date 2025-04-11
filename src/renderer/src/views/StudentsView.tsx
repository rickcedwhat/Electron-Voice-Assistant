import { useSuspenseQuery } from '@tanstack/react-query';
import { supaClient } from '../services/supabase/supaClient';
import { Stack, Typography, List, ListItem, ListItemText } from '@mui/material';
import { StudentWithUser } from '../services/supabase/types'; // Assuming you have a Student type defined
import { StudentView } from './StudentView';

export const StudentsView = () => {
  const { data: students } = useSuspenseQuery<StudentWithUser[], Error>({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supaClient.from('student') // Replace 'student' with your actual table name
        .select(`
          id,
          invoice_ninja_client_id,
          user_id,
          user (
            id,
            email,
            name,
            phone_number
          )
        `); // Selecting all student fields and related user data

      if (error) {
        throw new Error(error.message);
      }

      return data as unknown as StudentWithUser[];
    },
  });

  return (
    <Stack direction="column" spacing={2} padding={2}>
      <Typography variant="h4">All Students with User Info</Typography>
      {students && students.length > 0 ? (
        <List>
          {students.map((student) => (
            <ListItem key={student.id}>
              <ListItemText
                primary={`Student ID: ${student.id}`}
                secondary={`
                  Invoice Ninja: ${student.invoice_ninja_client_id || 'N/A'},
                  User: ${student.user?.name || 'N/A'} (${student.user?.email || 'N/A'})
                `}
              />
              <StudentView studentID={student.id} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography>No students found.</Typography>
      )}
    </Stack>
  );
};

// Remember to wrap StudentsView with <Suspense> and optionally <ErrorBoundary>
// in its parent component.
