import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'

export default async function Home() {
  const session = await getSession()

  if (session) {
    redirect('/user')
  }

  redirect('/signup')
}
