import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE, verifySession } from '@/lib/auth';
import Dashboard from './Dashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin - SneakerDrop', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const session = await verifySession(cookies().get(COOKIE)?.value);
  if (!session) redirect('/admin/login');
  return <Dashboard email={session.email} />;
}
