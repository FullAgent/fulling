export type SkillCatalogEntry = {
  skillId: string
  name: string
  description: string
  sourceUrl: string
  installCommand: string
  uninstallCommand: string
}

const skillCatalog: SkillCatalogEntry[] = [
  {
    skillId: 'frontend-design',
    name: 'Frontend Design',
    description:
      'Adds Anthropic frontend design workflows so projects can use the shared UI and interaction skill set.',
    sourceUrl: 'https://github.com/anthropics/skills',
    installCommand:
      'npx -y skills add https://github.com/anthropics/skills --skill frontend-design -y',
    uninstallCommand: 'npx -y skills remove frontend-design -y',
  },
]

export function getSkillCatalog(): SkillCatalogEntry[] {
  return skillCatalog
}

export function findSkillCatalogEntry(skillId: string): SkillCatalogEntry | undefined {
  return skillCatalog.find((skill) => skill.skillId === skillId)
}
