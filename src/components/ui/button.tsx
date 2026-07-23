import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-bold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      primary: "bg-brand-default text-white hover:bg-brand-hover border border-transparent",
      secondary: "bg-neutral-surface text-brand-default border border-brand-default hover:bg-brand-pale",
      danger: "bg-status-danger-bg text-status-danger-text hover:bg-red-100 border border-transparent",
      ghost: "hover:bg-neutral-bg text-neutral-muted hover:text-neutral-text border border-transparent",
    }
    
    const sizes = {
      default: "h-10 px-4 py-2 rounded-xl",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-xl px-8",
      icon: "h-10 w-10 rounded-xl",
    }
    
    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

    return (
      <button
        className={combinedClassName}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
