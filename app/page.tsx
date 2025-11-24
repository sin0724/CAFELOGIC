import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      if (payload.role === 'admin') {
        redirect('/admin/dashboard');
      } else {
        redirect('/reviewer/dashboard');
      }
    }
  }

  redirect('/auth/login');
}

