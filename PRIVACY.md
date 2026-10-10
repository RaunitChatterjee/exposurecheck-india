# Privacy

ExposureCheck India is designed so that it **cannot** build a list of the people who use it.

## What happens to your input
| Data | What we do |
|---|---|
| Email address | Sent once to the [HaveIBeenPwned](https://haveibeenpwned.com) API to look up breaches. Held in memory for the length of the request, then discarded. Never written to the database or to application logs. |
| Domain (optional) | Used for public certificate-log (crt.sh) and DNS lookups. Same handling as above. |
| IP address | Used in process memory only, for rate limiting. Not persisted. |

## What is stored
One table, `daily_stats`, with anonymous counters per day: scans, scans with a breach, breaches surfaced, domain scans. There is no per-user or per-email row.

## Third parties that see your input
- **HaveIBeenPwned** receives the email address (this is how the lookup works; see their privacy policy).
- **crt.sh** and public **DNS resolvers** receive the domain, if you provide one.
- Your hosting provider's infrastructure may keep standard request metadata (e.g. IP addresses in edge/proxy logs) that this application does not control.

The scan is a `POST` with a JSON body, so the email does not appear in URLs or access logs.

## Not done
No accounts, no cookies, no analytics scripts, no email capture, no marketing list.
