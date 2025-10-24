#!/bin/bash

# Dashboard page
cat > Dashboard.tsx << 'EOF'
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Sparkles, User, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: journalEntries = [] } = trpc.journal.list.useQuery();
  const { data: visionItems = [] } = trpc.vision.list.useQuery();
  const { data: meditationSessions = [] } = trpc.meditation.list.useQuery();
  const { data: patterns = [] } = trpc.patterns.analyze.useQuery();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const stats = [
    { label: "Journal Entries", value: journalEntries.length, icon: BookOpen, color: "text-blue-600" },
    { label: "Patterns Discovered", value: patterns.length, icon: Brain, color: "text-purple-600" },
    { label: "Vision Items", value: visionItems.length, icon: Sparkles, color: "text-pink-600" },
    { label: "Meditations", value: meditationSessions.length, icon: User, color: "text-green-600" },
  ];

  const quickActions = [
    {
      title: "Continue Your Story",
      description: "Explore your journey with guided questions",
      icon: BookOpen,
      href: "/journal",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Explore Patterns",
      description: "Discover insights from your reflections",
      icon: Brain,
      href: "/patterns",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Create Vision",
      description: "Build your vision board and manifest dreams",
      icon: Sparkles,
      href: "/vision",
      color: "from-pink-500 to-rose-500",
    },
    {
      title: "Meditate",
      description: "Find your center with guided meditation",
      icon: User,
      href: "/meditation",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          {greeting()}, {user?.name || "Explorer"}!
        </h1>
        <p className="text-muted-foreground text-lg">Welcome to your journey of self-discovery</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <Icon className={`h-12 w-12 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-xl transition-all cursor-pointer group h-full">
                  <CardHeader>
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Inspirational Quote */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-none">
        <CardContent className="pt-6">
          <blockquote className="text-lg italic text-center">
            "The purpose of life is to discover your gift. The meaning of life is to give it away."
          </blockquote>
          <p className="text-center text-muted-foreground mt-2">— David Viscott</p>
        </CardContent>
      </Card>
    </div>
  );
}
EOF

echo "Created Dashboard.tsx"
