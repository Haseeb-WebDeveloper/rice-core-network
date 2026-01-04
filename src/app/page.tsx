import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-user'

export default async function Home() {
  const user = await getCurrentUser()

  if (user) {
    // Redirect based on role
    redirect(user.role === 'ADMIN' ? '/admin' : '/user')
  }

  redirect('/signup')
}
