import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getProjects } from '@/lib/data/project'
import { HomePageContent } from './_components/home-page-content'

export const metadata = {
  title: 'My Projects | Fulling',
  description: 'Manage and monitor your full stack apps and deployments.',
}

export default async function HomePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const projects = await getProjects(session.user.id)

  return (
    <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
      <div className="max-w-7xl mx-auto">
        <HomePageContent projects={projects} />
      </div>
    </main>
  )
}