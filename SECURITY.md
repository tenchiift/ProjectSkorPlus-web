# Security Policy

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Email the maintainer or open a private security advisory on GitHub with:
- Description of the issue
- Steps to reproduce
- Potential impact

We aim to acknowledge reports within 72 hours.

## Notes for this project

- Never commit Supabase service-role keys, OpenRouter keys, or `.env` files
- AI keys (`OPENROUTER_API_KEY`) are server-side only (`api/` functions on Vercel)
- Client bundle must only contain the Supabase anon key + project URL
- Lecturer/admin elevation is done via SQL (`role = 'admin'`) — restrict who can run it
