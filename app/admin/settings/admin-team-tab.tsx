"use client";

import { useEffect, useState } from "react";
import { Loader2, Shield, Trash2, UserPlus, X } from "lucide-react";

type Admin = {
  id: string;
  source: "ADMIN" | "INVITE";
  name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "BLOCKED" | "INVITED";
  lastLoginAt: string | null;
  createdAt: string;
  expiresAt?: string;
};

type AdminTeamData = {
  admins: Admin[];
  stats: {
    total: number;
    active: number;
    blocked: number;
    invited: number;
  };
  currentAdminId: string;
  currentAdminRole: "ADMIN" | "SUPER_ADMIN";
};

type Props = {
  onMessage: (message: string) => void;
  onError: (message: string) => void;
};

export default function AdminTeamTab({ onMessage, onError }: Props) {
  const [data, setData] = useState<AdminTeamData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [action, setAction] = useState<"block" | "unblock" | "delete" | null>(
    null,
  );

  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "SUPER_ADMIN" | "">(
    "",
  );

  const [saving, setSaving] = useState(false);

  async function loadTeam() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/team", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Unable to load admin team.",
        );
      }

      setData(result.data);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Unable to load admin team.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTeam();
  }, []);

  async function handleAction() {
    if (!selectedAdmin || !action || selectedAdmin.source !== "ADMIN") {
      return;
    }

    setSaving(true);
    onError("");

    try {
      const response =
        action === "delete"
          ? await fetch(`/api/admin/team/${selectedAdmin.id}`, {
              method: "DELETE",
            })
          : await fetch(`/api/admin/team/${selectedAdmin.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action,
              }),
            });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Unable to update administrator.",
        );
      }

      onMessage(result.message || "Administrator updated successfully.");

      setSelectedAdmin(null);
      setAction(null);

      await loadTeam();
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Unable to update administrator.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim() || !inviteRole) {
      onError("Complete all invitation fields.");
      return;
    }

    setSaving(true);
    onError("");

    try {
      const response = await fetch("/api/admin/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Unable to send invitation.",
        );
      }

      onMessage(result.message || "Admin invitation sent successfully.");

      closeInvite();
      await loadTeam();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Unable to send invitation.",
      );
    } finally {
      setSaving(false);
    }
  }

  function closeInvite() {
    if (saving) {
      return;
    }

    setShowInvite(false);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("");
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[7px] border border-[#e6e7e9] bg-white dark:border-[#342a24] dark:bg-[#1b1714]">
        <Loader2 size={22} className="animate-spin text-[#ff6b00]" />
      </div>
    );
  }

  const isSuperAdmin = data.currentAdminRole === "SUPER_ADMIN";

  return (
    <>
      <section className="overflow-hidden rounded-[7px] border border-[#e6e7e9] bg-white dark:border-[#342a24] dark:bg-[#1b1714]">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[#eeeeef] px-5 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-[#342a24]">
          <div>
            <h2 className="text-[14px] font-bold tracking-[-0.02em]">
              Admin Team
            </h2>

            <p className="mt-1 text-[10px] text-[#8a8d91] dark:text-[#9e9189]">
              {data.admins.length} people with console access
            </p>
          </div>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => {
                onError("");
                setShowInvite(true);
              }}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[4px] bg-[#ff6b00] px-4 text-[10px] font-semibold text-white transition-colors hover:bg-[#e96000] focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/25 sm:w-auto"
            >
              <UserPlus size={14} />
              Invite Admin
            </button>
          )}
        </div>

        {/* Table */}
        {data.admins.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="bg-[#fafafa] dark:bg-[#211c19]">
                  {["Name", "Email", "Role", "Status", "Last Active"].map(
                    (heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="border-b border-[#eeeeef] px-5 py-3 text-[8px] font-semibold uppercase tracking-[0.09em] text-[#8a8d91] dark:border-[#342a24]"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {data.admins.map((admin) => {
                  const clickable = admin.source === "ADMIN";

                  return (
                    <tr
                      key={admin.id}
                      onClick={() => {
                        if (!clickable) {
                          return;
                        }

                        onError("");
                        setSelectedAdmin(admin);
                      }}
                      className={[
                        "border-b border-[#f0f0f1] last:border-b-0 dark:border-[#302822]",
                        clickable
                          ? "cursor-pointer transition-colors hover:bg-[#fffaf7] dark:hover:bg-[#211b18]"
                          : "",
                      ].join(" ")}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff0e5] text-[8px] font-bold uppercase text-[#ff6b00] dark:bg-[#35231a] dark:text-[#ffb27a]">
                            {getInitials(admin.name)}
                          </div>

                          <span className="truncate text-[10px] font-semibold">
                            {admin.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-[9px] text-[#777b80] dark:text-[#bdb0a8]">
                        {admin.email}
                      </td>

                      <td className="px-5 py-4">
                        <RoleBadge role={admin.role} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={admin.status} />
                      </td>

                      <td className="px-5 py-4 text-[9px] text-[#777b80] dark:text-[#bdb0a8]">
                        {admin.status === "INVITED"
                          ? "—"
                          : admin.lastLoginAt
                            ? formatDate(admin.lastLoginAt)
                            : "Never"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0e5] text-[#ff6b00] dark:bg-[#35231a] dark:text-[#ffb27a]">
              <Shield size={18} />
            </div>

            <p className="mt-3 text-[10px] font-semibold">
              No administrators found
            </p>

            <p className="mt-1 text-[9px] text-[#8a8d91] dark:text-[#9e9189]">
              Invite an administrator to give them console access.
            </p>
          </div>
        )}
      </section>

      {/* Admin details */}
      {selectedAdmin && !action && (
        <Modal onClose={() => setSelectedAdmin(null)}>
          <ModalHeader
            title="Admin Details"
            onClose={() => setSelectedAdmin(null)}
            label="Close admin details"
          />

          <div className="mt-5 overflow-hidden rounded-[5px] border border-[#e8e8e9] dark:border-[#40352e]">
            <DetailRow label="Name" value={selectedAdmin.name} />
            <DetailRow label="Email" value={selectedAdmin.email} />
            <DetailRow
              label="Role"
              value={
                selectedAdmin.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"
              }
            />
            <DetailRow
              label="Status"
              value={selectedAdmin.status === "ACTIVE" ? "Active" : "Blocked"}
            />
            <DetailRow
              label="Last Active"
              value={
                selectedAdmin.lastLoginAt
                  ? formatDate(selectedAdmin.lastLoginAt)
                  : "Never"
              }
            />
          </div>

          {isSuperAdmin && selectedAdmin.id !== data.currentAdminId && (
            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[#eeeeef] pt-5 sm:flex-row sm:justify-end dark:border-[#342a24]">
              <button
                type="button"
                onClick={() =>
                  setAction(
                    selectedAdmin.status === "ACTIVE" ? "block" : "unblock",
                  )
                }
                className="h-9 rounded-[4px] border border-[#ffd2b8] px-4 text-[10px] font-semibold text-[#ff6b00] transition-colors hover:bg-[#fff8f3] focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/25 dark:border-[#5a3827] dark:hover:bg-[#2a211c]"
              >
                {selectedAdmin.status === "ACTIVE"
                  ? "Block Admin"
                  : "Unblock Admin"}
              </button>

              <button
                type="button"
                onClick={() => setAction("delete")}
                className="h-9 rounded-[4px] bg-[#ef3e4a] px-4 text-[10px] font-semibold text-white transition-colors hover:bg-[#d9323d] focus:outline-none focus:ring-2 focus:ring-[#ef3e4a]/25"
              >
                Delete Admin
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* Confirmation */}
      {selectedAdmin && action && (
        <ConfirmModal
          action={action}
          admin={selectedAdmin}
          saving={saving}
          onCancel={() => setAction(null)}
          onConfirm={() => void handleAction()}
        />
      )}

      {/* Invite */}
      {showInvite && (
        <Modal onClose={closeInvite}>
          <ModalHeader
            title="Invite Admin"
            subtitle="They'll receive an email invite to join the Tinkhupp admin console."
            onClose={closeInvite}
            label="Close invite dialog"
          />

          <div className="mt-6 space-y-4">
            <Field
              label="Full Name"
              value={inviteName}
              onChange={setInviteName}
              placeholder="e.g Grace Timi"
            />

            <Field
              label="Email Address"
              value={inviteEmail}
              onChange={setInviteEmail}
              type="email"
              placeholder="name@example.com"
            />

            <div>
              <label
                htmlFor="admin-invite-role"
                className="mb-1.5 block text-[9px] font-semibold text-[#55585d] dark:text-[#bdb0a8]"
              >
                Role
              </label>

              <select
                id="admin-invite-role"
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(
                    event.target.value as "ADMIN" | "SUPER_ADMIN" | "",
                  )
                }
                className="h-10 w-full rounded-[4px] border border-[#e5e6e8] bg-[#f7f7f7] px-3 text-[10px] outline-none transition-colors focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/10 dark:border-[#40352e] dark:bg-[#241e1a] dark:text-[#fff4ec]"
              >
                <option value="">Select role</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#eeeeef] pt-5 sm:flex-row sm:justify-end dark:border-[#342a24]">
            <button
              type="button"
              onClick={closeInvite}
              disabled={saving}
              className="h-9 rounded-[4px] border border-[#e1e2e4] px-4 text-[10px] font-semibold transition-colors hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#40352e] dark:hover:bg-[#29221e]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void handleInvite()}
              disabled={saving}
              className="inline-flex h-9 items-center justify-center rounded-[4px] bg-[#ff6b00] px-4 text-[10px] font-semibold text-white transition-colors hover:bg-[#e96000] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/25"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invite"
              )}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function RoleBadge({ role }: { role: Admin["role"] }) {
  return (
    <span className="inline-flex rounded-[3px] bg-[#f0edff] px-2 py-1 text-[8px] font-semibold text-[#7559c9] dark:bg-[#2b2438] dark:text-[#c8b8ff]">
      {role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
    </span>
  );
}

function StatusBadge({ status }: { status: Admin["status"] }) {
  const config = {
    ACTIVE: {
      label: "Active",
      className:
        "bg-[#e8f8ef] text-[#167044] dark:bg-[#17251d] dark:text-[#8ce0ae]",
    },
    BLOCKED: {
      label: "Blocked",
      className:
        "bg-[#fff0ef] text-[#c43c32] dark:bg-[#2b1b19] dark:text-[#ffaaa1]",
    },
    INVITED: {
      label: "Invited",
      className:
        "bg-[#f0f0f2] text-[#666970] dark:bg-[#292624] dark:text-[#c0bbb7]",
    },
  };

  const item = config[status];

  return (
    <span
      className={`inline-flex rounded-[3px] px-2 py-1 text-[8px] font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-[#eeeeef] px-3.5 py-3 last:border-b-0 dark:border-[#342a24]">
      <span className="shrink-0 text-[9px] font-semibold text-[#8a8d91] dark:text-[#9e9189]">
        {label}
      </span>

      <span className="break-all text-right text-[9px] font-medium">
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-semibold text-[#55585d] dark:text-[#bdb0a8]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-[4px] border border-[#e5e6e8] bg-[#f7f7f7] px-3 text-[10px] outline-none transition-colors placeholder:text-[#aaa] focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/10 dark:border-[#40352e] dark:bg-[#241e1a] dark:text-[#fff4ec] dark:placeholder:text-[#756a63]"
      />
    </label>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative my-auto max-h-[calc(100vh-24px)] w-full max-w-[600px] overflow-y-auto rounded-[7px] border border-[#eeeeef] bg-white p-5 shadow-2xl dark:border-[#342a24] dark:bg-[#1b1714] dark:text-[#fff4ec] sm:max-h-[calc(100vh-32px)] sm:p-6">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
  label,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  label: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-[14px] font-bold tracking-[-0.02em]">{title}</h3>

        {subtitle && (
          <p className="mt-1 max-w-[430px] text-[9px] leading-4 text-[#8a8d91] dark:text-[#9e9189]">
            {subtitle}
          </p>
        )}
      </div>

      <button
        type="button"
        aria-label={label}
        onClick={onClose}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-[#8a8d91] transition-colors hover:bg-[#f5f5f5] hover:text-[#55585d] focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/25 dark:hover:bg-[#29221e] dark:hover:text-[#fff4ec]"
      >
        <X size={15} />
      </button>
    </div>
  );
}

function ConfirmModal({
  action,
  admin,
  saving,
  onCancel,
  onConfirm,
}: {
  action: "block" | "unblock" | "delete";
  admin: Admin;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isDelete = action === "delete";
  const isBlock = action === "block";

  return (
    <Modal onClose={onCancel}>
      <div className="text-center">
        <div
          className={[
            "mx-auto flex h-12 w-12 items-center justify-center rounded-[8px]",
            isDelete
              ? "bg-[#fff0ef] text-[#ef3e4a] dark:bg-[#2b1b19]"
              : "bg-[#fff0e5] text-[#ff6b00] dark:bg-[#35231a] dark:text-[#ffb27a]",
          ].join(" ")}
        >
          {isDelete ? <Trash2 size={22} /> : <Shield size={22} />}
        </div>

        <h3 className="mt-4 text-[15px] font-bold">
          {isDelete
            ? "Delete this admin?"
            : isBlock
              ? "Block this admin?"
              : "Unblock this admin?"}
        </h3>

        <p className="mx-auto mt-2 max-w-[340px] text-[9px] leading-4 text-[#8a8d91] dark:text-[#9e9189]">
          {isDelete
            ? `This will permanently remove ${admin.name} from the Tinkhupp admin team.`
            : isBlock
              ? `${admin.name} will no longer be able to access the Tinkhupp admin console.`
              : `${admin.name} will regain access to the Tinkhupp admin console.`}
        </p>

        <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-9 rounded-[4px] border border-[#e1e2e4] px-5 text-[10px] font-semibold transition-colors hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#40352e] dark:hover:bg-[#29221e]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className={[
              "inline-flex h-9 items-center justify-center rounded-[4px] px-5 text-[10px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2",
              isDelete
                ? "bg-[#ef3e4a] hover:bg-[#d9323d] focus:ring-[#ef3e4a]/25"
                : "bg-[#ff6b00] hover:bg-[#e96000] focus:ring-[#ff6b00]/25",
            ].join(" ")}
          >
            {saving ? (
              <>
                <Loader2 size={13} className="mr-1.5 animate-spin" />
                Saving...
              </>
            ) : isDelete ? (
              "Delete Admin"
            ) : isBlock ? (
              "Block Admin"
            ) : (
              "Unblock Admin"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AD"
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
