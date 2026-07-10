import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import RootLayout from "@/components/layouts/layout";
import AdminRootLayout from "@/components/layouts/admin-layout";
import MotRootLayout from "@/components/layouts/mot-layout";
import OperatorRootLayout from "@/components/layouts/operator-layout";
import TimekeeperRootLayout from "@/components/layouts/timekeeper-layout";
import { PageLoadingFallback } from "@/components/layouts/page-loading-fallback";
import { Link } from "@/lib/router";
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

// Role sections get their own persistent layout route (sidebar/header/role
// check mount once via <Outlet/>, see admin-layout.tsx etc.) instead of being
// remounted on every page navigation — only the matched page's own Suspense
// boundary re-suspends, so the chrome never flashes blank between pages.
const ROLE_LAYOUTS = {
  admin: AdminRootLayout,
  mot: MotRootLayout,
  operator: OperatorRootLayout,
  timekeeper: TimekeeperRootLayout,
} as const;

type Role = keyof typeof ROLE_LAYOUTS;

interface RouteEntry {
  path: string;
  Page: ComponentType;
}

const allRoutes: RouteEntry[] = Object.entries(pageModules).map(([filePath, loadModule]) => ({
  path: routePathFromFile(filePath),
  Page: lazy(loadModule),
}));

const roleSections: Record<Role, RouteEntry[]> = {
  admin: [],
  mot: [],
  operator: [],
  timekeeper: [],
};
const standaloneRoutes: RouteEntry[] = [];

for (const route of allRoutes) {
  const role = route.path.split("/")[1] as Role | undefined;
  if (role && role in roleSections) {
    roleSections[role].push(route);
  } else {
    standaloneRoutes.push(route);
  }
}

function PageRoute({ Page }: { Page: ComponentType }) {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Page />
    </Suspense>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <Link className="text-primary underline" href="/">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RootLayout>
        <Routes>
          {standaloneRoutes.map(({ path, Page }) => (
            <Route key={path} path={path} element={<PageRoute Page={Page} />} />
          ))}

          {(Object.keys(roleSections) as Role[]).map((role) => {
            const routes = roleSections[role];
            if (routes.length === 0) return null;
            const RoleLayout = ROLE_LAYOUTS[role];

            return (
              <Route key={role} path={`/${role}`} element={<RoleLayout />}>
                {routes.map(({ path, Page }) => {
                  const relativePath = path.slice(`/${role}`.length).replace(/^\//, "");
                  return relativePath === "" ? (
                    <Route key={path} index element={<PageRoute Page={Page} />} />
                  ) : (
                    <Route key={path} path={relativePath} element={<PageRoute Page={Page} />} />
                  );
                })}
              </Route>
            );
          })}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </RootLayout>
    </BrowserRouter>
  );
}
