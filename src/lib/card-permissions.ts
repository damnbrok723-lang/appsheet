"use client";

import { useEffect, useState } from "react";

export type CardId =
  | "ncr_pcs_total"
  | "ncr_documents"
  | "ncr_customers"
  | "ncr_defect_cases"
  | "reports_qty_ok"
  | "reports_qty_ng"
  | "reports_input_form"
  | "reports_export"
  | "reports_reviewer_actions"
  | "grafik_sap_manpower"
  | "grafik_sap_stock"
  | "grafik_sap_daily"
  | "grafik_sap_warehouse"
  | "grafik_sap_import"
  | "grafik_sap_export"
  | "grafik_sap_delete"
  | "nav_dashboard"
  | "nav_grafik_sap"
  | "nav_stok_ncr"
  | "nav_repair"
  | "nav_laporan"
  | "nav_admin";

// Default permission mappings per role
export const DEFAULT_ROLE_PERMISSIONS: Record<string, CardId[]> = {
  ADMIN: [
    "ncr_pcs_total",
    "ncr_documents",
    "ncr_customers",
    "ncr_defect_cases",
    "reports_qty_ok",
    "reports_qty_ng",
    "reports_input_form",
    "reports_export",
    "reports_reviewer_actions",
    "grafik_sap_manpower",
    "grafik_sap_stock",
    "grafik_sap_daily",
    "grafik_sap_warehouse",
    "grafik_sap_import",
    "grafik_sap_export",
    "grafik_sap_delete",
    "nav_dashboard",
    "nav_grafik_sap",
    "nav_stok_ncr",
    "nav_repair",
    "nav_laporan",
    "nav_admin",
  ],
  MANAGER: [
    "ncr_pcs_total",
    "ncr_documents",
    "ncr_customers",
    "ncr_defect_cases",
    "reports_qty_ok",
    "reports_qty_ng",
    "reports_export",
    "reports_reviewer_actions",
    "grafik_sap_manpower",
    "grafik_sap_stock",
    "grafik_sap_daily",
    "grafik_sap_warehouse",
    "grafik_sap_import",
    "grafik_sap_export",
    "nav_dashboard",
    "nav_grafik_sap",
    "nav_stok_ncr",
    "nav_repair",
    "nav_laporan",
  ],
  EMPLOYEE: [
    "ncr_pcs_total",
    "ncr_documents",
    "reports_qty_ok",
    "reports_qty_ng",
    "reports_input_form",
    "grafik_sap_manpower",
    "grafik_sap_stock",
    "grafik_sap_daily",
    "grafik_sap_warehouse",
    "grafik_sap_import",
    "nav_dashboard",
    "nav_grafik_sap",
    "nav_stok_ncr",
    "nav_repair",
    "nav_laporan",
  ],
};

const STORAGE_KEY = "officehub_card_permissions";

export function getRolePermissions(): Record<string, CardId[]> {
  if (typeof window === "undefined") return DEFAULT_ROLE_PERMISSIONS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_ROLE_PERMISSIONS;
}

export function saveRolePermissions(permissions: Record<string, CardId[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
    window.dispatchEvent(new Event("officehub_permissions_updated"));
  } catch {}
}

export function hasPermission(cardId: CardId, userRole?: string, userPermissions?: string[] | null): boolean {
  if (userPermissions && Array.isArray(userPermissions)) {
    return userPermissions.includes(cardId);
  }
  const role = userRole || "EMPLOYEE";
  const perms = getRolePermissions();
  const rolePerms = perms[role] || DEFAULT_ROLE_PERMISSIONS[role] || [];
  return rolePerms.includes(cardId);
}

export function useCardPermission(cardId: CardId, userRole?: string, userPermissions?: string[] | null): boolean {
  const [allowed, setAllowed] = useState<boolean>(() => {
    return hasPermission(cardId, userRole, userPermissions);
  });

  useEffect(() => {
    function update() {
      setAllowed(hasPermission(cardId, userRole, userPermissions));
    }
    update();
    window.addEventListener("officehub_permissions_updated", update);
    return () => window.removeEventListener("officehub_permissions_updated", update);
  }, [cardId, userRole, userPermissions]);

  return allowed;
}
