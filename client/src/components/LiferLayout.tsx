import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Bell, BookOpen, Brain, Home, Loader2, LogOut, Menu, Settings, Sparkles, Target, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import AIChatWidget from "@/components/AIChatWidget";
import { EarlyTesterNotice } from "@/components/EarlyTesterNotice";
import { useSessionTracking } from "@/hooks/useAnalytics";

interface LiferLayoutProps {
  children: React.ReactNode;
}

export default function LiferLayout({ children }: LiferLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { data: tokenBalance } = trpc.tokens.getBalance.useQuery(undefined, { enabled: isAuthenticated });
  const { data: notificationCount = 0 } = trpc.notifications.count.useQuery(undefined, { 
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Track user sessions
  useSessionTracking();

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
    { path: "/notifications", icon: Bell, label: "Data Completion", badge: notificationCount },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-gray-900 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800"
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-r border-gray-200 dark:border-gray-800 z-50 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'
      } lg:translate-x-0 lg:shadow-none`}>
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
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          
          {/* Token Balance */}
          <Link href="/tokens">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer mb-2">
              <span className="text-sm font-medium">🪙 {tokenBalance?.balance || 0} tokens</span>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* AI Chat Widget */}
      <AIChatWidget />
      
      {/* Early Tester Notice */}
      <EarlyTesterNotice />
    </div>
  );
}

