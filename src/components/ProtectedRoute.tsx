import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Wrench } from "lucide-react";
import { isPast } from "date-fns";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, workshop, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-primary">
            <Wrench className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Subscription Gate
  if (workshop?.workshops) {
    const status = workshop.workshops.subscription_status;
    const trialEnds = workshop.workshops.trial_ends_at ? new Date(workshop.workshops.trial_ends_at) : new Date();
    
    // Check if blocked: either trial expired and they are still 'trialing', or status is past_due/canceled
    const isBlocked = (status === 'trialing' && isPast(trialEnds)) || status === 'past_due' || status === 'canceled';

    // Allow access to the subscription page itself so they can pay!
    if (isBlocked && location.pathname !== '/assinatura') {
      return <Navigate to="/assinatura" replace />;
    }
  }

  return <>{children}</>;
}
