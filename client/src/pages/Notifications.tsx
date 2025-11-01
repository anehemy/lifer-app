import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Check, X, Clock, MapPin, Sparkles, Heart, TrendingUp, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function Notifications() {
  const { data: notifications = [], isLoading, refetch } = trpc.notifications.list.useQuery();
  const utils = trpc.useUtils();
  
  const scanMutation = trpc.notifications.scan.useMutation({
    onSuccess: (data) => {
      toast.success(`Found ${data.notificationsCreated} missing data points`);
      refetch();
    },
  });

  const dismissMutation = trpc.notifications.dismiss.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.count.invalidate();
      toast.success("Notification dismissed");
    },
  });

  const updateMetadata = trpc.journal.updateMetadata.useMutation({
    onSuccess: () => {
      utils.journal.list.invalidate();
      utils.notifications.list.invalidate();
      utils.notifications.count.invalidate();
      toast.success("Entry updated!");
    },
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleSave = async (notification: any) => {
    if (!inputValue.trim()) {
      toast.error("Please enter a value");
      return;
    }

    // Update the journal entry
    await updateMetadata.mutateAsync({
      id: notification.entryId,
      [notification.fieldName]: inputValue,
    });

    setEditingId(null);
    setInputValue("");
  };

  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case "timeContext":
        return <Clock className="h-4 w-4 text-purple-500" />;
      case "placeContext":
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case "experienceType":
        return <Sparkles className="h-4 w-4 text-yellow-500" />;
      case "challengeType":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "growthTheme":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getFieldPlaceholder = (fieldName: string) => {
    switch (fieldName) {
      case "timeContext":
        return "e.g., 2010, childhood, age 15";
      case "placeContext":
        return "e.g., New York, school, home";
      case "experienceType":
        return "e.g., learning, achievement, relationship";
      case "challengeType":
        return "e.g., loss, conflict, uncertainty";
      case "growthTheme":
        return "e.g., resilience, patience, confidence";
      default:
        return "Enter value...";
    }
  };

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Alerts</h1>
            <p className="text-muted-foreground mt-1">
              Complete missing information from your journal entries
            </p>
          </div>
          <Button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
            Scan for Missing Data
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Loading notifications...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && notifications.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground mb-4">
                You have no pending data completion requests.
              </p>
              <Button
                onClick={() => scanMutation.mutate()}
                disabled={scanMutation.isPending}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Scan for Missing Data
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        {!isLoading && notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className="border-l-4 border-l-amber-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getFieldIcon(notification.fieldName)}
                        <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                          {notification.promptQuestion}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Entry:</strong> {notification.entryQuestion}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.entryResponse}
                      </p>
                    </div>
                    {editingId !== notification.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissMutation.mutate({ notificationId: notification.id })}
                        className="text-muted-foreground hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {editingId === notification.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`input-${notification.id}`} className="text-xs">
                          Your Answer
                        </Label>
                        <Input
                          id={`input-${notification.id}`}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder={getFieldPlaceholder(notification.fieldName)}
                          className="mt-1"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSave(notification)}
                          disabled={updateMetadata.isPending}
                          size="sm"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingId(null);
                            setInputValue("");
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setEditingId(notification.id);
                        setInputValue("");
                      }}
                      variant="default"
                      size="sm"
                    >
                      Answer Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

