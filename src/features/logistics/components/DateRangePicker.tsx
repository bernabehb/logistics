"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SingleDatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label: string
}

export function SingleDatePicker({
  date,
  setDate,
  label,
}: SingleDatePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[14px] font-bold text-slate-600 dark:text-slate-300 tracking-wide ml-1">
        {label}
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[110px] sm:w-[130px] justify-start text-left font-medium h-9 px-2 sm:px-3 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#1E293B]/80 shadow-sm transition-all",
              !date && "text-slate-500 dark:text-slate-400"
            )}
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
            {date ? format(date, "d MMM, yyyy", { locale: es }) : <span className="text-[11px] sm:text-[12px]">Seleccionar</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xl overflow-hidden border-slate-200 dark:border-slate-700 shadow-xl" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            locale={es}
          />
          {date && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDate(undefined)}
                className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar fecha
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
