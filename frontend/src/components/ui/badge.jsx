import { cn } from '@/lib/utils';

const variants = {
  default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
  secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
  outline: 'text-foreground',
  success: 'border-transparent bg-green-100 text-green-800',
  warning: 'border-transparent bg-yellow-100 text-yellow-800',
  draft: 'border-transparent bg-gray-100 text-gray-800',
};

const statusMap = {
  DRAFT: 'draft',
  SENT: 'warning',
  PAID: 'success',
  CANCELLED: 'destructive',
};

function Badge({ className, variant = 'default', status, children, ...props }) {
  const resolvedVariant = status ? statusMap[status] || variant : variant;
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[resolvedVariant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Badge };
