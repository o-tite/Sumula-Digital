import { auth } from "@/infrastructure/auth";

export default auth;

export const config = {
  matcher: [
    // Roteia tudo exceto _next, arquivos públicos e api/auth
    "/((?!_next|favicon.ico|api/auth|api/sse).*)"
  ]
};
