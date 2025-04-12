import { Stack, Typography, List, ListItem, ListItemText } from '@mui/material';
import { CustomButtonLink as ButtonLink } from '@renderer/components/CustomButtonLink';
import { Route as studentRoute } from '../routes/students_.$studentID';
import { Route as studentsRoute } from '../routes/students';

export const StudentsPage = () => {
  const students = studentsRoute.useLoaderData();

  return (
    <Stack direction="column" spacing={2} padding={2}>
      <Typography variant="h4">All Students with User Info</Typography>
      {students && students.length > 0 ? (
        <List>
          {students.map((student) => (
            <ListItem key={student.id}>
              <ButtonLink to={studentRoute.to} params={{ studentID: student.id }}>
                <ListItemText primary={student.user.name} />
              </ButtonLink>
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
