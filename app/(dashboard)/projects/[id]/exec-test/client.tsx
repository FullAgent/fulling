'use client'

import { TtydExecTest } from '@/components/terminal/ttyd-exec-test'

interface TtydExecTestClientProps {
  ttydUrl: string
  accessToken: string
}

export function TtydExecTestClient({ ttydUrl, accessToken }: TtydExecTestClientProps) {
  return <TtydExecTest ttydUrl={ttydUrl} accessToken={accessToken} />
}