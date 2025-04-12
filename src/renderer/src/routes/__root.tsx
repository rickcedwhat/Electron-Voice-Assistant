import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { CustomButtonLink as ButtonLink } from '@renderer/components/CustomButtonLink';
import { Divider } from '@mui/material';
import { QueryClient } from '@tanstack/react-query';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: () => (
    <>
      <div className="p-2 flex gap-2">
        <ButtonLink to="/">Home</ButtonLink>
        <ButtonLink to="/students">Students</ButtonLink>
        <ButtonLink to="/about">About</ButtonLink>
      </div>
      <Divider />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
  notFoundComponent: () => {
    return (
      <div>
        <p>This is the notFoundComponent configured on root route</p>
        <Link to="/">Start Over</Link>
      </div>
    );
  },
});

// export const Route = createRootRoute({
//   queryClient: QueryClient,
//   component: () => (
//     <>
//       <div className="p-2 flex gap-2">
//         <ButtonLink to="/">Home</ButtonLink>
//         <ButtonLink to="/students">Students</ButtonLink>
//         <ButtonLink to="/about">About</ButtonLink>
//       </div>
//       <Divider />
//       <Outlet />
//       <TanStackRouterDevtools />
//     </>
//   ),
// });
