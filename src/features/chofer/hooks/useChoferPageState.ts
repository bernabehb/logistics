import { useState, useMemo } from 'react';
import { MOCK_CHOFER_DATA, ChoferRow } from '@/features/chofer/models';

interface UseChoferPageStateResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  totalPages: number;
  paginatedRows: ChoferRow[];
  totalItems: number;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  assignedCount: number;
  totalWeight: number;
}

export function useChoferPageState(): UseChoferPageStateResult {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter Data
  const filteredRows = useMemo(() => {
    let result = MOCK_CHOFER_DATA;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (row) =>
          row.id.toLowerCase().includes(lowerQuery) ||
          row.clientName.toLowerCase().includes(lowerQuery) ||
          row.destination.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [searchQuery]);

  // Paginate Data
  const totalItems = filteredRows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRows, currentPage]);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  // Reset page when filtering
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const assignedCount = MOCK_CHOFER_DATA.length;

  const totalWeight = useMemo(() => {
    return filteredRows.reduce((acc, row) => {
      const rowWeight = [
        ...row.materials.aluminio,
        ...row.materials.vidrio,
        ...row.materials.herrajes,
      ].reduce((sum, m) => sum + m.weight, 0);
      return acc + rowWeight;
    }, 0);
  }, [filteredRows]);

  return {
    searchQuery,
    setSearchQuery,
    currentPage,
    totalPages,
    paginatedRows,
    totalItems,
    goToNextPage,
    goToPrevPage,
    assignedCount,
    totalWeight
  };
}
