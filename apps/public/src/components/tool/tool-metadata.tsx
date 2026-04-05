import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ToolMetadataProps {
  language: string;
  languages: string[];
  license: string;
  deploymentModels: string[];
  packageManagers: Record<string, string>;
}

const deploymentLabels: Record<string, string> = {
  'self-hosted': 'Self-Hosted',
  cloud: 'Cloud',
  embedded: 'Embedded',
  serverless: 'Serverless',
};

export function ToolMetadata({
  language,
  languages,
  license,
  deploymentModels,
  packageManagers,
}: ToolMetadataProps) {
  const secondaryLanguages = languages.filter((l) => l !== language);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Metadata
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {/* Primary Language */}
          {language && (
            <Badge className="bg-[var(--tp-accent-subtle)] text-[var(--tp-accent)] border-[var(--tp-accent)]/20">
              {language}
            </Badge>
          )}

          {/* Secondary Languages */}
          {secondaryLanguages.map((lang) => (
            <Badge key={lang} variant="secondary">
              {lang}
            </Badge>
          ))}

          {/* License */}
          {license && <Badge variant="outline">{license}</Badge>}

          {/* Deployment Models */}
          {deploymentModels.map((model) => (
            <Badge key={model} variant="secondary">
              {deploymentLabels[model] ?? model}
            </Badge>
          ))}
        </div>

        {/* Package Install Commands */}
        {Object.keys(packageManagers).length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Install
            </span>
            <div className="flex flex-col gap-1.5">
              {Object.entries(packageManagers).map(([manager, command]) => (
                <code
                  key={manager}
                  className={cn(
                    'rounded-md border border-border bg-muted px-3 py-1.5 font-mono text-xs text-foreground',
                  )}
                >
                  {command}
                </code>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
