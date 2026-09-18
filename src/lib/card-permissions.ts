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
  | "reports_reviewer_actions";

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
  ],
  EMPLOYEE: [
    "ncr_pcs_total",
    "ncr_documents",
    "reports_qty_ok",
    "reports_qty_ng",
    "reports_input_form",
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

export function useCardPermission(cardId: CardId, userRole?: string): boolean {
  const [allowed, setAllowed] = useState<boolean>(() => {
    const role = userRole || "EMPLOYEE";
    const perms = getRolePermissions();
    const rolePerms = perms[role] || DEFAULT_ROLE_PERMISSIONS[role] || [];
    return rolePerms.includes(cardId);
  });

  useEffect(() => {
    function update() {
      const role = userRole || "EMPLOYEE";
      const perms = getRolePermissions();
      const rolePerms = perms[role] || DEFAULT_ROLE_PERMISSIONS[role] || [];
      setAllowed(rolePerms.includes(cardId));
    }
    update();
    window.addEventListener("officehub_permissions_updated", update);
    return () => window.removeEventListener("officehub_permissions_updated", update);
  }, [cardId, userRole]);

  return allowed;
}
