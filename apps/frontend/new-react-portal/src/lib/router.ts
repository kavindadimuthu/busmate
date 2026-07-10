import { createElement, forwardRef, useMemo } from "react";
import {
  Link as RouterLink,
  Navigate,
  type LinkProps as RouterLinkProps,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams as useReactSearchParams,
} from "react-router";

type LinkProps = Omit<RouterLinkProps, "to"> & {
  href?: RouterLinkProps["to"];
  to?: RouterLinkProps["to"];
};

// forwardRef so this shim is safe to pass to Radix's asChild (Tooltip,
// Button, ...), which clones its child and attaches a ref.
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, to, ...props },
  ref,
) {
  return createElement(RouterLink, {
    ...props,
    to: to ?? href ?? "#",
    ref,
  });
});

export { Navigate, useParams };
export default Link;

export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParams(): URLSearchParams {
  const [searchParams] = useReactSearchParams();
  return searchParams;
}

export function useRouter() {
  const navigate = useNavigate();

  return useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, { replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => window.location.reload(),
    }),
    [navigate],
  );
}
