import { requireSession } from '@/lib/auth/session'

import { DashboardHeader } from './_components/dashboard-header'

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireSession()

  return (
    <div className="min-h-screen bg-[#f7f8f6] text-[#171a1f]">
      <DashboardHeader userName={user.name} userEmail={user.email} userImage={user.image ?? null} />
      {children}
    </div>
  )
}
