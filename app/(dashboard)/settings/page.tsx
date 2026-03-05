import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'

export const metadata = {
  title: 'Settings | Fulling',
  description: 'Manage your account settings and integrations.',
}

export default async function SettingsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  redirect('/settings/integrations')
}
