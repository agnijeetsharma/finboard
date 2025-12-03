"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useDashboardStore } from "@/lib/store"
import { DashboardHeader } from "@/components/header"
import { AddWidgetDialog } from "@/components/add-widget-dialog"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { WidgetShell } from "@/components/widgets/widget-shell"
import { CardWidget } from "@/components/widgets/card-widget"
import { TableWidget } from "@/components/widgets/table-widget"
import { LineChartWidget } from "@/components/widgets/line-chart-widget"

import { cn } from "@/lib/utils"

function useThemeToggle() {
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === "undefined") return "dark"
    return localStorage.getItem("finboard-theme") || "dark"
  })
  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") root.classList.add("dark")
    else root.classList.remove("dark")
    localStorage.setItem("finboard-theme", theme)
  }, [theme])
  return { theme, setTheme }
}

export default function Page() {
  const { theme, setTheme } = useThemeToggle()
  const widgets = useDashboardStore((s) => s.widgets || [])
  const reorder = useDashboardStore((s) => s.reorder)
  const removeWidget = useDashboardStore((s) => s.removeWidget)
  const [isAddOpen, setAddOpen] = useState(false)

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    reorder(result.source.index, result.destination.index)
  }

  return (
    <main className="min-h-screen bg-background">
      <DashboardHeader
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        onAddWidget={() => setAddOpen(true)}
        onExport={() => {
          const data = useDashboardStore.getState().exportConfig()
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = "finboard-config.json"
          a.click()
          URL.revokeObjectURL(url)
        }}
        onImport={(file) => {
          const reader = new FileReader()
          reader.onload = () => {
            try {
              const json = JSON.parse(reader.result as string)
              useDashboardStore.getState().importConfig(json)
            } catch {
              alert("Invalid config file")
            }
          }
          reader.readAsText(file)
        }}
      />

      <section className="container mx-auto px-4 py-8">
        {widgets.length === 0 ? (
          <div className="grid place-items-center min-h-[70vh]">
            <div className="finboard-card max-w-2xl w-full p-8 text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <div className="size-8 rounded bg-primary/20" aria-hidden />
              </div>
              <h2 className="text-2xl font-bold finboard-text-balance mb-4">Build Your Finance Dashboard</h2>
              <p className="text-muted-foreground finboard-text-balance mb-8 max-w-lg mx-auto">
                Connect to financial APIs like Alpha Vantage and Finnhub. Create customizable widgets with cards,
                tables, and charts. Use our JSON explorer to map data fields visually.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button size="lg" onClick={() => setAddOpen(true)} className="finboard-focus">
                  Create Your First Widget
                </Button>
                <Button size="lg" variant="outline" asChild className="finboard-focus bg-transparent">
                  <a href="/docs">View Documentation</a>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="dashboard" direction="horizontal">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="finboard-grid">
                  {widgets.map((w, idx) => (
                    <Draggable key={w.id} draggableId={w.id} index={idx}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={cn(
                            "transition-all duration-200",
                            snapshot.isDragging ? "opacity-80 scale-105 rotate-2" : "opacity-100",
                          )}
                        >
                          <WidgetShell widget={w} onRemove={() => removeWidget(w.id)}>
                            {w.type === "card" && <CardWidget widget={w} />}
                            {w.type === "table" && <TableWidget widget={w} />}
                            {w.type === "line" && <LineChartWidget widget={w} />}
                          </WidgetShell>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <div
                    className="finboard-card border-dashed border-2 border-primary/30 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all duration-200 group cursor-pointer"
                    onClick={() => setAddOpen(true)}
                  >
                    <div className="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                      <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-2xl text-primary">+</span>
                      </div>
                      <h3 className="font-semibold text-primary mb-2">Add Widget</h3>
                      <p className="text-sm text-muted-foreground">Create a new data visualization</p>
                    </div>
                  </div>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </section>

      <AddWidgetDialog open={isAddOpen} onOpenChange={setAddOpen} />
    </main>
  )
}
