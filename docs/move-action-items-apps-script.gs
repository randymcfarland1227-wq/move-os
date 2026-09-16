/**
 * Optional Google Apps Script bridge for the "Move Action Items" tab.
 * Paste into Extensions > Apps Script in the workbook, then deploy as a web app.
 * The app uses stable IDs, so edits update rows instead of creating duplicates.
 */
const TAB_NAME = "Move Action Items";
const CORE_HEADERS = [
  "ID", "Title", "Phase", "Type", "Area", "Status", "Parent ID", "Due Date",
  "Notes", "Current Value", "Target Value", "Unit", "Blocker", "Importance",
  "Sort Order", "Completed At"
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
    return json_({ items });
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
    const existing = tab.getLastRow() > 1
      ? tab.getRange(2, 1, tab.getLastRow() - 1, headers.length).getValues()
      : [];
    const byId = new Map(existing.filter(row => row[headers.indexOf("ID")]).map(row => [String(row[headers.indexOf("ID")]), row]));
    const output = rows.map(item => headers.map((header, index) => {
      if (Object.prototype.hasOwnProperty.call(item, header)) return item[header];
      return byId.get(String(item.ID))?.[index] || "";
    }));
    if (tab.getLastRow() > 1) tab.getRange(2, 1, tab.getLastRow() - 1, headers.length).clearContent();
    if (output.length) tab.getRange(2, 1, output.length, headers.length).setValues(output);
    return json_({ ok: true, count: output.length });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}
