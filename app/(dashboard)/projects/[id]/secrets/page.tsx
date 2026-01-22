/**
 * Secrets Configuration Page
 * Manage sensitive environment variables and API keys
 */

'use client';

import { useParams } from 'next/navigation';

import { EnvVarSection } from '@/components/config/env-var-section';
import {
  useBatchUpdateEnvironmentVariables,
  useEnvironmentVariables,
} from '@/hooks/use-environment-variables';
import { useProject } from '@/hooks/use-project';

import { SettingsLayout } from '../_components/settings-layout';

function SecretsPageContent() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: envData, isLoading: envLoading } = useEnvironmentVariables(projectId);
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const batchUpdate = useBatchUpdateEnvironmentVariables(projectId);

  const secretVars = envData?.secret || [];

  const handleSave = async (
    variables: Array<{ key: string; value: string; isSecret?: boolean }>
  ) => {
    await batchUpdate.mutateAsync({
      category: 'secret',
      variables: variables.map((v) => ({ ...v, isSecret: true })),
    });
  };

  return (
    <SettingsLayout
      title="Secret Configuration"
      description="Manage sensitive environment variables and API keys"
      loading={envLoading || projectLoading}
    >
      <div className="space-y-6">
        {/* Secrets Section */}
        <EnvVarSection
          title="Secret Variables"
          description="Store sensitive data like API keys, tokens, and passwords"
          variables={secretVars.map((v) => ({ ...v, isSecret: true }))}
          sandboxes={project?.sandboxes || []}
          onSave={handleSave}
          saving={batchUpdate.isPending}
          allowCustomVariables={true}
        />

        {/* Security Notice */}
        <div className="p-4 bg-card border border-border rounded">
          <h3 className="text-xs font-medium text-foreground mb-2">Security Best Practices</h3>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>All secret values are masked by default for security</li>
            <li>Never commit secrets to Git</li>
            <li>Rotate secrets regularly to maintain security</li>
            {/*<li>Use different secrets for development and production environments</li>*/}
            <li>Limit access to secrets to only those who need them</li>
          </ul>
        </div>
      </div>
    </SettingsLayout>
  );
}

export default SecretsPageContent;
