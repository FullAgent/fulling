import { getK8sServiceForUser } from '@/lib/k8s/k8s-service-helper'

/**
 * Resolves the default Kubernetes namespace for a Fulling user.
 *
 * Expected inputs:
 * - A valid Fulling user ID with KUBECONFIG already configured.
 *
 * Expected outputs:
 * - Returns the namespace string used for new platform resources.
 *
 * Out of scope:
 * - Does not create Kubernetes resources.
 * - Does not persist any control-plane state.
 */
export async function getUserDefaultNamespace(userId: string): Promise<string> {
  const k8sService = await getK8sServiceForUser(userId)
  return k8sService.getDefaultNamespace()
}
