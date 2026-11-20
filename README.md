# Continua

Continua is a synthetic-data continuity-intelligence prototype for care
coordinators. It reconstructs fragmented care records into a source-linked
patient journey, verifies continuity gaps, ranks verified intervention
priorities, and provides an evidence drawer for every displayed gap.

This repository is a prototype. It is not HIPAA compliant, not clinically
validated, and not a medical device. All data is synthetic.

## Five-minute quick start

```bash
npm ci
npm run validate
npm run dev
```

Open http://localhost:3000 and follow `/demo`.

## Key commands

```bash
npm run validate
npm run test
npm run test:safety
npm run test:reliability
npm run build
npm run demo:check
npm run demo:warm
```

## Documentation

- `docs/getting-started/evaluator-quickstart.md`
- `docs/architecture/system-overview.md`
- `docs/evaluation/benchmark-card.md`
- `docs/safety/system-card.md`
- `docs/demo/quick-demo.md`
- `docs/troubleshooting/README.md`

## Frozen versions

- `continua-reliability-v1`
- `continua-demo-release-candidate-v1`
- `continua-visual-v1`
- `continua-docs-v1` (this phase)
