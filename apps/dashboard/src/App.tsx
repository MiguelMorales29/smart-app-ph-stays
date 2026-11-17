import { RouterProvider } from '@tanstack/react-router';
import { DashboardProvider } from '@/app/dashboard-context';
import { router } from '@/app/router';

export function App() {
  return (
    <DashboardProvider>
      <RouterProvider router={router} />
    </DashboardProvider>
  );
}
