# Supplier batch sheet brief

Date: Sep 12, 2026

## Brief

BRIEF: Supplier batch sheet — generate from Airtable, read tracking back

Context: The supplier wants each batch of orders as one document she can add tracking numbers to and return. Replace the per-order IntakeBlock paste with a shared Google Sheet the script fills and later reads.

Task 1 — The sheet. Create a Google Sheet named AG Supplier Orders, shared with the existing service account as editor. Owner shares it with the supplier as editor after creation (owner action; report the sheet ID). One tab per batch date, named YYYY-MM-DD, plus a README tab with the fixed note below.

Task 2 — Batch generation. Add POST /api/batch (fulfill-key auth) and a step in the fulfill cron: every run, gather Orders rows with Status = intake-ready and no BatchDate. If any exist, create or append to today's tab (ET date) with this header row and one row per order, then set BatchDate and Status = sent-to-supplier and SentToSupplierTS on each row (the SentToSupplier checkbox becomes redundant for batched orders; keep it working for manual cases).

Header, exact order: # · Order no. · Customer name · Address line 1 · Address line 2 · City · State · Zip · Phone · Email · Item · Spare cartridge · Shipping · Tracking (supplier) · Notes

Values: Order no. = OrderNumber; Item = H1-230KM complete set (first row of each tab carries the full parts list in parentheses: softener unit, brine tank, regeneration attachment with pump, hoses, mount adapter, wrench, teflon tape, English manual); Spare cartridge = Yes/No from BumpTaken (also Yes if OTOAccepted, with + Spares Kit in Notes); Shipping = Express or Standard from ShippingMethod; Tracking (supplier) blank; kit-only orders (ItemType = kit) appear with Item = Spares Kit and Spare cartridge = No.

Above the table on each tab, a summary line: Batch date · N orders · N units · N spare cartridges · N express · N standard, and the fixed sentence: All units ship under our brand, AG Water Softener. Please add the tracking number in the last column.

Task 3 — Tracking read-back. Each fulfill run also reads every batch tab from the last 30 days. For any row where Tracking (supplier) is non-empty and the matching Airtable row (by Order no.) has an empty Tracking, write the tracking number to Airtable. The existing validation, Carrier assignment, and ready-to-notify gate then run as today; the owner still ticks Notify. Never overwrite a non-empty Airtable Tracking.

Task 4 — Digest. Fulfillment health gains one line when > 0: batched, awaiting supplier tracking (N days) for orders with BatchDate set and no Tracking.

Task 5 — README tab (fixed text): what the sheet is, that one tab is one day's batch, that the supplier fills only the Tracking column, cutoff 3:00 PM Beijing.

Out of scope: payment links (the supplier issues them from the sheet), customer emails, the SOP (owner updates it after this ships).

Verification: dry-run showing which rows would batch today and the tab contents as they'd be written; after write, the sheet tab pasted; a simulated supplier tracking entry read back into a test row and that row reaching ready-to-notify; the digest line. Report per the skill format.

## Owner answers to clarifying questions

1. Correct. generateIntake() always lands on intake-ready; the batch step advances it. IntakeBlock stays populated as the audit trail. SUPPLIER_EMAIL stays supported for manual use but is no longer the default path.

2. One row per order. UnitQty as a prefix in the Item cell (2x H1-230KM complete set) and reflected in the summary line's unit count.

3. The owner has created the sheet AG Supplier Orders in his own Drive, shared it with ag-pnl-writer@ag-ops.iam.gserviceaccount.com as editor, and set SUPPLIER_SHEET_ID on Vercel Production and in .env.backfill. No setup endpoint; do not create a sheet.

4. Extract the Sheets helpers to src/server/sheets.ts; pnl.ts and the new batch module both import from it. After the refactor, re-run the August P&L once as a regression check and paste the Summary row.
