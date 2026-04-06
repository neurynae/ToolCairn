import Link from 'next/link';
import { GithubIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/ui/logo';

const FOOTER_SECTIONS = [
  {
    label: 'Product',
    links: [
      { href: '/explore', label: 'Explore Tools' },
      { href: '/compare', label: 'Compare' },
      { href: '/stack', label: 'Stack Builder' },
      { href: '/compatibility', label: 'Compatibility' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { href: '/docs', label: 'Documentation' },
      { href: '/docs/getting-started', label: 'Getting Started' },
      { href: '/about', label: 'How it Works' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
    ],
  },
  {
    label: 'Community',
    links: [
      {
        href: 'https://github.com/NEURYNAE/ToolCairn',
        label: 'GitHub',
        external: true,
      },
      { href: '/suggest', label: 'Suggest a Tool' },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <Logo size="xs" />
              ToolCairn
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              Graph-powered tool intelligence for AI agents and developers.
            </p>
            <a
              href="https://github.com/NEURYNAE/ToolCairn"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <GithubIcon className="size-3.5" />
              NEURYNAE/ToolCairn
            </a>
          </div>

          {/* Link sections */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                {section.label}
              </p>
              <ul className="flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NEURYNAE. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with a graph mind for developers.
          </p>
        </div>
      </div>
    </footer>
  );
}
