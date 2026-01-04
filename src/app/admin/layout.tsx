import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { getCurrentUser } from '@/lib/auth/get-user'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'ADMIN') {
    redirect('/user')
  }

  const userData = {
    avatar: user.avatar,
    fullName: user.fullName,
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={userData} />
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto p-4 lg:p-8 pt-26 lg:pt-4">
          {children}
        </div>
      </main>
    </div>
  )
}

