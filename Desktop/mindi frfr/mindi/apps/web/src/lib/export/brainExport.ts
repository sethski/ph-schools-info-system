// =============================================================================
// MINDI — Brain Export Utility
// Generates JSON, Markdown, or SQLite exports of the user's brain.
// Privacy: encrypted node content exported as-is (user decrypts locally).
// Vendor lock-in prevention — full data portability per Trust Covenant.
// =============================================================================

import type { BrainNode, MindiUser } from '../../../../../shared/types';
import { EXPORT_CONFIG, REGIONS } from '../../../../../shared/constants';

// -----------------------------------------------------------------------------
// JSON Export — complete structured dump
// -----------------------------------------------------------------------------

export function exportAsJson(
  user: Partial<MindiUser>,
  nodes: BrainNode[]
): string {
  const payload = {
    _meta: {
      exportedBy: 'Mindi',
      exportedAt: new Date().toISOString(),
      version: '1.0',
      nodeCount: nodes.length,
      format: 'mindi-brain-json-v1',
    },
    user: {
      uid: user.uid,
      displayName: user.displayName,
      locale: user.locale,
      styleFingerprint: (user as any).styleFingerprint,
    },
    nodes: nodes.map((n) => ({
      id: n.id,
      region: n.region,
      title: n.title,
      content: n.content, // Encrypted nodes remain encrypted — user decrypts
      isEncrypted: n.isEncrypted,
      version: n.version,
      confidence: n.confidence,
      tags: n.tags,
      sourceRef: n.sourceRef,
      styleMetrics: n.styleMetrics,
      relatedNodeIds: n.relatedNodeIds,
      createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
      updatedAt: n.updatedAt instanceof Date ? n.updatedAt.toISOString() : n.updatedAt,
    })),
  };

  return EXPORT_CONFIG.JSON_PRETTY_PRINT
    ? JSON.stringify(payload, null, 2)
    : JSON.stringify(payload);
}

// -----------------------------------------------------------------------------
// Markdown Export — human-readable, region-organized
// -----------------------------------------------------------------------------

export function exportAsMarkdown(
  user: Partial<MindiUser>,
  nodes: BrainNode[]
): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const regionGroups: Record<string, BrainNode[]> = {};
  for (const node of nodes.filter((n) => !n.isArchived)) {
    if (!regionGroups[node.region]) regionGroups[node.region] = [];
    regionGroups[node.region].push(node);
  }

  const sections = Object.entries(regionGroups).map(([region, regionNodes]) => {
    const label = REGIONS[region as keyof typeof REGIONS]?.label ?? region;
    const nodeContent = regionNodes
      .map((n) => {
        const body = n.isEncrypted
          ? '*[Encrypted — decrypt locally to view]*'
          : n.content.slice(0, 800) + (n.content.length > 800 ? '…' : '');
        return `### ${n.title}\n**Confidence**: ${Math.round(n.confidence * 100)}%  \n**Version**: v${n.version}  \n**Source**: ${n.sourceRef?.fileName ?? 'unknown'}\n\n${body}`;
      })
      .join('\n\n---\n\n');

    return `## ${label} (${regionNodes.length} nodes)\n\n${nodeContent}`;
  });

  return EXPORT_CONFIG.MARKDOWN_TEMPLATE
    .replace('{{date}}', date)
    .replace('{{regions}}', Object.keys(regionGroups).join(', '))
    .replace('{{count}}', String(nodes.length))
    .replace('{{nodes}}', sections.join('\n\n---\n\n'));
}

// -----------------------------------------------------------------------------
// Client-side download trigger
// -----------------------------------------------------------------------------

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function triggerJsonExport(user: Partial<MindiUser>, nodes: BrainNode[]): void {
  const json = exportAsJson(user, nodes);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(json, `mindi-brain-${date}.json`, 'application/json');
}

export function triggerMarkdownExport(user: Partial<MindiUser>, nodes: BrainNode[]): void {
  const md = exportAsMarkdown(user, nodes);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(md, `mindi-brain-${date}.md`, 'text/markdown');
}
