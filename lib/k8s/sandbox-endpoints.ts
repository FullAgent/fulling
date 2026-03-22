export interface BuildSandboxUrlsInput {
  sandboxName: string
  ingressDomain: string
  ttydAccessToken?: string
}

export interface SandboxUrls {
  publicUrl: string
  ttydUrl: string
  fileBrowserUrl: string
  editorUrl: string
}

export function buildSandboxUrls({
  sandboxName,
  ingressDomain,
  ttydAccessToken,
}: BuildSandboxUrlsInput): SandboxUrls {
  const publicUrl = `https://${sandboxName}-app.${ingressDomain}`
  const ttydBaseUrl = `https://${sandboxName}-ttyd.${ingressDomain}`
  const ttydUrl = ttydAccessToken ? `${ttydBaseUrl}?arg=${ttydAccessToken}` : ttydBaseUrl

  return {
    publicUrl,
    ttydUrl,
    fileBrowserUrl: `https://${sandboxName}-filebrowser.${ingressDomain}`,
    editorUrl: `https://${sandboxName}-editor.${ingressDomain}`,
  }
}
