# ExposureCheck India

A free, no-signup exposure scanner with India-specific guidance. Enter an email (and optionally a domain you own) and get a plain-language report: which known breaches include the email, what an attacker can do with that data, and what to do next in India (1930, cybercrime.gov.in, CERT-In, Sanchar Saathi).

## What it does (v1)
- **Breach exposure** via the [HaveIBeenPwned](https://haveibeenpwned.com/API/v3) API, with India-related breaches highlighted and a plain-language "what an attacker can do" note per breach.
- **Domain exposure** (optional) from public certificate-transparency logs ([crt.sh](https://crt.sh)); hostnames such as `admin`, `dev`, `staging` are flagged for review.
- **Email security posture** (optional) via DNS: SPF, DMARC, and DKIM (probed on common selectors only, so a miss is reported as *inconclusive*, never as a failure).
- **Transparent risk score** (0-100) where every point maps to a listed factor, plus prioritised remediation and a **MITRE ATT&CK** panel.
- Anonymous aggregate counters only; see [PRIVACY.md](PRIVACY.md).

Out of scope for v1: phone-number OSINT, social-media scraping, dark-web monitoring, paid tiers, accounts.

## Requirements you must know about
- **HIBP's breached-account lookup needs a paid API key.** Without `HIBP_API_KEY` the app still runs, but the breach section reports "unavailable" and the score is marked *partial*.
- The India-related list in `backend/app/data/india_breaches.json` is a curated, best-effort list matched on the breach's domain (plus Indian TLDs). Verify entries against HIBP's breach list and extend it.
- DKIM detection is selector-guessing by design; it cannot prove DKIM is absent.

## Architecture
```
React + Vite SPA  --POST /api/scan-->  FastAPI
                                         |-- hibp.py        HaveIBeenPwned v3
                                         |-- crtsh.py       certificate transparency
                                         |-- dns_checks.py  SPF / DKIM / DMARC
                                         |-- scoring.py     rule-based 0-100 score
                                         |-- remediation.py India-specific steps
                                         |-- mitre.py       ATT&CK mapping
                                         '-- db.py          daily aggregate counters (PostgreSQL / SQLite)
```

## Folder structure
```
exposurecheck-india/
├── backend/
│   ├── app/
│   │   ├── main.py            API, rate limiting, security headers
│   │   ├── config.py          env-based settings
│   │   ├── models.py          request/response schemas
│   │   ├── validation.py      email/domain validation
│   │   ├── ratelimit.py       sliding-window limiter
│   │   ├── db.py              aggregate stats only
│   │   ├── cli.py             terminal harness
│   │   ├── services/          hibp, crtsh, dns_checks, scoring, remediation, mitre, indian_context, report
│   │   └── data/              india_breaches.json, demo_breaches.json
│   ├── tests/
│   ├── Dockerfile
│   └── requirements*.txt
├── frontend/                  React + Vite SPA (src/components/*)
├── .github/workflows/ci.yml
├── docker-compose.yml
├── render.yaml
├── PRIVACY.md
└── README.md
```

## Run locally
```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # set HIBP_API_KEY, or HIBP_DEMO=1 for sample data
set -a && source .env && set +a
uvicorn app.main:app --reload   # http://localhost:8000/api/docs
python -m pytest -q

# CLI harness (no frontend needed)
python -m app.cli you@example.com --domain example.com

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                     # http://localhost:5173 (proxies /api to :8000)
```
`HIBP_DEMO=1` returns clearly labelled **fictional** sample breaches so you can develop the UI without a key; the report says "DEMO MODE" when active.

## Deploy
- Backend: Render/Railway using `render.yaml` or `backend/Dockerfile`. Set `HIBP_API_KEY`, `CORS_ORIGINS` (your frontend URL) and `TRUST_PROXY=1`.
- Frontend: Vercel/Netlify, build command `npm run build`, output `dist`, env `VITE_API_URL=<backend URL>`.

## Roadmap
v2+: phone-number checks, optional browser extension, monitoring alerts. See the project roadmap document.
