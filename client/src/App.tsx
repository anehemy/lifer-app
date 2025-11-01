import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LiferLayout from "./components/LiferLayout";
import Dashboard from "./pages/Dashboard";
import Journal from "./pages/Journal";
import Patterns from "./pages/Patterns";
import VisionBoard from "./pages/VisionBoard";
import Meditation from "./pages/Meditation";
import PrimaryAim from "./pages/PrimaryAim";
import Tokens from "./pages/Tokens";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";

function Router() {
  return (
    <LiferLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/journal" component={Journal} />
        <Route path="/patterns" component={Patterns} />
        <Route path="/vision" component={VisionBoard} />
        <Route path="/meditation" component={Meditation} />
        <Route path="/primary-aim" component={PrimaryAim} />
        <Route path="/tokens" component={Tokens} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/settings" component={Settings} />
        <Route path="/admin" component={Admin} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </LiferLayout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
