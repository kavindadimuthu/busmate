import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { ApiExplorerPage } from "@/pages/ApiExplorerPage";
import { ApiTesterPage } from "@/pages/ApiTesterPage";
import { HealthMonitorPage } from "@/pages/HealthMonitorPage";

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "explorer", element: <ApiExplorerPage /> },
      { path: "tester", element: <ApiTesterPage /> },
      { path: "health", element: <HealthMonitorPage /> },
    ],
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
