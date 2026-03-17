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
import { enableGlobalSkill } from '@/lib/actions/skill'
import { getSkillCatalog } from '@/lib/skills/catalog'

type SkillsLibraryProps = {
  enabledSkillIds: string[]
}

export function SkillsLibrary({ enabledSkillIds }: SkillsLibraryProps) {
  const router = useRouter()
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const catalog = getSkillCatalog()
  const enabledSkillSet = new Set(enabledSkillIds)

  const handleEnable = (skillId: string) => {
    startTransition(async () => {
      setPendingSkillId(skillId)

      const result = await enableGlobalSkill(skillId)
      if (!result.success) {
        toast.error(result.error)
        setPendingSkillId(null)
        return
      }

      toast.success('Global skill enabled. Install tasks will fan out across your projects.')
      router.refresh()
      setPendingSkillId(null)
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
            Enabling a skill here creates global desired state for the user. Existing projects get
            `INSTALL_SKILL` tasks immediately, and new projects inherit the same skill when they
            are created.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {catalog.map((skill) => {
          const isEnabled = enabledSkillSet.has(skill.skillId)
          const isLoading = isPending && pendingSkillId === skill.skillId

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
                  onClick={() => handleEnable(skill.skillId)}
                  disabled={isEnabled || isLoading}
                >
                  {isEnabled ? 'Enabled' : isLoading ? 'Enabling...' : 'Enable Skill'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
