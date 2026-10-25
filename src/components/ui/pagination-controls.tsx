import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  onPageChange: (page: number) => void
  label?: string
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  label = "elementos"
}: PaginationControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 border-t border-border/50 pt-6 gap-4">
      <p className="text-sm text-muted-foreground">
        Página <span className="font-medium text-foreground">{currentPage}</span> de <span className="font-medium text-foreground">{totalPages || 1}</span>
        {" · "}
        {totalItems > 0 ? startIndex + 1 : 0}–{Math.min(endIndex, totalItems)} de {totalItems} {label}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Mostrar páginas alrededor de la actual si hay muchas
            let pageNum = i + 1;
            if (totalPages > 5) {
              if (currentPage > 3) pageNum = currentPage - 2 + i;
              if (pageNum > totalPages) pageNum = totalPages - 4 + i;
            }
            if (pageNum <= 0 || pageNum > totalPages) return null;
            
            return (
              <motion.div key={pageNum} whileTap={{ scale: 0.88 }}>
                <Button
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 font-medium",
                    currentPage === pageNum ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              </motion.div>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
