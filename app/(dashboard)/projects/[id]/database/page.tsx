import { Info } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

import { SettingsLayout } from '../_components/settings-layout';
import { ConnectionString } from './connection-string';

export default async function DatabasePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: { databases: true, environments: true },
  });

  if (!project) notFound();

  const database = project.databases[0];

  const connectionString = database?.connectionUrl || '';
  let host = '';
  let port = '';
  let dbName = '';
  let username = '';
  let password = '';

  // Parse connection string
  if (connectionString) {
    try {
      const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
      if (match) {
        [, username, password, host, port, dbName] = match;
      }
    } catch (e) {
      console.error('Failed to parse database URL:', e);
    }
  }

  return (
    <SettingsLayout title="Database Information" description="View database connection details">
      {connectionString ? (
        <>
          {/* Connection Details */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-foreground">PostgreSQL Connection</h2>

            {/* Host */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Host</label>
              <div className="p-2.5 bg-muted border border-border rounded font-mono text-sm text-foreground">
                {host}
              </div>
            </div>

            {/* Port */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Port</label>
              <div className="p-2.5 bg-muted border border-border rounded font-mono text-sm text-foreground">
                {port}
              </div>
            </div>

            {/* Database Name */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Database</label>
              <div className="p-2.5 bg-muted border border-border rounded font-mono text-sm text-foreground">
                {dbName}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Username</label>
              <div className="p-2.5 bg-muted border border-border rounded font-mono text-sm text-foreground">
                {username}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Password</label>
              <div className="p-2.5 bg-muted border border-border rounded font-mono text-sm text-foreground">
                {'•'.repeat(Math.min(password.length, 20))}
              </div>
            </div>

            {/* Full Connection String */}
            <ConnectionString connectionString={connectionString} />
          </div>

          {/* Info Panel */}
          <div className="p-4 bg-card border border-border rounded">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• Database is automatically provisioned with your sandbox</p>
                <p>• Managed by KubeBlocks with high availability</p>
                <p>• SSL encryption enabled by default</p>
                <p>• Connection string available via DATABASE_URL environment variable</p>
              </div>
            </div>
          </div>
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
