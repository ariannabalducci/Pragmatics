import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive tracking-wide",
  {
    variants: {
      variant: {
        primary: "bg-[#62B4A5] text-white order-[#D9D9D9] border-[#D9D9D9] border-b-4 active:border-b-1 hover:bg-[#A6DADA] late-500 uppercase rounded-full",
        secondary: "bg-white text-black order-[#D9D9D9] border-[#D9D9D9] border-b-4 active:border-b-1 hover:text-[#D9D9D9] late-500 uppercase",
        transparent: "bg-transparent text-[#62B4A5] hover:bg-[#D9D9D9] uppercase",
        danger: "bg-[#E87D57] text-primary-foreground hover:bg-[#FF8D65] border-[#D9D9D9] border-b-4 active:border-b-1 uppercase",
        option: "bg-[#D9D9D9] text-[#5A5959] hover:bg-[#E2E2E2] rounded-4xl border-none  text-left transition-colors whitespace-normal leading-tight",
        back: "bg-white text-[#5A5959] border-[#5A5959] border-2 hover:text-[#D9D9D9] hover:border-[#D9D9D9] rounded-full transition-colors",
        
        cross: "bg-[#62B4A5] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform",
        arrow: "bg-[#A6DADA] text-white border-[#62B4A5] border-b-8 active:border-b-0 active:translate-y-2 hover:bg-[#D6F2F2] hover:border-[#96C6BD] rounded-full flex items-center justify-center shadow-xl transition-all",
        play: "bg-[#A6DADA] text-[#62B4A5] border-[#62B4A5] border-b-8 active:border-b-0 active:translate-y-2 hover:bg-[#D6F2F2] hover:text-[#96C6BD] hover:border-[#96C6BD] rounded-full flex items-center justify-center shadow-xl transition-all",
        locked: "bg-[#D9D9D9] text-[#ABABAB] border-[#ABABAB] border-b-8 active:border-b-0 rounded-full flex items-center justify-center pointer-events-none",
        completed: "bg-[#FFE53B] text-[#FFCC00] border-[#FFCC00] border-b-8 active:border-b-0 rounded-full flex items-center justify-center pointer-events-none",
      },
      size: {
        default: "text-3xl h-18 px-8 py-4 has-[>svg]:px-6",
        sm: "text-xl h-16 gap-3 px-6 has-[>svg]:px-5",
        lg: "text-3xl h-20 px-12 has-[>svg]:px-8",
        icon: "size-18",
        "icon-sm": "size-12",
        "icon-lg": "size-20",
        rounded: "rounded-full",
        content: "text-xl h-auto py-8 px-8 min-h-[50px] w-full max-w-[280px]",
        play: "w-10 h-10 [&_svg]:size-10 md:w-40 md:h-40 md:[&_svg]:size-18",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
