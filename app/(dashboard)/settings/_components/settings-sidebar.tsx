'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const menuItems = [
  { label: 'Integrations', href: '/settings/integrations' },
  { label: 'Account', href: '/settings/account' },
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar/50">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-foreground">Settings</h2>
      </div>
      <Separator />
      <nav className="flex flex-col gap-1 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-lg',
                isActive ? 'text-white' : 'text-muted-foreground'
              )}
            >
              <span className="text-sm font-medium font-display">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
