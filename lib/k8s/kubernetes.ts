import * as k8s from '@kubernetes/client-node'

import { getKubeconfigContent, KubeconfigRequiredError } from '@/lib/kubeconfig'

export class KubernetesService {
  readonly kubeConfig: k8s.KubeConfig
  readonly namespace: string

  constructor(content: string) {
    const kubeConfig = new k8s.KubeConfig()
    kubeConfig.loadFromString(content)

    const context = kubeConfig.getContextObject(kubeConfig.getCurrentContext())
    if (!context) {
      throw new Error('The saved kubeconfig has no current context.')
    }

    this.kubeConfig = kubeConfig
    this.namespace = context.namespace || 'default'
  }

  makeApiClient<T extends k8s.ApiType>(apiClient: k8s.ApiConstructor<T>): T {
    return this.kubeConfig.makeApiClient(apiClient)
  }
}

export async function getK8sServiceForUser(userId: string): Promise<KubernetesService> {
  const content = await getKubeconfigContent(userId)
  if (!content) {
    throw new KubeconfigRequiredError()
  }

  return new KubernetesService(content)
}
