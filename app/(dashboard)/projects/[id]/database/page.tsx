import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { getProject } from '@/lib/data/project';
import { parseConnectionUrl } from '@/lib/data/database';

import { SettingsLayout } from '../_components/settings-layout';
import { ConnectionString } from './_components/connection-string';
import { FeatureCards } from './_components/feature-cards';
import { ReadOnlyField } from './_components/read-only-field';

export default async function DatabasePage({ params }: { params: Promise<{ id: string }> }) {
  // Parallel: fetch session and params simultaneously
  const [session, paramsResolved] = await Promise.all([
    auth(),
    params
  ]);

  if (!session) redirect('/login');

  const { id } = paramsResolved;

  const project = await getProject(id, session.user.id, {
    databases: true,
  });

  if (!project) notFound();

  const database = project.databases[0];
  const connectionString = database?.connectionUrl || '';
  const connectionInfo = parseConnectionUrl(connectionString) || {
    host: '', port: '', database: '', username: '', password: ''
  };

  return (
    <SettingsLayout title="Database Information" description="View database connection details">
      {connectionString ? (
        <>
          <div className="space-y-4">
            <h2 className="text-sm font-medium uppercase text-foreground mb-8 pb-2 border-b">PostgreSQL Connection</h2>

            <div className="grid grid-cols-2 gap-x-12 gap-y-10">
              <ReadOnlyField label="Host" value={connectionInfo.host} />
              <ReadOnlyField label="Port" value={connectionInfo.port} />
              <ReadOnlyField label="Database" value={connectionInfo.database} />
              <ReadOnlyField label="Username" value={connectionInfo.username} />
              <ReadOnlyField label="Password" value={'•'.repeat(Math.min(connectionInfo.password.length, 20))} fullWidth />
            </div>

            <div className="mt-10">
              <ConnectionString connectionString={connectionString} />
            </div>
          </div>

          <FeatureCards />
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No database configured</p>
          <p className="text-xs text-muted-foreground mt-1">
            Database will be automatically provisioned when sandbox is created
          </p>
        </div>
      )}
    </SettingsLayout>
  );
}