/**
 * Optional Google Apps Script bridge for the "Move Action Items" tab.
 * Paste into Extensions > Apps Script in the workbook, then deploy as a web app.
 * The app uses stable IDs, so edits update rows instead of creating duplicates.
 */
const TAB_NAME = "Move Action Items";
const CONTEXT_TAB = "Move Context";
const CASH_FLOW_TAB = "Move Cash Flow";
const CORE_HEADERS = [
  "ID", "Title", "Phase", "Type", "Area", "Status", "Parent ID", "Due Date",
  "Notes", "Current Value", "Target Value", "Unit", "Blocker", "Importance",
  "Sort Order", "Completed At", "Plan ID", "Plan Section ID", "Route ID",
  "Requirement ID", "Action Stage", "Trigger", "Pinned"
];

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  const tab = SpreadsheetApp.getActive().getSheetByName(TAB_NAME);
  if (!tab) throw new Error(`Create a tab named "${TAB_NAME}" before connecting Move OS.`);
  return tab;
}

function jsonTab_(name) {
  const spreadsheet = SpreadsheetApp.getActive();
  const tab = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (tab.getLastRow() === 0) tab.getRange(1, 1, 1, 3).setValues([["KEY", "JSON", "UPDATED_AT"]]);
  return tab;
}

function readJson_(name) {
  const tab = SpreadsheetApp.getActive().getSheetByName(name);
  if (!tab || tab.getLastRow() < 2) return undefined;
  const value = tab.getRange(2, 2).getValue();
  if (!value) return undefined;
  try { return JSON.parse(value); } catch (_) { return undefined; }
}

function writeJson_(name, key, value) {
  if (value === undefined) return;
  const tab = jsonTab_(name);
  tab.getRange(2, 1, 1, 3).setValues([[key, JSON.stringify(value), new Date().toISOString()]]);
}

function headers_(tab) {
  const width = Math.max(tab.getLastColumn(), CORE_HEADERS.length);
  const existing = width ? tab.getRange(1, 1, 1, width).getDisplayValues()[0].filter(Boolean) : [];
  const headers = [...existing];
  CORE_HEADERS.forEach(header => { if (!headers.includes(header)) headers.push(header); });
  tab.getRange(1, 1, 1, headers.length).setValues([headers]);
  return headers;
}

function doGet() {
  try {
    const tab = sheet_();
    const headers = headers_(tab);
    const values = tab.getLastRow() > 1
      ? tab.getRange(2, 1, tab.getLastRow() - 1, headers.length).getDisplayValues()
      : [];
    const items = values
      .filter(row => row.some(Boolean))
      .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
    return json_({ items, context: readJson_(CONTEXT_TAB), cashFlow: readJson_(CASH_FLOW_TAB) });
  } catch (error) {
    return json_({ error: String(error) });
  }
}

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || "{}");
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const tab = sheet_();
    const headers = headers_(tab);
    const existing = tab.getLastRow() > 1 ? tab.getRange(2, 1, tab.getLastRow() - 1, headers.length).getValues() : [];
    const idIndex = headers.indexOf("ID");
    const byId = new Map(existing.map((row, offset) => [String(row[idIndex] || ""), {row, rowNumber: offset + 2}]).filter(([id]) => id));
    const incomingIds = new Set(rows.map(item => String(item.ID)));
    rows.forEach(item => {
      const previous = byId.get(String(item.ID));
      const output = headers.map((header, index) => Object.prototype.hasOwnProperty.call(item, header) ? item[header] : previous?.row[index] || "");
      if (previous) {
        if (JSON.stringify(previous.row.map(String)) !== JSON.stringify(output.map(String))) tab.getRange(previous.rowNumber, 1, 1, headers.length).setValues([output]);
      } else {
        tab.appendRow(output);
      }
    });
    [...byId.entries()].filter(([id]) => !incomingIds.has(id)).sort((a,b) => b[1].rowNumber - a[1].rowNumber).forEach(([,value]) => tab.deleteRow(value.rowNumber));
    writeJson_(CONTEXT_TAB, "move-context", payload.context);
    writeJson_(CASH_FLOW_TAB, "cash-flow", payload.cashFlow);
    return json_({ ok: true, count: rows.length });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}
