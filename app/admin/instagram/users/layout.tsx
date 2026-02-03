import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from 'auth.config';

export default async function AdminInstagramUsersLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    return redirect('/login');
  }
  return <>{children}</>;
}
