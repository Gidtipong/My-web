"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskStatus } from "@prisma/client";
import {
  formatDateBangkok,
  isOverdue,
  getPriorityStyles,
  getTaskTypeStyles,
  cn,
} from "@/lib/utils";
import { Server, Calendar, CheckSquare, AlertTriangle, ExternalLink } from "lucide-react";
import { updateTaskStatus } from "@/app/actions/tasks";
import { IncidentDoneModal } from "@/components/tasks/incident-done-modal";

interface TaskItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  dueDate: Date | string | null;
  ticketRef?: string | null;
  site?: { id: string; name: string } | null;
  device?: { id: string; hostname: string; model: string; ipAddress: string } | null;
  checklists?: Array<{ id: string; done: boolean }>;
}

interface TaskKanbanProps {
  tasks: TaskItem[];
  onRefresh: () => void;
}

const COLUMNS: Array<{ id: TaskStatus; label: string; dot: string; border: string }> = [
  { id: "TODO", label: "To Do", dot: "bg-slate-400", border: "border-slate-800" },
  { id: "IN_PROGRESS", label: "In Progress", dot: "bg-blue-400", border: "border-blue-900/50" },
  { id: "BLOCKED", label: "Blocked", dot: "bg-amber-400", border: "border-amber-900/50" },
  { id: "DONE", label: "Done", dot: "bg-emerald-400", border: "border-emerald-900/50" },
];

function KanbanCard({ task, isDragging = false }: { task: TaskItem; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(task.dueDate, task.status);
  const priorityStyles = getPriorityStyles(task.priority);
  const typeStyles = getTaskTypeStyles(task.type);
  const totalChecklists = task.checklists?.length || 0;
  const doneChecklists = task.checklists?.filter((c) => c.done).length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5 shadow-sm transition-all select-none cursor-grab active:cursor-grabbing hover:border-zinc-700",
        isDragging && "opacity-40 ring-2 ring-emerald-500",
        overdue && "border-red-500/40 bg-red-950/20"
      )}
    >
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border",
              priorityStyles.bg
            )}
          >
            {task.priority}
          </span>
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", typeStyles.bg)}>
            {typeStyles.label}
          </span>
        </div>
        {task.ticketRef && (
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1 py-0.5 rounded border border-zinc-700">
            {task.ticketRef}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="font-medium text-xs text-zinc-100 group-hover:text-emerald-300 transition-colors line-clamp-2 mb-2">
        {task.title}
      </div>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
        {/* Device pill */}
        {task.device ? (
          <span className="flex items-center gap-1 font-mono text-zinc-300">
            <Server className="h-3 w-3 text-purple-400" />
            <span className="truncate max-w-[110px]">{task.device.hostname}</span>
          </span>
        ) : (
          <span className="text-zinc-600">-</span>
        )}

        {/* Due date */}
        {task.dueDate && (
          <span
            className={cn(
              "flex items-center gap-1 font-mono",
              overdue ? "text-red-400 font-bold" : "text-zinc-400"
            )}
          >
            {overdue ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
            <span>{formatDateBangkok(task.dueDate, "dd MMM")}</span>
          </span>
        )}
      </div>

      {/* Checklist Indicator & Link button */}
      <div className="flex items-center justify-between mt-2 pt-1.5 text-[10px] text-zinc-500 font-mono">
        {totalChecklists > 0 ? (
          <span className={doneChecklists === totalChecklists ? "text-emerald-400 font-semibold" : ""}>
            ✓ {doneChecklists}/{totalChecklists} Checklist
          </span>
        ) : (
          <span />
        )}
        <Link
          href={`/tasks/${task.id}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
        >
          <span>Detail</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </Link>
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
}: {
  column: (typeof COLUMNS)[0];
  tasks: TaskItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border bg-zinc-950/80 p-3 min-w-[260px] flex-1 min-h-[500px]",
        column.border,
        isOver && "ring-2 ring-emerald-500/50 bg-zinc-900/50"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", column.dot)} />
          <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
            {column.label}
          </h4>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 text-xs font-mono font-semibold border border-zinc-800">
          {tasks.length}
        </span>
      </div>

      {/* Cards List */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
          {tasks.length === 0 ? (
            <div className="h-32 flex items-center justify-center border border-dashed border-zinc-800/80 rounded-lg text-zinc-600 text-xs font-mono">
              Drop tasks here
            </div>
          ) : (
            tasks.map((task) => <KanbanCard key={task.id} task={task} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskKanban({ tasks: initialTasks, onRefresh }: TaskKanbanProps) {
  // Local state for optimistic updates
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [incidentPromptTask, setIncidentPromptTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag begins
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column or another card
    let targetStatus: TaskStatus | null = null;
    if (COLUMNS.some((c) => c.id === overId)) {
      targetStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status as TaskStatus;
      }
    }

    if (!targetStatus) return;

    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === targetStatus) return;

    // Prompt if Incident marked Done
    if (targetStatus === "DONE" && currentTask.type === "INCIDENT") {
      setIncidentPromptTask(currentTask);
    }

    // 1. Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus! } : t))
    );

    // 2. Server Action Mutation
    try {
      await updateTaskStatus(taskId, targetStatus);
      onRefresh();
    } catch (err) {
      console.error("Failed to update status:", err);
      // Rollback
      setTasks(initialTasks);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return <KanbanColumn key={col.id} column={col} tasks={colTasks} />;
        })}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} isDragging /> : null}
      </DragOverlay>

      {/* Incident Done Auto-Prompt Dialog */}
      <IncidentDoneModal
        task={incidentPromptTask}
        isOpen={!!incidentPromptTask}
        onClose={() => setIncidentPromptTask(null)}
      />
    </DndContext>
  );
}
