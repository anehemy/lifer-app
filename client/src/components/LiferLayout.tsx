import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { APP_TITLE, getLoginUrl } from "@/const";
import { BookOpen, Brain, Home, Loader2, LogOut, Sparkles, Target, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import AIChatWidget from "@/components/AIChatWidget";

interface LiferLayoutProps {
  children: React.ReactNode;
}

export default function LiferLayout({ children }: LiferLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { data: tokenBalance } = trpc.tokens.getBalance.useQuery(undefined, { enabled: isAuthenticated });
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-6 p-8">
          <h1 className="text-5xl font-bold text-gradient">{APP_TITLE}</h1>
          <p className="text-xl text-muted-foreground max-w-md">
            Discover your Primary Aim through AI-guided journaling, pattern recognition, and meditation
          </p>
          {/* Token Balance */}
          <Link href="/tokens">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <span className="text-sm font-medium">🪙 {tokenBalance?.balance || 0} tokens</span>
            </div>
          </Link>

          <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
            Sign In to Begin Your Journey
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/journal", icon: BookOpen, label: "Life Story" },
    { path: "/patterns", icon: Brain, label: "Patterns" },
    { path: "/vision", icon: Sparkles, label: "Vision Board" },
    { path: "/meditation", icon: User, label: "Meditation" },
    { path: "/primary-aim", icon: Target, label: "Primary Aim" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-r border-gray-200 dark:border-gray-800 z-50">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gradient">{APP_TITLE}</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover Your Purpose</p>
        </div>

        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          {/* Token Balance */}
          <Link href="/tokens">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <span className="text-sm font-medium">🪙 {tokenBalance?.balance || 0} tokens</span>
            </div>
          </Link>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="container py-8">{children}</div>
      </main>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
}

