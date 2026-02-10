import { MdTerminal, MdCheck, MdArrowOutward, MdAutoAwesome } from 'react-icons/md';

export function TerminalDemo() {
  return (
    <div className="hidden lg:flex w-1/2 h-full bg-card border-l border-border relative items-center justify-center p-12 overflow-hidden [background-size:30px_30px] [background-image:linear-gradient(to_right,rgb(255_255_255/0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.03)_1px,transparent_1px)]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]" />

      {/* Terminal Window */}
      <div className="w-full max-w-2xl bg-background rounded-xl border border-border shadow-2xl shadow-black/50 overflow-hidden [transform:perspective(1000px)_rotateY(-2deg)] transition-all hover:[transform:rotateY(0)] duration-700 group">
        {/* Title Bar */}
        <div className="bg-card px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E] shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-sm" />
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <MdTerminal className="text-[14px]" />
            <span className="text-xs font-mono text-muted-foreground">Fulling — zsh</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Terminal Content */}
        <div className="p-6 font-mono text-sm leading-relaxed min-h-[500px] relative">
          {/* Command Input */}
          <div className="flex items-start mb-4">
            <div className="mr-3 pt-0.5">
              <MdAutoAwesome className="text-brand-claude text-[18px]" />
            </div>
            <div className="text-foreground">
              <span className="text-muted-foreground text-xs block mb-1">~/projects</span>
              <span className="text-brand-claude font-bold">claude</span> &quot;Build a personal blog
              with Next.js 16 and Payload CMS&quot;
            </div>
          </div>

          {/* Progress Steps */}
          <div className="pl-8 mb-6 relative border-l border-border/50 ml-2.5">
            <div className="text-muted-foreground/60 text-xs ml-5 mb-4 space-y-1 font-mono">
              <div className="flex items-center gap-2 text-foreground/40">
                <span className="text-primary">→</span> Initializing project structure...
              </div>
              <div className="flex items-center gap-2 text-foreground/40">
                <span className="text-primary">→</span> Creating payload.config.ts...
              </div>
              <div className="flex items-center gap-2 text-foreground/40">
                <span className="text-primary">→</span> Setting up Next.js 16 App Router...
              </div>
            </div>
          </div>

          {/* File Tree */}
          <div className="pl-8 mb-6">
            <div className="bg-card rounded-md border border-border/50 p-4 text-[11px] font-mono leading-tight mb-4 shadow-inner">
              <div className="text-muted-foreground/30 mb-2"># Generated file tree</div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                <FileEntry name="payload.config.ts" />
                <FileEntry name="src/app/page.tsx" />
                <FileEntry name="src/payload/blocks/*" />
                <FileEntry name="src/components/Post.tsx" />
                <FileEntry name="src/app/(payload)/admin" />
                <FileEntry name="src/collections/Users.ts" />
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground/50">
                ... and 14 other files created.
              </div>
            </div>

            {/* Check Items */}
            <div className="space-y-1.5 mb-6">
              <CheckItem text="Next.js 16 environment configured" />
              <CheckItem text="Payload CMS admin panel ready" />
              <CheckItem text="Database connection established (PostgreSQL)" />
              <CheckItem text="Deployment pipeline triggered" />
            </div>

            {/* Success Card */}
            <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-4 animate-fade-in shadow-[0_0_20px_rgba(74,222,128,0.1)] backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,1)] animate-pulse" />
                <div className="flex-1">
                  <div className="text-green-400 font-bold text-sm mb-1 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)] tracking-wide">
                    Success! Your Blog is live
                  </div>
                  <span className="text-green-400 text-xs flex items-center gap-1 font-medium">
                    Live at your-blog-on.sealos.app
                    <MdArrowOutward className="text-[14px]" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Waiting Input */}
          <div className="flex items-center mt-6 pt-4 border-t border-border/50 opacity-80">
            <div className="mr-3 pt-0.5">
              <MdAutoAwesome className="text-brand-claude text-[18px]" />
            </div>
            <div className="text-foreground flex items-center">
              <span className="mr-2">Add a dark mode toggle to the navbar</span>
              <span className="w-2.5 h-5 bg-brand-claude cursor-blink" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileEntry({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-green-400 font-bold">+</span>
      <span className="text-foreground">{name}</span>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <MdCheck className="text-[14px] text-green-400" />
      <span className="text-foreground">{text}</span>
    </div>
  );
}

