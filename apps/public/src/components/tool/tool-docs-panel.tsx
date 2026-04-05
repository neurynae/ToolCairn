import { ExternalLinkIcon, BookOpenIcon, CodeIcon, ClockIcon, FileTextIcon, GithubIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ToolDocsPanelProps {
  docs: {
    readme_url?: string;
    docs_url?: string;
    api_url?: string;
    changelog_url?: string;
  };
  githubUrl: string;
}

const DOC_LINKS = [
  { key: 'docs_url' as const, label: 'Official Docs', Icon: BookOpenIcon },
  { key: 'api_url' as const, label: 'API Reference', Icon: CodeIcon },
  { key: 'changelog_url' as const, label: 'Changelog', Icon: ClockIcon },
  { key: 'readme_url' as const, label: 'README', Icon: FileTextIcon },
] as const;

export function ToolDocsPanel({ docs, githubUrl }: ToolDocsPanelProps) {
  const links = [
    ...DOC_LINKS.map(({ key, label, Icon }) => ({
      label,
      url: docs[key],
      Icon,
    })),
    { label: 'GitHub', url: githubUrl, Icon: GithubIcon },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Documentation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="flex flex-col">
          {links.map(({ label, url, Icon }) => {
            const available = Boolean(url);
            return (
              <li key={label} className="border-b border-border last:border-0">
                {available ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Icon className="size-4 shrink-0 text-[var(--tp-accent)]" aria-hidden="true" />
                    {label}
                    <ExternalLinkIcon className="ml-auto size-3 text-muted-foreground" />
                  </a>
                ) : (
                  <span
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 text-sm font-medium',
                      'cursor-not-allowed text-muted-foreground opacity-40',
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {label}
                    <span className="ml-auto text-xs">—</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
