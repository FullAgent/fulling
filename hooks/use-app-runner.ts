import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const BASE_DIR = '/home/fulling/next';

function buildSkillPrompt(repoUrl?: string) {
  void repoUrl;
  return '/fulling-deploy';
}

export function useAppRunner(
  sandboxId: string | undefined,
  deployDir: string = './',
  repoUrl?: string
) {
  const [isRunningSkill, setIsRunningSkill] = useState(false);

  // Calculate workdir based on deployDir
  const workdir = useMemo(() => {
    if (deployDir === './' || deployDir === '.') {
      return BASE_DIR;
    }
    // Remove leading ./ if present and join with base dir
    const relativePath = deployDir.replace(/^\.\//, '');
    return `${BASE_DIR}/${relativePath}`;
  }, [deployDir]);

  const runDeploySkill = useCallback(async () => {
    if (!sandboxId || isRunningSkill) return;

    setIsRunningSkill(true);
    try {
      const prompt = buildSkillPrompt(repoUrl);
      const response = await fetch(`/api/sandbox/${sandboxId}/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `claude -p ${JSON.stringify(prompt)}`,
          workdir,
        }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Deploy Prep Started', {
          description: 'The /fulling-deploy skill is running in the sandbox background.',
        });
      } else {
        toast.error('Failed to Start Deploy Prep', {
          description: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('Failed to start deploy prep skill:', error);
      toast.error('Failed to Start Deploy Prep', {
        description: 'Network error, please try again',
      });
    } finally {
      setIsRunningSkill(false);
    }
  }, [sandboxId, isRunningSkill, repoUrl, workdir]);

  return {
    isRunningSkill,
    runDeploySkill,
  };
}
