export const SAP_DATA_UPDATED_EVENT = "officehub-sap-data-updated";

export function notifySapDataUpdated() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAP_DATA_UPDATED_EVENT, String(Date.now()));
}
