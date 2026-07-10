import * as React from "react";

/**
 * Shape of a router-aware link component (react-router's Link, Next's Link,
 * etc.) that layout components can accept so internal navigation goes
 * through client-side routing instead of a full page reload. Layouts that
 * accept this prop fall back to a plain <a> when it isn't provided.
 */
export type AppLinkComponent = React.ComponentType<{
  href: string;
  className?: string;
  children?: React.ReactNode;
}>;
