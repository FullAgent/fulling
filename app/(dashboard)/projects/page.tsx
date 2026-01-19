/**
 * Projects Page
 *
 * Server component that displays the list of user projects
 */

import ProjectListContent from '@/components/features/projectList/ProjectListContent';
import ProjectListHeader from '@/components/features/projectList/ProjectListHeader';

export default function ProjectsPage() {
  return (
    <div className="flex-1 flex flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full z-10 overflow-y-auto">
      {/* Header Bar */}
      <ProjectListHeader />

      {/* Content */}
      <ProjectListContent />
    </div>
  );
}
