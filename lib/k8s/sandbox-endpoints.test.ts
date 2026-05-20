import assert from 'node:assert/strict'
import test from 'node:test'

let buildSandboxUrls:
  | ((
      input: {
        sandboxName: string
        ingressDomain: string
        ttydAccessToken?: string
      }
    ) => {
      publicUrl: string
      ttydUrl: string
      fileBrowserUrl: string
      editorUrl: string
    })
  | undefined

try {
  ;({ buildSandboxUrls } = await import('./sandbox-endpoints.ts'))
} catch {
  buildSandboxUrls = undefined
}

test('buildSandboxUrls returns editor endpoint and ttyd tokenized URL', () => {
  assert.equal(typeof buildSandboxUrls, 'function')

  const urls = buildSandboxUrls?.({
    sandboxName: 'demo-sandbox',
    ingressDomain: 'example.com',
    ttydAccessToken: 'terminal-secret',
  })

  assert.deepEqual(urls, {
    publicUrl: 'https://demo-sandbox-app.example.com',
    ttydUrl: 'https://demo-sandbox-ttyd.example.com?arg=terminal-secret',
    fileBrowserUrl: 'https://demo-sandbox-filebrowser.example.com',
    editorUrl: 'https://demo-sandbox-editor.example.com',
  })
})

test('buildSandboxUrls omits ttyd query when no token is available', () => {
  assert.equal(typeof buildSandboxUrls, 'function')

  const urls = buildSandboxUrls?.({
    sandboxName: 'demo-sandbox',
    ingressDomain: 'example.com',
  })

  assert.equal(urls?.ttydUrl, 'https://demo-sandbox-ttyd.example.com')
  assert.equal(urls?.editorUrl, 'https://demo-sandbox-editor.example.com')
})
