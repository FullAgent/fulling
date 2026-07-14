import { requireSession } from '@/lib/auth/session'

import { DashboardHeader } from './_components/dashboard-header'

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireSession()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader userName={user.name} userEmail={user.email} userImage={user.image ?? null} />
      {children}
    </div>
  )
}
