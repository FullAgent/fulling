'use client';

import { MdAdd, MdClose, MdTerminal } from 'react-icons/md';

import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface Tab {
  id: string;
  name: string;
}

export interface TerminalTabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function TerminalTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabAdd,
}: TerminalTabsProps) {
  return (
    <div className="flex items-center flex-1 min-w-0 h-full overflow-x-auto overflow-y-hidden">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            'flex items-center gap-2 px-4 h-full text-xs cursor-pointer transition-colors border-r border-[#3e3e42] relative group min-w-[120px] max-w-[200px]',
            activeTabId === tab.id
              ? 'bg-zinc-800 text-white'
              : 'bg-sidebar-background text-[#969696] hover:bg-sidebar-background hover:text-white'
          )}
          onClick={() => onTabSelect(tab.id)}
        >
          {/* Top Accent Line for Active Tab */}
          {activeTabId === tab.id && (
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
          )}

          <MdTerminal
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              activeTabId === tab.id ? 'text-blue-500' : 'text-foreground'
            )}
          />
          <span className="truncate flex-1">{tab.name}</span>
          {tabs.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className={cn(
                'p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-all',
                activeTabId === tab.id ? 'hover:bg-[#37373d]' : 'hover:bg-[#454549]'
              )}
            >
              <MdClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onTabAdd}
        className="h-full aspect-square flex items-center justify-center text-[#c5c5c5] hover:bg-[#37373d] transition-colors border-r border-transparent"
        title="Add new terminal"
      >
        <MdAdd className="h-4 w-4" />
      </button>
    </div>
  );
}
