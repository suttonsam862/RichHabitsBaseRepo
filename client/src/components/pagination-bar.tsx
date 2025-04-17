import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationBarProps) {
  // Generate page numbers based on current page and sibling count
  const generatePagination = () => {
    // If the total pages is 7 or less, show all pages without dots
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first and last page
    const firstPage = 1;
    const lastPage = totalPages;

    // Calculate the start and end of the middle section
    const leftSiblingIndex = Math.max(currentPage - siblingCount, firstPage);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, lastPage);

    // Don't show dots if there's only one page number hidden
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    // Cases for different dot placements
    if (!shouldShowLeftDots && shouldShowRightDots) {
      // Show more pages at the beginning
      const leftRange = Array.from({ length: 5 }, (_, i) => i + 1);
      return [...leftRange, "rightDots", lastPage];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      // Show more pages at the end
      const rightRange = Array.from(
        { length: 5 },
        (_, i) => lastPage - 4 + i
      );
      return [firstPage, "leftDots", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      // Show dots on both sides
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPage, "leftDots", ...middleRange, "rightDots", lastPage];
    }

    // Default case
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  const pages = generatePagination();

  return (
    <nav className="flex items-center justify-center gap-1 md:gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>

      {pages.map((page, index) => {
        if (page === "leftDots" || page === "rightDots") {
          return (
            <Button
              key={`${page}-${index}`}
              variant="ghost"
              size="icon"
              disabled
              className="h-8 w-8"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More pages</span>
            </Button>
          );
        }

        const pageNumber = Number(page);
        return (
          <Button
            key={pageNumber}
            variant={pageNumber === currentPage ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(pageNumber)}
            className={`h-8 w-8 ${
              pageNumber === currentPage ? "pointer-events-none" : ""
            }`}
          >
            {pageNumber}
            <span className="sr-only">Page {pageNumber}</span>
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </nav>
  );
}