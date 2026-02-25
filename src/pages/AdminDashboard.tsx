import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Scissors as ScissorsIcon, ChevronLeft, ChevronRight, User, Phone, MessageCircle, CheckCircle2, History, Ban, TrendingUp, Clock } from 'lucide-react';
import { format, addDays, isSameDay, endOfDay, startOfDay, subDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Booking } from '../types';
import { RecentBookings } from '../components/RecentBookings';
import { ThemeToggle } from '../components/ThemeToggle';
import { DateStrip } from '../components/DateStrip';
import { timeToMinutes, minutesToTime } from '../lib/utils';
import { NewBookingModal } from '../components/NewBookingModal';

interface DashboardStats {
    activeServices: number;
    todayAppointments: number;
    blockedSlots: number;
    completedHistory: number;
}



// Helper to format phone for WhatsApp (assuming BR numbers)
const getWhatsAppUrl = (phone: string, clientName: string, time: string, service: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone; // Add country code if missing
    const message = `Olá, ${clientName}! Passando para confirmar seu agendamento de *${service}* hoje às *${time}* na Impar Barbearia.`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
};

export function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [stats, setStats] = useState<DashboardStats>({
        activeServices: 0,
        todayAppointments: 0,
        blockedSlots: 0,
        completedHistory: 0
    });
    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        checkUser();
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [selectedDate]);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate('/');
        }
        setLoading(false);
    };

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Active Services Count
            const { count: servicesCount } = await supabase
                .from('services')
                .select('*', { count: 'exact', head: true })
                .eq('active', true);

            // 2. Fetch Completed Bookings Count for Current Month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count: historyCount } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed')
                .gte('date', startOfMonth.toISOString());

            // 3. Fetch Bookings for Selected Date (Only Pending)
            const startRange = addDays(startOfDay(selectedDate), -1).toISOString();
            const endRange = addDays(endOfDay(selectedDate), 1).toISOString();
            const targetDateStr = format(selectedDate, 'yyyy-MM-dd');

            const { data: bookingsData, error: bookingsError } = await supabase
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
                .gte('date', startRange)
                .lte('date', endRange)
                // .or('status.eq.pending,status.is.null') // Moved to local filter for debugging stability
                .order('time');

            if (bookingsError) throw bookingsError;

            // Transform data and Filter locally
            const formattedBookings: Booking[] = (bookingsData || [])
                .map((b: any) => {
                    const dateStr = b.date.includes('T') ? b.date : `${b.date}T00:00:00`;
                    return {
                        id: b.id,
                        time: b.time,
                        date: b.date,
                        service_name: b.service_name,
                        price: b.price,
                        duration_minutes: b.duration_minutes || 30,
                        status: b.status || 'pending', // Default to pending if null
                        is_mensalista: b.is_mensalista,
                        client: {
                            name: b.clients?.name || 'Cliente Desconhecido',
                            phone: b.clients?.phone || '-'
                        },
                        _localDate: format(new Date(dateStr), 'yyyy-MM-dd')
                    };
                })
                .filter(b => b._localDate === targetDateStr && b.status !== 'cancelled');

            setBookings(formattedBookings);
            setStats({
                activeServices: servicesCount || 0,
                todayAppointments: formattedBookings.length,
                blockedSlots: 0,
                completedHistory: historyCount || 0
            });

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        }
    };

    const [modalOpen, setModalOpen] = useState(false);
    const [newBookingModalOpen, setNewBookingModalOpen] = useState(false);
    const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [daysWithBookings, setDaysWithBookings] = useState<string[]>([]); // Dates that have bookings

    const [now, setNow] = useState(new Date());

    // Update 'now' every minute to refresh "late" status visually
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // 1 min
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchDaysWithBookings();
    }, [selectedDate]); // Refresh when month changes (as selectedDate month changes)

    // New function to fetch dates that have bookings for the "dots" on DateStrip
    const fetchDaysWithBookings = async () => {
        try {
            const today = new Date();
            const startRange = subDays(today, 60); // Keep 60 days back
            const endRange = addDays(today, 365); // Expanded to 1 year ahead

            const { data, error } = await supabase
                .from('bookings')
                .select('date')
                .gte('date', startOfDay(startRange).toISOString()) // Changed to startRange
                .lte('date', endOfDay(endRange).toISOString())
                .neq('status', 'cancelled');

            if (error) throw error;

            const uniqueDates = new Set<string>();
            data?.forEach((b: any) => {
                const dateStr = b.date.includes('T') ? b.date.split('T')[0] : b.date;
                uniqueDates.add(dateStr);
            });

            setDaysWithBookings(Array.from(uniqueDates));
        } catch (error) {
            console.error('Erro ao buscar dias com agendamentos:', error);
        }
    };

    const isLate = (booking: Booking) => {
        // Robust check for "Today": Compare YYYY-MM-DD strings in local time
        const todayStr = format(now, 'yyyy-MM-dd');
        const bookingDateStr = booking.date.includes('T') ? booking.date.split('T')[0] : booking.date;

        // 1. If date is in the past, it's late (since we only show pending/confirmed here)
        if (bookingDateStr < todayStr) return true;

        // 2. If future date, not late
        if (bookingDateStr > todayStr) return false;

        // 3. If today, check time
        const [hours, minutes] = booking.time.split(':').map(Number);
        const bookingTime = new Date();
        bookingTime.setHours(hours, minutes, 0, 0);

        // Reduce tolerance to 0, so it alerts immediately after the minute passes
        const tolerance = 0;
        return now.getTime() > (bookingTime.getTime() + tolerance);
    };

    const openActionModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setModalOpen(true);
    };

    const handleAction = async (action: 'completed' | 'cancelled') => {
        if (!selectedBooking) return;

        try {
            // 1. Update status locally immediately for snappy feel
            setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: action } : b));
            setModalOpen(false);
            setSelectedBooking(null);

            // 2. Sync with server in background
            const { error } = await supabase
                .from('bookings')
                .update({ status: action })
                .eq('id', selectedBooking.id);

            if (error) throw error;

            // 3. Refresh derived stats
            await fetchDashboardData();
        } catch (error) {
            console.error(`Erro ao atualizar status para ${action}: `, error);
            alert('Erro ao atualizar status.');
        }
    };



    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const changeMonth = (months: number) => {
        setSelectedDate(prev => addMonths(prev, months));
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

    // Derived stats for UI
    const realizedRevenue = bookings.filter(b => b.status === 'completed').reduce((acc, curr) => acc + curr.price, 0);
    const realizedCount = bookings.filter(b => b.status === 'completed').length;

    // Helper for Cancellation Message (Barber cancelling)
    const getCancellationWhatsAppUrl = (phone: string, clientName: string, time: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
        const message = `Olá ${clientName}, aqui é da Impar Barbearia. Infelizmente precisaremos cancelar seu agendamento de hoje às ${time}. Pedimos desculpas pelo transtorno. Podemos remarcar?\n\nDigite *Agendar* para receber o link novamente.`;
        return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    };

    const confirmBarberCancellation = async () => {
        if (!selectedBooking) return;

        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', selectedBooking.id);

            if (error) throw error;

            // Remove from list or update status
            setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b));

            // Open WhatsApp with apology
            const waUrl = getCancellationWhatsAppUrl(selectedBooking.client.phone, selectedBooking.client.name, selectedBooking.time);
            window.open(waUrl, '_blank');

            setCancellationModalOpen(false);
            setSelectedBooking(null);

        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            alert('Erro ao cancelar agendamento.');
        }
    };



    const openCancellationModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setCancellationModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-muted/20 pb-10">
            <nav className="bg-background border-b sticky top-0 z-20 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="font-serif font-bold text-xl flex items-center gap-3">
                        <img src="/header_logo_v3.png" alt="Logo" className="h-10 w-auto object-contain" />
                        <span className="hidden sm:inline text-primary">Painel do Barbeiro</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <RecentBookings />
                        <button
                            onClick={handleLogout}
                            className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sair</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto p-4 sm:p-6 space-y-8">
                <div className="space-y-6">
                    {/* 1. Actions Row (Top) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                        <Link to="/admin/services" className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col justify-between hover:bg-muted/50 transition-colors group h-24">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <ScissorsIcon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">{stats.activeServices} ativos</span>
                            </div>
                            <p className="font-semibold text-sm">Serviços</p>
                        </Link>

                        <Link to="/admin/finance" className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col justify-between hover:bg-muted/50 transition-colors group h-24">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">Relatórios</span>
                            </div>
                            <p className="font-semibold text-sm">Financeiro</p>
                        </Link>

                        <Link to="/admin/history" className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col justify-between hover:bg-muted/50 transition-colors group h-24">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-muted rounded-lg text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <History className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">Mês atual</span>
                            </div>
                            <div className="flex items-baseline justify-between">
                                <p className="font-semibold text-sm">Histórico</p>
                                <p className="text-lg font-bold">{stats.completedHistory}</p>
                            </div>
                        </Link>

                        <Link to="/admin/schedule" className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col justify-between hover:bg-muted/50 transition-colors group h-24">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-red-100 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                    <Ban className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">Agenda</span>
                            </div>
                            <p className="font-semibold text-sm">Bloqueios</p>
                        </Link>
                    </div>

                    {/* 2. Today's Summary Card */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                            <ScissorsIcon className="w-48 h-48" />
                        </div>
                        <div className="relative p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                            <div>
                                <h3 className="text-amber-100 font-medium text-sm mb-0.5">Resumo do Dia</h3>
                                <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                                    <p className="text-2xl font-bold tracking-tight">
                                        {isSameDay(selectedDate, new Date()) ? 'Hoje' : format(selectedDate, "dd MMM", { locale: ptBR })}
                                    </p>
                                    <span className="text-amber-200 text-xs capitalize">
                                        {format(selectedDate, "EEEE", { locale: ptBR })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-right">
                                    <p className="text-amber-200 text-xs font-medium uppercase tracking-wider">Faturamento</p>
                                    <p className="text-2xl font-bold">R$ {realizedRevenue.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-amber-200 text-xs font-medium uppercase tracking-wider">Concluídos</p>
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-2xl font-bold">{realizedCount}</span>
                                        <ScissorsIcon className="w-4 h-4 text-amber-300" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Date Strip */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            Sua Agenda
                        </h2>
                        <div className="flex gap-2 bg-muted/30 p-1 rounded-full border">
                            <button onClick={() => changeMonth(-1)} className="p-1 px-2 hover:bg-background rounded-full transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="flex items-center text-sm font-bold capitalize min-w-[120px] justify-center">
                                {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
                            </span>
                            <button onClick={() => changeMonth(1)} className="p-1 px-2 hover:bg-background rounded-full transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} scheduledDates={daysWithBookings} />
                </div>

                {/* 4. Segmented Agenda Lists */}
                <div className="space-y-6">
                    {/* 4.1 Pending List */}
                    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                            <h2 className="font-bold uppercase tracking-tight text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-400" />
                                Agenda do Dia (Pendentes)
                            </h2>
                            <button
                                onClick={() => setNewBookingModalOpen(true)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-xs font-black transition-all shadow-lg"
                            >
                                NOVO AGENDAMENTO
                            </button>
                        </div>
                        <div className="divide-y">
                            {bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length > 0 ? (
                                bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').map(booking => {
                                    const late = isLate(booking);
                                    return (
                                        <div key={booking.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${late ? 'bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500' : 'hover:bg-muted/10'}`}>
                                            <div className="flex gap-4">
                                                <div className={`font-bold rounded-xl p-2 min-w-[5.5rem] text-center flex flex-col justify-center border ${late ? 'bg-amber-500/20 border-amber-500/30 text-amber-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                                                    <span className="text-lg leading-tight">{booking.time}</span>
                                                    <span className="text-[9px] opacity-70 border-t border-current/20 mt-1 pt-1 uppercase font-black">até {minutesToTime(timeToMinutes(booking.time) + (booking.duration_minutes || 30))}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 font-bold text-base">
                                                        {booking.client.name}
                                                        {booking.is_mensalista && (
                                                            <span className="text-[9px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-amber-500/10">
                                                                Mensalista
                                                            </span>
                                                        )}
                                                        {late && <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">Aguardando</span>}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-0.5 font-medium italic">
                                                        {booking.service_name} • R$ {booking.price.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 bg-muted/50 w-fit px-2 py-1 rounded-lg">
                                                        <Phone className="w-3 h-3" />
                                                        {booking.client.phone}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <a
                                                    href={getWhatsAppUrl(booking.client.phone, booking.client.name, booking.time, booking.service_name)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 border border-green-500/30 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500/20 transition-all"
                                                    title="WhatsApp"
                                                >
                                                    <MessageCircle className="w-5 h-5" />
                                                </a>
                                                <button
                                                    onClick={() => openCancellationModal(booking)}
                                                    className="p-2 border border-red-500/30 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                                                    title="Cancelar"
                                                >
                                                    <Ban className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => openActionModal(booking)}
                                                    className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground font-black text-sm rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    CONCLUIR
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="p-16 text-center text-muted-foreground bg-muted/5">
                                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-5 text-green-500" />
                                    <p className="font-bold text-lg">Nada pendente por aqui!</p>
                                    <p className="text-sm opacity-60">Todos os clientes foram atendidos ou não há horários.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4.2 Completed List */}
                    <div className="bg-card rounded-xl border border-dashed border-border shadow-inner overflow-hidden opacity-90 transition-all">
                        <div className="p-4 border-b bg-zinc-900/10 flex justify-between items-center">
                            <h2 className="font-black uppercase tracking-widest text-white/50 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500/50" />
                                Serviços Finalizados ({isSameDay(selectedDate, new Date()) ? 'HOJE' : format(selectedDate, "dd/MM")})
                            </h2>
                            <span className="text-[10px] font-black text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50 uppercase">
                                {bookings.filter(b => b.status === 'completed').length} Concluídos
                            </span>
                        </div>
                        <div className="divide-y divide-border/30">
                            {bookings.filter(b => b.status === 'completed').length > 0 ? (
                                bookings.filter(b => b.status === 'completed').map(booking => (
                                    <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors group">
                                        <div className="flex gap-4">
                                            <div className="bg-green-500/5 text-green-500/50 font-black rounded-xl p-2 min-w-[5rem] text-center border border-green-500/10 text-xs flex items-center justify-center">
                                                {booking.time}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 font-bold text-white/40 group-hover:text-white/60 transition-colors">
                                                    {booking.client.name}
                                                    <CheckCircle2 className="w-3 h-3 text-green-500/40" />
                                                </div>
                                                <div className="text-[11px] text-muted-foreground/60 italic font-medium">
                                                    {booking.service_name} • R$ {booking.price.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-green-500/50 font-black px-3 py-1 bg-green-500/5 rounded-lg border border-green-500/10 uppercase tracking-tighter">
                                            Pago & Finalizado
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-muted-foreground/30 text-xs italic font-medium letter-spacing-tight">
                                    Nenhum serviço finalizado ainda.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Action Modal (Completion/No-Show) */}
            {modalOpen && selectedBooking && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
                    <div className="bg-card border-2 border-primary/20 rounded-3xl shadow-2xl max-w-sm w-full p-8 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-white">Encerrar Atendimento</h3>
                            <p className="text-sm text-muted-foreground">
                                Confirme o que aconteceu com <span className="font-bold text-foreground">{selectedBooking.client.name}</span> às {selectedBooking.time}:
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => handleAction('completed')}
                                className="flex items-center justify-center gap-3 p-4 bg-green-600 text-white hover:bg-green-700 rounded-2xl font-black transition-all shadow-lg shadow-green-600/20 active:scale-95"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                ATENDIMENTO REALIZADO
                            </button>

                            <button
                                onClick={() => handleAction('cancelled')}
                                className="flex items-center justify-center gap-3 p-4 bg-red-600/10 text-red-500 border-2 border-red-500/20 hover:bg-red-600 hover:text-white rounded-2xl font-bold transition-all active:scale-95"
                            >
                                <Ban className="w-5 h-5 shrink-0" />
                                CLIENTE NÃO COMPARECEU
                            </button>
                        </div>

                        <button
                            onClick={() => setModalOpen(false)}
                            className="w-full p-2 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors"
                        >
                            Voltar (Fechar)
                        </button>
                    </div>
                </div>
            )}

            {/* Cancellation Modal (Barber Cancel) */}
            {cancellationModalOpen && selectedBooking && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
                    <div className="bg-card border-2 border-red-500/20 rounded-3xl shadow-2xl max-w-sm w-full p-8 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4">
                                <Ban className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-red-500">Cancelar Horário</h3>
                            <p className="text-sm text-muted-foreground">
                                Você está cancelando o horário de <span className="font-bold text-foreground">{selectedBooking.client.name}</span>.
                            </p>
                            <p className="text-xs text-muted-foreground/60 p-3 bg-muted/30 rounded-xl italic">
                                Ao confirmar, abriremos o WhatsApp com uma mensagem automática de cancelamento.
                            </p>
                        </div>

                        <button
                            onClick={confirmBarberCancellation}
                            className="flex items-center justify-center gap-3 w-full p-4 bg-red-600 text-white hover:bg-red-700 rounded-2xl font-black transition-all shadow-lg active:scale-95"
                        >
                            <MessageCircle className="w-5 h-5" />
                            CONFIRMAR E AVISAR
                        </button>

                        <button
                            onClick={() => setCancellationModalOpen(false)}
                            className="w-full p-2 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors"
                        >
                            Voltar
                        </button>
                    </div>
                </div>
            )}

            <NewBookingModal
                isOpen={newBookingModalOpen}
                onClose={() => setNewBookingModalOpen(false)}
                onSuccess={() => {
                    fetchDashboardData();
                    fetchDaysWithBookings();
                }}
                initialDate={selectedDate}
            />
        </div>
    );
}
