'use client';

import { useState } from 'react';
import { ChevronDown, Folder } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DirectorySelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const DIRECTORY_OPTIONS = ['./', '/app'];

export function DirectorySelector({
  value: controlledValue,
  onChange,
}: DirectorySelectorProps) {
  const [internalValue, setInternalValue] = useState('./');
  
  const value = controlledValue ?? internalValue;

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
          className="relative group cursor-pointer mr-1 bg-[#1e1e1e] border border-[#3e3e42] text-[#cccccc] text-xs rounded pl-8 pr-6 py-1 h-[26px] font-mono w-[120px] focus:outline-none focus:border-[#007fd4] hover:bg-[#252526] hover:border-[#505055] transition-all select-none text-left"
          title="Change deploy directory"
        >
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Folder className="h-3.5 w-3.5 text-[#858585] group-hover:text-[#c5c5c5] transition-colors" />
          </div>
          <span className="truncate block">{value}</span>
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="h-3 w-3 text-[#858585] group-hover:text-[#c5c5c5] transition-colors" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="bg-[#252526] border-[#3e3e42] min-w-[120px]"
      >
        {DIRECTORY_OPTIONS.map((dir) => (
          <DropdownMenuItem
            key={dir}
            onClick={() => handleSelect(dir)}
            className="text-xs font-mono text-[#cccccc] hover:bg-[#37373d] hover:text-white focus:bg-[#37373d] focus:text-white cursor-pointer"
          >
            <Folder className="h-3.5 w-3.5 text-[#858585] mr-2" />
            {dir}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
