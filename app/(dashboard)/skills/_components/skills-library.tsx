'use client'

import { useState, useTransition } from 'react'
import { MdBolt, MdCheckCircle, MdOpenInNew } from 'react-icons/md'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { enableGlobalSkill, uninstallGlobalSkill } from '@/lib/actions/skill'
import { getSkillCatalog } from '@/lib/skills/catalog'

type SkillsLibraryProps = {
  enabledSkillIds: string[]
}

export function SkillsLibrary({ enabledSkillIds }: SkillsLibraryProps) {
  const router = useRouter()
  const [pendingOperation, setPendingOperation] = useState<{
    skillId: string
    type: 'enable' | 'uninstall'
  } | null>(null)
  const [isPending, startTransition] = useTransition()
  const catalog = getSkillCatalog()
  const enabledSkillSet = new Set(enabledSkillIds)

  const handleEnable = (skillId: string) => {
    startTransition(async () => {
      setPendingOperation({ skillId, type: 'enable' })

      const result = await enableGlobalSkill(skillId)
      if (!result.success) {
        toast.error(result.error)
        setPendingOperation(null)
        return
      }

      toast.success('Global skill enabled. Install tasks will fan out across your projects.')
      router.refresh()
      setPendingOperation(null)
    })
  }

  const handleUninstall = (skillId: string) => {
    startTransition(async () => {
      setPendingOperation({ skillId, type: 'uninstall' })

      const result = await uninstallGlobalSkill(skillId)
      if (!result.success) {
        toast.error(result.error)
        setPendingOperation(null)
        return
      }

      toast.success('Global skill removed. Uninstall tasks will converge existing projects.')
      router.refresh()
      setPendingOperation(null)
    })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          Global Skills
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold text-white">Skills</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Skills here define global desired state for the user. Enabling fans out
            `INSTALL_SKILL` tasks to existing projects and future projects inherit the skill.
            Uninstalling removes the global desired state and fans out `UNINSTALL_SKILL` work
            without auto-starting stopped sandboxes.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {catalog.map((skill) => {
          const isEnabled = enabledSkillSet.has(skill.skillId)
          const isLoading = isPending && pendingOperation?.skillId === skill.skillId
          const isUninstalling = isLoading && pendingOperation?.type === 'uninstall'

          return (
            <Card key={skill.skillId} className="border-border/80 bg-card/70">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <MdBolt className="size-5 text-primary" />
                  </div>
                  <Badge
                    variant={isEnabled ? 'default' : 'outline'}
                    className={isEnabled ? '' : 'border-border/70 text-muted-foreground'}
                  >
                    {isEnabled ? 'Enabled' : 'Available'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <CardTitle className="font-display text-xl text-white">{skill.name}</CardTitle>
                  <CardDescription className="leading-6">{skill.description}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 rounded-xl border border-border/70 bg-background/60 p-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <MdCheckCircle className="size-3.5" />
                    Install Command
                  </div>
                  <code className="block whitespace-pre-wrap break-all text-xs leading-5 text-slate-200">
                    {skill.installCommand}
                  </code>
                </div>
              </CardContent>

              <CardFooter className="justify-between gap-3 border-t border-border/70">
                <Button variant="ghost" size="sm" asChild>
                  <a href={skill.sourceUrl} target="_blank" rel="noreferrer">
                    <MdOpenInNew className="size-4" />
                    Source
                  </a>
                </Button>

                <Button
                  variant={isEnabled ? 'destructive' : 'default'}
                  onClick={() =>
                    isEnabled ? handleUninstall(skill.skillId) : handleEnable(skill.skillId)
                  }
                  disabled={isLoading}
                >
                  {isEnabled
                    ? isUninstalling
                      ? 'Uninstalling...'
                      : 'Uninstall Skill'
                    : isLoading
                      ? 'Enabling...'
                      : 'Enable Skill'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
