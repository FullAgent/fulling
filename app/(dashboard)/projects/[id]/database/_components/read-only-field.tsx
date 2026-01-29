/**
 * Read-only field component for displaying data
 * Mimics input styling for display-only scenarios
 */

import { useId } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReadOnlyFieldProps {
  /** Field label */
  label: string;
  /** Field value */
  value: string | number;
  /** Full width on mobile (col-span-2) */
  fullWidth?: boolean;
}

export function ReadOnlyField({ label, value, fullWidth }: ReadOnlyFieldProps) {
  const fieldId = useId();

  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <Label
        htmlFor={fieldId}
        className="block text-xs text-muted-foreground mb-2 uppercase"
      >
        {label}
      </Label>
      <Input
        id={fieldId}
        readOnly
        value={value}
        className="bg-muted font-mono text-sm cursor-text focus-visible:ring-0"
      />
    </div>
  );
}
