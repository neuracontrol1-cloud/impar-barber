import { useState, useEffect } from 'react';
import { X, User, Calendar, Clock, Check, Loader2, RefreshCw } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import { supabase } from '../lib/supabase';
import { ServiceSelection } from './ServiceSelection';
import { BookingCalendar } from './BookingCalendar';
import { TimeSlotPicker } from './TimeSlotPicker';
import { cn, timeToMinutes } from '../lib/utils';
import type { Service } from '../types';

interface NewBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialDate?: Date;
}

export function NewBookingModal({ isOpen, onClose, onSuccess, initialDate = new Date() }: NewBookingModalProps) {
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [existingBookings, setExistingBookings] = useState<{ time: string; duration_minutes: number }[]>([]);

    const [clientData, setClientData] = useState({
        name: '',
        phone: '',
        isMensalista: false,
        weeks: 4
    });

    useEffect(() => {
        if (isOpen) {
            fetchServices();
            setSelectedDate(initialDate);
        }
    }, [isOpen, initialDate]);

    useEffect(() => {
        if (selectedDate) {
            fetchExistingBookings();
        }
    }, [selectedDate]);

    const fetchServices = async () => {
        const { data } = await supabase.from('services').select('*').eq('active', true);
        if (data) setServices(data);
    };

    const fetchExistingBookings = async () => {
        if (!selectedDate) return;
        const start = format(selectedDate, 'yyyy-MM-dd');

        const { data } = await supabase
            .from('bookings')
            .select('time, duration_minutes')
            .eq('date', start)
            .neq('status', 'cancelled');

        if (data) {
            setExistingBookings(data.map(b => ({
                time: b.time,
                duration_minutes: b.duration_minutes || 30
            })));
        }
    };

    const selectedServicesList = services.filter(s => selectedServiceIds.includes(s.id));
    const totalDuration = selectedServicesList.reduce((sum, s) => sum + (s.duration_minutes || 30), 0);
    const totalPrice = selectedServicesList.reduce((sum, s) => sum + s.price, 0);

    const handleSave = async () => {
        if (!selectedDate || !selectedTime || selectedServiceIds.length === 0 || !clientData.name) {
            alert('Preencha pelo menos o Nome e selecione Serviço, Data e Hora.');
            return;
        }

        setLoading(true);
        try {
            // 1. Get/Create Client
            // We search by phone first if provided, otherwise by name
            let clientId;
            const phoneSearch = clientData.phone ? clientData.phone.replace(/\D/g, '') : null;

            const { data: existingClients } = await supabase
                .from('clients')
                .select('id, phone, name')
                .or(`name.ilike.%${clientData.name}%,phone.eq.${phoneSearch || '____'}`);

            const existingClient = existingClients?.find(c =>
                (phoneSearch && c.phone?.replace(/\D/g, '') === phoneSearch) ||
                c.name.toLowerCase() === clientData.name.toLowerCase()
            );

            if (existingClient) {
                clientId = existingClient.id;
            } else {
                // Email is required by schema, but Barber might not have it.
                // Using a synthetic unique email based on name/phone
                const syntheticEmail = `${clientData.name.toLowerCase().replace(/\s/g, '.')}.${phoneSearch || Date.now()}@impar.internal`;

                const { data: newClient, error: clientErr } = await supabase
                    .from('clients')
                    .insert({
                        name: clientData.name,
                        phone: clientData.phone,
                        email: syntheticEmail
                    })
                    .select('id')
                    .single();
                if (clientErr) throw clientErr;
                clientId = newClient.id;
            }

            // 2. Prepare & Verify Bookings
            const bookingDates = [selectedDate];
            if (clientData.isMensalista) {
                for (let i = 1; i < clientData.weeks; i++) {
                    bookingDates.push(addWeeks(selectedDate, i));
                }
            }

            // CHECK COLLISIONS FOR ALL DATES
            const slotStart = timeToMinutes(selectedTime);
            const slotEnd = slotStart + totalDuration;

            for (const date of bookingDates) {
                const dateStr = format(date, 'yyyy-MM-dd');
                const { data: dayBookings } = await supabase
                    .from('bookings')
                    .select('time, duration_minutes')
                    .eq('date', dateStr)
                    .neq('status', 'cancelled');

                const hasCollision = dayBookings?.some(b => {
                    const bStart = timeToMinutes(b.time);
                    const bEnd = bStart + (b.duration_minutes || 30);
                    return Math.max(slotStart, bStart) < Math.min(slotEnd, bEnd);
                });

                if (hasCollision) {
                    alert(`Opa! O horário das ${selectedTime} já está ocupado no dia ${format(date, 'dd/MM')}. Agendamento cancelado.`);
                    setLoading(false);
                    return;
                }
            }

            const bookingsToInsert = bookingDates.map(date => ({
                client_id: clientId,
                service_id: selectedServiceIds[0],
                service_name: selectedServicesList.map(s => s.name).join(' + '),
                price: totalPrice,
                duration_minutes: totalDuration,
                date: format(date, 'yyyy-MM-dd'),
                time: selectedTime,
                status: 'confirmed'
            }));

            const { error: bookingErr } = await supabase.from('bookings').insert(bookingsToInsert);
            if (bookingErr) throw bookingErr;

            onSuccess();
            onClose();
            // Reset
            setSelectedServiceIds([]);
            setSelectedTime(null);
            setClientData({ name: '', phone: '', isMensalista: false, weeks: 4 });

        } catch (error) {
            console.error('Erro ao salvar agendamento:', error);
            alert('Erro ao salvar agendamento. Verifique se as informações estão corretas.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
            <div className="bg-card border-2 border-primary/20 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b flex justify-between items-center bg-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-xl text-primary">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-serif font-bold text-xl text-white">Novo Agendamento</h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">Manual / Mensalista</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    {/* Step 1: Client Info */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                <User className="w-4 h-4" /> 1. Dados do Cliente
                            </h3>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Nome do Cliente</label>
                                <input
                                    type="text"
                                    className="w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 rounded-xl px-4 py-3 outline-none transition-all"
                                    placeholder="Nome completo para busca ou cadastro"
                                    value={clientData.name}
                                    onChange={e => setClientData({ ...clientData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">WhatsApp</label>
                                <input
                                    type="text"
                                    className="w-full bg-muted/30 border-2 border-transparent focus:border-primary/50 rounded-xl px-4 py-3 outline-none transition-all"
                                    placeholder="(00) 00000-0000"
                                    value={clientData.phone}
                                    onChange={e => setClientData({ ...clientData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Step 2: Services */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Check className="w-4 h-4" /> 2. Serviços Escolhidos
                        </h3>
                        <div className="bg-muted/10 p-2 rounded-2xl border border-border/50">
                            <ServiceSelection
                                services={services}
                                selectedServices={selectedServiceIds}
                                onSelect={(id) => {
                                    setSelectedServiceIds(prev =>
                                        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                    );
                                }}
                            />
                        </div>
                        {selectedServiceIds.length > 0 && (
                            <div className="p-4 bg-primary/10 border-2 border-primary/20 rounded-2xl flex justify-between items-center shadow-inner">
                                <div className="space-y-1">
                                    <p className="font-bold text-foreground">{selectedServicesList.map(s => s.name).join(' + ')}</p>
                                    <p className="text-xs text-muted-foreground">{totalDuration} minutos de atendimento</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-black text-primary">R$ {totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Step 3: Date & Time */}
                    <section className="grid lg:grid-cols-2 gap-10 pt-4 border-t border-border/50">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> 3. Data do Primeiro Horário
                            </h3>
                            <div className="flex justify-center p-2 bg-muted/20 rounded-2xl border border-border/30">
                                <BookingCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                <Clock className="w-4 h-4" /> 4. Horário Inicial
                            </h3>
                            <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {selectedDate ? (
                                    <TimeSlotPicker
                                        selectedTime={selectedTime}
                                        onTimeSelect={setSelectedTime}
                                        existingBookings={existingBookings}
                                        date={selectedDate}
                                        totalDuration={totalDuration}
                                    />
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-3xl text-muted-foreground">
                                        Selecione uma data primeiro
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Step 4: Recurring */}
                    <section className="pt-6 border-t border-border/50 space-y-4">
                        <div
                            onClick={() => setClientData({ ...clientData, isMensalista: !clientData.isMensalista })}
                            className={cn(
                                "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group",
                                clientData.isMensalista
                                    ? "bg-primary/10 border-primary"
                                    : "bg-muted/30 border-transparent hover:border-primary/30"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                clientData.isMensalista ? "bg-primary border-primary" : "border-muted-foreground group-hover:border-primary"
                            )}>
                                {clientData.isMensalista && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-foreground">Definir como Mensalista</p>
                                <p className="text-xs text-muted-foreground">Fixar este horário semanalmente para o cliente.</p>
                            </div>
                            <div className="p-2 bg-background rounded-lg shadow-sm">
                                <RefreshCw className={cn("w-5 h-5", clientData.isMensalista ? "text-primary animate-spin-slow" : "text-muted-foreground")} />
                            </div>
                        </div>

                        {clientData.isMensalista && (
                            <div className="p-6 bg-muted/40 rounded-3xl border-2 border-dashed border-primary/20 space-y-5 animate-in slide-in-from-top-4 duration-500">
                                <p className="text-sm font-medium text-foreground">Por quantas semanas deseja fixar este horário?</p>
                                <div className="grid grid-cols-4 gap-3">
                                    {[2, 4, 8, 12].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setClientData({ ...clientData, weeks: num })}
                                            className={cn(
                                                "py-3 rounded-xl border-2 font-bold transition-all",
                                                clientData.weeks === num
                                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                                    : "bg-background border-transparent hover:border-primary/20"
                                            )}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-500 flex gap-2 items-start">
                                    <Loader2 className="w-3 h-3 mt-0.5 shrink-0" />
                                    <span>O sistema criará {clientData.weeks} agendamentos idênticos, pulando de 7 em 7 dias a partir da data selecionada.</span>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <div className="p-6 border-t bg-zinc-900/50 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-xs text-muted-foreground uppercase font-bold tracking-tighter">
                            Resumo Final:
                        </div>
                        {selectedTime && (
                            <div className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold rounded-full uppercase">
                                {format(selectedDate!, 'dd/MM')} às {selectedTime}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-6 py-3 font-bold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading || !selectedTime || selectedServiceIds.length === 0 || !clientData.name}
                            className="flex-1 sm:flex-none px-10 py-3 bg-primary text-primary-foreground font-black rounded-xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                            CONFIRMAR AGENDAMENTO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
