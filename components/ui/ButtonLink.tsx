import * as React from "react"
import Link, { LinkProps } from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants, type ButtonProps } from "./Button"

interface ButtonLinkProps extends LinkProps, Omit<ButtonProps, "disabled" | "isLoading"> {
  children: React.ReactNode
}

const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
ButtonLink.displayName = "ButtonLink"

export { ButtonLink }
