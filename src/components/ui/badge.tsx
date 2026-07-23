import * as React from "react"

export type BadgeStatus = "success" | "warning" | "expiring" | "danger" | "brand"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus
}

export function Badge({ status, className = "", children, ...props }: BadgeProps) {
  const statusClasses = {
    success: "bg-status-success-bg text-status-success-text",
    warning: "bg-status-warning-bg text-status-warning-text",
    expiring: "bg-status-orange-bg text-status-orange-text",
    danger: "bg-status-danger-bg text-status-danger-text",
    brand: "bg-brand-pale text-brand-hover",
  }

  return (
    <span
      className={`inline-flex items-center rounded-[6px] px-[10px] py-[5px] text-xs font-medium whitespace-nowrap ${statusClasses[status]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
