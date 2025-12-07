export function isK8sNotFound(error: unknown): boolean {
   
  const e = error as any
  const code = e?.code ?? e?.statusCode ?? e?.response?.statusCode
  return code === 404
}
