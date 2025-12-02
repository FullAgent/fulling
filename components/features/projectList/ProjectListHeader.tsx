/**
 * ProjectListHeader Component
 *
 * Header bar for projects page with avatar and settings
 */

'use client';

import { useState } from 'react';
import { Plus, User } from 'lucide-react';

import CreateProjectDialog from '@/components/dialog/create-project-dialog';
import SettingsDialog from '@/components/dialog/settings-dialog';
import { Button } from '@/components/ui/button';

const ProjectListHeader = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground mt-1">Manage your full-stack applications</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto items-center">
           <Button 
             onClick={() => setShowCreateProject(true)}
             className="whitespace-nowrap px-4 py-2 text-sm"
           >
             <Plus size={16} />
             New Project
           </Button>
           
           {/* Avatar / Settings Button */}
           <Button
             variant="secondary"
             size="icon"
             onClick={() => setShowSettings(true)}
             className="ml-1 rounded-full border-border text-muted-foreground hover:text-foreground hover:border-primary shadow-sm"
             aria-label="User Settings"
           >
             <User size={18} />
           </Button>
        </div>
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog open={showCreateProject} onOpenChange={setShowCreateProject} />

      {/* Settings Dialog */}
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
};

ProjectListHeader.displayName = 'ProjectListHeader';

export default ProjectListHeader;
