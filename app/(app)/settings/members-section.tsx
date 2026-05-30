"use client";

// Members tab (§5.13): co-managers of the cap table. Admins can invite by email
// + role (magic-link invite) and revoke access. Pending invites show until the
// invitee signs in for the first time.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteMember, inviteMembersBulk, removeMember } from "./actions";

export interface MemberRow {
  membershipId: string;
  email: string;
  fullName: string | null;
  role: string;
  pending: boolean;
  isSelf: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export function MembersSection({ members }: { members: MemberRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const onInvite = () => {
    const value = email.trim();
    if (!value) {
      toast.error("Enter an email address to invite.");
      return;
    }
    startTransition(async () => {
      const result = await inviteMember(value, role);
      if (result.ok) {
        toast.success(
          result.emailed
            ? `Invite sent to ${value}.`
            : `${value} added. (Email isn't configured here, so no message went out.)`,
        );
        setEmail("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const onBulkInvite = () => {
    if (!bulkText.trim()) {
      toast.error("Paste some email addresses first.");
      return;
    }
    startTransition(async () => {
      const result = await inviteMembersBulk(bulkText, role);
      if (result.ok) {
        const parts = [`${result.invited} invited`];
        if (result.skipped) parts.push(`${result.skipped} already members`);
        if (result.invalid.length) parts.push(`${result.invalid.length} skipped`);
        toast.success(parts.join(" · "));
        setBulkText("");
        setBulkOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const onRemove = (m: MemberRow) => {
    startTransition(async () => {
      const result = await removeMember(m.membershipId);
      if (result.ok) {
        toast.success(`Removed ${m.email}.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-slate-900">Members</h2>
      <p className="mt-1 text-sm text-slate-500">
        People who can see and manage this cap table. Invites are sent as a one-time sign-in link —
        no passwords.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          inputMode="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onInvite();
          }}
          disabled={pending}
          className="sm:flex-1"
          aria-label="Invitee email"
        />
        <Select value={role} onValueChange={setRole} disabled={pending}>
          <SelectTrigger className="sm:w-36" aria-label="Role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onInvite} disabled={pending}>
          {pending ? "Sending…" : "Invite member"}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setBulkOpen((v) => !v)}
        className="mt-3 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
      >
        {bulkOpen ? "Hide bulk invite" : "Invite several at once"}
      </button>

      {bulkOpen ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-xs text-slate-500">
            One email per line (up to 50). Add a role after a comma to override the one above —
            e.g. <code className="rounded bg-white px-1">sam@acme.com, admin</code>.
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            disabled={pending}
            rows={5}
            placeholder={"alex@acme.com\njordan@acme.com, viewer"}
            className="mt-2 w-full resize-y rounded-md border border-slate-200 bg-white p-2 font-mono text-xs text-slate-900 outline-none focus:border-brand-400"
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={onBulkInvite} disabled={pending}>
              {pending ? "Sending…" : "Send invites"}
            </Button>
          </div>
        </div>
      ) : null}

      <ul className="mt-5 divide-y divide-slate-100">
        {members.map((m) => (
          <li key={m.membershipId} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-slate-900">
                  {m.fullName?.trim() || m.email}
                </span>
                {m.isSelf ? <span className="text-xs text-slate-400">(you)</span> : null}
                {m.pending ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Invited
                  </span>
                ) : null}
              </div>
              {m.fullName?.trim() ? (
                <div className="truncate text-xs text-slate-500">{m.email}</div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs uppercase tracking-wider text-slate-400">
                {ROLE_LABEL[m.role] ?? m.role}
              </span>
              {m.isSelf ? null : (
                <button
                  type="button"
                  onClick={() => onRemove(m)}
                  disabled={pending}
                  className="text-xs font-medium text-slate-400 transition-colors hover:text-red-600 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
