import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - HomeMade',
  description: 'Admin login page for HomeMade food delivery platform',
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 