import type { TopologyRow } from '@toolpilot/graph';
import { describe, expect, it } from 'vitest';
import { mapTopologyRows } from './graph-topology.js';

function makeRow(overrides: Partial<TopologyRow> = {}): TopologyRow {
  return {
    sourceId: 'tool-a',
    sourceName: 'tool-a',
    sourceDisplayName: 'Tool A',
    sourceCategory: 'ai',
    sourceMaintenanceScore: 0.8,
    sourceStars: 100,
    targetId: null,
    edgeType: null,
    baseWeight: null,
    effectiveWeight: null,
    confidence: null,
    edgeSource: null,
    ...overrides,
  };
}

describe('mapTopologyRows', () => {
  it('returns empty result for empty input', () => {
    const result = mapTopologyRows([]);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.stats.totalNodes).toBe(0);
  });

  it('includes isolated node (targetId = null)', () => {
    const rows = [makeRow()];
    const result = mapTopologyRows(rows);
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
    expect(result.nodes[0]?.id).toBe('tool-a');
  });

  it('deduplicates nodes across multiple edge rows', () => {
    const rows = [
      makeRow({
        targetId: 'tool-b',
        edgeType: 'SIMILAR_TO',
        baseWeight: 0.9,
        effectiveWeight: 0.8,
        confidence: 0.9,
        edgeSource: 'manual',
      }),
      makeRow({
        targetId: 'tool-c',
        edgeType: 'SIMILAR_TO',
        baseWeight: 0.7,
        effectiveWeight: 0.6,
        confidence: 0.8,
        edgeSource: 'manual',
      }),
    ];
    const result = mapTopologyRows(rows);
    // source node appears in both rows but should only produce one node
    expect(result.nodes.filter((n) => n.id === 'tool-a')).toHaveLength(1);
    expect(result.edges).toHaveLength(2);
  });

  it('deduplicates edges (same pair, same type)', () => {
    const edge = {
      targetId: 'tool-b',
      edgeType: 'SIMILAR_TO',
      baseWeight: 0.9,
      effectiveWeight: 0.8,
      confidence: 0.9,
      edgeSource: 'manual',
    };
    const rows = [makeRow(edge), makeRow(edge)];
    const result = mapTopologyRows(rows);
    expect(result.edges).toHaveLength(1);
  });

  it('canonicalizes undirected edge (b→a same as a→b)', () => {
    const rowAB = makeRow({
      sourceId: 'tool-a',
      targetId: 'tool-b',
      edgeType: 'SIMILAR_TO',
      baseWeight: 0.9,
      effectiveWeight: 0.8,
      confidence: 0.9,
      edgeSource: 'm',
    });
    const rowBA = makeRow({
      sourceId: 'tool-b',
      targetId: 'tool-a',
      edgeType: 'SIMILAR_TO',
      baseWeight: 0.9,
      effectiveWeight: 0.8,
      confidence: 0.9,
      edgeSource: 'm',
    });
    const result = mapTopologyRows([rowAB, rowBA]);
    expect(result.edges).toHaveLength(1);
  });

  it('assigns positions to all nodes', () => {
    const rows = [
      makeRow({
        sourceId: 'tool-a',
        targetId: 'tool-b',
        edgeType: 'SIMILAR_TO',
        baseWeight: 0.9,
        effectiveWeight: 0.8,
        confidence: 0.9,
        edgeSource: 'm',
      }),
      makeRow({ sourceId: 'tool-b', targetId: null }),
    ];
    const result = mapTopologyRows(rows);
    for (const node of result.nodes) {
      expect(node.position.x).toBeTypeOf('number');
      expect(node.position.y).toBeTypeOf('number');
    }
  });

  it('includes category list in stats', () => {
    const rows = [
      makeRow({ sourceId: 'a', sourceCategory: 'ai' }),
      makeRow({ sourceId: 'b', sourceCategory: 'search' }),
    ];
    const result = mapTopologyRows(rows);
    expect(result.stats.categories).toContain('ai');
    expect(result.stats.categories).toContain('search');
  });

  it('clamps effectiveWeight to 0–1 for strokeWidth', () => {
    const row = makeRow({
      targetId: 'tool-b',
      edgeType: 'SIMILAR_TO',
      baseWeight: 2,
      effectiveWeight: 2,
      confidence: 1,
      edgeSource: 'm',
    });
    const result = mapTopologyRows([row]);
    const edge = result.edges[0];
    // strokeWidth = 1 + clamp(2, 0, 1) * 5 = 6
    expect(edge?.style.strokeWidth).toBe(6);
  });
});
