import { Sidebar } from '@/components/sidebar'
import { Hero } from './_components/hero'

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <Hero />
      </main>
    </div>
  )
}
