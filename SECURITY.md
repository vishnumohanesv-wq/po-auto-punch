# Security and data

## Keep this repository private
`index.html` contains business data: the product master (SKUs, EANs, EasyEcom codes, MRPs),
buyer article-code mappings for Reliance, FirstCry and Purplle, and warehouse routing rules.
None of these are passwords, but they are internal. Keep the repository **private** and add
collaborators individually.

**GitHub Pages on a free account requires a public repository.** A public repo plus Pages means
anyone with the link can open the app and read that product data from the page source. Options:
1. Make the repo private and stop using Pages; open `index.html` from your computer or a shared drive.
2. Keep Pages but upgrade to a paid plan (GitHub Pro / Team), which allows Pages from a private repo.
   Note the published site itself is still reachable by anyone who has the URL unless the
   organisation uses GitHub Enterprise access control.
3. Move the mappings out of the file into data loaded at runtime from your Google Sheet.
   That is planned work, not done yet.

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
