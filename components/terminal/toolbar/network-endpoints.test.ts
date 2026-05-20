import assert from 'node:assert/strict'
import test from 'node:test'

let buildNetworkEndpoints:
  | ((
      input: {
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
    ) => Array<{
      label: string
      port: number
      domain: string
      credentials?: Array<{
        id: string
        label: string
        value: string
        secret?: boolean
      }>
    }>)
  | undefined

try {
  ;({ buildNetworkEndpoints } = await import('./network-endpoints.ts'))
} catch {
  buildNetworkEndpoints = undefined
}

test('buildNetworkEndpoints includes editor and file browser credentials', () => {
  assert.equal(typeof buildNetworkEndpoints, 'function')

  const endpoints = buildNetworkEndpoints?.({
    sandbox: {
      publicUrl: 'https://demo-app.example.com',
      ttydUrl: 'https://demo-ttyd.example.com?arg=ttyd-secret',
      fileBrowserUrl: 'https://demo-filebrowser.example.com',
      editorUrl: 'https://demo-editor.example.com',
    },
    fileBrowserCredentials: {
      username: 'fb-user',
      password: 'fb-secret',
    },
    editorPassword: 'editor-secret',
  })

  assert.deepEqual(endpoints, [
    {
      label: 'Application',
      port: 3000,
      domain: 'https://demo-app.example.com',
      protocol: 'HTTPS',
    },
    {
      label: 'Terminal',
      port: 7681,
      domain: 'https://demo-ttyd.example.com?arg=ttyd-secret',
      protocol: 'HTTPS',
    },
    {
      label: 'File Browser',
      port: 8080,
      domain: 'https://demo-filebrowser.example.com',
      protocol: 'HTTPS',
      credentials: [
        { id: 'file-browser-username', label: 'Username', value: 'fb-user' },
        { id: 'file-browser-password', label: 'Password', value: 'fb-secret', secret: true },
      ],
    },
    {
      label: 'Editor',
      port: 3773,
      domain: 'https://demo-editor.example.com',
      protocol: 'HTTPS',
      credentials: [
        { id: 'editor-password', label: 'Password', value: 'editor-secret', secret: true },
      ],
    },
  ])
})

test('buildNetworkEndpoints omits services that do not have URLs', () => {
  assert.equal(typeof buildNetworkEndpoints, 'function')

  const endpoints = buildNetworkEndpoints?.({
    sandbox: {
      publicUrl: null,
      ttydUrl: undefined,
      fileBrowserUrl: 'https://demo-filebrowser.example.com',
      editorUrl: null,
    },
  })

  assert.deepEqual(endpoints, [
    {
      label: 'File Browser',
      port: 8080,
      domain: 'https://demo-filebrowser.example.com',
      protocol: 'HTTPS',
      credentials: undefined,
    },
  ])
})
