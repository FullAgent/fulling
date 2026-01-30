'use client';

import { useEffect, useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { MdCode, MdSave, MdStorage, MdTerminal } from 'react-icons/md';
import Image from 'next/image';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import * as fetchClient from '@/lib/fetch-client';
import { useSealos } from '@/provider/sealos';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'system-prompt' | 'kubeconfig' | 'anthropic' | 'github';
}

const DEFAULT_SYSTEM_PROMPT = `You are an AI full-stack developer working in a Next.js environment.

## Environment Information
- Framework: Next.js 15 with App Router
- Language: TypeScript
- Database: PostgreSQL with Prisma ORM
- UI Framework: Shadcn/UI with Tailwind CSS
- Authentication: NextAuth v5

## Available Environment Variables
- DATABASE_URL: PostgreSQL connection string
- ANTHROPIC_API_KEY: Claude API key
- ANTHROPIC_BASE_URL: Claude API base URL

## Instructions
- Follow Next.js 15 App Router conventions
- Use TypeScript for type safety
- Implement proper error handling and loading states
- Follow responsive design principles with Tailwind CSS
- Focus on creating production-ready, maintainable code

## Development Guidelines
- Write clean, readable code with proper documentation
- Implement proper error boundaries and validation
- Use semantic HTML and accessibility best practices
- Optimize for performance and SEO
- Follow modern React patterns and best practices`;

type TabType = 'system-prompt' | 'kubeconfig' | 'anthropic' | 'github';

interface GitHubStatus {
  connected: boolean;
  login?: string;
  avatar_url?: string;
}

export default function SettingsDialog({
  open,
  onOpenChange,
  defaultTab = 'kubeconfig',
}: SettingsDialogProps) {
  const { isSealos } = useSealos();
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  // System Prompt state
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSystemPromptLoading, setIsSystemPromptLoading] = useState(false);
  const [isSystemPromptInitialLoading, setIsSystemPromptInitialLoading] = useState(true);

  // Kubeconfig state
  const [kubeconfig, setKubeconfig] = useState('');
  const [kubeconfigNamespace, setKubeconfigNamespace] = useState<string | null>(null);
  const [isKubeconfigLoading, setIsKubeconfigLoading] = useState(false);
  const [isKubeconfigInitialLoading, setIsKubeconfigInitialLoading] = useState(true);

  // Anthropic state
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [anthropicApiBaseUrl, setAnthropicApiBaseUrl] = useState('');
  const [anthropicModel, setAnthropicModel] = useState('');
  const [anthropicSmallFastModel, setAnthropicSmallFastModel] = useState('');
  const [isAnthropicLoading, setIsAnthropicLoading] = useState(false);
  const [isAnthropicInitialLoading, setIsAnthropicInitialLoading] = useState(true);

  // GitHub state
  const [githubStatus, setGithubStatus] = useState<GitHubStatus>({ connected: false });
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGithubInitialLoading, setIsGithubInitialLoading] = useState(true);

  // Confirmation dialog state
  const [showSystemPromptConfirm, setShowSystemPromptConfirm] = useState(false);
  const [showSystemPromptResetConfirm, setShowSystemPromptResetConfirm] = useState(false);
  const [showAnthropicConfirm, setShowAnthropicConfirm] = useState(false);

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadSystemPrompt();
      if (!isSealos) {
        loadKubeconfig();
      }
      loadAnthropicConfig();
      loadGithubStatus();
    }
  }, [open, isSealos]);

  // Set active tab when defaultTab changes
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const loadSystemPrompt = async () => {
    try {
      const data = await fetchClient.GET<{ systemPrompt: string | null }>(
        '/api/user/config/system-prompt'
      );
      setSystemPrompt(data.systemPrompt || DEFAULT_SYSTEM_PROMPT);
    } catch (error) {
      console.error('Failed to load system prompt:', error);
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    } finally {
      setIsSystemPromptInitialLoading(false);
    }
  };

  const loadKubeconfig = async () => {
    try {
      const data = await fetchClient.GET<{ kubeconfig: string; namespace?: string | null }>(
        '/api/user/config/kc'
      );
      setKubeconfig(data.kubeconfig);
      setKubeconfigNamespace(data.namespace || null);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        setKubeconfig('');
      } else {
        console.error('Failed to load kubeconfig:', error);
      }
    } finally {
      setIsKubeconfigInitialLoading(false);
    }
  };

  const loadAnthropicConfig = async () => {
    try {
      const data = await fetchClient.GET<{
        apiKey: string | null;
        apiBaseUrl: string | null;
        model: string | null;
        smallFastModel: string | null;
      }>('/api/user/config/anthropic');
      setAnthropicApiKey(data.apiKey || '');
      setAnthropicApiBaseUrl(data.apiBaseUrl || '');
      setAnthropicModel(data.model || '');
      setAnthropicSmallFastModel(data.smallFastModel || '');
    } catch (error) {
      console.error('Failed to load Anthropic config:', error);
    } finally {
      setIsAnthropicInitialLoading(false);
    }
  };

  const loadGithubStatus = async () => {
    try {
      const data = await fetchClient.GET<GitHubStatus>('/api/user/github');
      setGithubStatus(data);
    } catch (error) {
      console.error('Failed to load GitHub status:', error);
      setGithubStatus({ connected: false });
    } finally {
      setIsGithubInitialLoading(false);
    }
  };

  const handleSaveSystemPrompt = () => {
    setShowSystemPromptConfirm(true);
  };

  const handleConfirmSaveSystemPrompt = async () => {
    setShowSystemPromptConfirm(false);
    setIsSystemPromptLoading(true);
    try {
      await fetchClient.POST('/api/user/config/system-prompt', {
        systemPrompt,
      });
      toast.success('System prompt saved successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save system prompt:', error);
      toast.error('Failed to save system prompt');
    } finally {
      setIsSystemPromptLoading(false);
    }
  };

  const handleSaveKubeconfig = async () => {
    if (!kubeconfig.trim()) {
      toast.error('Kubeconfig cannot be empty');
      return;
    }

    setIsKubeconfigLoading(true);
    try {
      const result = await fetchClient.POST<{
        success: boolean;
        namespace?: string;
        error?: string;
        valid?: boolean;
      }>('/api/user/config/kc', {
        kubeconfig,
      });

      if (result.success) {
        setKubeconfigNamespace(result.namespace || null);
        toast.success(`Kubeconfig saved successfully (namespace: ${result.namespace})`);
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to save kubeconfig');
      }
    } catch (error: unknown) {
      console.error('Failed to save kubeconfig:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save kubeconfig');
    } finally {
      setIsKubeconfigLoading(false);
    }
  };

  const handleSaveAnthropicConfig = () => {
    if (!anthropicApiKey.trim() || !anthropicApiBaseUrl.trim()) {
      toast.error('Both API key and base URL are required');
      return;
    }
    setShowAnthropicConfirm(true);
  };

  const handleConfirmSaveAnthropicConfig = async () => {
    setShowAnthropicConfirm(false);
    setIsAnthropicLoading(true);
    try {
      await fetchClient.POST('/api/user/config/anthropic', {
        apiKey: anthropicApiKey,
        apiBaseUrl: anthropicApiBaseUrl,
        model: anthropicModel.trim() || undefined,
        smallFastModel: anthropicSmallFastModel.trim() || undefined,
      });
      toast.success('Anthropic configuration saved successfully');
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Failed to save Anthropic config:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save Anthropic configuration'
      );
    } finally {
      setIsAnthropicLoading(false);
    }
  };

  const handleResetSystemPrompt = () => {
    setShowSystemPromptResetConfirm(true);
  };

  const handleConfirmResetSystemPrompt = () => {
    setShowSystemPromptResetConfirm(false);
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    toast.success('Reset to default system prompt');
  };

  const handleConnectGithub = () => {
    setIsGithubLoading(true);

    // Open popup window for GitHub OAuth
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      '/api/user/github/bind',
      'github-oauth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      toast.error('Failed to open popup window. Please allow popups for this site.');
      setIsGithubLoading(false);
      return;
    }

    // Listen for message from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type !== 'github-oauth-callback') return;

      if (event.data.success) {
        toast.success('GitHub account connected successfully!');
        loadGithubStatus();
      } else {
        toast.error(event.data.message || 'Failed to connect GitHub account');
      }

      setIsGithubLoading(false);
      window.removeEventListener('message', handleMessage);
    };

    window.addEventListener('message', handleMessage);

    // Fallback: stop loading after timeout
    setTimeout(() => {
      setIsGithubLoading(false);
      window.removeEventListener('message', handleMessage);
    }, 60000); // 1 minute timeout
  };

  const handleDisconnectGithub = async () => {
    setIsGithubLoading(true);
    try {
      await fetchClient.DELETE('/api/user/github');
      toast.success('GitHub account disconnected successfully');
      setGithubStatus({ connected: false });
    } catch (error: unknown) {
      console.error('Failed to disconnect GitHub:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect GitHub account');
    } finally {
      setIsGithubLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl! h-[85vh] bg-card border-border text-foreground p-0 flex flex-col rounded"
        showCloseButton={true}
      >
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-xl text-foreground">Settings</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 py-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabType)}
            className="h-full flex flex-col"
          >
            <TabsList
              className={`shrink-0 grid w-full ${isSealos ? 'grid-cols-3' : 'grid-cols-4'} bg-secondary border-border rounded-lg`}
            >
              <TabsTrigger
                value="system-prompt"
                className="data-[state=active]:bg-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
              >
                <MdCode className="mr-2 h-4 w-4" />
                System Prompt
              </TabsTrigger>
              {!isSealos && (
                <TabsTrigger
                  value="kubeconfig"
                  className="data-[state=active]:bg-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
                >
                  <MdStorage className="mr-2 h-4 w-4" />
                  Kubeconfig
                </TabsTrigger>
              )}
              <TabsTrigger
                value="anthropic"
                className="data-[state=active]:bg-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
              >
                <MdTerminal className="mr-2 h-4 w-4" />
                Anthropic
              </TabsTrigger>
              <TabsTrigger
                value="github"
                className="data-[state=active]:bg-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
              >
                <FaGithub className="mr-2 h-4 w-4" />
                GitHub
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 min-h-0">
              {/* System Prompt Tab */}
              <TabsContent value="system-prompt" className="mt-0 h-full flex flex-col overflow-y-auto">
                <div className="space-y-4 pb-4 flex-1 flex flex-col min-h-0">
                  <div className="space-y-2 shrink-0">
                    <Label
                      htmlFor="system-prompt-dialog"
                      className="text-foreground text-sm font-medium"
                    >
                      System Prompt Template
                    </Label>
                  </div>
                  <Textarea
                    id="system-prompt-dialog"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    disabled={isSystemPromptInitialLoading}
                    className="flex-1 min-h-[300px] bg-input border-border text-foreground placeholder:text-muted-foreground font-mono text-sm disabled:opacity-50 resize-none overflow-y-auto rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                    placeholder={
                      isSystemPromptInitialLoading
                        ? 'Loading...'
                        : 'Enter your system prompt here...'
                    }
                  />
                  <p className="text-xs text-muted-foreground shrink-0">
                    This prompt will be used as context for Claude Code to understand your project
                    environment and coding preferences.
                  </p>

                  <div className="flex gap-2 pt-2 shrink-0">
                    <Button
                      onClick={handleSaveSystemPrompt}
                      disabled={isSystemPromptLoading || isSystemPromptInitialLoading}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <MdSave className="mr-2 h-4 w-4" />
                      {isSystemPromptLoading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleResetSystemPrompt}
                      disabled={isSystemPromptInitialLoading}
                      className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      Reset to Default
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Kubeconfig Tab */}
              {!isSealos && (
                <TabsContent value="kubeconfig" className="mt-0 h-full flex flex-col">
                  <div className="space-y-4 pb-4 flex-1 flex flex-col min-h-0">
                    <div className="space-y-2 shrink-0">
                      <Label
                        htmlFor="kubeconfig-dialog"
                        className="text-foreground text-sm font-medium"
                      >
                        Kubeconfig Content
                      </Label>
                      {kubeconfigNamespace && (
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                          Current namespace: {kubeconfigNamespace}
                        </p>
                      )}
                    </div>
                    <Textarea
                      id="kubeconfig-dialog"
                      value={kubeconfig}
                      onChange={(e) => setKubeconfig(e.target.value)}
                      disabled={isKubeconfigInitialLoading}
                      className="flex-1 min-h-[300px] bg-input border-border text-foreground placeholder:text-muted-foreground font-mono text-sm disabled:opacity-50 resize-none overflow-y-auto rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                      placeholder={
                        isKubeconfigInitialLoading
                          ? 'Loading...'
                          : 'Paste your kubeconfig content here...'
                      }
                    />
                    <p className="text-xs text-muted-foreground shrink-0">
                      The system will validate your kubeconfig before saving.
                    </p>
                    <div className="flex gap-2 pt-2 shrink-0">
                      <Button
                        onClick={handleSaveKubeconfig}
                        disabled={
                          isKubeconfigLoading || isKubeconfigInitialLoading || !kubeconfig.trim()
                        }
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <MdSave className="mr-2 h-4 w-4" />
                        {isKubeconfigLoading ? 'Validating & Saving...' : 'Validate & Save'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Anthropic Tab */}
              <TabsContent value="anthropic" className="mt-0 h-full overflow-y-auto">
                <div className="space-y-4 pb-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="anthropic-api-base-url-dialog"
                      className="text-foreground text-sm font-medium"
                    >
                      API Base URL
                    </Label>
                    <Input
                      id="anthropic-api-base-url-dialog"
                      type="url"
                      value={anthropicApiBaseUrl}
                      onChange={(e) => setAnthropicApiBaseUrl(e.target.value)}
                      disabled={isAnthropicInitialLoading}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground disabled:opacity-50 rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                      placeholder="https://api.anthropic.com"
                    />
                    <p className="text-xs text-muted-foreground mt-0">
                      The base URL for Anthropic API (e.g., https://api.anthropic.com or your proxy
                      URL)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="anthropic-api-key-dialog"
                      className="text-foreground text-sm font-medium"
                    >
                      API Key
                    </Label>
                    <Input
                      id="anthropic-api-key-dialog"
                      type="password"
                      value={anthropicApiKey}
                      onChange={(e) => setAnthropicApiKey(e.target.value)}
                      disabled={isAnthropicInitialLoading}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground font-mono disabled:opacity-50 rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                      placeholder="sk-ant-..."
                    />
                    <p className="text-xs text-muted-foreground mt-0">
                      Your Anthropic API key. This will be stored securely and injected as
                      ANTHROPIC_AUTH_TOKEN in sandboxes.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="anthropic-model-dialog"
                      className="text-foreground text-sm font-medium"
                    >
                      Default Model (Optional)
                    </Label>
                    <Input
                      id="anthropic-model-dialog"
                      type="text"
                      value={anthropicModel}
                      onChange={(e) => setAnthropicModel(e.target.value)}
                      disabled={isAnthropicInitialLoading}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground font-mono disabled:opacity-50 rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                      placeholder="claude-sonnet-4-5-20250929"
                    />
                    <p className="text-xs text-muted-foreground mt-0">
                      Default model to use (e.g., claude-sonnet-4-5-20250929). This will be injected
                      as ANTHROPIC_MODEL in sandboxes.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="anthropic-small-fast-model-dialog"
                      className="text-foreground text-sm font-medium"
                    >
                      Small Fast Model (Optional)
                    </Label>
                    <Input
                      id="anthropic-small-fast-model-dialog"
                      type="text"
                      value={anthropicSmallFastModel}
                      onChange={(e) => setAnthropicSmallFastModel(e.target.value)}
                      disabled={isAnthropicInitialLoading}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground font-mono disabled:opacity-50 rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
                      placeholder="claude-3-5-haiku-20241022"
                    />
                    <p className="text-xs text-muted-foreground mt-0">
                      Small fast model for quick operations (e.g., claude-3-5-haiku-20241022). This
                      will be injected as ANTHROPIC_SMALL_FAST_MODEL in sandboxes.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSaveAnthropicConfig}
                      disabled={
                        isAnthropicLoading ||
                        isAnthropicInitialLoading ||
                        !anthropicApiKey.trim() ||
                        !anthropicApiBaseUrl.trim()
                      }
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <MdSave className="mr-2 h-4 w-4" />
                      {isAnthropicLoading ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* GitHub Tab */}
              <TabsContent value="github" className="mt-0 h-full overflow-y-auto">
                <div className="space-y-4 pb-4">
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm font-medium">GitHub Account</Label>
                    <p className="text-xs text-muted-foreground">
                      Connect your GitHub account to enable repository access and code management features.
                    </p>
                  </div>

                  {isGithubInitialLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Loading...</div>
                    </div>
                  ) : githubStatus.connected ? (
                    // Connected state
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        {githubStatus.avatar_url && (
                          <Image
                            src={githubStatus.avatar_url}
                            alt="GitHub Avatar"
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {githubStatus.login}
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-500">● Connected</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your GitHub account is connected and ready to use.
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={handleDisconnectGithub}
                        disabled={isGithubLoading}
                        className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        {isGithubLoading ? 'Disconnecting...' : 'Disconnect GitHub Account'}
                      </Button>
                    </div>
                  ) : (
                    // Not connected state
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 border border-border rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          No GitHub account connected. Connect your GitHub account to access repositories and enable version control features.
                        </p>
                      </div>

                      <Button
                        onClick={handleConnectGithub}
                        disabled={isGithubLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <FaGithub className="mr-2 h-4 w-4" />
                        {isGithubLoading ? 'Connecting...' : 'Connect GitHub Account'}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* System Prompt Confirmation Dialog */}
        <AlertDialog open={showSystemPromptConfirm} onOpenChange={setShowSystemPromptConfirm}>
          <AlertDialogContent className="bg-card border-border text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Confirm Save System Prompt
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                These changes won&apos;t take effect until you manually restart the application.
                Save now?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmSaveSystemPrompt}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* System Prompt Reset Confirmation Dialog */}
        <AlertDialog
          open={showSystemPromptResetConfirm}
          onOpenChange={setShowSystemPromptResetConfirm}
        >
          <AlertDialogContent className="bg-card border-border text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Reset System Prompt to Default
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will reset the system prompt to the default template. You&apos;ll need to
                manually restart the application for this change to take effect. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmResetSystemPrompt}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Reset to Default
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Anthropic Config Confirmation Dialog */}
        <AlertDialog open={showAnthropicConfirm} onOpenChange={setShowAnthropicConfirm}>
          <AlertDialogContent className="bg-card border-border text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Confirm Save Anthropic Configuration
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                These changes won&apos;t take effect until you manually restart the application.
                Save now?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmSaveAnthropicConfig}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save Configuration
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
