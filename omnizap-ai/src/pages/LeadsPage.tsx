import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  MessageSquare,
  Calendar,
  User,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { Lead, LeadStatus } from '../types';

// ─── Column definitions ────────────────────────────────────────────────────────

interface ColumnDef {
  id: LeadStatus;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'novo_lead',          label: 'Novo Lead',          color: 'bg-blue-500',    bgColor: 'bg-blue-500/10',    textColor: 'text-blue-400' },
  { id: 'em_atendimento',     label: 'Em Atendimento',     color: 'bg-yellow-500',  bgColor: 'bg-yellow-500/10',  textColor: 'text-yellow-400' },
  { id: 'lead_qualificado',   label: 'Lead Qualificado',   color: 'bg-purple-500',  bgColor: 'bg-purple-500/10',  textColor: 'text-purple-400' },
  { id: 'reuniao_marcada',    label: 'Reunião Marcada',    color: 'bg-indigo-500',  bgColor: 'bg-indigo-500/10',  textColor: 'text-indigo-400' },
  { id: 'humano_na_conversa', label: 'Humano na Conversa', color: 'bg-orange-500',  bgColor: 'bg-orange-500/10',  textColor: 'text-orange-400' },
  { id: 'fechado',            label: 'Fechado',            color: 'bg-green-500',   bgColor: 'bg-green-500/10',   textColor: 'text-green-400' },
  { id: 'perdido',            label: 'Perdido',            color: 'bg-red-500',     bgColor: 'bg-red-500/10',     textColor: 'text-red-400' },
  { id: 'follow_up',          label: 'Follow-up',          color: 'bg-teal-500',    bgColor: 'bg-teal-500/10',    textColor: 'text-teal-400' },
];

const COLUMN_MAP = Object.fromEntries(COLUMNS.map((c) => [c.id, c])) as Record<LeadStatus, ColumnDef>;

// ─── Sortable Lead Card ────────────────────────────────────────────────────────

interface SortableLeadCardProps {
  lead: Lead;
  columnDef: ColumnDef;
}

const SortableLeadCard: React.FC<SortableLeadCardProps> = ({ lead, columnDef }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-dark-card p-4 rounded-xl border border-dark-border hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-md select-none',
        isDragging && 'opacity-40 border-primary scale-95'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-dark-border shrink-0', columnDef.bgColor, columnDef.textColor)}>
            {lead.nome?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <span className="font-bold text-sm truncate">{lead.nome}</span>
        </div>
        <button
          className="text-dark-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-dark-muted-foreground">
          <Phone className="w-3 h-3 shrink-0" />
          <span className="truncate">{lead.telefone}</span>
        </div>
        {lead.ultima_mensagem && (
          <div className="flex items-center gap-2 text-xs text-dark-muted-foreground">
            <MessageSquare className="w-3 h-3 shrink-0" />
            <span className="truncate">{lead.ultima_mensagem}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-dark-border flex items-center justify-between">
        <div className={cn('flex items-center gap-1 text-[10px] font-bold', columnDef.textColor)}>
          <Calendar className="w-3 h-3" />
          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
        </div>
        <div className="w-5 h-5 rounded-full bg-dark-muted border border-dark-border flex items-center justify-center">
          <User className="w-3 h-3 text-dark-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

// ─── Drag Overlay Card ─────────────────────────────────────────────────────────

const OverlayCard: React.FC<{ lead: Lead; columnDef: ColumnDef }> = ({ lead, columnDef }) => (
  <div className="bg-dark-card p-4 rounded-xl border-2 border-primary shadow-2xl w-[280px] rotate-2 cursor-grabbing select-none opacity-95">
    <div className="flex items-center gap-2 mb-3">
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-dark-border shrink-0', columnDef.bgColor, columnDef.textColor)}>
        {lead.nome?.charAt(0)?.toUpperCase() ?? '?'}
      </div>
      <span className="font-bold text-sm truncate">{lead.nome}</span>
    </div>
    <div className="flex items-center gap-2 text-xs text-dark-muted-foreground">
      <Phone className="w-3 h-3" />
      {lead.telefone}
    </div>
  </div>
);

// ─── Kanban Column ─────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  column: ColumnDef;
  leads: Lead[];
  isOver: boolean;
  onAddLead: () => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, leads, isOver, onAddLead }) => {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 min-w-[272px] max-w-[320px] flex flex-col rounded-2xl border transition-all duration-200',
        isOver
          ? cn('border-primary/60 shadow-lg shadow-primary/10', column.bgColor)
          : 'bg-dark-card/30 border-dark-border/50'
      )}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-dark-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', column.color)} />
          <h3 className="font-bold text-xs uppercase tracking-wider truncate">{column.label}</h3>
          <span className="bg-dark-muted text-dark-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <SortableContext
        id={column.id}
        items={leads.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={cn(
            'flex-1 p-3 space-y-3 overflow-y-auto min-h-[120px] transition-colors duration-200',
            isOver && 'bg-primary/5 rounded-b-2xl'
          )}
        >
          {leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} columnDef={column} />
          ))}

          {/* Drop indicator when dragging over empty column */}
          {isOver && leads.length === 0 && (
            <div className="border-2 border-dashed border-primary/50 rounded-xl h-20 flex items-center justify-center text-primary/60 text-xs font-bold animate-pulse">
              Soltar aqui
            </div>
          )}

          {/* Add lead button */}
          <button
            onClick={onAddLead}
            className="w-full py-2.5 border-2 border-dashed border-dark-border rounded-xl text-dark-muted-foreground hover:border-primary/50 hover:text-primary transition-all text-xs font-bold flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>
      </SortableContext>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const { user } = useAuth();
  const { leads, setLeads, updateLeadStatus, createLead } = useLeads(user?.id);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<LeadStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({ nome: '', telefone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Derived state ────────────────────────────────────────────────────────────

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(
      (l) =>
        l.nome?.toLowerCase().includes(q) ||
        l.telefone?.toLowerCase().includes(q) ||
        l.ultima_mensagem?.toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  const getLeadsByStatus = useCallback(
    (status: LeadStatus) => filteredLeads.filter((l) => l.status === status),
    [filteredLeads]
  );

  const activeLead = activeId ? leads.find((l) => l.id === activeId) ?? null : null;
  const activeColumnDef = activeLead ? COLUMN_MAP[activeLead.status] : COLUMNS[0];

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const findLeadContainer = useCallback(
    (id: string): LeadStatus | null => {
      if (COLUMNS.some((c) => c.id === id)) return id as LeadStatus;
      return leads.find((l) => l.id === id)?.status ?? null;
    },
    [leads]
  );

  // ── DnD handlers ─────────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) { setOverId(null); return; }

    const activeLeadId = active.id as string;
    const overedId = over.id as string;

    const activeContainer = findLeadContainer(activeLeadId);
    const overContainer = findLeadContainer(overedId);

    if (!activeContainer || !overContainer) return;

    // Highlight target column
    setOverId(overContainer);

    if (activeContainer === overContainer) return;

    // Optimistic UI: move card to new column immediately
    setLeads((prev) => {
      const activeIndex = prev.findIndex((l) => l.id === activeLeadId);
      if (activeIndex === -1) return prev;

      const overIndex = prev.findIndex((l) => l.id === overedId);
      const insertAt = COLUMNS.some((c) => c.id === overedId)
        ? prev.length
        : overIndex >= 0
        ? overIndex
        : prev.length;

      const updated = [...prev];
      updated[activeIndex] = { ...updated[activeIndex], status: overContainer };
      return arrayMove(updated, activeIndex, insertAt);
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeLeadId = active.id as string;
    const overContainer = findLeadContainer(over.id as string);

    if (!overContainer) return;

    // Find the lead's current (optimistically updated) status
    const currentLead = leads.find((l) => l.id === activeLeadId);
    if (!currentLead) return;

    const previousStatus = active.data.current?.sortable?.containerId as LeadStatus | undefined;

    // If status actually changed, sync with backend
    if (currentLead.status !== previousStatus) {
      const success = await updateLeadStatus(activeLeadId, overContainer);

      if (!success) {
        // Rollback: revert to original status
        if (previousStatus) {
          setLeads((prev) =>
            prev.map((l) =>
              l.id === activeLeadId ? { ...l, status: previousStatus } : l
            )
          );
        }
        toast.error('Erro ao mover lead. Tente novamente.', {
          icon: <AlertCircle className="w-4 h-4" />,
        });
      } else {
        const col = COLUMN_MAP[overContainer];
        toast.success(`Lead movido para ${col.label}`, { duration: 2000 });
      }
    }
  };

  // ── Add lead ─────────────────────────────────────────────────────────────────

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.nome.trim() || !newLead.telefone.trim()) return;

    setIsSubmitting(true);
    const result = await createLead({
      nome: newLead.nome.trim(),
      telefone: newLead.telefone.trim(),
      status: 'novo_lead',
      origem: 'manual',
      ultima_mensagem: 'Lead adicionado manualmente',
    });

    setIsSubmitting(false);

    if (result) {
      toast.success('Lead criado com sucesso!');
      setNewLead({ nome: '', telefone: '' });
      setIsModalOpen(false);
    } else {
      toast.error('Erro ao criar lead. Tente novamente.');
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────────

  const totalLeads = leads.length;
  const closedLeads = leads.filter((l) => l.status === 'fechado').length;
  const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold mb-1">Pipeline de Leads</h1>
          <p className="text-dark-muted-foreground text-sm">
            {totalLeads} lead{totalLeads !== 1 ? 's' : ''} · {conversionRate}% de conversão
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-dark-card border border-dark-border rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-primary transition-colors w-52"
            />
          </div>
          <button className="p-2 bg-dark-card border border-dark-border rounded-xl text-dark-muted-foreground hover:text-primary transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 min-h-0">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              leads={getLeadsByStatus(column.id)}
              isOver={overId === column.id}
              onAddLead={() => setIsModalOpen(true)}
            />
          ))}
        </div>

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.4' } },
            }),
          }}
        >
          {activeLead ? (
            <OverlayCard lead={activeLead} columnDef={activeColumnDef} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* New Lead Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="bg-dark-card border border-dark-border w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-dark-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Novo Lead</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-dark-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-dark-muted-foreground">
                  Nome do Lead <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: João Silva"
                  value={newLead.nome}
                  onChange={(e) => setNewLead({ ...newLead, nome: e.target.value })}
                  className="w-full bg-dark-muted border border-dark-border rounded-xl px-4 py-2.5 outline-none focus:border-primary transition-colors text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-dark-muted-foreground">
                  Telefone / WhatsApp <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 5511999999999"
                  value={newLead.telefone}
                  onChange={(e) => setNewLead({ ...newLead, telefone: e.target.value })}
                  className="w-full bg-dark-muted border border-dark-border rounded-xl px-4 py-2.5 outline-none focus:border-primary transition-colors text-sm"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-dark-border font-bold hover:bg-dark-muted transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Criando...' : 'Criar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
