import { Sidebar } from '@/components/sidebar'
import { SearchBar } from '@/components/search-bar'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <SearchBar />
        {children}
      </div>
    </div>
  )
}
