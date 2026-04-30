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
  Database,
  Save,
  ArrowUpDown,
  Check,
  X,
  Activity,
  BarChart3,
  Server,
  TrendingUp,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ---------- Types ---------- */

interface DailyCount {
  date: string;
  count: number;
}

interface TopUser {
  name: string | null;
  email: string;
  count: number;
}

interface ToolPopularity {
  type: string;
  count: number;
  pct: number;
}

interface Stats {
  totalUsers: number;
  totalProjects: number;
  proUsers: number;
  unlimitedUsers: number;
  recentSignups: number;
  recentProjects: number;
  projectsByType: Record<string, number>;
  dailyProjects?: DailyCount[];
  dailySignups?: DailyCount[];
  topUsers?: TopUser[];
  avgProjectsPerUser?: number;
  phiDetectionRate?: number;
  popularTools?: ToolPopularity[];
  activeUsers?: number;
}

interface SystemInfo {
  envStatus: Record<string, boolean>;
  nodeVersion: string;
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
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted]);

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Desktop tabs */}
        <div className="hidden sm:block">
          <TabsList className="w-full flex overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="shares">Shares</TabsTrigger>
            <TabsTrigger value="database">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="system">
              <Server className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>
        </div>
        {/* Mobile dropdown */}
        <div className="sm:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="users">
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Users</span>
              </SelectItem>
              <SelectItem value="projects">
                <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Projects</span>
              </SelectItem>
              <SelectItem value="shares">
                <span className="flex items-center gap-2"><Link2 className="h-4 w-4" /> Shares</span>
              </SelectItem>
              <SelectItem value="database">
                <span className="flex items-center gap-2"><Database className="h-4 w-4" /> Database</span>
              </SelectItem>
              <SelectItem value="system">
                <span className="flex items-center gap-2"><Server className="h-4 w-4" /> System</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

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
        <TabsContent value="database">
          <DatabaseTab />
        </TabsContent>
        <TabsContent value="system">
          <SystemTab />
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

  const maxDailyProjects = Math.max(
    1,
    ...(stats.dailyProjects?.map((d) => d.count) ?? [1])
  );

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

      {/* Additional metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Active Users (7d)"
          value={stats.activeUsers ?? 0}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Projects/User"
          value={stats.avgProjectsPerUser ?? 0}
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              PHI Detection Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {((stats.phiDetectionRate ?? 0) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Recent Signups (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.recentSignups}</p>
          </CardContent>
        </Card>
      </div>

      {/* 30-day activity chart */}
      {stats.dailyProjects && stats.dailyProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              30-Day Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-32">
              {stats.dailyProjects.map((day, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/60 hover:bg-primary rounded-t transition-colors"
                  style={{
                    height: `${Math.max(4, (day.count / maxDailyProjects) * 100)}%`,
                  }}
                  title={`${day.date}: ${day.count} projects`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent activity + Top users row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Top users table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Users by Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topUsers && stats.topUsers.length > 0 ? (
                stats.topUsers.map((u, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground w-5">
                        {i + 1}.
                      </span>
                      <span className="truncate">{u.name || u.email}</span>
                    </div>
                    <Badge variant="secondary">{u.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tool popularity breakdown */}
      {stats.popularTools && stats.popularTools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tool Popularity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.popularTools.map((tool) => (
                <div key={tool.type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{tool.type}</span>
                    <span className="text-muted-foreground">
                      {tool.count} ({tool.pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${tool.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects by type (legacy badges view) */}
      {Object.keys(stats.projectsByType).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projects by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.projectsByType).map(([type, cnt]) => (
                <Badge key={type} variant="secondary">
                  {type}: {cnt}
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
            <table className="min-w-[600px] w-full text-sm">
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
            <table className="min-w-[700px] w-full text-sm">
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
        <table className="min-w-[700px] w-full text-sm">
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

/* ---------- Database Tab ---------- */

const DB_TABLES = [
  "user",
  "project",
  "subscription",
  "user_preference",
  "template_favorite",
  "session",
  "account",
  "verification",
] as const;

// Primary key column per table
const PK_COLUMN: Record<string, string> = {
  user: "id",
  project: "id",
  subscription: "id",
  user_preference: "user_id",
  template_favorite: "user_id",
  session: "id",
  account: "id",
  verification: "id",
};

interface DbQueryResult {
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  totalPages: number;
  columns: string[];
}

function DatabaseTab() {
  const [table, setTable] = useState<string>("user");
  const [data, setData] = useState<DbQueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    column: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [pendingEdits, setPendingEdits] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [jsonDialogContent, setJsonDialogContent] = useState<string | null>(
    null
  );

  const fetchData = useCallback(
    async (t: string, p: number, s: string, sortCol: string, sortOrder: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          table: t,
          page: String(p),
          limit: String(PAGE_LIMIT),
          search: s,
          sort: sortCol,
          order: sortOrder,
        });
        const res = await fetch(`/api/admin/database?${params}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to fetch");
        }
        const result: DbQueryResult = await res.json();
        setData(result);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load table data"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData(table, page, search, sort, order);
  }, [table, page, search, sort, order, fetchData]);

  function handleTableChange(newTable: string) {
    setTable(newTable);
    setPage(1);
    setSearch("");
    setSort("created_at");
    setOrder("desc");
    setEditingCell(null);
    setPendingEdits({});
  }

  function handleSort(column: string) {
    if (sort === column) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSort(column);
      setOrder("asc");
    }
    setPage(1);
  }

  function getRowId(row: Record<string, unknown>): string {
    const pk = PK_COLUMN[table] || "id";
    return String(row[pk] ?? "");
  }

  function startEdit(rowId: string, column: string, currentValue: unknown) {
    setEditingCell({ rowId, column });
    if (currentValue === null || currentValue === undefined) {
      setEditValue("");
    } else if (typeof currentValue === "object") {
      setEditValue(JSON.stringify(currentValue, null, 2));
    } else {
      setEditValue(String(currentValue));
    }
  }

  function commitEdit(rowId: string, column: string) {
    const row = data?.rows.find((r) => getRowId(r) === rowId);
    if (!row) return;

    const originalValue = row[column];
    let newValue: unknown = editValue;

    // Try to parse back to the right type
    if (editValue === "") {
      newValue = null;
    } else if (editValue === "true") {
      newValue = true;
    } else if (editValue === "false") {
      newValue = false;
    } else if (
      typeof originalValue === "object" &&
      originalValue !== null
    ) {
      try {
        newValue = JSON.parse(editValue);
      } catch {
        // Keep as string if JSON parse fails
      }
    }

    // Only mark as pending if the value actually changed
    if (JSON.stringify(newValue) !== JSON.stringify(originalValue)) {
      setPendingEdits((prev) => ({
        ...prev,
        [rowId]: { ...(prev[rowId] || {}), [column]: newValue },
      }));
    }
    setEditingCell(null);
  }

  function cancelEdit() {
    setEditingCell(null);
    setEditValue("");
  }

  async function saveRow(rowId: string) {
    const edits = pendingEdits[rowId];
    if (!edits || Object.keys(edits).length === 0) return;

    setSavingRow(rowId);
    try {
      const res = await fetch("/api/admin/database", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, id: rowId, updates: edits }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save");
      }
      const result = await res.json();
      // Update the row in-place
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rows: prev.rows.map((r) =>
            getRowId(r) === rowId ? (result.row as Record<string, unknown>) : r
          ),
        };
      });
      setPendingEdits((prev) => {
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
      toast.success("Row updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save row"
      );
    } finally {
      setSavingRow(null);
    }
  }

  async function deleteRow(rowId: string) {
    if (!window.confirm(`Delete row "${rowId}" from "${table}"? This cannot be undone.`))
      return;
    try {
      const res = await fetch("/api/admin/database", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, id: rowId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete");
      }
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rows: prev.rows.filter((r) => getRowId(r) !== rowId),
          total: prev.total - 1,
        };
      });
      setPendingEdits((prev) => {
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
      toast.success("Row deleted");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete row"
      );
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Table selector */}
        <div className="w-[200px]">
          <Select value={table} onValueChange={handleTableChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {DB_TABLES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rows..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-8 text-xs"
          />
        </div>

        {/* Row count */}
        {data && (
          <span className="text-xs text-muted-foreground">
            {data.total} row{data.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Database className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">
            {data ? "No rows found." : "Select a table to browse."}
          </p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full text-xs">
              <thead>
                <tr className="border-b text-left">
                  {data.columns.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 font-medium whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort(col)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col}
                        {sort === col && (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-2 font-medium text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => {
                  const rowId = getRowId(row);
                  const hasPending =
                    pendingEdits[rowId] &&
                    Object.keys(pendingEdits[rowId]).length > 0;

                  return (
                    <tr
                      key={rowId}
                      className={`border-b last:border-0 ${hasPending ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""}`}
                    >
                      {data.columns.map((col) => {
                        const isEditing =
                          editingCell?.rowId === rowId &&
                          editingCell?.column === col;
                        // Use pending edit value if present, else the original
                        const cellValue =
                          pendingEdits[rowId]?.[col] !== undefined
                            ? pendingEdits[rowId][col]
                            : row[col];

                        return (
                          <td
                            key={col}
                            className="px-3 py-2 max-w-[200px]"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) =>
                                    setEditValue(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      commitEdit(rowId, col);
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                  className="h-6 text-xs min-w-[100px]"
                                  autoFocus
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => commitEdit(rowId, col)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={cancelEdit}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <CellDisplay
                                value={cellValue}
                                isPending={
                                  pendingEdits[rowId]?.[col] !== undefined
                                }
                                onClick={() =>
                                  startEdit(rowId, col, cellValue)
                                }
                                onExpandJson={(json) =>
                                  setJsonDialogContent(json)
                                }
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {hasPending && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              disabled={savingRow === rowId}
                              onClick={() => saveRow(rowId)}
                            >
                              {savingRow === rowId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                              Save
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => deleteRow(rowId)}
                            title="Delete row"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
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
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* JSON expand dialog */}
      <Dialog
        open={jsonDialogContent !== null}
        onOpenChange={(open) => {
          if (!open) setJsonDialogContent(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>JSON Data</DialogTitle>
            <DialogDescription>Full content of the JSON field</DialogDescription>
          </DialogHeader>
          <pre className="text-xs bg-muted p-4 rounded-md overflow-auto whitespace-pre-wrap break-all">
            {jsonDialogContent}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Cell Display Helper ---------- */

function CellDisplay({
  value,
  isPending,
  onClick,
  onExpandJson,
}: {
  value: unknown;
  isPending: boolean;
  onClick: () => void;
  onExpandJson: (json: string) => void;
}) {
  const pendingClass = isPending
    ? "bg-yellow-100 dark:bg-yellow-900/30 rounded px-1"
    : "";

  // Null
  if (value === null || value === undefined) {
    return (
      <span
        className={`text-muted-foreground/50 cursor-pointer hover:bg-muted/50 rounded px-1 ${pendingClass}`}
        onClick={onClick}
        title="Click to edit"
      >
        -
      </span>
    );
  }

  // Boolean
  if (typeof value === "boolean") {
    return (
      <span
        className={`cursor-pointer hover:bg-muted/50 rounded px-1 ${pendingClass}`}
        onClick={onClick}
        title="Click to edit"
      >
        <input
          type="checkbox"
          checked={value}
          readOnly
          className="pointer-events-none"
        />
      </span>
    );
  }

  // Object / JSON
  if (typeof value === "object") {
    const jsonStr = JSON.stringify(value, null, 2);
    const truncated =
      jsonStr.length > 50 ? jsonStr.slice(0, 50) + "..." : jsonStr;
    return (
      <span className={`inline-flex items-center gap-1 ${pendingClass}`}>
        <span
          className="cursor-pointer hover:bg-muted/50 rounded px-1 font-mono text-[10px] truncate max-w-[150px]"
          onClick={onClick}
          title="Click to edit"
        >
          {truncated}
        </span>
        {jsonStr.length > 50 && (
          <button
            className="text-[9px] text-blue-500 hover:underline shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onExpandJson(jsonStr);
            }}
          >
            expand
          </button>
        )}
      </span>
    );
  }

  // Date strings
  const strValue = String(value);
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(strValue) ||
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(strValue)
  ) {
    const dateStr = new Date(strValue).toLocaleString();
    return (
      <span
        className={`cursor-pointer hover:bg-muted/50 rounded px-1 whitespace-nowrap ${pendingClass}`}
        onClick={onClick}
        title={`Click to edit\n${strValue}`}
      >
        {dateStr}
      </span>
    );
  }

  // Regular string / number
  return (
    <span
      className={`cursor-pointer hover:bg-muted/50 rounded px-1 truncate block max-w-[200px] ${pendingClass}`}
      onClick={onClick}
      title={`Click to edit\n${strValue}`}
    >
      {strValue}
    </span>
  );
}

/* ---------- System Tab ---------- */

function SystemTab() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSystemInfo() {
      try {
        const res = await fetch("/api/admin/system");
        if (!res.ok) throw new Error("Failed to fetch system info");
        const data: SystemInfo = await res.json();
        setSystemInfo(data);
      } catch {
        toast.error("Failed to load system info");
      } finally {
        setLoading(false);
      }
    }
    fetchSystemInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!systemInfo) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Failed to load system information.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Environment info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Server className="h-4 w-4" />
            Environment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Node.js Version</span>
              <span className="font-mono">{systemInfo.nodeVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-mono">Next.js</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API key / env var status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Environment Variables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(systemInfo.envStatus).map(([key, configured]) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-mono text-xs">{key}</span>
                <Badge
                  variant={configured ? "secondary" : "destructive"}
                  className="text-[10px]"
                >
                  {configured ? "Configured" : "Missing"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
