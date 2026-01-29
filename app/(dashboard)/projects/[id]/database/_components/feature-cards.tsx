import { type IconType } from 'react-icons';
import { MdAutoAwesome, MdHttps, MdStorage, MdTerminal } from 'react-icons/md';

// Feature card component
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: IconType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors">
      <div className="mb-3 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-medium text-card-foreground mb-2">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// Feature cards data
const DATABASE_FEATURES = [
  {
    icon: MdAutoAwesome,
    title: 'Auto Provisioned',
    description: 'Database is automatically provisioned and ready to use with your sandbox environment.',
  },
  {
    icon: MdStorage,
    title: 'High Availability',
    description: 'Managed by KubeBlocks with high availability and automatic failover.',
  },
  {
    icon: MdHttps,
    title: 'SSL Encrypted',
    description: 'SSL encryption enabled by default for secure database connections.',
  },
  {
    icon: MdTerminal,
    title: 'Environment Variable',
    description: 'Connection string available via DATABASE_URL environment variable.',
  },
] as const;

// Export complete component
export function FeatureCards() {
  return (
    <div className="grid grid-cols-4 gap-6 pt-4 border-t border-border">
      {DATABASE_FEATURES.map(({ icon, title, description }) => (
        <FeatureCard key={title} icon={icon} title={title} description={description} />
      ))}
    </div>
  );
}
