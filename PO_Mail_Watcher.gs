/**
 * PO PUNCH PRO · PO Mail Watcher  (Google Apps Script, v1.2)
 * Install it in the MAIN PO mailbox: ops@tucokids.com (Tuco Operations). FirstCry stockist POs go there directly.
 * FirstCry warehouse/JIT POs (JIT@firstcry.com) are sent to chitra@/anshuman@, not ops@: forward them to ops@
 * (Gmail filter in chitra@: from:jit@firstcry.com → Forward to ops@tucokids.com); forwarded ones are picked up too.
 *  - Every 10 minutes: finds new PO emails per channel, saves the PO file (attachment or FirstCry download link)
 *    to Drive, labels the email "PO-Punch/New", logs it, and emails NOTIFY_TO a list of the new POs.
 *  - Web app for PO Punch Pro (POST, key in the body): list new POs, download a PO file, mark processed
 *    (the app sends its spot-check result; this script emails it to NOTIFY_TO and labels the email "PO-Punch/Processed").
 * SETUP (once): paste into script.google.com → set KEY below → Run setup() → allow access →
 *   Deploy → New deployment → Web app → Execute as: Me · Who has access: Anyone → copy the /exec URL into PO Punch Pro.
 */
var CONFIG = {
  KEY: 'change-this-secret',                       // same key goes into PO Punch Pro
  MAILBOX: 'ops@tucokids.com',                     // main PO mailbox this script runs in (shown in reports)
  NOTIFY_TO: 'vishnu@tucokids.com',                // only this inbox gets alerts/reports. Leave '' for no emails (app only)
  APP_URL: 'https://vishnumohanesv-wq.github.io/po-auto-punch/',
  LOOKBACK: '3d',                                  // only look at mail this recent
  FOLDER: 'PO Punch · Mail POs',
  LABEL_NEW: 'PO-Punch/New', LABEL_DONE: 'PO-Punch/Processed',
  EXCLUDE: '-subject:(GRN OR GrnCode OR "Payment Voucher" OR "Pending PO" OR Consolidated OR "debit note" OR invoice OR ASN OR appointment OR Receipt OR Scheduled OR Cancelled OR "ship now" OR Return OR Notice) -from:me -in:sent -in:chats',
  // channel rules: Gmail search + where the PO file comes from ('attach' = attachments, 'links' = download links in the mail)
  CHANNELS: [
    {name: 'FirstCry',        q: 'from:noreply@firstcry.com subject:PONO',                                        src: 'links'},
    {name: 'FirstCry (JIT)',  q: '(from:jit@firstcry.com OR "jit@firstcry.com") subject:("purchase order no")',     src: 'links', fwdOk: true},
    {name: 'Purplle',         q: 'from:(purplle.com OR manash) subject:(PO OR "purchase order") has:attachment',    src: 'attach'},
    {name: 'Reliance Retail', q: 'from:(ril.com OR relianceretail.com OR jio.com) subject:(PO OR "purchase order") has:attachment', src: 'attach'},
    {name: 'DMart',           q: 'from:(dmartindia.com OR dmart.in OR avenue) subject:(PO OR "purchase order") has:attachment', src: 'attach'},
    {name: 'Health & Glow',   q: 'from:(healthandglow.com OR healthandglow.in) subject:(PO OR "purchase order") has:attachment', src: 'attach'},
    {name: 'Tata 1mg',        q: 'from:(1mg.com OR tata1mg.com) subject:(PO OR "purchase order") has:attachment',   src: 'attach'},
    {name: 'FirstClub',       q: 'from:(firstclub.in OR firstclub.com OR firstclub.co) subject:(PO OR "purchase order") has:attachment', src: 'attach'},
    {name: 'Other (check)',   q: 'subject:("purchase order" OR "PO No" OR "PO number") has:attachment -from:firstcry.com', src: 'attach', check: true}
  ]
};

/* ---------- setup ---------- */
function setup(){
  label_(CONFIG.LABEL_NEW); label_(CONFIG.LABEL_DONE); folder_(); log_();
  ScriptApp.getProjectTriggers().forEach(function(t){ if (t.getHandlerFunction() === 'checkNewPOs') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('checkNewPOs').timeBased().everyMinutes(10).create();
  checkNewPOs();
  Logger.log('Ready. Now deploy as a Web app (Execute as: Me, Who has access: Anyone) and paste the /exec URL into PO Punch Pro.');
}

/* ---------- the 10-minute check ---------- */
function checkNewPOs(){
  var lock = LockService.getScriptLock(); if (!lock.tryLock(20000)) return;
  try{
    var sh = log_(), seen = {}, found = [];
    sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues().forEach(function(r){ if (r[0]) seen[r[0]] = 1; });
    var skip = ' -label:' + CONFIG.LABEL_NEW.replace('/', '-') + ' -label:' + CONFIG.LABEL_DONE.replace('/', '-');
    CONFIG.CHANNELS.forEach(function(ch){
      GmailApp.search(ch.q + ' newer_than:' + CONFIG.LOOKBACK + ' ' + CONFIG.EXCLUDE + skip, 0, 50).forEach(function(th){
        th.getMessages().forEach(function(m){
          var id = m.getId(); if (seen[id]) return; seen[id] = 1;
          var subj = m.getSubject(), files = [];
          if (/^\s*re\s*:/i.test(subj) || (/^\s*(fw|fwd)\s*:/i.test(subj) && !ch.fwdOk)) return;   // replies (appointment threads) are not new POs
          try{ files = ch.src === 'links' ? fromLinks_(m, ch) : fromAttachments_(m, ch); }catch(e){ files = []; }
          var po = poNo_(subj + ' ' + files.map(function(f){ return f.name; }).join(' '));
          var row = [id, new Date(), ch.name, po, subj, m.getFrom(), files.map(function(f){ return f.id; }).join(','), files.map(function(f){ return f.name; }).join(' | '),
                     ch.check ? 'check' : (files.length ? 'new' : 'no-file'), '', '', m.getThread().getPermalink()];
          sh.appendRow(row); found.push(row);
        });
        th.addLabel(label_(CONFIG.LABEL_NEW));
      });
    });
    if (found.length) notifyNew_(found);
  } finally { lock.releaseLock(); }
}

function fromAttachments_(m, ch){
  return m.getAttachments({includeInlineImages: false}).filter(function(a){ return /\.(pdf|xlsx?|csv|zip)$/i.test(a.getName()); })
    .map(function(a){ var f = sub_(ch.name).createFile(a.copyBlob()).setName(a.getName()); return {id: f.getId(), name: f.getName()}; });
}
function fromLinks_(m, ch){
  var html = m.getBody(), out = [], re = /<a[^>]+href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi, x, po = poNo_(m.getSubject()) || 'PO';
  while ((x = re.exec(html))){
    var url = x[1].replace(/&amp;/g, '&'), text = x[2].replace(/<[^>]+>/g, ' ');
    var isPdf = /pdf/i.test(text), isXl = /excel|xls/i.test(text);
    if (!(isPdf || isXl) || !/^https?:/i.test(url)) continue;
    var r = UrlFetchApp.fetch(url, {followRedirects: true, muteHttpExceptions: true}); if (r.getResponseCode() !== 200) continue;
    var b = r.getBlob(), ct = String(b.getContentType() || '');
    var magic = function(bl){ var x = bl.getBytes().slice(0, 4); return String.fromCharCode.apply(null, x.map(function(v){ return v < 0 ? v + 256 : v; })); };
    var mg0 = ''; try{ mg0 = magic(b); }catch(e){}
    if (mg0 !== '%PDF' && mg0.slice(0, 2) !== 'PK' && /html|text/i.test(ct)){    // not a file yet: maybe a page that points to it, follow once
      var h2 = ''; try{ h2 = r.getContentText(); }catch(e){}
      var m2 = h2.match(/(?:url=|href=['"]|location(?:\.href)?\s*=\s*['"])(https?:[^'"\s>]+\.(?:pdf|xlsx?)[^'"\s>]*)/i);
      if (m2){ var r2 = UrlFetchApp.fetch(m2[1].replace(/&amp;/g, '&'), {followRedirects: true, muteHttpExceptions: true}); if (r2.getResponseCode() === 200){ b = r2.getBlob(); ct = String(b.getContentType() || ''); } } }
    var mg = magic(b);                                                         // trust the file's first bytes, not the server's content-type
    var ext = mg === '%PDF' ? '.pdf' : mg.slice(0, 2) === 'PK' ? '.xlsx' : mg.charCodeAt(0) === 0xD0 ? '.xls' : '';
    if (!ext) continue;                                                        // a login page or an expired link
    var f = sub_(ch.name).createFile(b).setName(po + ext); out.push({id: f.getId(), name: f.getName()});
  }
  return out;
}
function poNo_(s){ var m = String(s).match(/\bpin[a-z0-9]{12,20}\b/i) || String(s).match(/\b4[23]\d{8}\b/) || String(s).match(/\bPO[\s.:#-]*(?:No\.?|Number)?[\s.:#-]*([A-Z0-9\/-]{5,20})/i);
  return m ? (m[1] || m[0]) : ''; }

function notifyNew_(rows){
  var by = {}; rows.forEach(function(r){ (by[r[2]] = by[r[2]] || []).push(r); });
  var head = Object.keys(by).map(function(k){ return k + ' ' + by[k].length; }).join(' · ');
  var html = '<div style="font:14px Arial,sans-serif"><h2 style="margin:0 0 8px">🆕 ' + rows.length + ' new PO' + (rows.length > 1 ? 's' : '') + ' in ' + esc_(CONFIG.MAILBOX) + '</h2><p style="color:#555">' + esc_(head) + '</p>'
    + '<table cellpadding="6" style="border-collapse:collapse;font-size:13px"><tr style="background:#f1f3f7"><th align="left">Channel</th><th align="left">PO</th><th align="left">Subject</th><th align="left">File</th><th align="left">Status</th></tr>'
    + rows.map(function(r){ return '<tr style="border-top:1px solid #e5e7eb"><td>' + esc_(r[2]) + '</td><td><b>' + esc_(r[3] || '—') + '</b></td><td>' + esc_(r[4]).slice(0, 90) + '</td><td>'
      + esc_(r[7] || 'none') + '</td><td>' + (r[8] === 'new' ? 'ready to check' : r[8] === 'check' ? '⚠ check: not a known channel' : '⚠ no PO file, open the mail') + '</td></tr>'; }).join('')
    + '</table><p><a href="' + CONFIG.APP_URL + '#mail">Open PO Punch Pro to check and process them</a></p></div>';
  if (!CONFIG.NOTIFY_TO) return;
  MailApp.sendEmail({to: CONFIG.NOTIFY_TO, subject: '🆕 New PO' + (rows.length > 1 ? 's' : '') + ': ' + head, htmlBody: html});
}

/* ---------- web app for PO Punch Pro ---------- */
function doPost(e){
  var q = {}; try{ q = JSON.parse(e.postData.contents || '{}'); }catch(err){}
  if (q.key !== CONFIG.KEY) return out_({ok: false, error: 'Wrong key'});
  try{
    if (q.action === 'ping') return out_({ok: true, notify: CONFIG.NOTIFY_TO, mailbox: CONFIG.MAILBOX || Session.getEffectiveUser().getEmail()});
    if (q.action === 'check'){ checkNewPOs(); q.action = 'list'; }
    var sh = log_(), V = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 12).getValues() : [];
    if (q.action === 'list_all') return out_({ok: true, items: V.slice(-300).map(function(r){ return {id: r[0], po: r[3], channel: r[2], status: r[8]}; })});
    if (q.action === 'list'){
      return out_({ok: true, items: V.filter(function(r){ return /^(new|check|no-file)$/.test(r[8]); }).map(function(r){
        return {id: r[0], at: new Date(r[1]).toISOString(), channel: r[2], po: r[3], subject: r[4], from: r[5], files: String(r[6] || '').split(',').filter(String), names: String(r[7] || '').split(' | ').filter(String), status: r[8], link: r[11]}; })});
    }
    if (q.action === 'file'){
      var f = DriveApp.getFileById(q.fileId), b = f.getBlob();
      return out_({ok: true, name: f.getName(), mime: b.getContentType(), b64: Utilities.base64Encode(b.getBytes())});
    }
    if (q.action === 'done'){
      var idx = V.map(function(r){ return r[0]; }).indexOf(q.id); if (idx < 0) return out_({ok: false, error: 'Unknown mail id'});
      sh.getRange(idx + 2, 9, 1, 3).setValues([['processed', new Date(), String(q.result || '').slice(0, 500)]]);
      try{ var th = GmailApp.getMessageById(q.id).getThread(); th.removeLabel(label_(CONFIG.LABEL_NEW)); th.addLabel(label_(CONFIG.LABEL_DONE)); }catch(err){}
      if (q.notify !== false && CONFIG.NOTIFY_TO) MailApp.sendEmail({to: CONFIG.NOTIFY_TO, subject: (q.ok ? '✅ ' : '⚠️ ') + 'PO ' + (q.po || V[idx][3]) + ' checked & processed · ' + V[idx][2],
        htmlBody: '<div style="font:14px Arial,sans-serif"><p><b>' + esc_(q.po || V[idx][3]) + '</b> (' + esc_(V[idx][2]) + ') was checked and processed in PO Punch Pro.</p><pre style="font:13px Consolas,monospace;background:#f6f7f9;padding:10px;white-space:pre-wrap">'
          + esc_(q.result || '') + '</pre><p><a href="' + V[idx][11] + '">Open the email</a> · <a href="' + CONFIG.APP_URL + '">Open PO Punch Pro</a></p></div>'});
      return out_({ok: true});
    }
    if (q.action === 'dismiss'){       // "not a PO": leave the inbox quietly (no email)
      var j2 = V.map(function(r){ return r[0]; }).indexOf(q.id); if (j2 < 0) return out_({ok: false, error: 'Unknown mail id'});
      sh.getRange(j2 + 2, 9, 1, 3).setValues([['dismissed', new Date(), 'Not a PO']]);
      try{ var t3 = GmailApp.getMessageById(q.id).getThread(); t3.removeLabel(label_(CONFIG.LABEL_NEW)); }catch(err){}
      return out_({ok: true});
    }
    if (q.action === 'refetch'){       // download the PO files again (e.g. the PDF was missed the first time)
      var j2 = V.map(function(r){ return r[0]; }).indexOf(q.id); if (j2 < 0) return out_({ok: false, error: 'Unknown mail id'});
      var chn = CONFIG.CHANNELS.filter(function(c){ return c.name === V[j2][2]; })[0] || {name: V[j2][2], src: 'links'};
      var msg = GmailApp.getMessageById(q.id), fl = chn.src === 'links' ? fromLinks_(msg, chn) : fromAttachments_(msg, chn);
      if (!fl.length) return out_({ok: false, error: 'No PO file could be downloaded (link expired?)'});
      sh.getRange(j2 + 2, 7, 1, 3).setValues([[fl.map(function(f){ return f.id; }).join(','), fl.map(function(f){ return f.name; }).join(' | '), 'new']]);
      return out_({ok: true, names: fl.map(function(f){ return f.name; })});
    }
    if (q.action === 'reopen'){        // put a mail back as new (e.g. it could not be read the first time)
      var k = V.map(function(r){ return r[0]; }).indexOf(q.id); if (k < 0) return out_({ok: false, error: 'Unknown mail id'});
      sh.getRange(k + 2, 9, 1, 3).setValues([[V[k][6] ? 'new' : 'no-file', '', '']]);
      try{ var t2 = GmailApp.getMessageById(q.id).getThread(); t2.removeLabel(label_(CONFIG.LABEL_DONE)); t2.addLabel(label_(CONFIG.LABEL_NEW)); }catch(err){}
      return out_({ok: true});
    }
    return out_({ok: false, error: 'Unknown action'});
  }catch(err){ return out_({ok: false, error: String(err)}); }
}
function doGet(){ return out_({ok: true, app: 'PO Mail Watcher', hint: 'Use POST with your key'}); }

/* ---------- helpers ---------- */
function out_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function esc_(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
function label_(n){ return GmailApp.getUserLabelByName(n) || GmailApp.createLabel(n); }
function folder_(){ var it = DriveApp.getFoldersByName(CONFIG.FOLDER); return it.hasNext() ? it.next() : DriveApp.createFolder(CONFIG.FOLDER); }
function sub_(name){ var p = folder_(), it = p.getFoldersByName(name); return it.hasNext() ? it.next() : p.createFolder(name); }
function log_(){
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('LOG_ID'), ss = null;
  try{ if (id) ss = SpreadsheetApp.openById(id); }catch(e){}
  if (!ss){ ss = SpreadsheetApp.create('PO Punch · Mail PO log'); p.setProperty('LOG_ID', ss.getId());
    try{ DriveApp.getFileById(ss.getId()).moveTo(folder_()); }catch(e){}
    ss.getSheets()[0].appendRow(['Mail id', 'Received', 'Channel', 'PO', 'Subject', 'From', 'Drive file ids', 'Files', 'Status', 'Processed at', 'Result', 'Mail link']); }
  return ss.getSheets()[0];
}
