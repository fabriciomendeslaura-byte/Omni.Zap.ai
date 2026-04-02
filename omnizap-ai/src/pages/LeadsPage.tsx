import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Phone, 
  MessageSquare, 
  Calendar,
  DollarSign,
  User,
  GripVertical,
  X
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
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { Lead, LeadStatus } from '../types';

const columns: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'novo', label: 'Novo Lead', color: 'bg-blue-500' },
  { id: 'atendimento', label: 'Em Atendimento', color: 'bg-yellow-500' },
  { id: 'fechado', label: 'Fechado', color: 'bg-green-500' },
  { id: 'parado', label: 'Parado', color: 'bg-red-500' },
];


interface SortableLeadCardProps {
  lead: Lead;
}

const SortableLeadCard: React.FC<SortableLeadCardProps> = ({ lead }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id });

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
        "bg-dark-card p-4 rounded-xl border border-dark-border hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-md",
        isDragging && "opacity-50 border-primary"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-dark-muted flex items-center justify-center text-xs font-bold text-primary border border-dark-border">
            {lead.nome.charAt(0)}
          </div>
          <span className="font-bold text-sm truncate max-w-[120px]">{lead.nome}</span>
        </div>
        <button className="text-dark-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-dark-muted-foreground">
          <Phone className="w-3 h-3" />
          {lead.telefone}
        </div>
        <div className="flex items-center gap-2 text-xs text-dark-muted-foreground">
          <MessageSquare className="w-3 h-3" />
          <span className="truncate">{lead.ultima_mensagem}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs font-bold text-primary">
          <Calendar className="w-3 h-3" />
          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
        </div>
        <div className="flex -space-x-1">
          <div className="w-6 h-6 rounded-full bg-dark-muted border border-dark-border flex items-center justify-center text-[8px] font-bold">
            <User className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const { user } = useAuth();
  const { leads, setLeads, updateLeadStatus, createLead } = useLeads(user?.id);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({ nome: '', telefone: '', value: '' });


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const query = searchQuery.toLowerCase();
    return leads.filter(lead => 
      lead.nome.toLowerCase().includes(query) || 
      lead.telefone.toLowerCase().includes(query) ||
      lead.ultima_mensagem?.toLowerCase().includes(query)
    );
  }, [leads, searchQuery]);

  const getLeadsByStatus = (status: LeadStatus) => {
    return filteredLeads.filter(lead => lead.status === status);
  };

  const handleAddLead = async (e: React.FormEvent, status: LeadStatus = 'novo') => {
    e.preventDefault();
    if (!newLead.nome || !newLead.telefone) return;

    await createLead({
      nome: newLead.nome,
      telefone: newLead.telefone,
      status: status,
      origem: 'manual',
      ultima_mensagem: 'Lead adicionado manualmente'
    });

    setNewLead({ nome: '', telefone: '', value: '' });
    setIsModalOpen(false);
  };


  const findContainer = (id: string) => {
    if (columns.some(col => col.id === id)) return id;
    const lead = leads.find(l => l.id === id);
    return lead ? lead.status : null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setLeads((prev) => {
      const activeIndex = prev.findIndex((l) => l.id === activeId);
      const overIndex = prev.findIndex((l) => l.id === overId);

      let newIndex;
      if (columns.some(col => col.id === overId)) {
        newIndex = prev.length;
      } else {
        const isBelowLastItem = over && overIndex === prev.length - 1;
        const modifier = isBelowLastItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : prev.length;
      }

      const updatedLeads = [...prev];
      updatedLeads[activeIndex] = {
        ...updatedLeads[activeIndex],
        status: overContainer as LeadStatus
      };

      return arrayMove(updatedLeads, activeIndex, newIndex);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (activeContainer && overContainer && activeId !== overId) {
       // Just update backend if status changed
       if (activeContainer !== overContainer) {
          updateLeadStatus(activeId, overContainer as LeadStatus);
       }
    }

    setActiveId(null);
  };

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pipeline de Leads</h1>
          <p className="text-dark-muted-foreground">Gerencie seus leads e acompanhe cada etapa da venda.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-dark-card border border-dark-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <button className="p-2 bg-dark-card border border-dark-border rounded-xl text-dark-muted-foreground hover:text-primary transition-colors">
            <Filter className="w-5 h-5" />
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
        <div className="flex-1 flex gap-6 overflow-x-auto pb-6 kanban-column">
          {columns.map((column) => (
            <div key={column.id} className="flex-1 min-w-[300px] flex flex-col bg-dark-card/30 rounded-2xl border border-dark-border/50">
              {/* Column Header */}
              <div className="p-4 border-b border-dark-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", column.color)}></div>
                  <h3 className="font-bold text-sm uppercase tracking-wider">{column.label}</h3>
                  <span className="bg-dark-muted text-dark-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {getLeadsByStatus(column.id).length}
                  </span>
                </div>
                <button className="text-dark-muted-foreground hover:text-white transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Column Content */}
              <SortableContext 
                id={column.id}
                items={getLeadsByStatus(column.id).map(l => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {getLeadsByStatus(column.id).map((lead) => (
                    <SortableLeadCard key={lead.id} lead={lead} />
                  ))}
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3 border-2 border-dashed border-dark-border rounded-xl text-dark-muted-foreground hover:border-primary/50 hover:text-primary transition-all text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Lead
                  </button>
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeLead ? (
            <div className="bg-dark-card p-4 rounded-xl border border-primary shadow-2xl w-[268px] rotate-3 cursor-grabbing">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-dark-muted flex items-center justify-center text-xs font-bold text-primary border border-dark-border">
                    {activeLead.nome.charAt(0)}
                  </div>
                  <span className="font-bold text-sm truncate max-w-[120px]">{activeLead.nome}</span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-dark-muted-foreground">
                  <Phone className="w-3 h-3" />
                  {activeLead.telefone}
                </div>
              </div>
              <div className="pt-3 border-t border-dark-border flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-bold text-primary">
                  <Calendar className="w-3 h-3" />
                  {activeLead.created_at ? new Date(activeLead.created_at).toLocaleDateString('pt-BR') : 'Agora'}
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* New Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-card border border-dark-border w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-dark-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Novo Lead</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-dark-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-muted-foreground">Nome do Lead</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: João Silva"
                  value={newLead.nome}
                  onChange={(e) => setNewLead({ ...newLead, nome: e.target.value })}
                  className="w-full bg-dark-muted border border-dark-border rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors"
                />

              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-muted-foreground">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: (11) 99999-9999"
                  value={newLead.telefone}
                  onChange={(e) => setNewLead({ ...newLead, telefone: e.target.value })}
                  className="w-full bg-dark-muted border border-dark-border rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors"
                />

              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-dark-border font-bold hover:bg-dark-muted transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  Criar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
