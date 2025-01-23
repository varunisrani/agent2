import { Metadata } from 'next';
import React, { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Library - Perplexica',
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <div>{children}</div>;
}
