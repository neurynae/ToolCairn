# Embedding Models for ToolPilot

## Decision: Nomic Embed Code (768d)

**Model**: `nomic-ai/nomic-embed-text-v1.5` (code-optimized variant)
**Dimensions**: 768
**Provider**: Nomic AI API
**Use**: Tool description embeddings in Qdrant

## Why Nomic Embed Code

- Code-aware: trained on code + technical documentation
- 768d is a sweet spot — more expressive than 384d, cheaper than 1536d
- Strong performance on technical similarity tasks vs general-purpose models
- Nomic API is cheaper than OpenAI embeddings at scale

## Alternatives Evaluated

| Model | Dims | Notes |
|-------|------|-------|
| text-embedding-3-small | 1536 | Good quality, OpenAI dependency, higher cost |
| text-embedding-3-large | 3072 | Overkill for tool descriptions |
| all-MiniLM-L6-v2 | 384 | Fast, free, but lower quality on technical text |
| nomic-embed-text-v1.5 | 768 | **Selected** |

## Qdrant Collection Config

```typescript
{
  name: 'tools',
  vectors: {
    size: 768,
    distance: 'Cosine'
  },
  // Payload indexes for Stage 2 hard filters:
  // category, deployment_models, language, license
}
```
