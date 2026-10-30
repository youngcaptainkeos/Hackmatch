// Adapted from shadcn/ui (MIT), new-york Card.
import * as React from 'react';
import { cn } from '@/lib/utils';
export const Card = React.forwardRef(function Card({ className, ...props }, ref) {
  return <div ref={ref} className={cn('card', className)} {...props} />;
});
export function CardHeader({ className, ...props }) {
  return <div className={cn('card-header', className)} {...props} />;
}
export function CardTitle({ className, ...props }) {
  return <h3 className={cn('card-title', className)} {...props} />;
}
export function CardDescription({ className, ...props }) {
  return <p className={cn('card-description', className)} {...props} />;
}
export function CardContent({ className, ...props }) {
  return <div className={cn('card-content', className)} {...props} />;
}
