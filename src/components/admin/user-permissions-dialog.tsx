"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CardId, DEFAULT_ROLE_PERMISSIONS } from "@/lib/card-permissions";
import { Check } from "lucide-react";
import { toast } from "sonner";

type AdminUser = { id: string; name: string; email: string; role: string; status: string; permissions?: string[] };

const PERMISSION_LABELS: Record<CardId, string> = {
  ncr_pcs_total: "Kartu Total PCS NCR",
  ncr_documents: "Kartu Dokumen NCR",
  ncr_customers: "Kartu Customer NCR",
  ncr_defect_cases: "Kartu Kasus Cacat",
  reports_qty_ok: "Kartu Total Qty OK",
  reports_qty_ng: "Kartu Total Qty NG",
  reports_input_form: "Form Input Laporan",
  reports_export: "Tombol Export & PDF Laporan",
  reports_reviewer_actions: "Aksi Reviewer (Approve/Reject)",
  grafik_sap_manpower: "Grafik SAP Manpower",
  grafik_sap_stock: "Grafik SAP Stok Grade C/ST",
  grafik_sap_daily: "Grafik SAP Daily Output Repair",
  grafik_sap_warehouse: "Grafik SAP Output per Gudang",
  grafik_sap_import: "Tombol Import SAP",
  grafik_sap_export: "Tombol Export SAP",
  grafik_sap_delete: "Tombol Hapus Data SAP",
  nav_dashboard: "Menu Dashboard",
  nav_grafik_sap: "Menu Grafik SAP",
  nav_stok_ncr: "Menu Stok NCR",
  nav_repair: "Menu Output Repair",
  nav_laporan: "Menu Laporan",
  nav_admin: "Menu Admin Panel",
};

export function UserPermissionsDialog({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Default permissions fallbacks
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
  
  // Local state for checkboxes
  const [selected, setSelected] = useState<string[]>(
    user.permissions && Array.isArray(user.permissions) ? user.permissions : defaultPerms
  );

  const mutation = useMutation({
    mutationFn: async (perms: string[]) => {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: perms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan permissions");
      return data;
    },
    onSuccess: () => {
      toast.success("Hak akses berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function toggle(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else {
      setSelected([...selected, id]);
    }
  }

  function handleSave() {
    mutation.mutate(selected);
  }

  function handleResetToDefault() {
    setSelected(defaultPerms);
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) {
        setSelected(user.permissions && Array.isArray(user.permissions) ? user.permissions : defaultPerms);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          Hak Akses
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hak Akses & Menu</DialogTitle>
          <DialogDescription>
            Atur kartu dan menu apa saja yang bisa dilihat oleh <strong>{user.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-sm font-semibold">Pilih Hak Akses:</span>
            <Button type="button" variant="ghost" size="sm" onClick={handleResetToDefault} className="text-xs h-7">
              Reset Default ({user.role})
            </Button>
          </div>

          <div className="grid gap-2">
            {(Object.entries(PERMISSION_LABELS) as [CardId, string][]).map(([id, label]) => {
              const isChecked = selected.includes(id);
              return (
                <label
                  key={id}
                  onClick={() => toggle(id)}
                  className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-5 w-5 items-center justify-center rounded border ${isChecked ? "bg-primary border-primary text-primary-foreground" : "border-input bg-transparent"}`}>
                      {isChecked && <Check className="h-3 w-3" />}
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
