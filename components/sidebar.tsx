import Image from 'next/image'
import Link from 'next/link'
import { FaGithub } from 'react-icons/fa6'

import { Button } from '@/components/ui/button'
import packageInfo from '../package.json'
import { Separator } from '@/components/ui/separator'
import {
  MdDashboardCustomize,
  MdExtension,
  MdGridView,
  MdHub,
  MdLightbulbOutline,
  MdPsychology,
  MdSettings,
} from 'react-icons/md'

const menuItems = [
  { icon: MdGridView, label: 'Projects', active: true },
  { icon: MdPsychology, label: 'Skills', active: false },
  { icon: MdHub, label: 'MCP', active: false },
  { divider: true },
  { icon: MdDashboardCustomize, label: 'Templates', active: false },
  { icon: MdExtension, label: 'Integrations', active: false },
  { icon: MdSettings, label: 'Settings', active: false },
]

export function Sidebar() {
  return (
    <aside className="w-56 flex flex-col justify-between bg-sidebar border-r border-sidebar-border flex-shrink-0 z-20 transition-all duration-300">
      <div className="flex flex-col p-3 h-full">
        <LogoSection />
        <NavMenu />
        <Footer />
      </div>
    </aside>
  )
}

function LogoSection() {
  return (
    <div className="flex items-center gap-3 px-2 mb-8 mt-3">
      <Image
        src="/icon-transparent.svg"
        alt="Fulling"
        width={32}
        height={32}
        className="w-8 h-8"
      />
      <div className="flex flex-col">
        <h1 className="text-white text-base font-display font-bold leading-tight tracking-tight">
          Fulling
        </h1>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Full-Stack Agent
        </span>
      </div>
    </div>
  )
}

function NavMenu() {
  return (
    <nav className="flex flex-col gap-1 flex-1">
      {menuItems.map((item, index) => {
        if ('divider' in item) {
          return <Separator key={`divider-${index}`} className="my-2" />
        }

        const isActive = item.active

        return (
          <Link
            key={item.label}
            href="#"
            className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-primary/10 border border-primary/20'
                : 'hover:bg-white/5 text-muted-foreground hover:text-white'
            }`}
          >
            <item.icon
              className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`}
            />
            <span
              className={`text-sm font-medium font-display ${
                isActive
                  ? 'text-white'
                  : 'group-hover:text-primary transition-colors'
              }`}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

function Footer() {
  return (
    <div className="mt-auto pt-3 border-t border-sidebar-border mb-1">
      <div className="flex items-center justify-between">
        <Link
          href="https://github.com/FullAgent/fulling"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-white transition-colors flex items-center"
          title="View on GitHub"
        >
          <FaGithub className="w-4 h-4" />
        </Link>
        <span className="text-[10px] text-muted-foreground font-mono">
          v{packageInfo.version}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary"
          title="Tips & Guide"
        >
          <MdLightbulbOutline className="w-[18px] h-[18px]" />
        </Button>
      </div>
    </div>
  )
}
