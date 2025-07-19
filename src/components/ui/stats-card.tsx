import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: number
  variant?: "default" | "success" | "warning" | "info" | "destructive"
  className?: string
}

const StatsCard = React.forwardRef<
  HTMLDivElement,
  StatsCardProps
>(({ title, value, variant = "default", className, ...props }, ref) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "border-success bg-success/5"
      case "warning":
        return "border-warning bg-warning/5"
      case "info":
        return "border-info bg-info/5"
      case "destructive":
        return "border-destructive bg-destructive/5"
      default:
        return ""
    }
  }

  const getValueClasses = () => {
    switch (variant) {
      case "success":
        return "text-success"
      case "warning":
        return "text-warning"
      case "info":
        return "text-info"
      case "destructive":
        return "text-destructive"
      default:
        return "text-primary"
    }
  }

  return (
    <Card
      ref={ref}
      className={cn("border-2", getVariantClasses(), className)}
      {...props}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-ar">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold text-ar", getValueClasses())}>
          {value.toLocaleString('ar-SA')}
        </div>
      </CardContent>
    </Card>
  )
})
StatsCard.displayName = "StatsCard"

export { StatsCard }