import { GitHubStatusCard } from '../_components/github-status-card'

export const metadata = {
  title: 'Integrations | Settings | Fulling',
  description: 'Manage your integrations and connected services.',
}

export default function IntegrationsPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Integrations</h1>
        <p className="text-muted-foreground text-sm">
          Manage your integrations and connected services.
        </p>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">GitHub Integration</h2>
          <GitHubStatusCard />
        </section>
      </div>
    </>
  )
}
