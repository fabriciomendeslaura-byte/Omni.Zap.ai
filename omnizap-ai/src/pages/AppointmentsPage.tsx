import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAppointments } from '../hooks/useAppointments';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { Appointment } from '../types';


export default function AppointmentsPage() {
  const { user } = useAuth();
  const { appointments, loading, updateAppointmentStatus, createAppointment } = useAppointments(user?.id);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ leadName: '', date: '', time: '' });
  const [isSaving, setIsSaving] = useState(false);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const handleStatusChange = async (id: string, status: Appointment['status']) => {
    const success = await updateAppointmentStatus(id, status);
    if (success) {
      toast.success(`Agendamento ${status === 'confirmed' ? 'confirmado' : 'atualizado'}!`);
    } else {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointment.leadName || !newAppointment.date || !newAppointment.time) return;

    setIsSaving(true);
    try {
      const result = await createAppointment({
        nome: newAppointment.leadName,
        data_agendamento: newAppointment.date,
        hora_agendamento: newAppointment.time,
        status: 'pending'
      });

      if (result) {
        toast.success('Agendamento criado com sucesso!');
        setNewAppointment({ leadName: '', date: '', time: '' });
        setIsModalOpen(false);
        
        // Update selected date to the new appointment date to show it
        const [year, month, day] = newAppointment.date.split('-').map(Number);
        setSelectedDate(new Date(year, month - 1, day));
        setCurrentDate(new Date(year, month - 1, 1));
      } else {
        toast.error('Erro ao criar agendamento.');
      }
    } catch (error) {
      toast.error('Erro ao processar agendamento.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calendar Helpers
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const hasAppointment = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.some(app => app.data_agendamento === dateStr);
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentDate.getMonth() && 
           selectedDate.getFullYear() === currentDate.getFullYear();
  };

  const filteredAppointments = selectedDate 
    ? appointments.filter(app => {
        const [y, m, d] = app.data_agendamento.split('-').map(Number);
        return y === selectedDate.getFullYear() && 
               m === selectedDate.getMonth() + 1 && 
               d === selectedDate.getDate();
      })
    : appointments;

  const summary = {
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    canceled: appointments.filter(a => a.status === 'canceled').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Agendamentos</h1>
          <p className="text-dark-muted-foreground">Gerencie as reuniões e consultas marcadas pela sua IA.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Agendamento
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-dark-card p-6 rounded-2xl border border-dark-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-dark-muted rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-dark-muted rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                <div key={d} className="text-[10px] font-bold text-dark-muted-foreground uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {/* Empty cells for days of previous month */}
              {Array.from({ length: firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => (
                <div key={`empty-${i}`} className="w-8 h-8" />
              ))}
              
              {Array.from({ length: daysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
                const day = i + 1;
                const hasApp = hasAppointment(day);
                const active = isSelected(day);
                
                return (
                  <button 
                    key={day} 
                    onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all relative",
                      active ? "bg-primary text-white" : "hover:bg-dark-muted text-dark-muted-foreground",
                      hasApp && !active && "text-primary"
                    )}
                  >
                    {day}
                    {hasApp && (
                      <div className={cn(
                        "w-1 h-1 rounded-full absolute bottom-1",
                        active ? "bg-white" : "bg-primary"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
            {selectedDate && (
              <button 
                onClick={() => setSelectedDate(null)}
                className="w-full mt-6 text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground hover:text-primary transition-colors"
              >
                Ver todos os agendamentos
              </button>
            )}
          </div>

          <div className="bg-dark-card p-6 rounded-2xl border border-dark-border">
            <h3 className="font-bold mb-4">Resumo Geral</h3>
            <div className="space-y-4">
              {[
                { label: 'Confirmados', value: summary.confirmed, color: 'bg-green-500' },
                { label: 'Pendentes', value: summary.pending, color: 'bg-yellow-500' },
                { label: 'Cancelados', value: summary.canceled, color: 'bg-red-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", item.color)}></div>
                    <span className="text-sm text-dark-muted-foreground font-medium">{item.label}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="font-bold text-sm uppercase tracking-widest text-dark-muted-foreground">
              {selectedDate 
                ? `Agendamentos para ${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}`
                : 'Próximos Agendamentos'}
            </h3>
            <span className="text-xs font-bold text-primary">{filteredAppointments.length} agendamentos</span>
          </div>
          
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => {
              const [y, m, d] = appointment.data_agendamento.split('-').map(Number);
              const dateObj = new Date(y, m - 1, d);
              const monthAbbr = monthNames[dateObj.getMonth()].substring(0, 3);

              return (
                <div key={appointment.id} className="bg-dark-card p-6 rounded-2xl border border-dark-border flex items-center justify-between group hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-dark-muted rounded-2xl flex flex-col items-center justify-center border border-dark-border">
                      <span className="text-[10px] font-bold uppercase text-dark-muted-foreground">{monthAbbr}</span>
                      <span className="text-xl font-black text-primary">{d}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{appointment.nome}</h4>
                      <div className="flex items-center gap-4 text-xs text-dark-muted-foreground font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {appointment.hora_agendamento.substring(0, 5)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          Agendamento OmniZap
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      appointment.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                      appointment.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      appointment.status === 'completed' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {appointment.status === 'confirmed' ? 'Confirmado' :
                       appointment.status === 'pending' ? 'Pendente' : 
                       appointment.status === 'completed' ? 'Finalizado' : 'Cancelado'}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {appointment.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          className="p-2 hover:bg-green-500/10 hover:text-green-500 rounded-lg transition-colors text-dark-muted-foreground"
                          title="Confirmar"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                      {appointment.status !== 'canceled' && (
                        <button 
                          onClick={() => handleStatusChange(appointment.id, 'canceled')}
                          className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-dark-muted-foreground"
                          title="Cancelar"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-dark-muted rounded-lg transition-colors text-dark-muted-foreground">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-dark-card/50 border border-dashed border-dark-border rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <CalendarIcon className="w-12 h-12 text-dark-muted-foreground mb-4 opacity-20" />
              <p className="text-dark-muted-foreground font-medium">Nenhum agendamento encontrado para esta data.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-card border border-dark-border w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-dark-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Novo Agendamento</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-dark-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAppointment} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-muted-foreground">Nome do Lead</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: João Silva"
                  value={newAppointment.leadName}
                  onChange={(e) => setNewAppointment({ ...newAppointment, leadName: e.target.value })}
                  className="w-full bg-dark-muted border border-dark-border rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-muted-foreground">Data</label>
                  <input 
                    type="date" 
                    required
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                    className="w-full bg-dark-muted border border-dark-border rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-muted-foreground">Horário</label>
                  <input 
                    type="time" 
                    required
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                    className="w-full bg-dark-muted border border-dark-border rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors"
                  />
                </div>
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
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Agendar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
