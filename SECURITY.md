# Security and data

## Keep this repository private
`index.html` contains business data: the product master (SKUs, EANs, EasyEcom codes, MRPs),
buyer article-code mappings for Reliance, FirstCry and Purplle, and warehouse routing rules.
None of these are passwords, but they are internal. Keep the repository **private** and add
collaborators individually.

If the app ever needs to be public, the mappings must first move out of the file into data
loaded at runtime. That is planned work, not done yet.

## What is never in this repository
- Google Apps Script web-app URLs and secret keys. You enter them in the app; they are stored
  in that browser's local storage only.
- Your POs, invoices, history and dispatch records. They live in the browser where you use the app.
- Backup files. `.gitignore` excludes `*_PO_Punch_backup_*.json`; never commit one.

## Known limitations (from the v4.0 audit)
- Some integration calls send the secret key in the URL, so it can appear in browser history and
  Google's request logs. Treat the key as low-trust and rotate it if a shared computer was used.
- Keys are stored unencrypted in browser storage. Don't use the integrations on shared machines.
- There are no user accounts. Anyone with the file and a browser can use it.

Report problems to the repository owner.
