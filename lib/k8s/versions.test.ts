import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('VERSIONS.RUNTIME_IMAGE defaults to the GHCR runtime image', () => {
  const source = readFileSync(new URL('./versions.ts', import.meta.url), 'utf8')
  assert.match(
    source,
    /RUNTIME_IMAGE:\s*env\.RUNTIME_IMAGE\s*\|\|\s*'ghcr\.io\/fullagent\/fullstack-web-runtime:latest'/
  )
})

test('VERSIONS.RUNTIME_IMAGE respects environment overrides', () => {
  const source = readFileSync(new URL('./versions.ts', import.meta.url), 'utf8')
  assert.match(source, /env\.RUNTIME_IMAGE/)
})
