import { lazy, Suspense } from "react";
import type { ComponentType, ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import RootLayout from "@/components/layouts/layout";
import AdminRootLayout from "@/components/layouts/admin-layout";
import MotRootLayout from "@/components/layouts/mot-layout";
import OperatorRootLayout from "@/components/layouts/operator-layout";
import TimekeeperRootLayout from "@/components/layouts/timekeeper-layout";
import "./globals.css";

type PageModule = {
  default: ComponentType;
};

const pageModules = import.meta.glob<PageModule>("./pages/**/page.tsx");

function routePathFromFile(filePath: string): string {
  const route = filePath
    .replace("./pages", "")
    .replace(/\/page\.tsx$/, "")
    .replace(/\[(.+?)\]/g, ":$1");

  return route === "" ? "/" : route;
}

function withRoleLayout(path: string, element: ReactNode): ReactNode {
  if (path === "/admin" || path.startsWith("/admin/")) {
    return <AdminRootLayout>{element}</AdminRootLayout>;
  }

  if (path === "/mot" || path.startsWith("/mot/")) {
    return <MotRootLayout>{element}</MotRootLayout>;
  }

  if (path === "/operator" || path.startsWith("/operator/")) {
    return <OperatorRootLayout>{element}</OperatorRootLayout>;
  }

  if (path === "/timekeeper" || path.startsWith("/timekeeper/")) {
    return <TimekeeperRootLayout>{element}</TimekeeperRootLayout>;
  }

  return element;
}

const routes = Object.entries(pageModules).map(([filePath, loadModule]) => {
  const Page = lazy(loadModule);
  const path = routePathFromFile(filePath);
  const element = withRoleLayout(path, <Page />);

  return { path, element };
});

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <a className="text-primary underline" href="/">
          Go to sign in
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RootLayout>
        <Suspense fallback={null}>
          <Routes>
            {routes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </RootLayout>
    </BrowserRouter>
  );
}
