# ADR 0002: Phase 0 stabilises the current file in place (v7)

**Decision:** keep shipping the single-file tool while the ERP is built. Split it into `legacy/src` modules (byte-identical reassembly), fix live bugs, replace polling with events, extract business rules into `packages/parsers` with golden tests and a parity test against the legacy code.
**Why:** the team uses the tool daily; a big-bang rewrite risks operations. The parity tests make the later port provable.
**Not done in Phase 0 (needs a server):** secrets out of the browser, integer-paise money and ISO dates inside the legacy screens.
