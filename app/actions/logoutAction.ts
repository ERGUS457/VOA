'use server';

import { deleteSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  deleteSession();
  redirect('/login');
}
