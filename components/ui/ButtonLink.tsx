import * as React from "react"
import Link, { LinkProps } from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "./Button"
import type { VariantProps } from "class-variance-authority"

interface ButtonLinkProps extends LinkProps, VariantProps<typeof buttonVariants> {
  children: React.ReactNode
  className?: string
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
