import {
  MdCheckCircleOutline,
  MdLockOutline,
  MdOutlineShield,
} from 'react-icons/md';
import Image from 'next/image';
import Link from 'next/link';

const navItems = ['Product', 'Templates', 'Solutions', 'Resources', 'Pricing'];

const proofItems = [
  {
    icon: MdOutlineShield,
    title: 'Enterprise ready',
    detail: 'SSO, RBAC, audit logs',
  },
  {
    icon: MdLockOutline,
    title: 'Your data, your control',
    detail: 'Private by default',
  },
  {
    icon: MdCheckCircleOutline,
    title: 'Built for reliability',
    detail: 'Observability & retries',
  },
];

/**
 * Landing page shell.
 */
export function LandingClient() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fbfbfa] font-[family-name:var(--font-heading)] text-[#05070c]">
      <div className="min-h-screen bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[length:64px_64px]">
        <LandingHeader />

        <main className="flex min-h-[calc(100vh-70px)] flex-col lg:h-[calc(100vh-70px)] lg:min-h-0">
          <section className="relative flex flex-1 overflow-hidden lg:min-h-0">
            <div className="relative z-10 flex w-full flex-col justify-center px-7 pb-10 pt-12 sm:px-10 lg:w-[43%] lg:justify-start lg:px-[60px] lg:pb-[54px] lg:pt-[93px]">
              <div className="mb-[27px] inline-flex w-fit items-center gap-2 rounded-full border border-[#dfe5e8] bg-white/72 px-3.5 py-2 text-[15px] font-medium text-[#465260] shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
                <span className="flex size-4 items-center justify-center rounded-full bg-[#dff7e8]">
                  <span className="size-2 rounded-full bg-[#2fc36d]" />
                </span>
                Workspace OS for teams
              </div>

              <h1 className="max-w-[500px] text-[clamp(4rem,5.4vw,5.7rem)] font-bold leading-[1.04] tracking-[-0.04em] text-[#03050a]">
                Ship AI
                <br />
                workspaces,
                <br />
                not prompts
              </h1>

              <p className="mt-[18px] max-w-[520px] font-[family-name:var(--font-body)] text-[21px] font-medium leading-[1.45] tracking-[-0.01em] text-[#485568]">
                Build, run, and share AI workspaces as products.
                <br />
                Versioned. Reliable. Governed.
              </p>

              <div className="mt-[30px] flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-[60px] items-center justify-center rounded-[8px] bg-[#020712] px-6 text-[17px] font-semibold text-white shadow-[0_18px_45px_rgba(2,7,18,0.18)] transition hover:bg-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#020712]"
                >
                  Create workspace
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-[60px] items-center justify-center rounded-[8px] border border-[#cbd5df] bg-white/65 px-7 text-[17px] font-semibold text-[#111827] shadow-[0_10px_30px_rgba(15,23,42,0.025)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fa1b3]"
                >
                  View templates
                </Link>
              </div>

              <div className="mt-14 grid max-w-[580px] grid-cols-1 gap-5 sm:grid-cols-3 lg:mt-[59px]">
                {proofItems.map((item) => (
                  <div key={item.title} className="flex min-w-0 items-start gap-3">
                    <item.icon className="mt-0.5 size-7 shrink-0 text-[#354052]" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-tight text-[#111827]">
                        {item.title}
                      </p>
                      <p className="mt-1 font-[family-name:var(--font-body)] text-[12px] font-medium leading-tight text-[#6b7280]">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[62%] lg:block">
              <div className="absolute right-[51px] top-[45px] w-[min(58vw,885px)] [mask-image:linear-gradient(to_bottom,transparent_0,black_5%,black_94%,transparent_100%)]">
                <Image
                  src="/images/landing-workspace-concept.png"
                  alt="A conceptual AI workspace assembled from mission, knowledge, skills, runtime, scripts, memory, and sharing pieces."
                  width={885}
                  height={620}
                  priority
                  className="w-full max-w-none select-none [mask-image:linear-gradient(to_right,transparent_0,black_5%,black_100%)]"
                />
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-20 bg-gradient-to-t from-[#fbfbfa] to-transparent lg:block" />
          </section>
        </main>
      </div>
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="flex h-[70px] items-center border-b border-[#e3e7eb] bg-white/74 px-7 backdrop-blur-md sm:px-10 lg:pl-[38px] lg:pr-[50px]">
      <div className="flex w-full items-center">
        <Link
          href="/"
          className="text-[31px] font-bold leading-none tracking-[-0.045em] text-[#05070c]"
        >
          Fulling
        </Link>

        <nav
          className="ml-[113px] hidden items-center gap-[34px] text-[14px] font-medium tracking-[-0.01em] text-[#080b12] lg:flex"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <Link key={item} href="/login" className="transition hover:text-[#3b82a0]">
              {item}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center justify-end gap-7">
          <Link
            href="/login"
            className="hidden text-[14px] font-medium tracking-[-0.01em] text-[#080b12] transition hover:text-[#3b82a0] sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="inline-flex h-[38px] items-center justify-center rounded-[7px] bg-[#020712] px-6 text-[14px] font-semibold text-white shadow-[0_14px_35px_rgba(2,7,18,0.16)] transition hover:bg-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#020712]"
          >
            Create workspace
          </Link>
        </div>
      </div>
    </header>
  );
}
