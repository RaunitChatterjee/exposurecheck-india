# Contributing

The most useful contribution is a **message the scam checker gets wrong**. Use the "This result looks wrong? Report it" button in the app, or open an issue with the *Wrong result* template.

## Adding test messages

- Datasets live in `frontend/test-data/`. `scam-messages.json` is the development set (rules were tuned against it). `scam-messages-heldout.json` was written after the rules were frozen and must **not** be used to tune rules.
- Each entry: `id`, `set`, `label` (`scam` or `legit`), `category`, `language`, `text`, `source`.
- Remove names, phone numbers, account numbers and real links. Use made-up placeholders. Never submit a real person's message.
- New messages from the community go in a new held-out batch first; only after they are counted can rules be changed.

## Website checker test addresses

`domains-dev.json` and `domains-heldout.json` follow the same rule as the message sets: the held-out file is never used to tune the checker. Each entry has `label` of `official`, `fake` or `legit-other` (a real site that is not on the list). Use invented or generic addresses, not live scam sites, and never a real person's address. To correct or extend the official list (`orgs.js`), check the address on the organisation's own website first.

## Changing rules

Rules are in `frontend/src/lib/scam.js`. Add a test in `scam.test.js`, run `npm test` and `npm run benchmark`, and report both sets. A rule change that improves the development set but lowers the held-out set is not an improvement.

## Running tests

```
cd frontend && npm test && npm run benchmark
cd backend && pytest
```
