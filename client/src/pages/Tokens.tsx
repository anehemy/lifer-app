import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Coins, Sparkles, Zap, Crown } from "lucide-react";

const tokenPackages = [
  {
    id: "starter",
    name: "Starter Pack",
    tokens: 500,
    price: "$9.99",
    icon: Sparkles,
    features: ["50 AI conversations", "10 image generations", "30 minutes of meditation audio"],
  },
  {
    id: "pro",
    name: "Pro Pack",
    tokens: 2000,
    price: "$29.99",
    icon: Zap,
    popular: true,
    features: ["200 AI conversations", "40 image generations", "120 minutes of meditation audio", "Priority support"],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    tokens: 10000,
    price: "$99.99",
    icon: Crown,
    features: ["1000 AI conversations", "200 image generations", "600 minutes of meditation audio", "Premium features", "Lifetime updates"],
  },
];

export default function Tokens() {
  const { data: tokenBalance } = trpc.tokens.getBalance.useQuery();
  const utils = trpc.useUtils();
  
  const purchaseTokens = trpc.tokens.purchase.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully added ${data.tokensAdded} tokens!`);
      utils.tokens.getBalance.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">AI Tokens</h1>
        <p className="text-muted-foreground">Power your journey with AI-enhanced features</p>
      </div>

      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Token Balance</p>
              <p className="text-4xl font-bold flex items-center gap-2">
                <Coins className="h-8 w-8 text-yellow-500" />
                {tokenBalance?.balance || 0}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>• 10 tokens per AI chat</p>
              <p>• 50 tokens per image</p>
              <p>• 15 tokens per minute of audio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Purchase Tokens</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {tokenPackages.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <Card 
                key={pkg.id} 
                className={pkg.popular ? "border-2 border-purple-500 relative" : ""}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-8 w-8 text-purple-600" />
                    <span className="text-2xl font-bold">{pkg.price}</span>
                  </div>
                  <CardTitle>{pkg.name}</CardTitle>
                  <CardDescription className="text-lg font-semibold text-foreground">
                    {pkg.tokens.toLocaleString()} tokens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                    onClick={() => purchaseTokens.mutate({ packageId: pkg.id })}
                    disabled={purchaseTokens.isPending}
                  >
                    {purchaseTokens.isPending ? "Processing..." : "Purchase"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Tokens Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>AI Conversations:</strong> Each message you send to Mr. MG or other AI assistants costs 10 tokens.
          </p>
          <p>
            <strong>Image Generation:</strong> Creating inspiring images for your vision board costs 50 tokens per image.
          </p>
          <p>
            <strong>Meditation Audio:</strong> Generating personalized meditation audio costs 15 tokens per minute.
          </p>
          <p>
            <strong>Pattern Analysis:</strong> Deep AI analysis of your journal entries costs 25 tokens.
          </p>
          <p className="pt-2 border-t">
            💡 <strong>Tip:</strong> Start with 1,000 free tokens to explore all features. Purchase more anytime to continue your journey!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
