// components/ClientLayout.tsx
// This file is used to handle the client layout
// It is used to display the client layout which is used to wrap the children components into a client component like the dashboard page

'use client';

import { useEffect, useState } from 'react';
import ClientOnly from './ClientOnly';

export default function ClientLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <body className={className}>
      <ClientOnly>{children}</ClientOnly>
    </body>
  );
} 