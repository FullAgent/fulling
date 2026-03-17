'use server'

import type { UserSkill } from '@prisma/client'

import { auth } from '@/lib/auth'
import { enableGlobalSkillCommand } from '@/lib/platform/control/commands/skill'

import type { ActionResult } from './types'

export async function enableGlobalSkill(skillId: string): Promise<ActionResult<UserSkill>> {
  const session = await auth()

  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  return enableGlobalSkillCommand({
    userId: session.user.id,
    skillId,
  })
}
