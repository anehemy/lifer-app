import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Sparkles, User, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import StartHereGuide from "@/components/StartHereGuide";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { usePageView } from "@/hooks/useAnalytics";

export default function Dashboard() {
  usePageView("/dashboard");
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
    { label: "Journal Entries", value: journalEntries.length, icon: BookOpen, color: "text-blue-600", href: "/journal" },
    { label: "Patterns Discovered", value: patterns.length, icon: Brain, color: "text-purple-600", href: "/patterns" },
    { label: "Vision Items", value: visionItems.length, icon: Sparkles, color: "text-pink-600", href: "/vision" },
    { label: "Meditations", value: meditationSessions.length, icon: User, color: "text-green-600", href: "/meditation" },
  ];

  // Removed quickActions - replaced with FeedbackWidget

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            {greeting()}, {user?.name || "Explorer"}!
          </h1>
          <p className="text-muted-foreground text-lg">Welcome to your journey of self-discovery</p>
        </div>
        <StartHereGuide />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
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
            </Link>
          );
        })}
      </div>

      {/* Quick Feedback */}
      <FeedbackWidget />

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
