import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Sign in — trace' };
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
