import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rutas públicas: landing, auth y el webhook de Clerk (verifica su propia firma).
const esRutaPublica = createRouteMatcher([
  "/",
  "/login(.*)",
  "/registro(.*)",
  "/api/webhooks/clerk",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!esRutaPublica(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Todo excepto internals de Next y ficheros estáticos
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
