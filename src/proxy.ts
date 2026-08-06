import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Storefront-only proxy: apply next-intl locale handling to everything.
// There is no /admin or /api on this app anymore.
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
