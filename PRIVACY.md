# Privacy

ExposureCheck India is designed so that it **cannot** build a list of the people who use it.

## What happens to your input
| Data | What we do |
|---|---|
| Email address | Sent once to the configured breach database ([HaveIBeenPwned](https://haveibeenpwned.com) or [XposedOrNot](https://xposedornot.com)) to look up breaches. Held in memory for the length of the request, then discarded. Never written to the database or to application logs. |
| Domain (optional) | Used for public certificate-log (crt.sh) and DNS lookups. Same handling as above. |
| IP address | Used in process memory only, for rate limiting. Not persisted. |

## Browser-only tools
The password check, scam message check and email header analyzer, UPI QR/link inspector and the "I've been scammed" planner run entirely in your browser. QR images are decoded locally and never uploaded; screenshots of messages are read locally by OCR software served from this site and never uploaded, and the address checker and family card also run locally; the details you type into the planner (amounts, transaction IDs, names) are never sent or stored. Pasted messages and headers are not sent to any server. The password check hashes your password locally and sends only the first 5 characters of the SHA-1 hash to the [Pwned Passwords](https://haveibeenpwned.com/API/v3#PwnedPasswords) range API (k-anonymity), which cannot reveal the password.

## What is stored
One table, `daily_stats`, with anonymous counters per day: scans, scans with a breach, breaches surfaced, domain scans. There is no per-user or per-email row.

## Third parties that see your input
- **The breach database in use** (HaveIBeenPwned or XposedOrNot, named in each report) receives the email address; this is how the lookup works. See that provider's privacy policy.
- **crt.sh** and public **DNS resolvers** receive the domain, if you provide one.
- Your hosting provider's infrastructure may keep standard request metadata (e.g. IP addresses in edge/proxy logs) that this application does not control.

The scan is a `POST` with a JSON body, so the email does not appear in URLs or access logs.

## Not done
No accounts, no cookies, no analytics scripts, no email capture, no marketing list.
