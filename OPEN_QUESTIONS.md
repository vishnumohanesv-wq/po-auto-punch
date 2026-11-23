# Open questions (business rules that look wrong or ambiguous). Not guessed in code.

| # | Rule | Where | Question |
|---|---|---|---|
| Q6 | DMart tax | legacy L1853 | Supplier GSTIN is a placeholder (`27AAAAA0000A1Z5`, fails checksum) and CGST+SGST is always assumed. What are the real GSTINs per node, and does DMart ever receive from a non-Maharashtra node (→ IGST)? |
| Q7 | "Waiting > 4 h" | L2920/2928 | Should "late" exclude time waiting for a buyer appointment, and should the threshold differ per stage/channel? |
| Q8 | Buyer detection | detectMode | Purplle is chosen if the word appears anywhere in the PDF. Can other buyers' POs mention Purplle (would misroute)? |
| Q9 | FirstCry MRP auto-correct | v5.6 | Confirmed rule "keep PO margin at EasyEcom MRP". Should the PO be held until FirstCry amends it, instead of invoicing at the corrected rate? |
| Q10 | EasyEcom rounding | L2614 | EasyEcom works per-unit at 2 dp; PO line totals differ by paise. Which total is billed: PO line total or EasyEcom? |
| Q11 | Dispatch ← Master | v6.0 | Open POs older than 45 days are not added to the board. Right window? |
| Q12 | Hold MOQ | hdCfg | Near/far decided by keyword match on location text. Should this be a ship-to master attribute instead? |
| Q13 | Demurrage | DMC | Defaults free 10 days, ₹2/kg/day. Contracted values per carrier? |
