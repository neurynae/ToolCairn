'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MenuIcon, GithubIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/explore', label: 'Explore Tools' },
  { href: '/compare', label: 'Compare' },
  { href: '/stack', label: 'Stack Builder' },
  { href: '/compatibility', label: 'Compatibility' },
  { href: '/docs', label: 'Docs' },
  { href: '/about', label: 'How it works' },
] as const;

interface MobileNavProps {
  onOpenSearch?: () => void;
}

export function MobileNav({ onOpenSearch }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="sm:hidden text-muted-foreground"
            aria-label="Open navigation menu"
          />
        }
      >
        <MenuIcon className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight"
              onClick={() => setOpen(false)}
            >
              <Logo size="xs" />
              ToolCairn
            </Link>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1 p-3">
          {/* Search trigger */}
          {onOpenSearch && (
            <SheetClose
              render={
                <Button
                  variant="outline"
                  className="mb-1 w-full justify-start gap-2 text-muted-foreground"
                  onClick={onOpenSearch}
                />
              }
            >
              <SearchIcon className="size-4" />
              Search tools...
              <kbd className="ml-auto rounded border border-border bg-muted px-1.5 text-xs">
                ⌘K
              </kbd>
            </SheetClose>
          )}

          {/* Nav links */}
          {NAV_LINKS.map((link) => (
            <SheetClose
              key={link.href}
              render={
                <Link
                  href={link.href}
                  className={cn(
                    'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                />
              }
            >
              {link.label}
            </SheetClose>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-3 p-4">
          <a
            href="https://github.com/NEURYNAE/ToolCairn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            <GithubIcon className="size-4" />
            GitHub
          </a>

          <div className="flex items-center justify-between px-3">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
