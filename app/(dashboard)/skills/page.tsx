import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { getUserSkills } from '@/lib/data/user-skill'

import { SkillsLibrary } from './_components/skills-library'

export const metadata = {
  title: 'Skills | Fulling',
  description: 'Manage global skills that install into or uninstall from your projects.',
}

export default async function SkillsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const userSkills = await getUserSkills(session.user.id)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
      <SkillsLibrary
        enabledSkillIds={userSkills.map((skill) => skill.skillId)}
      />
    </div>
  )
}
