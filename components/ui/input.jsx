// Adapted from shadcn/ui (MIT), new-york Input.
import * as React from 'react';
import { cn } from '@/lib/utils';
export const Input = React.forwardRef(function Input({ className, type, ...props }, ref) {
  return <input type={type} className={cn('input', className)} ref={ref} {...props} />;
});
