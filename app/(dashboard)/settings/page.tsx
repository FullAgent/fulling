import { redirect } from 'next/navigation'

import { Sidebar } from '@/components/sidebar'
import { auth } from '@/lib/auth'

import { GitHubStatusCard } from './_components/github-status-card'

export const metadata = {
  title: 'Settings | Fulling',
  description: 'Manage your account settings and integrations.',
}

export default async function SettingsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-10">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage your account settings and integrations.
            </p>
          </header>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">GitHub Integration</h2>
              <GitHubStatusCard />
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
