/**
 * check_issue — Checks GitHub directly for known issues matching an error.
 *
 * IMPORTANT: This is a last-resort tool. The agent should:
 *   1. Try to fix the error itself (2 retries)
 *   2. Consult the tool's documentation (2 more retries)
 *   3. ONLY THEN call check_issue (pass retry_count≥4, docs_consulted=true)
 *
 * This prevents spamming the GitHub API for errors that are config issues,
 * environment problems, or things the docs would explain.
 *
 * Flow:
 *   1. Gate: enforce retry + docs requirements
 *   2. Look up tool's github_url in Memgraph
 *   3. Search GitHub Issues API directly (no local DB — live data)
 *   4. Also search for PRs that may fix the issue
 *   5. Return one of four statuses:
 *      - not_found:           no matching issue on GitHub → agent handles it
 *      - fix_in_progress:     open issue + open PR exists → track PR
 *      - known_issue_no_fix:  open issue, no PR → gist + ask user intent
 *      - fixed_in_version:    closed issue → which version fixed it
 *   6. In real-issue cases (3/4): add 👍 reaction to the issue via GitHub API
 */

import { config } from '@toolpilot/config';
import { MemgraphToolRepository } from '@toolpilot/graph';
import pino from 'pino';
import { errResult, okResult } from '../utils.js';

const logger = pino({ name: '@toolpilot/mcp-server:check-issue' });
const repo = new MemgraphToolRepository();

const DOCS_RETRY_THRESHOLD = 4; // total retries before check_issue is appropriate

// ─── GitHub API helpers ───────────────────────────────────────────────────────

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  pull_request?: { merged_at: string | null; html_url: string };
  labels: Array<{ name: string }>;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  reactions?: { '+1': number; total_count: number };
}

interface GitHubSearchResult {
  total_count: number;
  items: GitHubIssue[];
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (config.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${config.GITHUB_TOKEN}`;
  }
  return headers;
}

async function searchGitHubIssues(
  owner: string,
  repoName: string,
  query: string,
  type: 'issue' | 'pr',
): Promise<GitHubIssue[]> {
  const q = encodeURIComponent(`${query} repo:${owner}/${repoName} type:${type}`);
  const url = `https://api.github.com/search/issues?q=${q}&sort=relevance&per_page=5`;

  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) {
    if (res.status === 422 || res.status === 403) return []; // rate limit or bad query
    throw new Error(`GitHub Search API error: ${res.status}`);
  }
  const data = (await res.json()) as GitHubSearchResult;
  return data.items ?? [];
}

async function addReaction(owner: string, repoName: string, issueNumber: number): Promise<boolean> {
  if (!config.GITHUB_TOKEN) return false; // reactions require auth
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNumber}/reactions`,
      {
        method: 'POST',
        headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '+1' }),
      },
    );
    return res.ok || res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Extract a concise gist from an issue (title + key labels + first 500 chars of body).
 */
function buildIssueGist(issue: GitHubIssue): string {
  const labels = issue.labels.map((l) => l.name).join(', ');
  const bodySnippet = (issue.body ?? '').slice(0, 500).replace(/\r?\n/g, ' ');
  return [
    `Title: ${issue.title}`,
    labels ? `Labels: ${labels}` : null,
    bodySnippet
      ? `Description: ${bodySnippet}${issue.body && issue.body.length > 500 ? '...' : ''}`
      : null,
    `State: ${issue.state}`,
    `Comments: ${issue.comments}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Parse owner/repo from a GitHub URL.
 */
function parseGitHubRepo(githubUrl: string): { owner: string; repo: string } | null {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (!match) return null;
  return { owner: match[1]!, repo: (match[2] ?? '').replace(/\.git$/, '') };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function handleCheckIssue(args: {
  tool_name: string;
  issue_title: string;
  retry_count?: number;
  docs_consulted?: boolean;
  issue_url?: string;
}) {
  try {
    const retryCount = args.retry_count ?? 0;
    const docsConsulted = args.docs_consulted ?? false;

    logger.info(
      { tool_name: args.tool_name, issue_title: args.issue_title, retryCount, docsConsulted },
      'check_issue called',
    );

    // ── Gate: enforce "docs first, then issues" protocol ─────────────────────
    if (retryCount < DOCS_RETRY_THRESHOLD || !docsConsulted) {
      const nextStep = !docsConsulted
        ? "Consult the documentation link in the tool's prompt_hint before calling check_issue. Read the changelog and README carefully — most errors are config or version issues."
        : `Retry at least ${DOCS_RETRY_THRESHOLD} times total before checking GitHub issues. You have tried ${retryCount} time(s).`;

      return okResult({
        status: 'too_early',
        message: 'check_issue is a last resort. Exhaust documentation and retries first.',
        retry_count: retryCount,
        docs_consulted: docsConsulted,
        next_step: nextStep,
        agent_instructions: [
          '1. Try to fix the error yourself (up to 2 retries).',
          "2. Read the tool's documentation — use the docs_url/readme_url from search_tools results.",
          '3. Apply documentation guidance and retry (up to 2 more retries).',
          '4. Only call check_issue after 4+ total retries AND docs_consulted=true.',
        ].join(' '),
      });
    }

    // ── Look up tool in Memgraph to get github_url ────────────────────────────
    const toolResult = await repo.findByName(args.tool_name);
    if (!toolResult.ok) {
      return errResult('db_error', toolResult.error.message);
    }
    if (!toolResult.data) {
      return errResult(
        'tool_not_found',
        `Tool '${args.tool_name}' is not in the ToolPilot index. Try search_tools to find the correct tool name.`,
      );
    }
    const tool = toolResult.data;

    const parsed = parseGitHubRepo(tool.github_url);
    if (!parsed) {
      return errResult('parse_error', `Cannot parse GitHub repo from: ${tool.github_url}`);
    }
    const { owner, repo: repoName } = parsed;

    // ── Search GitHub Issues + PRs directly ──────────────────────────────────
    logger.info({ owner, repo: repoName, query: args.issue_title }, 'Searching GitHub issues');

    const [issues, prs] = await Promise.all([
      searchGitHubIssues(owner, repoName, args.issue_title, 'issue'),
      searchGitHubIssues(owner, repoName, args.issue_title, 'pr'),
    ]);

    // ── CASE 1: Nothing found ─────────────────────────────────────────────────
    if (issues.length === 0 && prs.length === 0) {
      return okResult({
        status: 'not_found',
        tool: args.tool_name,
        message: `No matching issue found on GitHub for '${args.tool_name}'. The problem may be specific to your environment or configuration.`,
        github_issues_url: `${tool.github_url}/issues`,
        agent_instructions: [
          'No known GitHub issue matches this error.',
          'Investigate: (1) environment/config differences, (2) version mismatch, (3) incorrect usage pattern.',
          'Re-read the documentation section relevant to this error.',
          'Consider searching GitHub manually with different keywords.',
        ].join(' '),
      });
    }

    // Find the most relevant open issue
    const openIssues = issues.filter((i) => i.state === 'open');
    const closedIssues = issues.filter((i) => i.state === 'closed');
    const topIssue = openIssues[0] ?? closedIssues[0];

    // Find related open PRs (not merged yet)
    const openPrs = prs.filter((pr) => pr.state === 'open');
    const mergedPrs = prs.filter((pr) => pr.pull_request?.merged_at != null);
    const topPr = openPrs[0] ?? mergedPrs[0];

    // ── CASE 4: Fixed in a closed issue + merged PR ───────────────────────────
    if (!topIssue || topIssue.state === 'closed') {
      const fixInfo = mergedPrs[0]
        ? `PR #${mergedPrs[0].number} was merged: ${mergedPrs[0].html_url}`
        : `Issue was closed: ${topIssue?.html_url ?? `${tool.github_url}/issues`}`;

      return okResult({
        status: 'fixed_in_version',
        tool: args.tool_name,
        issue: topIssue
          ? {
              number: topIssue.number,
              title: topIssue.title,
              github_url: topIssue.html_url,
              closed_at: topIssue.closed_at,
            }
          : null,
        fix_info: fixInfo,
        message: `This issue appears to have been fixed. ${fixInfo}`,
        agent_instructions:
          'Update the tool to the latest version to get this fix. Check the PR/release notes for the specific version.',
      });
    }

    // ── Add 👍 reaction to the issue (signal that others have hit this too) ───
    const reactionAdded = await addReaction(owner, repoName, topIssue.number);
    logger.info({ issue: topIssue.number, reactionAdded }, 'Attempted to add 👍 reaction to issue');

    // ── CASE 2: Open issue + open PR exists ───────────────────────────────────
    if (topPr && topPr.state === 'open') {
      return okResult({
        status: 'fix_in_progress',
        tool: args.tool_name,
        issue: {
          number: topIssue.number,
          title: topIssue.title,
          github_url: topIssue.html_url,
          gist: buildIssueGist(topIssue),
        },
        pr: {
          number: topPr.number,
          title: topPr.title,
          github_url: topPr.html_url,
          state: 'open',
        },
        reaction_added: reactionAdded,
        message: `Known issue — a fix is in progress (PR #${topPr.number}). Your 👍 reaction was ${reactionAdded ? 'added' : 'not added (no GitHub token)'} to signal impact.`,
        agent_instructions:
          'A fix is in progress. Consider: (1) checking if a pre-release/nightly build has the fix, (2) applying a temporary workaround, (3) tracking the PR for a stable release.',
      });
    }

    // ── CASE 3: Open issue, no PR ─────────────────────────────────────────────
    return okResult({
      status: 'known_issue_no_fix',
      tool: args.tool_name,
      issue: {
        number: topIssue.number,
        title: topIssue.title,
        github_url: topIssue.html_url,
        state: topIssue.state,
        comments: topIssue.comments,
        created_at: topIssue.created_at,
        gist: buildIssueGist(topIssue),
      },
      reaction_added: reactionAdded,
      other_matching_issues: openIssues.slice(1, 3).map((i) => ({
        number: i.number,
        title: i.title,
        github_url: i.html_url,
      })),
      message: `Known open issue (#${topIssue.number}): "${topIssue.title}". Your 👍 reaction was ${reactionAdded ? 'added' : 'not added'} to signal impact.`,
      user_action_required: {
        question:
          'What would you like to do? Options: (a) Create a new issue report if your case has additional detail, (b) Handle it later, (c) Ignore.',
        if_create_issue:
          "Ask the agent to generate an issue template — you can copy and paste it to GitHub manually. The agent will follow the repo's issue template format.",
        github_new_issue_url: `${tool.github_url}/issues/new`,
      },
      agent_instructions: [
        `Issue #${topIssue.number} is open with no fix yet.`,
        'Ask the user whether they want to: (a) create a new issue, (b) handle it later, (c) ignore.',
        "If user wants to create an issue: generate a detailed issue template using the repo's issue format, present it for the user to copy-paste manually.",
        'Do NOT auto-submit any GitHub issue — always require explicit user action.',
        'In the meantime, explore workarounds: different config, version pinning, or alternative approaches.',
      ].join(' '),
    });
  } catch (e) {
    logger.error({ err: e, tool_name: args.tool_name }, 'check_issue failed');
    return errResult('internal_error', e instanceof Error ? e.message : String(e));
  }
}
