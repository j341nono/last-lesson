# Last Lesson development rules

- Preserve the central loop: exactly three teachings → autonomous, explainable decisions → a finite life → a causal retrospective. There is no universal good/evil score.
- All player-facing prose is Japanese. Maintain the quiet, warm, postwar pixel-art direction and responsive accessibility.
- `src/game/` must stay independent of React, browser APIs, time, networking and storage. Use the serialized PRNG state; never call Math.random or Date inside the simulation.
- A replay requires engine version, three confirmed lessons (including edits), seed, name and intervention step/index pairs. Changing content or algorithms can break old replays: version the rules and migrate before a live content update.
- New events need unique IDs, finite positive weights/duration, meaningful alternatives, explicit memory producers/prerequisites, consistent world details and authored consequences. Do not inflate counts with paraphrases.
- Teachings affect motives, personality, scope and conditions. Descriptive meaning text is an explanation; the editable structured fields define simulation behavior. Do not claim arbitrary prose is understood by the local fallback.
- Interventions only temporarily boost one of the original lessons, only at critical events, at most twice. They must never select actions directly.
- API keys remain in Worker secrets. Call the LLM only in teaching analysis, validate its response, always provide local fallback, never generate runtime story prose.
- Ranking scores and timelines must be rebuilt on the server. Consent is mandatory. Treat rate limiting and basic text filtering as prototype protections, not complete abuse prevention.
- Save in IndexedDB. Keep network failure separate from game progression. Do not publish private teachings without explicit per-life consent.
- Run `npm test`, `npm run build`, and relevant Playwright flows after substantive changes. Add coverage for causal dependencies, determinism, lifespan and intervention limits when changing the engine.
- Root contains only configuration, README, AGENTS and source directories. Put specifications in `docs/`. Use small, meaningful `prefix: concise English sentence` commits; do not create empty or fabricated commits.
