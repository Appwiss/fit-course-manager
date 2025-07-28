import { cn } from "@/lib/utils";
import { SubscriptionType } from "@/types/fitness";

interface SubscriptionBadgeProps {
  type: SubscriptionType;
  className?: string;
}

export function SubscriptionBadge({ type, className }: SubscriptionBadgeProps) {
  const getVariantStyles = (type: SubscriptionType) => {
    switch (type) {
      case 'debutant':
        return 'bg-gradient-success text-success-foreground';
      case 'medium':
        return 'bg-gradient-secondary text-secondary-foreground';
      case 'expert':
        return 'bg-gradient-expert text-expert-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getLabel = (type: SubscriptionType) => {
    switch (type) {
      case 'debutant':
        return 'Débutant';
      case 'medium':
        return 'Medium';
      case 'expert':
        return 'Expert';
      default:
        return type;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all",
        getVariantStyles(type),
        className
      )}
    >
      {getLabel(type)}
    </span>
  );
}