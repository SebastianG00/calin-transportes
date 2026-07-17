import { useMemo, useState } from "react"
import { es } from "date-fns/locale/es"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react"

import {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarMonthView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
  CalendarYearView,
  type CalendarEvent,
} from "@/components/ui/full-calendar"
import { Calendar as MiniCalendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { type EventoCategoria, eventos } from "@/data/eventos"

type SectionProps = {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function Section({ title, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 text-sm font-medium text-foreground"
      >
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
        {title}
      </button>
      {open && <div className="pl-1">{children}</div>}
    </div>
  )
}

const calendarios: {
  categoria: EventoCategoria
  label: string
  dot: string
}[] = [
  { categoria: "cargas", label: "Cargas", dot: "bg-green-500" },
  { categoria: "oficina", label: "Oficina", dot: "bg-purple-500" },
  { categoria: "personal", label: "Personal", dot: "bg-blue-500" },
]

export function CalendarioPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(2026, 6, 16)
  )
  const [checked, setChecked] = useState<Record<EventoCategoria, boolean>>({
    cargas: true,
    oficina: true,
    personal: true,
  })

  const visibleEvents = useMemo<CalendarEvent[]>(
    () =>
      eventos
        .filter((e) => checked[e.categoria])
        .map(({ categoria: _categoria, ...event }) => event),
    [checked]
  )

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Calendario</h1>
        <p className="text-sm text-muted-foreground">
          Cargas programadas y eventos
        </p>
      </div>

      <div className="flex min-h-0 flex-1 gap-6">
        {/* Left column */}
        <aside className="flex w-[280px] shrink-0 flex-col gap-6 overflow-auto">
          <Button className="w-full">
            <Plus className="size-4" />
            Nuevo evento
          </Button>

          <MiniCalendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={es}
            className="w-full rounded-md border [--cell-size:2.35rem]"
          />

          <Section title="Mis calendarios" defaultOpen>
            <div className="flex flex-col gap-2">
              {calendarios.map((c) => (
                <label
                  key={c.categoria}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={checked[c.categoria]}
                    onCheckedChange={(value) =>
                      setChecked((prev) => ({
                        ...prev,
                        [c.categoria]: value === true,
                      }))
                    }
                  />
                  <span className={cn("size-2 rounded-full", c.dot)} />
                  {c.label}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Favoritos">
            <p className="text-sm text-muted-foreground">Sin favoritos</p>
          </Section>

          <Section title="Otros">
            <p className="text-sm text-muted-foreground">
              Sin otros calendarios
            </p>
          </Section>
        </aside>

        {/* Main area */}
        <div className="flex min-h-0 flex-1 flex-col">
          <Calendar events={visibleEvents} locale={es} view="month">
            <div className="flex items-center gap-2 pb-4">
              <CalendarViewTrigger
                view="day"
                className="aria-[current=true]:bg-accent"
              >
                Día
              </CalendarViewTrigger>
              <CalendarViewTrigger
                view="week"
                className="aria-[current=true]:bg-accent"
              >
                Semana
              </CalendarViewTrigger>
              <CalendarViewTrigger
                view="month"
                className="aria-[current=true]:bg-accent"
              >
                Mes
              </CalendarViewTrigger>
              <CalendarViewTrigger
                view="year"
                className="aria-[current=true]:bg-accent"
              >
                Año
              </CalendarViewTrigger>

              <span className="flex-1" />

              <CalendarCurrentDate />

              <CalendarPrevTrigger>
                <ChevronLeft className="size-4" />
              </CalendarPrevTrigger>
              <CalendarTodayTrigger>Hoy</CalendarTodayTrigger>
              <CalendarNextTrigger>
                <ChevronRight className="size-4" />
              </CalendarNextTrigger>
            </div>

            <div className="flex-1 overflow-auto">
              <CalendarMonthView />
              <CalendarWeekView />
              <CalendarDayView />
              <CalendarYearView />
            </div>
          </Calendar>
        </div>
      </div>
    </div>
  )
}
