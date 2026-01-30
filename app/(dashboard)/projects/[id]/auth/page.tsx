/**
 * Authentication Configuration Page
 * Configure OAuth providers and NextAuth settings
 */

'use client';

import { FaGithub } from 'react-icons/fa';
import { MdOpenInNew, MdVpnKey } from 'react-icons/md';
import { useParams } from 'next/navigation';

import { EnvVarSection } from '@/components/config/env-var-section';
import {
  useBatchUpdateEnvironmentVariables,
  useEnvironmentVariables,
} from '@/hooks/use-environment-variables';
import { useProject } from '@/hooks/use-project';

import { SettingsLayout } from '../_components/settings-layout';

/**
 * Generate a secure random secret
 */
function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

function AuthPageContent() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: envData, isLoading: envLoading } = useEnvironmentVariables(projectId);
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const batchUpdate = useBatchUpdateEnvironmentVariables(projectId);

  const authVars = envData?.auth || [];

  const handleSave = async (
    variables: Array<{ key: string; value: string; isSecret?: boolean }>
  ) => {
    await batchUpdate.mutateAsync({
      category: 'auth',
      variables,
    });
  };

  // GitHub OAuth templates
  const githubTemplates = [
    {
      key: 'GITHUB_CLIENT_ID',
      label: 'Client ID',
      placeholder: 'Enter your GitHub OAuth App Client ID',
      isSecret: false,
      description: 'Get this from GitHub Developer Settings → OAuth Apps',
    },
    {
      key: 'GITHUB_CLIENT_SECRET',
      label: 'Client Secret',
      placeholder: 'Enter your GitHub OAuth App Client Secret',
      isSecret: true,
      description: 'Keep this secret! Get it from your GitHub OAuth App settings',
    },
  ];

  // NextAuth templates
  const nextAuthTemplates = [
    {
      key: 'NEXTAUTH_URL',
      label: 'Application URL',
      placeholder: 'https://your-app.example.com',
      isSecret: false,
      description: 'The public URL of your application',
    },
    {
      key: 'NEXTAUTH_SECRET',
      label: 'NextAuth Secret',
      placeholder: 'Click Generate to create a secure secret',
      isSecret: true,
      description: 'A random string used to hash tokens and sign cookies (min 32 characters)',
      generateValue: generateSecret,
    },
  ];

  return (
    <SettingsLayout
      title="Auth Configuration"
      description="Configure auth configuration settings for this project."
      loading={envLoading || projectLoading}
    >
      <div className="space-y-6">
        {/* GitHub OAuth Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaGithub className="h-5 w-5 text-primary" />
              <h2 className="text-base font-medium text-foreground">GitHub OAuth</h2>
            </div>
            <a
              href="https://github.com/settings/developers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
            >
              GitHub Developer Settings
              <MdOpenInNew className="h-3.5 w-3.5" />
            </a>
          </div>

          <EnvVarSection
            title=""
            variables={authVars}
            templates={githubTemplates}
            sandboxes={project?.sandboxes || []}
            onSave={handleSave}
            saving={batchUpdate.isPending}
          />

          {/* Setup Instructions */}
          <div className="mt-4 p-4 bg-card border border-border rounded">
            <h3 className="text-xs font-medium text-foreground mb-2">Setup Instructions</h3>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to GitHub Settings → Developer settings → OAuth Apps</li>
              <li>Click &quot;New OAuth App&quot; or select an existing app</li>
              <li>Set the Homepage URL and Authorization callback URL</li>
              <li>Copy the Client ID and Client Secret to the fields above</li>
              <li>Save your changes</li>
            </ol>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* NextAuth Configuration Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MdVpnKey className="h-5 w-5 text-primary" />
            <h2 className="text-base font-medium text-foreground">NextAuth Configuration</h2>
          </div>

          <EnvVarSection
            title=""
            variables={authVars}
            templates={nextAuthTemplates}
            sandboxes={project?.sandboxes || []}
            onSave={handleSave}
            saving={batchUpdate.isPending}
          />

          {/* Important Notes */}
          <div className="mt-4 p-4 bg-card border border-border rounded">
            <h3 className="text-xs font-medium text-foreground mb-2">Important Notes</h3>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>The NextAuth URL must match your application URL exactly</li>
              <li>The secret should be at least 32 characters long</li>
              <li>Never commit your NEXTAUTH_SECRET to version control</li>
              <li>Use a strong, unique secret for production</li>
            </ul>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}

export default AuthPageContent;
