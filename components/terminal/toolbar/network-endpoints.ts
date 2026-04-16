export interface NetworkCredentialField {
  id: string
  label: string
  value: string
  secret?: boolean
}

export interface NetworkEndpoint {
  domain: string
  port: number
  protocol: string
  label: string
  credentials?: NetworkCredentialField[]
}

interface BuildNetworkEndpointsInput {
  sandbox?: {
    publicUrl?: string | null
    ttydUrl?: string | null
    fileBrowserUrl?: string | null
    editorUrl?: string | null
  }
  fileBrowserCredentials?: {
    username: string
    password: string
  }
  editorPassword?: string
}

export function buildNetworkEndpoints({
  sandbox,
  fileBrowserCredentials,
  editorPassword,
}: BuildNetworkEndpointsInput): NetworkEndpoint[] {
  const endpoints: Array<NetworkEndpoint | null> = [
    sandbox?.publicUrl
      ? {
          domain: sandbox.publicUrl,
          port: 3000,
          protocol: 'HTTPS',
          label: 'Application',
        }
      : null,
    sandbox?.ttydUrl
      ? {
          domain: sandbox.ttydUrl,
          port: 7681,
          protocol: 'HTTPS',
          label: 'Terminal',
        }
      : null,
    sandbox?.fileBrowserUrl
      ? {
          domain: sandbox.fileBrowserUrl,
          port: 8080,
          protocol: 'HTTPS',
          label: 'File Browser',
          credentials: fileBrowserCredentials
            ? [
                {
                  id: 'file-browser-username',
                  label: 'Username',
                  value: fileBrowserCredentials.username,
                },
                {
                  id: 'file-browser-password',
                  label: 'Password',
                  value: fileBrowserCredentials.password,
                  secret: true,
                },
              ]
            : undefined,
        }
      : null,
    sandbox?.editorUrl
      ? {
          domain: sandbox.editorUrl,
          port: 3773,
          protocol: 'HTTPS',
          label: 'Editor',
          credentials: editorPassword
            ? [
                {
                  id: 'editor-password',
                  label: 'Password',
                  value: editorPassword,
                  secret: true,
                },
              ]
            : undefined,
        }
      : null,
  ]

  return endpoints.filter((endpoint): endpoint is NetworkEndpoint => endpoint !== null)
}
