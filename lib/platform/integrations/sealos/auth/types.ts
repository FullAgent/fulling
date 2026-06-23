export interface SealosUserInfo {
  id: string
  name: string
  avatar: string
  k8sUsername: string
  nsid: string
}

export interface SealosAuthSession {
  token: string
  kubeconfig: string
  user: SealosUserInfo
  namespaceId: string
  cleanup: () => void
}
