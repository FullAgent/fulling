'use client';

import { useEffect,useState } from 'react';
import { ChevronDown, Folder, Loader2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { runCommand } from '@/lib/actions/sandbox';

interface DirectorySelectorProps {
  sandboxId?: string;
  value?: string;
  onChange?: (value: string) => void;
}

// Directories to exclude from the list
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  '.next',
  '.cache',
  'dist',
  'build',
  '.turbo',
  '.vercel',
];

export function DirectorySelector({
  sandboxId,
  value: controlledValue,
  onChange,
}: DirectorySelectorProps) {
  const [internalValue, setInternalValue] = useState('./');
  const [directories, setDirectories] = useState<string[]>(['./']);
  const [isLoading, setIsLoading] = useState(false);

  const value = controlledValue ?? internalValue;

  // Fetch directories from sandbox on mount
  useEffect(() => {
    if (!sandboxId) return;

    const fetchDirectories = async () => {
      setIsLoading(true);
      try {
        const result = await runCommand(sandboxId, 'find . -type d -maxdepth 1');
        if (result.success && result.output) {
          const dirs = result.output
            .split('\n')
            .map((dir) => dir.trim())
            .filter((dir) => {
              if (!dir) return false;
              // Only keep lines that look like directory paths (start with . or /)
              if (!dir.startsWith('.') && !dir.startsWith('/')) return false;
              // Exclude hidden dirs and common build outputs
              return !EXCLUDED_DIRS.some((excluded) => dir.includes(excluded));
            })
            .slice(0, 20); // Limit to 20 directories

          setDirectories(dirs.length > 0 ? dirs : ['./']);
        }
      } catch (error) {
        console.error('Failed to fetch directories:', error);
        // Keep default on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchDirectories();
  }, [sandboxId]);

  const handleSelect = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative group cursor-pointer mr-1 bg-[#1e1e1e] border border-[#3e3e42] text-[#cccccc] text-xs rounded pl-8 pr-6 py-1 h-[26px] font-mono w-[180px] focus:outline-none focus:border-[#007fd4] hover:bg-[#252526] hover:border-[#505055] transition-all select-none text-left"
          title="Change deploy directory"
          disabled={isLoading}
        >
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 text-[#858585] animate-spin" />
            ) : (
              <Folder className="h-3.5 w-3.5 text-[#858585] group-hover:text-[#c5c5c5] transition-colors" />
            )}
          </div>
          <span className="truncate block">{value}</span>
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="h-3 w-3 text-[#858585] group-hover:text-[#c5c5c5] transition-colors" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="bg-[#252526] border-[#3e3e42] w-[var(--radix-dropdown-menu-trigger-width)] max-h-[200px] overflow-y-auto"
      >
        {directories.map((dir) => (
          <DropdownMenuItem
            key={dir}
            onClick={() => handleSelect(dir)}
            className="text-xs font-mono text-[#cccccc] hover:bg-[#37373d] hover:text-white focus:bg-[#37373d] focus:text-white cursor-pointer"
          >
            <Folder className="h-3.5 w-3.5 text-[#858585] mr-2 shrink-0" />
            <span className="truncate">{dir}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
