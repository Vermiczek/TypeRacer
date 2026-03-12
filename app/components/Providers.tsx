"use client";

import { ThemeProvider } from "next-themes";

const Providers = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    {children}
  </ThemeProvider>
);

export default Providers;
