"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  ShieldCheck,
  Users,
  KeyRound,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Save,
  X,
  LockKeyhole,
  Check,
  ShieldAlert,
} from "lucide-react";

type Role = {
  id: string;
  name: string;
  permissionCount: number;
  assignedAccounts: number;
  isProtected: boolean;
};

type Permission = {
  id: string;
  name: string;
  action: string;
};

type PermissionGroup = {
  module: string;
  permissions: Permission[];
};

type Capabilities = {
  create: boolean;
  rename: boolean;
  delete: boolean;
  assignPermissions: boolean;
};

type ApiData = {
  ok?: boolean;
  error?: string;
  id?: string;
  roles?: Role[];
  permissionGroups?: PermissionGroup[];
  rolePermissions?: Record<string, string[]>;
  grantablePermissionIds?: string[];
  capabilities?: Capabilities;
};

const EMPTY_CAPABILITIES: Capabilities = {
  create: false,
  rename: false,
  delete: false,
  assignPermissions: false,
};

async function requestApi(
  method: string,
  body?: Record<string, unknown>
): Promise<ApiData> {
  const response = await fetch("/api/admin/roles", {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json() as ApiData;

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

function humanize(value: string) {
  return value
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function RoleManagementClient() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [rolePermissions, setRolePermissions] =
    useState<Record<string, string[]>>({});

  const [grantableIds, setGrantableIds] = useState<string[]>([]);
  const [capabilities, setCapabilities] =
    useState<Capabilities>(EMPTY_CAPABILITIES);

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [modal, setModal] = useState<"create" | "rename" | null>(null);
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/admin/roles", {
      method: "GET",
      cache: "no-store",
    })
      .then(async response => {
        const data = await response.json() as ApiData;

        if (!response.ok) {
          throw new Error(data.error || "Could not load roles.");
        }

        return data;
      })
      .then(data => {
        if (!active) return;

        const nextRoles = data.roles || [];
        const firstId = nextRoles[0]?.id || "";

        setRoles(nextRoles);
        setGroups(data.permissionGroups || []);
        setRolePermissions(data.rolePermissions || {});
        setGrantableIds(data.grantablePermissionIds || []);
        setCapabilities(data.capabilities || EMPTY_CAPABILITIES);

        setSelectedRoleId(firstId);
        setDraftPermissions(
          data.rolePermissions?.[firstId] || []
        );
      })
      .catch(err => {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load role information."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredRoles = useMemo(() => {
    const term = search.trim().toLowerCase();

    return roles.filter(role =>
      role.name.toLowerCase().includes(term)
    );
  }, [roles, search]);

  const selectedRole = roles.find(
    role => role.id === selectedRoleId
  );

  const selectableIds = useMemo(
    () => groups.flatMap(group =>
      group.permissions
        .map(permission => permission.id)
        .filter(id => grantableIds.includes(id))
    ),
    [groups, grantableIds]
  );

  const totalPermissions = groups.reduce(
    (total, group) => total + group.permissions.length,
    0
  );

  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every(id => draftPermissions.includes(id));

  const canEditSelectedPermissions =
    Boolean(
      selectedRole &&
      capabilities.assignPermissions &&
      !selectedRole.isProtected
    );

  function selectRole(role: Role) {
    setSelectedRoleId(role.id);

    setDraftPermissions(
      rolePermissions[role.id] || []
    );

    setError("");
    setNotice("");
  }

  function togglePermission(id: string) {
    if (!canEditSelectedPermissions || !grantableIds.includes(id)) {
      return;
    }

    setDraftPermissions(previous =>
      previous.includes(id)
        ? previous.filter(value => value !== id)
        : [...previous, id]
    );
  }

  function toggleGroup(group: PermissionGroup) {
    if (!canEditSelectedPermissions) return;

    const ids = group.permissions
      .map(permission => permission.id)
      .filter(id => grantableIds.includes(id));

    const alreadySelected =
      ids.length > 0 &&
      ids.every(id => draftPermissions.includes(id));

    setDraftPermissions(previous => {
      if (alreadySelected) {
        return previous.filter(id => !ids.includes(id));
      }

      return [...new Set([...previous, ...ids])];
    });
  }

  function toggleAllPermissions() {
    if (!canEditSelectedPermissions) return;

    setDraftPermissions(
      allSelected ? [] : [...selectableIds]
    );
  }

  async function savePermissions() {
    if (!selectedRole || !canEditSelectedPermissions) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const safeIds = draftPermissions.filter(
        id => grantableIds.includes(id)
      );

      await requestApi("PATCH", {
        action: "permissions",
        roleId: selectedRole.id,
        permissionIds: safeIds,
      });

      setRolePermissions(previous => ({
        ...previous,
        [selectedRole.id]: safeIds,
      }));

      setRoles(previous =>
        previous.map(role =>
          role.id === selectedRole.id
            ? { ...role, permissionCount: safeIds.length }
            : role
        )
      );

      setNotice("Role permissions saved successfully.");

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Permission update failed."
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = roleName.trim();

    if (!name) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      if (modal === "create") {
        const data = await requestApi("POST", { name });

        const id = String(data.id);

        setRoles(previous =>
          [...previous, {
            id,
            name,
            permissionCount: 0,
            assignedAccounts: 0,
            isProtected: false,
          }].sort((a, b) => a.name.localeCompare(b.name))
        );

        setRolePermissions(previous => ({
          ...previous,
          [id]: [],
        }));

        setSelectedRoleId(id);
        setDraftPermissions([]);

        setNotice("New role created successfully.");

      } else if (modal === "rename" && selectedRole) {
        await requestApi("PATCH", {
          action: "rename",
          roleId: selectedRole.id,
          name,
        });

        setRoles(previous =>
          previous.map(role =>
            role.id === selectedRole.id
              ? { ...role, name }
              : role
          )
        );

        setNotice("Role renamed successfully.");
      }

      setModal(null);
      setRoleName("");

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Role operation failed."
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteRole() {
    if (!selectedRole || selectedRole.isProtected) return;

    if (selectedRole.assignedAccounts > 0) {
      setError("Reassign operators before deleting this role.");
      return;
    }

    if (!window.confirm(
      `Delete the role "${selectedRole.name}"? This action cannot be undone.`
    )) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await requestApi("DELETE", {
        roleId: selectedRole.id,
      });

      const remaining = roles.filter(
        role => role.id !== selectedRole.id
      );

      setRoles(remaining);

      const nextId = remaining[0]?.id || "";

      setSelectedRoleId(nextId);
      setDraftPermissions(
        rolePermissions[nextId] || []
      );

      setNotice("Role deleted successfully.");

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Role deletion failed."
      );
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setRoleName("");
    setModal("create");
    setError("");
  }

  function openRename() {
    if (!selectedRole || selectedRole.isProtected) return;

    setRoleName(selectedRole.name);
    setModal("rename");
    setError("");
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
        <RefreshCw className="mx-auto mb-3 animate-spin" size={24} />
        <p className="text-sm text-slate-500">Loading role management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Admin Roles</span>
            <ShieldCheck className="text-blue-600" size={22} />
          </div>
          <div className="mt-3 text-3xl font-bold">{roles.length}</div>
          <p className="mt-1 text-xs text-slate-500">Existing administrative roles</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Permissions</span>
            <KeyRound className="text-violet-600" size={22} />
          </div>
          <div className="mt-3 text-3xl font-bold">{totalPermissions}</div>
          <p className="mt-1 text-xs text-slate-500">Available admin permissions</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Assigned Accounts</span>
            <Users className="text-emerald-600" size={22} />
          </div>
          <div className="mt-3 text-3xl font-bold">
            {roles.reduce((total, role) => total + role.assignedAccounts, 0)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Role assignments</p>
        </div>

      </div>

      {/* NOTIFICATIONS */}

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <ShieldAlert size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <Check size={18} />
          {notice}
        </div>
      )}

      {/* MAIN CONTENT */}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">

        {/* ROLE LIST */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Roles</h2>
                <p className="mt-1 text-xs text-slate-500">Manage administrator roles</p>
              </div>

              {capabilities.create && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <Plus size={15} />
                  New Role
                </button>
              )}
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />

              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search roles..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="max-h-[650px] space-y-2 overflow-y-auto p-3">

            {filteredRoles.map(role => {
              const active = selectedRoleId === role.id;

              return (
                <button
                  type="button"
                  key={role.id}
                  onClick={() => selectRole(role)}
                  aria-pressed={active}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-transparent bg-slate-50 hover:border-slate-200 dark:bg-slate-800/60 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">

                    <div className="flex min-w-0 items-center gap-2">
                      <ShieldCheck size={18} className={active ? "text-blue-600" : "text-slate-400"} />

                      <span className="truncate text-sm font-semibold">
                        {role.name}
                      </span>
                    </div>

                    {role.isProtected && (
                      <LockKeyhole size={15} className="shrink-0 text-amber-600" />
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{role.permissionCount} permissions</span>
                    <span>{role.assignedAccounts} operators</span>
                  </div>

                  {active && (
                    <div className="mt-3 text-xs font-semibold text-blue-600">
                      Currently selected
                    </div>
                  )}
                </button>
              );
            })}

            {filteredRoles.length === 0 && (
              <p className="p-6 text-center text-sm text-slate-500">
                No matching roles found.
              </p>
            )}

          </div>
        </section>

        {/* PERMISSION PANEL */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          {!selectedRole ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Select a role to manage permissions.
            </div>
          ) : (
            <>

              <div className="border-b border-slate-200 p-5 dark:border-slate-800">

                <div className="flex flex-wrap items-start justify-between gap-4">

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{selectedRole.name}</h2>

                      {selectedRole.isProtected && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Protected
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedRole.permissionCount} permissions · {selectedRole.assignedAccounts} assigned operators
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">

                    {capabilities.rename && !selectedRole.isProtected && (
                      <button
                        type="button"
                        onClick={openRename}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <Pencil size={14} />
                        Rename
                      </button>
                    )}

                    {capabilities.delete && !selectedRole.isProtected && (
                      <button
                        type="button"
                        onClick={() => void deleteRole()}
                        disabled={busy || selectedRole.assignedAccounts > 0}
                        title={selectedRole.assignedAccounts > 0 ? "Reassign operators first" : "Delete role"}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}

                  </div>
                </div>

                {selectedRole.isProtected && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    This system role is protected. Its name, permissions and deletion are restricted in this dashboard.
                  </div>
                )}

                {selectedRole.assignedAccounts > 0 && !selectedRole.isProtected && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                    This role is assigned to {selectedRole.assignedAccounts} account(s). Reassign them before deletion.
                  </div>
                )}

              </div>

              {/* PERMISSION TOOLBAR */}

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">

                <div>
                  <h3 className="text-sm font-semibold">Permission Matrix</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {draftPermissions.length} selected · {totalPermissions} available
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">

                  {canEditSelectedPermissions && (
                    <button
                      type="button"
                      onClick={toggleAllPermissions}
                      disabled={busy || selectableIds.length === 0}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                  )}

                  {canEditSelectedPermissions && (
                    <button
                      type="button"
                      onClick={() => void savePermissions()}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save size={14} />
                      {busy ? "Saving..." : "Save Permissions"}
                    </button>
                  )}

                </div>
              </div>

              {!canEditSelectedPermissions && (
                <div className="border-b border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                  {selectedRole.isProtected
                    ? "Protected system role: permission editing is disabled."
                    : "You have read-only access or lack permission to edit role permissions."}
                </div>
              )}

              {/* PERMISSION GROUPS */}

              <div className="space-y-4 p-4">

                {groups.map(group => {
                  const ids = group.permissions
                    .map(permission => permission.id)
                    .filter(id => grantableIds.includes(id));

                  const checkedCount = ids.filter(
                    id => draftPermissions.includes(id)
                  ).length;

                  const checked =
                    ids.length > 0 &&
                    checkedCount === ids.length;

                  return (
                    <div
                      key={group.module}
                      className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
                    >

                      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3 dark:bg-slate-800/70">

                        <div>
                          <h4 className="text-sm font-semibold">
                            {humanize(group.module)}
                          </h4>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {checkedCount} of {ids.length} editable selected
                          </p>
                        </div>

                        {canEditSelectedPermissions && ids.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleGroup(group)}
                            disabled={busy}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-40"
                          >
                            {checked ? "Deselect module" : "Select module"}
                          </button>
                        )}

                      </div>

                      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">

                        {group.permissions.map(permission => {
                          const allowed = grantableIds.includes(permission.id);
                          const selected = draftPermissions.includes(permission.id);

                          return (
                            <label
                              key={permission.id}
                              className={`flex min-w-0 items-center gap-2 rounded-lg border p-3 text-xs ${
                                !allowed
                                  ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50 dark:border-slate-800 dark:bg-slate-900"
                                  : selected
                                    ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
                                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                              } ${
                                canEditSelectedPermissions && allowed
                                  ? "cursor-pointer"
                                  : "cursor-default"
                              }`}
                            >

                              <input
                                type="checkbox"
                                checked={selected}
                                disabled={
                                  busy ||
                                  !allowed ||
                                  !canEditSelectedPermissions
                                }
                                onChange={() => togglePermission(permission.id)}
                                className="h-4 w-4 shrink-0 accent-blue-600"
                              />

                              <span className="min-w-0 flex-1 break-words">
                                {humanize(permission.action)}
                                <span className="mt-0.5 block break-all text-[10px] text-slate-400">
                                  {permission.name}
                                </span>
                              </span>

                              {!allowed && (
                                <LockKeyhole size={13} className="shrink-0 text-slate-400" />
                              )}

                            </label>
                          );
                        })}

                      </div>
                    </div>
                  );
                })}

                {groups.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                    <KeyRound className="mx-auto mb-3 text-slate-400" size={28} />
                    <p className="text-sm font-semibold">Permission list unavailable</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Permission-list access is required to view the matrix.
                    </p>
                  </div>
                )}

              </div>

            </>
          )}

        </section>

      </div>

      {/* CREATE / RENAME MODAL */}

      {modal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !busy) {
              setModal(null);
            }
          }}
        >

          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">

            <div className="flex items-center justify-between gap-3">

              <div>
                <h3 className="text-lg font-bold">
                  {modal === "create" ? "Create New Role" : "Rename Role"}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {modal === "create"
                    ? "Add a new administrative role."
                    : "Update the role display name."}
                </p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => setModal(null)}
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={19} />
              </button>

            </div>

            <form onSubmit={event => void submitRole(event)}>

              <label className="mt-6 block text-sm font-medium">
                Role Name
              </label>

              <input
                autoFocus
                required
                minLength={2}
                maxLength={80}
                value={roleName}
                onChange={event => setRoleName(event.target.value)}
                placeholder="Example: Inventory Manager"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
              />

              <div className="mt-6 flex justify-end gap-2">

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setModal(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={busy || roleName.trim().length < 2}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy
                    ? "Processing..."
                    : modal === "create"
                      ? "Create Role"
                      : "Save Changes"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
