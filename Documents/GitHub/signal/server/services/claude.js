import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// In-memory insight cache: regionId → { text, cachedAt }
const _cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function buildPrompt(region, demographics, score) {
  const income = demographics.median_household_income_aud
    ? `$${demographics.median_household_income_aud}/week`
    : 'unknown';
  const density = demographics.population_density_per_sqkm
    ? `${Math.round(demographics.population_density_per_sqkm)} persons/km²`
    : 'unknown';
  const growth =
    demographics.growth_rate_pct != null
      ? `${demographics.growth_rate_pct > 0 ? '+' : ''}${demographics.growth_rate_pct?.toFixed(1)}%`
      : 'unknown';

  return `You are a broadband market analyst for Australia.
Analyse the following region for broadband expansion opportunity.

Region: ${region.name} (${region.type.toUpperCase()}, ${region.state_code})
Population: ${(demographics.population || 0).toLocaleString()} | Density: ${density}
Median Household Income: ${income} (national avg: ~$1,746/week)
Households with Children: ${demographics.households_with_children_pct?.toFixed(1) ?? 'unknown'}%
Internet Access: ${demographics.internet_access_pct?.toFixed(1) ?? 'unknown'}% of dwellings
Population Growth (2016–2021): ${growth}
Opportunity Score: ${score.opportunity_score}/100

Score Components:
  Income ${score.income_component}/100 | Children ${score.children_component}/100 |
  Growth ${score.growth_component}/100 | Competition ${score.competition_component}/100 |
  Density ${score.density_component}/100

Provide a concise 3-paragraph analysis (150–200 words total):
1. Market opportunity summary
2. Key strengths and risk factors
3. Strategic recommendation for a broadband provider

Be specific to the Australian market context (NBN Co infrastructure, Telstra, Optus, TPG/iiNet competitive landscape).
Do not include headings. Write in natural prose.`;
}

/**
 * Stream Claude insights for a region as async iterable of text chunks.
 * Yields string chunks as they arrive from the API.
 * Caches completed responses for 1 hour.
 */
export async function* streamInsights(region, demographics, score) {
  const cacheKey = region.id;
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    // Yield cached text as a single chunk
    yield cached.text;
    return;
  }

  const prompt = buildPrompt(region, demographics, score);
  let fullText = '';

  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      fullText += event.delta.text;
      yield event.delta.text;
    }
  }

  _cache.set(cacheKey, { text: fullText, cachedAt: Date.now() });
}
