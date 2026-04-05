'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LightbulbIcon, CheckCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { AmbientBackground } from '@/components/layout/ambient-background';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCommandPalette } from '@/components/providers/command-palette-provider';

function SuggestContent() {
  const searchParams = useSearchParams();
  const [toolName, setToolName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName.trim() || !githubUrl.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion_type: 'new_tool',
          node_type: 'tool',
          node_data: {
            name: toolName.trim().toLowerCase().replace(/\s+/g, '-'),
            display_name: toolName.trim(),
            github_url: githubUrl.trim(),
            description: description.trim(),
          },
          confidence: 0.7,
          source: 'user_report',
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        toast.success('Suggestion submitted — thanks!');
      } else {
        toast.error('Submission failed. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--tp-health-active)]/15">
          <CheckCircleIcon className="size-8 text-[var(--tp-health-active)]" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Suggestion received!</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          We&apos;ll review it and add it to the graph if it meets our quality criteria. Thanks for helping improve ToolCairn.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Suggest another
        </Button>
      </div>
    );
  }

  const prefilledType = searchParams.get('type') ?? 'new_tool';
  void prefilledType; // we only support new_tool for now

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LightbulbIcon className="size-5 text-[var(--tp-accent)]" />
          Suggest a Tool
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Know a tool that should be in the ToolCairn index? Submit it for review.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tool-name">Tool name *</Label>
            <input
              id="tool-name"
              type="text"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              placeholder="e.g. Drizzle ORM"
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="github-url">GitHub URL *</Label>
            <input
              id="github-url"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/drizzle-team/drizzle-orm"
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Brief description (optional)</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this tool do? Why should it be indexed?"
              rows={3}
              className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
            />
          </div>
          <Button type="submit" disabled={loading || !toolName.trim() || !githubUrl.trim()}>
            {loading ? 'Submitting...' : 'Submit Suggestion'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            All suggestions are reviewed before being added to the graph.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SuggestPage() {
  const { toggle } = useCommandPalette();

  return (
    <>
      <AmbientBackground />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader onOpenSearch={toggle} />
        <main className="flex-1">
          <section className="mx-auto max-w-4xl px-4 pb-20 pt-12 sm:px-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Community Contributions
              </h1>
              <p className="mt-2 text-muted-foreground">
                Help grow the ToolCairn index by suggesting tools and relationships.
              </p>
            </div>
            <Suspense>
              <SuggestContent />
            </Suspense>
          </section>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
