"use client"

import { Button } from "../ui/button"
import { toast } from "sonner"

export function ApiTestButton({ endpoint, label, method }: { 
  endpoint: string
  label: string
  method: string
}) {
  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            const response = await fetch(endpoint, { method })
            const data = await response.json()
            console.log(`${endpoint} response:`, data)
            toast.success(label, {
              description: `Response: ${JSON.stringify(data, null, 2).substring(0, 100)}...`
            })
          } catch (error) {
            console.error(`Error calling ${endpoint}:`, error)
            toast.error("API Error", {
              description: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }}
      >
        {label}
      </Button>
      <span className="text-sm text-muted-foreground">{method} {endpoint}</span>
    </div>
  )
}