import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Locale-aware navigation helpers. Use these `Link`/`redirect`/`usePathname`/
// `useRouter` in marketing code instead of the next/navigation equivalents so
// the active locale prefix is preserved automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
