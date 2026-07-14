'use client'

import { useState } from 'react'
import { LogOut, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { FullingBrand } from '@/components/fulling-brand'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth-client'

type DashboardHeaderProps = { userName: string; userEmail: string; userImage: string | null }

export function DashboardHeader({ userName, userEmail, userImage }: DashboardHeaderProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)
    const result = await signOut()

    if (result.error) {
      setIsSigningOut(false)
      return
    }

    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-[var(--page-max-width)] items-center gap-4 px-4 sm:px-6">
        <FullingBrand href="/workspace" />
        <nav className="ml-3 hidden items-center gap-1 sm:flex" aria-label="Dashboard">
          <Button asChild variant="ghost" size="sm"><Link href="/workspace">Workspace</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/settings/kubeconfig"><Settings2 />Kubeconfig</Link></Button>
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-3">
          <Avatar className="size-8"><AvatarImage src={userImage ?? undefined} alt="" /><AvatarFallback>{userName.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
          <div className="hidden min-w-0 md:block"><p className="truncate text-sm font-medium text-foreground">{userName}</p><p className="truncate text-xs leading-4 text-muted-foreground">{userEmail}</p></div>
          <Button type="button" variant="ghost" size="icon" disabled={isSigningOut} onClick={handleSignOut} aria-label="Sign out" title="Sign out"><LogOut /></Button>
        </div>
      </div>
      <nav className="flex h-11 items-center gap-1 border-t border-border px-4 sm:hidden" aria-label="Dashboard mobile">
        <Button asChild variant="ghost" size="sm"><Link href="/workspace">Workspace</Link></Button>
        <Button asChild variant="ghost" size="sm"><Link href="/settings/kubeconfig"><Settings2 />Kubeconfig</Link></Button>
      </nav>
    </header>
  )
}
