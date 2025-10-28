import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Users, Clock, Activity, Download } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function Analytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect non-admin users
  if (user?.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const { data: metrics } = trpc.analytics.getMetrics.useQuery();
  const { data: userStats } = trpc.analytics.getUserStats.useQuery();
  const { data: recentEvents } = trpc.analytics.getAllRecentEvents.useQuery({ limit: 100 });

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || "")).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Admin-only view of app usage and engagement</p>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeToday || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeThisWeek || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeThisMonth || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Feature Usage
          </CardTitle>
          <CardDescription>Total events by feature area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{metrics?.journalEntries || 0}</div>
                <div className="text-sm text-muted-foreground">Journal Entries</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{metrics?.meditations || 0}</div>
                <div className="text-sm text-muted-foreground">Meditations</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-pink-600">{metrics?.visionItems || 0}</div>
                <div className="text-sm text-muted-foreground">Vision Items</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{metrics?.chatMessages || 0}</div>
                <div className="text-sm text-muted-foreground">Chat Messages</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Stats Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Activity
              </CardTitle>
              <CardDescription>Login history and time spent per user</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(userStats || [], "user-stats.csv")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Total Logins</TableHead>
                <TableHead>Time Today</TableHead>
                <TableHead>Time This Week</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userStats?.map((stat: any) => (
                <TableRow key={stat.userId}>
                  <TableCell className="font-medium">{stat.userName || "Unknown"}</TableCell>
                  <TableCell>{stat.lastLogin ? new Date(stat.lastLogin).toLocaleString() : "Never"}</TableCell>
                  <TableCell>{stat.totalLogins || 0}</TableCell>
                  <TableCell>{stat.timeToday || "0m"}</TableCell>
                  <TableCell>{stat.timeThisWeek || "0m"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Last 100 events across all users</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(recentEvents || [], "recent-events.csv")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents?.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="text-sm">{new Date(event.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{event.userName || "Unknown"}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                      {event.eventType}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {event.eventData ? JSON.stringify(event.eventData).substring(0, 50) + "..." : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

