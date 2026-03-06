'use client';

import { useState } from 'react';
import {
  DealWithRelations,
  PipelineStage,
  KanbanColumn,
  formatCurrency,
} from '@/types/crm';
import { DealCard } from '@/components/crm/deal-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineBoardProps {
  stages: PipelineStage[];
  deals: DealWithRelations[];
  onDealClick?: (deal: DealWithRelations) => void;
  onDealEdit?: (deal: DealWithRelations) => void;
  onDealDelete?: (deal: DealWithRelations) => void;
  onDealMove?: (dealId: string, newStageId: string, newPosition: number) => void;
  onDealMarkWon?: (deal: DealWithRelations) => void;
  onDealMarkLost?: (deal: DealWithRelations) => void;
  onAddDeal?: (stageId: string) => void;
  onEditStages?: () => void;
  className?: string;
}

export function PipelineBoard({
  stages,
  deals,
  onDealClick,
  onDealEdit,
  onDealDelete,
  onDealMove,
  onDealMarkWon,
  onDealMarkLost,
  onAddDeal,
  onEditStages: _onEditStages,
  className,
}: PipelineBoardProps) {
  const [draggedDeal, setDraggedDeal] = useState<DealWithRelations | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Build columns from stages and deals
  const columns: KanbanColumn[] = stages
    .filter((s) => !s.is_won && !s.is_lost)
    .sort((a, b) => a.position - b.position)
    .map((stage) => {
      const stageDeals = deals
        .filter((d) => d.stage_id === stage.id && d.status === 'open')
        .sort((a, b) => a.position - b.position);
      const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
      return { stage, deals: stageDeals, totalValue };
    });

  const handleDragStart = (e: React.DragEvent, deal: DealWithRelations) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', deal.id);
  };

  const handleDragEnd = () => {
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedDeal && draggedDeal.stage_id !== stageId) {
      const stageDeals = deals.filter((d) => d.stage_id === stageId);
      const newPosition = stageDeals.length;
      onDealMove?.(draggedDeal.id, stageId, newPosition);
    }
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  return (
    <div className={cn('h-full', className)}>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 p-4 min-h-[600px]">
          {columns.map((column) => (
            <div
              key={column.stage.id}
              className={cn(
                'flex flex-col w-[300px] shrink-0 rounded-lg bg-muted/30',
                dragOverStage === column.stage.id && 'ring-2 ring-primary'
              )}
              onDragOver={(e) => handleDragOver(e, column.stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.stage.id)}
            >
              {/* Column Header */}
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: column.stage.color }}
                    />
                    <h3 className="font-semibold">{column.stage.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {column.deals.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onAddDeal?.(column.stage.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(column.totalValue)}
                </p>
              </div>

              {/* Deals */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {column.deals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal)}
                    onDragEnd={handleDragEnd}
                  >
                    <DealCard
                      deal={deal}
                      variant="kanban"
                      isDragging={draggedDeal?.id === deal.id}
                      onClick={onDealClick}
                      onEdit={onDealEdit}
                      onDelete={onDealDelete}
                      onMarkWon={onDealMarkWon}
                      onMarkLost={onDealMarkLost}
                    />
                  </div>
                ))}

                {column.deals.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      No deals in this stage
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddDeal?.(column.stage.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Deal
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Won/Lost Summary */}
          <div className="flex flex-col w-[200px] shrink-0 rounded-lg bg-muted/30 p-3">
            <h3 className="font-semibold mb-4">Closed Deals</h3>
            
            {/* Won */}
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="font-medium text-green-700 dark:text-green-400">
                  Won
                </span>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {deals.filter((d) => d.status === 'won').length}
              </p>
              <p className="text-sm text-green-600/80">
                {formatCurrency(
                  deals
                    .filter((d) => d.status === 'won')
                    .reduce((sum, d) => sum + d.value, 0)
                )}
              </p>
            </div>

            {/* Lost */}
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="font-medium text-red-700 dark:text-red-400">
                  Lost
                </span>
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {deals.filter((d) => d.status === 'lost').length}
              </p>
              <p className="text-sm text-red-600/80">
                {formatCurrency(
                  deals
                    .filter((d) => d.status === 'lost')
                    .reduce((sum, d) => sum + d.value, 0)
                )}
              </p>
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
