"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent } from "react";

import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Pencil,
  X,
  Check,
  LockKeyhole,
} from "lucide-react";

type Operator = {
  id: string;
  name: string;
  email: string;
  status: number;
  createdAt: string | null;
  roleId: string;
  roleNames: string;
  isProtected: boolean;
};

type Role = {
  id: string;
  name: string;
  restricted: boolean;
};

type Capabilities = {
  create: boolean;
  edit: boolean;
  disable: boolean;
  assignRole: boolean;
};

type FormState = {
  id?: string;
  name: string;
  email: string;
  password: string;
  roleId: string;
  roleLabel?: string;
  status: 0 | 1;
};

type ApiResponse = {
  error?: string;
  operators?: Operator[];
  roles?: Role[];
  currentUserId?: string;
  capabilities?: Capabilities;
};

const EMPTY_CAPABILITIES: Capabilities = {
  create: false,
  edit: false,
  disable: false,
  assignRole: false,
};

function isMultiRole(operator: Operator) {
  return operator.roleNames
    .split(",")
    .filter(Boolean).length > 1;
}

export default function OperatorManagementClient() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [capabilities, setCapabilities] =
    useState<Capabilities>(EMPTY_CAPABILITIES);

  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modal, setModal] =
    useState<"create" | "edit" | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    roleId: "",
    status: 1,
  });

  const loadOperators = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/operators", {
        method: "GET",
        cache: "no-store",
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load operators.");
      }

      setOperators(data.operators || []);
      setRoles(data.roles || []);
      setCapabilities(data.capabilities || EMPTY_CAPABILITIES);
      setCurrentUserId(data.currentUserId || "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/admin/operators", {
      method: "GET",
      cache: "no-store",
    })
      .then(async response => {
        const data: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load operators.");
        }

        return data;
      })
      .then(data => {
        if (!active) return;

        setOperators(data.operators || []);
        setRoles(data.roles || []);
        setCapabilities(data.capabilities || EMPTY_CAPABILITIES);
        setCurrentUserId(data.currentUserId || "");
      })
      .catch(err => {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to connect to the server."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => ({
    total: operators.length,
    active: operators.filter(o => o.status === 1).length,
    inactive: operators.filter(o => o.status !== 1).length,
    protected: operators.filter(o => o.isProtected).length,
  }), [operators]);

  const filteredOperators = useMemo(() => {
    const term = search.trim().toLowerCase();

    return operators.filter(operator => {
      const matchesSearch =
        !term ||
        operator.name.toLowerCase().includes(term) ||
        operator.email.toLowerCase().includes(term) ||
        operator.roleNames.toLowerCase().includes(term);

      const matchesRole =
        roleFilter === "all" ||
        operator.roleNames.split(",").includes(roleFilter);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && operator.status === 1) ||
        (statusFilter === "inactive" && operator.status !== 1);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [operators, search, roleFilter, statusFilter]);

  function canManageOperator(operator: Operator) {
    return (
      capabilities.edit &&
      !operator.isProtected &&
      !isMultiRole(operator) &&
      operator.id !== currentUserId &&
      roles.some(role => role.id === operator.roleId)
    );
  }

  function openCreate() {
    setError("");
    setNotice("");

    if (!roles.length) {
      setError("No assignable administrator role is available.");
      return;
    }

    setForm({
      name: "",
      email: "",
      password: "",
      roleId: roles[0].id,
      status: 1,
    });

    setModal("create");
  }

  function openEdit(operator: Operator) {
    if (!canManageOperator(operator)) return;

    setError("");
    setNotice("");

    setForm({
      id: operator.id,
      name: operator.name,
      email: operator.email,
      password: "",
      roleId: operator.roleId,
      roleLabel: operator.roleNames,
      status: operator.status === 1 ? 1 : 0,
    });

    setModal("edit");
  }

  async function saveOperator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!modal || busy) return;

    if (!form.roleId) {
      setError("Please select an administrator role.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const isCreate = modal === "create";

      const payload = isCreate
        ? {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            roleId: form.roleId,
          }
        : {
            id: form.id,
            name: form.name.trim(),
            email: form.email.trim(),
            roleId: form.roleId,
            status: form.status,
          };

      const response = await fetch("/api/admin/operators", {
        method: isCreate ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The operation failed.");
      }

      setModal(null);
      setNotice(
        isCreate
          ? "Operator created successfully."
          : "Operator information updated."
      );

      await loadOperators();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Operation failed."
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(operator: Operator) {
    if (!canManageOperator(operator)) return;

    const nextStatus = operator.status === 1 ? 0 : 1;

    if (nextStatus === 0 && !capabilities.disable) return;

    const action = nextStatus === 0 ? "deactivate" : "activate";

    if (!window.confirm(
      `Are you sure you want to ${action} ${operator.name}?`
    )) return;

    setBusyId(operator.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/operators", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: operator.id,
          name: operator.name,
          email: operator.email,
          roleId: operator.roleId,
          status: nextStatus,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Status update failed.");
      }

      setNotice(
        nextStatus === 1
          ? "Operator activated successfully."
          : "Operator deactivated successfully."
      );

      await loadOperators();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Status update failed."
      );
    } finally {
      setBusyId("");
    }
  }

  const canCreate =
    capabilities.create && capabilities.assignRole;

  return (
    <div className="operator-page">
      <div className="operator-heading">
        <div>
          <div className="operator-eyebrow">
            <ShieldCheck size={14} />
            ACCESS CONTROL
          </div>

          <h2>Operator Management</h2>

          <p>
            Manage administrator accounts, access roles and account status.
          </p>
        </div>

        <div className="operator-heading-actions">
          <button
            type="button"
            className="operator-button operator-button-secondary"
            onClick={() => void loadOperators()}
            disabled={loading || busy}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {canCreate && (
            <button
              type="button"
              className="operator-button operator-button-primary"
              onClick={openCreate}
            >
              <Plus size={17} />
              Add Operator
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="operator-alert operator-alert-error" role="alert">
          {error}
          <button type="button" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="operator-alert operator-alert-success" role="status">
          <Check size={16} />
          {notice}
          <button type="button" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="operator-stats">
        <div className="operator-stat">
          <div className="operator-stat-icon stat-blue">
            <Users size={19} />
          </div>
          <div>
            <span>Total Operators</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="operator-stat">
          <div className="operator-stat-icon stat-green">
            <UserCheck size={19} />
          </div>
          <div>
            <span>Active Accounts</span>
            <strong>{stats.active}</strong>
          </div>
        </div>

        <div className="operator-stat">
          <div className="operator-stat-icon stat-orange">
            <UserX size={19} />
          </div>
          <div>
            <span>Inactive Accounts</span>
            <strong>{stats.inactive}</strong>
          </div>
        </div>

        <div className="operator-stat">
          <div className="operator-stat-icon stat-purple">
            <LockKeyhole size={19} />
          </div>
          <div>
            <span>Protected Accounts</span>
            <strong>{stats.protected}</strong>
          </div>
        </div>
      </div>

      <section className="operator-panel">
        <div className="operator-panel-heading">
          <div>
            <h3>Administrator Accounts</h3>
            <p>Review and manage authorized team members.</p>
          </div>

          <span className="operator-result-count">
            {filteredOperators.length} results
          </span>
        </div>

        <div className="operator-filters">
          <label className="operator-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search name, email or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </label>

          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">All roles</option>
            {roles.map(role => (
              <option value={role.name} key={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="operator-loading">
            <RefreshCw size={20} className="operator-spin" />
            Loading administrator accounts...
          </div>
        ) : filteredOperators.length === 0 ? (
          <div className="operator-empty">
            <Users size={32} />
            <h3>No operators found</h3>
            <p>
              Try changing your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="operator-table-wrap">
            <table className="operator-table">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOperators.map(operator => {
                  const manageable = canManageOperator(operator);
                  const multiRole = isMultiRole(operator);

                  return (
                    <tr key={operator.id}>
                      <td>
                        <div className="operator-identity">
                          <span className="operator-avatar">
                            {operator.name.slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <strong>{operator.name}</strong>
                            <span>{operator.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="operator-role">
                          {operator.roleNames || "Unassigned"}
                        </span>
                        {multiRole && (
                          <small className="operator-row-note">
                            Multiple roles
                          </small>
                        )}
                        {operator.isProtected && (
                          <small className="operator-row-note">
                            Protected account
                          </small>
                        )}
                      </td>

                      <td>
                        <span className={
                          operator.status === 1
                            ? "operator-status is-active"
                            : "operator-status is-inactive"
                        }>
                          <span />
                          {operator.status === 1 ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <span className="operator-date">
                          {operator.createdAt
                            ? new Date(operator.createdAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </td>

                      <td>
                        <div className="operator-actions">
                          {manageable ? (
                            <>
                              <button
                                type="button"
                                className="operator-action-button"
                                title="Edit operator"
                                aria-label={`Edit ${operator.name}`}
                                onClick={() => openEdit(operator)}
                              >
                                <Pencil size={15} />
                              </button>

                              {(operator.status !== 1 || capabilities.disable) && (
                                <button
                                  type="button"
                                  className={
                                    operator.status === 1
                                      ? "operator-action-button action-danger"
                                      : "operator-action-button action-success"
                                  }
                                  title={
                                    operator.status === 1
                                      ? "Deactivate operator"
                                      : "Activate operator"
                                  }
                                  aria-label={
                                    operator.status === 1
                                      ? `Deactivate ${operator.name}`
                                      : `Activate ${operator.name}`
                                  }
                                  disabled={busyId === operator.id}
                                  onClick={() => void toggleStatus(operator)}
                                >
                                  {busyId === operator.id
                                    ? <RefreshCw size={15} className="operator-spin" />
                                    : operator.status === 1
                                      ? <UserX size={15} />
                                      : <UserCheck size={15} />
                                  }
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="operator-protected-label">
                              {operator.id === currentUserId
                                ? "Current account"
                                : operator.isProtected
                                  ? "Protected"
                                  : multiRole
                                    ? "Multi-role"
                                    : "Restricted"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="operator-panel-footer">
          <ShieldCheck size={15} />
          Changes are verified by server-side permissions.
        </div>
      </section>

      {modal && (
        <div
          className="operator-modal-backdrop"
          role="presentation"
          onMouseDown={e => {
            if (e.target === e.currentTarget && !busy) setModal(null);
          }}
        >
          <section
            className="operator-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="operator-modal-title"
          >
            <div className="operator-modal-heading">
              <div>
                <span className="operator-eyebrow">
                  ACCESS MANAGEMENT
                </span>
                <h3 id="operator-modal-title">
                  {modal === "create" ? "Add New Operator" : "Edit Operator"}
                </h3>
              </div>

              <button
                type="button"
                className="operator-close-button"
                onClick={() => !busy && setModal(null)}
                disabled={busy}
                aria-label="Close dialog"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveOperator}>
              <label className="operator-field">
                <span>Full name</span>
                <input
                  required
                  minLength={2}
                  maxLength={255}
                  value={form.name}
                  onChange={e => setForm({
                    ...form,
                    name: e.target.value,
                  })}
                  placeholder="Enter operator name"
                />
              </label>

              <label className="operator-field">
                <span>Email address</span>
                <input
                  required
                  type="email"
                  maxLength={255}
                  value={form.email}
                  onChange={e => setForm({
                    ...form,
                    email: e.target.value,
                  })}
                  placeholder="operator@example.com"
                />
              </label>

              {modal === "create" && (
                <label className="operator-field">
                  <span>Temporary password</span>
                  <input
                    required
                    type="password"
                    minLength={12}
                    maxLength={72}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={e => setForm({
                      ...form,
                      password: e.target.value,
                    })}
                    placeholder="At least 12 characters"
                  />
                  <small>
                    The password is securely hashed before storage.
                  </small>
                </label>
              )}

              {modal === "edit" && !capabilities.assignRole ? (
                <div className="operator-readonly-role">
                  <span>Assigned role</span>
                  <strong>{form.roleLabel || "Unassigned"}</strong>
                </div>
              ) : (
                <label className="operator-field">
                  <span>Administrator role</span>
                  <select
                    required
                    value={form.roleId}
                    onChange={e => setForm({
                      ...form,
                      roleId: e.target.value,
                    })}
                  >
                    {roles.map(role => (
                      <option value={role.id} key={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="operator-form-note">
                <ShieldCheck size={17} />
                <p>
                  Operator access is determined by the assigned role and
                  server-side permission rules.
                </p>
              </div>

              <div className="operator-modal-actions">
                <button
                  type="button"
                  className="operator-button operator-button-secondary"
                  onClick={() => setModal(null)}
                  disabled={busy}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="operator-button operator-button-primary"
                  disabled={
                    busy ||
                    !form.roleId ||
                    (modal === "create" && !canCreate)
                  }
                >
                  {busy
                    ? "Saving..."
                    : modal === "create"
                      ? "Create Operator"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
