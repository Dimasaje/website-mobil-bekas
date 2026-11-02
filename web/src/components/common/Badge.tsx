import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "available" | "booking" | "sold" | "promo";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({
  variant = "available",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const variantClass = `badge-${variant}`;

  return (
    <span className={`badge ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
