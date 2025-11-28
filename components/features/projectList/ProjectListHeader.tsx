/**
 * ProjectListHeader Component
 *
 * Header bar for projects page with avatar and settings
 */

'use client';

import { memo, useState } from 'react';
import { Plus, User } from 'lucide-react';
import { useSession } from 'next-auth/react';

import CreateProjectDialog from '@/components/dialog/create-project-dialog';
import SettingsDialog from '@/components/dialog/settings-dialog';
import { Button } from '@/components/ui/button';

interface ProjectListHeaderProps {

  className?: string;
}

const ProjectListHeader = memo(({ className }: ProjectListHeaderProps) => {
  const { data: session } = useSession();
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  // Get user initials for avatar fallback
  // const getUserInitials = () => {
  //   if (!session?.user?.name) return 'U';
  //   const names = session.user.name.split(' ');
  //   if (names.length >= 2) {
  //     return `${names[0][0]}${names[1][0]}`.toUpperCase();
  //   }
  //   return session.user.name[0].toUpperCase();
  // };

  return (
    <>
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 ${className || ''}`}>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Projects</h2>
          <p className="text-muted-foreground/70 mt-1">Manage your full-stack applications</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto items-center">
          {/* TODO: to be implemented */}
           {/* <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="w-full bg-secondary/50 border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
              />
           </div> */}
           <Button 
             variant="default" 
             onClick={() => setShowCreateProject(true)}
             className="whitespace-nowrap px-4 py-2 text-sm"
           >
             <Plus size={16} />
             New Project
           </Button>
           
           {/* Avatar / Settings Button */}
           <button 
             onClick={() => setShowSettings(true)}
             className="w-9 h-9 ml-1 rounded-full bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background shadow-sm"
             aria-label="User Settings"
           >
             <User size={18} />
           </button>
        </div>
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog open={showCreateProject} onOpenChange={setShowCreateProject} />

      {/* Settings Dialog */}
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
});

ProjectListHeader.displayName = 'ProjectListHeader';

export default ProjectListHeader;
