'use client';

import React from 'react';
import { RoleProvider } from '@/components/auth/RoleProvider';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <RoleProvider>{children}</RoleProvider>;
}
