"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  FileText,
  Link2,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/* ---------- Types ---------- */

interface Stats {
  totalUsers: number;
  totalProjects: number;
  proUsers: number;
  unlimitedUsers: number;
  recentSignups: number;
  recentProjects: number;
  projectsByType: Record<string, number>;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  projectCount: number;
  createdAt: string;
}

interface Project {
  id: string;
  title: string;
  type: string;
  userName: string | null;
  userEmail: string;
  phiDetected: boolean;
  shareId: string | null;
  createdAt: string;
}

interface Share {
  projectId: string;
  shareId: string;
  title: string;
  type: string;
  userName: string | null;
  userEmail: string;
  createdAt: string;
}

interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

interface PaginatedProjects {
  projects: Project[];
  total: number;
  page: number;
  totalPages: number;
}

type Role = "free" | "pro" | "unlimited" | "admin";

const ROLES: Role[] = ["free", "pro", "unlimited", "admin"];

const ROLE_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  unlimited:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const PAGE_LIMIT = 25;

/* ---------- Main Page ---------- */

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.status === 403) {
          setAccessDenied(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch {
        toast.error("Failed to load admin stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-1">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          You do not have permission to view the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">
          Manage users, content, and platform settings
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="shares">Shares</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab stats={stats} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="projects">
          <ProjectsTab />
        </TabsContent>
        <TabsContent value="shares">
          <SharesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Overview Tab ---------- */

function OverviewTab({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No stats available.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
        />
        <StatCard
          icon={FileText}
          label="Total Projects"
          value={stats.totalProjects}
        />
        <StatCard
          icon={Shield}
          label="Pro Users"
          value={stats.proUsers}
        />
        <StatCard
          icon={Shield}
          label="Unlimited Users"
          value={stats.unlimitedUsers}
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Signups (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.recentSignups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Projects (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.recentProjects}</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects by type */}
      {Object.keys(stats.projectsByType).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projects by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.projectsByType).map(([type, count]) => (
                <Badge key={type} variant="secondary">
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

/* ---------- Users Tab ---------- */

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(PAGE_LIMIT),
        search: q,
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data: PaginatedUsers = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page, search);
  }, [page, search, fetchUsers]);

  async function handleRoleChange(userId: string, role: string) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No users found.
        </p>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium text-center">Projects</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{user.name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value)
                        }
                      >
                        <SelectTrigger className="h-7 w-[120px] text-xs">
                          <SelectValue>
                            <span
                              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.role] || ROLE_COLORS.free}`}
                            >
                              {user.role}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              <span
                                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[r]}`}
                              >
                                {r}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.projectCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete user"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- Projects Tab ---------- */

function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchProjects = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(PAGE_LIMIT),
      });
      const res = await fetch(`/api/admin/projects?${params}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data: PaginatedProjects = await res.json();
      setProjects(data.projects);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(page);
  }, [page, fetchProjects]);

  async function handleDeleteProject(projectId: string) {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error("Failed to delete project");
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  }

  const filtered =
    typeFilter === "all"
      ? projects
      : projects.filter((p) => p.type === typeFilter);

  const projectTypes = Array.from(new Set(projects.map((p) => p.type)));

  return (
    <div className="space-y-4">
      {/* Type filter */}
      <div className="max-w-[200px]">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {projectTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No projects found.
        </p>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium text-center">PHI?</th>
                  <th className="px-4 py-3 font-medium text-center">Shared?</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr key={project.id} className="border-b last:border-0">
                    <td className="px-4 py-3 max-w-[200px] truncate" title={project.title}>
                      {project.title}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[10px]">
                        {project.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {project.userName || project.userEmail}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {project.phiDetected ? (
                        <Badge variant="warning" className="text-[10px]">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {project.shareId ? (
                        <Badge variant="success" className="text-[10px]">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteProject(project.id)}
                        title="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- Shares Tab ---------- */

function SharesTab() {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShares() {
      try {
        const res = await fetch("/api/admin/shares");
        if (!res.ok) throw new Error("Failed to fetch shares");
        const data = await res.json();
        setShares(data.shares || []);
      } catch {
        toast.error("Failed to load shares");
      } finally {
        setLoading(false);
      }
    }
    fetchShares();
  }, []);

  async function handleRevoke(projectId: string) {
    if (!window.confirm("Revoke this share link? This cannot be undone."))
      return;
    try {
      const res = await fetch("/api/admin/shares", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error("Failed to revoke share");
      setShares((prev) => prev.filter((s) => s.projectId !== projectId));
      toast.success("Share revoked");
    } catch {
      toast.error("Failed to revoke share");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Link2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">No active shares.</p>
      </div>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Shared By</th>
              <th className="px-4 py-3 font-medium">Share URL</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shares.map((share) => {
              const shareUrl = `/share/${share.shareId}`;
              return (
                <tr key={share.projectId} className="border-b last:border-0">
                  <td className="px-4 py-3 max-w-[200px] truncate" title={share.title}>
                    {share.title}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-[10px]">
                      {share.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {share.userName || share.userEmail}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate" title={shareUrl}>
                    {shareUrl}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(share.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive hover:text-destructive text-xs"
                      onClick={() => handleRevoke(share.projectId)}
                    >
                      Revoke
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
