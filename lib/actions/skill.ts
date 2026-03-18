'use server'

import { auth } from '@/lib/auth'
import { enableGlobalSkillCommand, uninstallGlobalSkillCommand } from '@/lib/platform/control/commands/skill'

import type { ActionResult } from './types'

export async function enableGlobalSkill(skillId: string): Promise<ActionResult<{ skillId: string }>> {
  const session = await auth()

  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  return enableGlobalSkillCommand({
    userId: session.user.id,
    skillId,
  })
}

export async function uninstallGlobalSkill(
  skillId: string
): Promise<ActionResult<{ skillId: string }>> {
  const session = await auth()

  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  return uninstallGlobalSkillCommand({
    userId: session.user.id,
    skillId,
  })
}
