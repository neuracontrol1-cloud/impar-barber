import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Phone, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import type { Booking } from '../types';
import { timeToMinutes, minutesToTime } from '../lib/utils';

export function AdminHistory() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) navigate('/');
            setLoading(false);
        };
        checkUser();
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [selectedDate, statusFilter]);

    const fetchHistory = async () => {
        try {
            let query = supabase
                .from('bookings')
                .select(`
                    id, 
                    time, 
                    date,
                    service_name, 
                    price,
                    duration_minutes,
                    status,
                    is_mensalista,
                    clients (name, phone)
                `)
                .order('date', { ascending: false })
                .order('time', { ascending: false });

            // Apply Status Filter
            if (statusFilter === 'all') {
                query = query.in('status', ['completed', 'cancelled']);
            } else {
                query = query.eq('status', statusFilter);
            }

            // Apply Date Filter if selected
            if (selectedDate) {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                query = query.eq('date', dateStr);
            } else {
                query = query.limit(50);
            }

            const { data, error } = await query;

            if (error) throw error;

            const targetDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

            const formatted: Booking[] = (data || [])
                .map((b: any) => {
                    return {
                        id: b.id,
                        time: b.time,
                        date: b.date,
                        service_name: b.service_name,
                        price: b.price,
                        duration_minutes: b.duration_minutes || 30,
                        status: b.status,
                        is_mensalista: b.is_mensalista,
                        client: {
                            name: b.clients?.name || 'Cliente Desconhecido',
                            phone: b.clients?.phone || '-'
                        },
                        _localDate: b.date
                    };
                })
                // Filter locally if a date is selected (double check)
                .filter(b => !targetDateStr || b._localDate === targetDateStr);

            setBookings(formatted);
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
        }
    };

    const changeDate = (days: number) => {
        if (selectedDate) {
            setSelectedDate(prev => addDays(prev!, days));
        } else {
            setSelectedDate(new Date());
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

    return (
        <div className="min-h-screen bg-muted/20 p-6">
            <div className="container mx-auto max-w-4xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin" className="p-2 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                            Histórico
                        </h1>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        {/* Status Filter */}
                        <div className="flex bg-background p-1 rounded-lg border shadow-sm w-full sm:w-auto justify-center">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setStatusFilter('completed')}
                                className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === 'completed' ? 'bg-green-600 text-white shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
                            >
                                Concluídos
                            </button>
                            <button
                                onClick={() => setStatusFilter('cancelled')}
                                className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === 'cancelled' ? 'bg-red-600 text-white shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
                            >
                                Cancelados
                            </button>
                        </div>

                        {/* Date Filter Controls */}
                        <div className="relative flex items-center gap-2 bg-background p-1 rounded-lg border shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                            {selectedDate ? (
                                <>
                                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <div className="relative">
                                        <button
                                            onClick={() => setShowCalendar(!showCalendar)}
                                            className="font-medium min-w-[140px] text-center capitalize hover:bg-muted px-2 py-1 rounded-md transition-colors"
                                        >
                                            {format(selectedDate, "EEE, dd 'de' MMMM", { locale: ptBR })}
                                        </button>

                                        {showCalendar && (
                                            <div className="absolute top-full right-0 mt-2 bg-card border rounded-xl shadow-xl z-20 p-2">
                                                <DayPicker
                                                    mode="single"
                                                    selected={selectedDate}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            setSelectedDate(date);
                                                            setShowCalendar(false);
                                                        }
                                                    }}
                                                    locale={ptBR}
                                                    modifiersStyles={{
                                                        selected: { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                    <div className="h-6 w-px bg-border mx-1" />
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md text-xs font-medium flex items-center gap-1"
                                        title="Limpar filtro"
                                    >
                                        <X className="w-4 h-4" />
                                        Todos
                                    </button>
                                </>
                            ) : (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Filtrar por Data
                                    </button>
                                    {showCalendar && (
                                        <div className="absolute top-full right-0 mt-2 bg-card border rounded-xl shadow-xl z-20 p-2">
                                            <DayPicker
                                                mode="single"
                                                selected={selectedDate || undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setSelectedDate(date);
                                                        setShowCalendar(false);
                                                    }
                                                }}
                                                locale={ptBR}
                                                modifiersStyles={{
                                                    selected: { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {showCalendar && (
                    <div className="fixed inset-0 z-10" onClick={() => setShowCalendar(false)} />
                )}

                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <div className="divide-y">
                        {bookings.length > 0 ? (
                            bookings.map(booking => (
                                <div key={booking.id} className="p-4 flex flex-col sm:flex-row justify-between gap-4 hover:bg-muted/10 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="bg-muted text-muted-foreground font-bold rounded-lg p-2 min-w-[5rem] text-center flex flex-col justify-center">
                                            <span className="text-sm leading-tight">{format(new Date(booking.date + 'T00:00:00'), 'dd/MM', { locale: ptBR })}</span>
                                            <span className="text-xs text-foreground mt-1">{booking.time}</span>
                                            <span className="text-[9px] opacity-60 border-t border-muted-foreground/20 mt-1 pt-1">até {minutesToTime(timeToMinutes(booking.time) + (booking.duration_minutes || 30))}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 font-medium">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                {booking.client.name}
                                                {booking.is_mensalista && (
                                                    <span className="text-[9px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                                                        Mensalista
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {booking.service_name} • R$ {booking.price.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {booking.client.phone}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        {booking.status === 'cancelled' ? (
                                            <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium border border-red-200 flex items-center gap-1">
                                                <X className="w-3 h-3" />
                                                Cancelado
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium border border-green-200 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Concluído
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-muted-foreground">
                                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Nenhum atendimento concluído encontrado {selectedDate ? 'nesta data' : ''}.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
