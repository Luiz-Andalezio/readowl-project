"use client";
import { SessionProvider } from "next-auth/react";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
	return <SessionProvider>{children}</SessionProvider>;
}
/**
 * Global application providers wrapper.
 * --------------------------------------------------------------
 * Why this file exists:
 *  - Centralize all React context providers that must run on the client.
 *  - Avoid sprinkling <SessionProvider> (and future providers) across many layouts.
 *  - Provide a single import surface so future additions (e.g. ThemeProvider, QueryClientProvider)
 *    require only a change here and not refactors in every layout/page.
 *
 * Current responsibilities:
 *  - Wrap the application tree with NextAuth's <SessionProvider> so hooks like `useSession`,
 *    `signIn`, and `signOut` function anywhere below this component.
 *
 * SSR & Hydration Notes:
 *  - <SessionProvider> runs only on the client; this file is marked with "use client".
 *  - If you require the session during server rendering, fetch it in a Server Component (e.g. layout)
 *    with getServerSession and pass *initialSession* to <SessionProvider> (optional optimization).
 *
 * Extending:
 *  - Add additional providers inside the return tree (e.g. React Query, Theme / UI library, i18n).
 *  - Keep the order: outermost providers should be the ones that other providers might depend on.
 *
 * Example (future) structure:
 *  <SessionProvider>
 *    <ThemeProvider>
 *      <QueryClientProvider client={queryClient}>
 *        {children}
 *      </QueryClientProvider>
 *    </ThemeProvider>
 *  </SessionProvider>
 *
 * Usage:
 *  import Providers from "@/components/ui/Providers";
 *  export default function RootLayout({ children }) {
 *    return <html><body><Providers>{children}</Providers></body></html>;
 *  }
 */