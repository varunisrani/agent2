'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export default function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemeProvider>
  );
}
