import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
  searchActive?: boolean;
  filterCount?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
  searchActive = false,
  filterCount = 0,
}: PaginationProps) {
  const startItem = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(0, currentPage - 2);
      const end = Math.min(totalPages - 1, start + maxVisible - 1);
      const adjustedStart = Math.max(0, end - maxVisible + 1);

      for (let i = adjustedStart; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 bg-white border-t border-gray-200 gap-3">
      <div className="flex items-center text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <span>Showing</span>
          <span className="font-medium">{startItem}</span>
          <span>to</span>
          <span className="font-medium">{endItem}</span>
          <span>of</span>
          <span className="font-medium">{totalElements}</span>
          <span>results</span>

          {/* Active filter indicators */}
          {(searchActive || filterCount > 0) && (
            <div className="flex items-center gap-1 ml-2">
              {searchActive && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  <Search className="w-3 h-3" />
                  <span>Search</span>
                </div>
              )}
              {filterCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  <Filter className="w-3 h-3" />
                  <span>
                    {filterCount} filter{filterCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={loading}
          className="ml-4 border border-gray-300 rounded px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || loading}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {getVisiblePages().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={loading}
            className={`px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed ${
              page === currentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page + 1}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || loading}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
