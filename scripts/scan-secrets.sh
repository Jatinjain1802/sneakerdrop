#!/usr/bin/env bash
# Scans the working tree AND full git history for credential-like strings.
set -u
pat='github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|AVNS_[A-Za-z0-9_-]{10,}|mysql://[^ @:/]+:[^ @]+@|(postgres|postgresql)://[^ @:/]+:[^ @]+@|\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{40,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|SESSION_SECRET=[A-Za-z0-9]{16,}'
status=0
echo "== working tree =="
allow='user:password@host|invalidinvalid'
if git grep -nIE "$pat" -- . ':!scripts/scan-secrets.sh' | grep -vE "$allow" | grep . ; then status=1; else echo "clean"; fi
echo "== history (all commits, all branches) =="
if git log --all -p --no-color | grep -nE "$pat" | grep -vE "$allow" | head -20 | grep . ; then status=1; else echo "clean"; fi
echo "== tracked env files =="
if git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example$'; then status=1; else echo "none"; fi
exit $status
