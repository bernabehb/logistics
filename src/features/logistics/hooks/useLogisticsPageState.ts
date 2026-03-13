import { useState, useMemo } from 'react';
import { MOCK_LOGISTICS_DATA, LogisticsRow } from '@/features/logistics/models';
import { isAfter, isBefore, startOfDay, endOfDay, parse } from "date-fns";
import { es } from "date-fns/locale";

type Status = 'pending' | 'in-progress' | 'ready' | 'none';

interface UseLogisticsPageStateResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fromDate: Date | undefined;
  setFromDate: (date: Date | undefined) => void;
  toDate: Date | undefined;
  setToDate: (date: Date | undefined) => void;
  clearFilters: () => void;
  statusFilters: Status[];
  toggleStatusFilter: (status: Status) => void;
  filteredRows: LogisticsRow[];
  pendingCount: number;
}

// Helper to parse Spanish date "12 de marzo 2026"
const parseSpanishDate = (dateStr: string) => {
  try {
    return parse(dateStr, "d 'de' MMMM yyyy", new Date(), { locale: es });
  } catch (e) {
    return new Date();
  }
};

export function useLogisticsPageState(): UseLogisticsPageStateResult {
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [statusFilters, setStatusFilters] = useState<Status[]>([]);

  const toggleStatusFilter = (status: Status) => {
    setStatusFilters((prev) => 
      prev.includes(status) 
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  // Filter Data
  const filteredRows = useMemo(() => {
    let result = MOCK_LOGISTICS_DATA;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (row) =>
          row.id.toLowerCase().includes(lowerQuery) ||
          row.clientName.toLowerCase().includes(lowerQuery)
      );
    }

    if (statusFilters.length > 0) {
      result = result.filter((row) => statusFilters.includes(row.estadoGeneral as Status));
    }

    if (fromDate) {
      const from = startOfDay(fromDate);
      result = result.filter((row) => {
        const rowDate = parseSpanishDate(row.date);
        return isAfter(rowDate, from) || rowDate.getTime() === from.getTime();
      });
    }

    if (toDate) {
      const to = endOfDay(toDate);
      result = result.filter((row) => {
        const rowDate = parseSpanishDate(row.date);
        return isBefore(rowDate, to) || rowDate.getTime() === to.getTime();
      });
    }

    return result;
  }, [searchQuery, fromDate, toDate, statusFilters]);

  const clearFilters = () => {
    setSearchQuery("");
    setFromDate(undefined);
    setToDate(undefined);
  };

  // Count pending for header
  const pendingCount = useMemo(() => {
     return MOCK_LOGISTICS_DATA.filter((r) => r.estadoGeneral === 'pending').length;
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    clearFilters,
    statusFilters,
    toggleStatusFilter,
    filteredRows,
    pendingCount
  };
}
