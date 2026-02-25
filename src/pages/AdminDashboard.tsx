import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Scissors as ScissorsIcon, ChevronLeft, ChevronRight, User, Phone, MessageCircle, CheckCircle2, History, Ban, TrendingUp } from 'lucide-react';
import { format, addDays, subDays, startOfMonth, addMonths, isSameDay } from 'date-fns';
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

            // 2. Fetch Completed Bookings Count for Current Month (Standardized)
            const today = new Date();
            const startMonth = format(startOfMonth(today), 'yyyy-MM-dd');

            const { count: historyCount } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed')
                .gte('date', startMonth);

            // 3. Fetch Bookings for Selected Date (Fetching ALL statuses to calculate stats correctly)
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
                .eq('date', targetDateStr)
                .order('time');

            if (bookingsError) throw bookingsError;

            // Transform data (local formatting and status safety)
            const formattedBookings: Booking[] = (bookingsData || [])
                .map((b: any) => {
                    return {
                        id: b.id,
                        time: b.time,
                        date: b.date,
                        service_name: b.service_name,
                        price: b.price,
                        duration_minutes: b.duration_minutes || 30,
                        status: b.status || 'pending',
                        is_mensalista: b.is_mensalista,
                        client: {
                            name: b.clients?.name || 'Cliente Desconhecido',
                            phone: b.clients?.phone || '-'
                        },
                        _localDate: b.date // Already AAAA-MM-DD from fetch
                    };
                });

            setBookings(formattedBookings);

            // Calculate Today's Stats from the full list

            setStats({
                activeServices: servicesCount || 0,
                todayAppointments: formattedBookings.filter(b => b.status !== 'cancelled').length,
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
    const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({}); // Date (YYYY-MM-DD) -> Count

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
                .gte('date', format(startRange, 'yyyy-MM-dd'))
                .lte('date', format(endRange, 'yyyy-MM-dd'))
                .not('status', 'in', '("cancelled", "completed")');

            if (error) throw error;

            const counts: Record<string, number> = {};
            data?.forEach((b: any) => {
                const dateStr = b.date.includes('T') ? b.date.split('T')[0] : b.date;
                counts[dateStr] = (counts[dateStr] || 0) + 1;
            });

            setBookingCounts(counts);
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

        const bookingId = selectedBooking.id;
        const originalBookings = [...bookings];

        try {
            // 1. Optimistic UI Update (Immediate feedback)
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: action } : b));
            setModalOpen(false);
            setSelectedBooking(null);

            // 2. Database Update
            const { data, error, status } = await supabase
                .from('bookings')
                .update({ status: action })
                .eq('id', bookingId)
                .select(); // Ask for data back to confirm update worked

            console.log(`Update ${action} status:`, status, data);

            if (error) throw error;

            // Se o update retornou sucesso mas a data está vazia, o RLS bloqueou a alteração silenciosamente
            if (status === 200 || status === 204) {
                if (!data || data.length === 0) {
                    setBookings(originalBookings);
                    alert("⚠️ O banco de dados não permitiu a alteração. Certifique-se de executar os comandos SQL no Supabase para liberar as permissões (RLS).");
                    return;
                }
            }

            // 3. Re-fetch in background to sync stats (Revenue, History Count, etc.)
            await fetchDashboardData();

        } catch (error) {
            console.error(`Erro ao atualizar status para ${action}: `, error);
            // Rollback on error
            setBookings(originalBookings);
            alert('Erro ao atualizar status. Tente novamente.');
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
    const getCancellationWhatsAppUrl = (phone: string, clientName: string, time: string, dateStr: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

        // Logical check for "Today" vs "Future Date"
        const dateObj = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
        const isToday = isSameDay(dateObj, new Date());
        const dateFormatted = isToday ? 'hoje' : `do dia ${format(dateObj, "dd/MM", { locale: ptBR })}`;

        const message = `Olá ${clientName}, aqui é da Impar Barbearia. Infelizmente precisaremos cancelar seu agendamento ${dateFormatted} às ${time}. Pedimos desculpas pelo transtorno. Podemos remarcar?\n\nDigite *Agendar* para receber o link novamente.`;
        return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    };

    const confirmBarberCancellation = async () => {
        if (!selectedBooking) return;

        const bookingId = selectedBooking.id;
        const originalBookings = [...bookings];

        try {
            // Optimistic Update
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
            setModalOpen(false);
            setCancellationModalOpen(false);

            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId);

            if (error) throw error;

            // Open WhatsApp with apology
            const waUrl = getCancellationWhatsAppUrl(selectedBooking.client.phone, selectedBooking.client.name, selectedBooking.time, selectedBooking.date);
            window.open(waUrl, '_blank');

            setSelectedBooking(null);
            fetchDashboardData();

        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            setBookings(originalBookings);
            alert('Erro ao cancelar agendamento.');
        }
    };



    const openCancellationModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setCancellationModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-muted/20">
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
                        {/* Services */}
                        <Link to="/admin/services" className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col justify-between hover:bg-muted/50 transition-colors group h-24">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <ScissorsIcon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">{stats.activeServices} ativos</span>
                            </div>
                            <p className="font-semibold text-sm">Serviços</p>
                        </Link>

                        {/* Finance */}
                        <Link to="/admin/finance" className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col justify-between hover:bg-muted/50 transition-colors group h-24">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">Relatórios</span>
                            </div>
                            <p className="font-semibold text-sm">Financeiro</p>
                        </Link>

                        {/* History */}
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

                        {/* Blocking */}
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

                    {/* 2. Today's Summary Card (Compact, Premium & Vibrant) */}
                    <div className="relative overflow-hidden rounded-3xl bg-[#1a1a1a] text-white shadow-2xl border border-white/10 dark:shadow-black/50 group">
                        {/* Premium Glow Effect */}
                        <div className="absolute -inset-2 bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all duration-500" />

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-4 opacity-[0.05] transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
                            <ScissorsIcon className="w-48 h-48" />
                        </div>

                        {/* Subtle Primary Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-40" />
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full" />

                        <div className="relative p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.3em] mb-1.5 opacity-60">Resumo do Dia</h3>
                                <div className="flex items-baseline gap-4">
                                    <p className="text-4xl font-black tracking-tighter bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                                        {isSameDay(selectedDate, new Date()) ? 'HOJE' : format(selectedDate, "dd MMM", { locale: ptBR }).toUpperCase()}
                                    </p>
                                    <div className="flex flex-col border-l border-white/10 pl-4 py-1">
                                        <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">
                                            {format(selectedDate, "EEEE", { locale: ptBR })}
                                        </span>
                                        <span className="text-white/30 text-[9px] font-medium uppercase tracking-widest leading-none">
                                            {format(selectedDate, "yyyy")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-12 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-primary/50 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Faturamento</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-white/40 text-[10px] font-bold">R$</span>
                                        <p className="text-3xl font-black text-white">
                                            {realizedRevenue.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-primary/50 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Serviços</span>
                                    <div className="flex items-center justify-end gap-3">
                                        <span className="text-3xl font-black text-white">{realizedCount}</span>
                                        <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 transform group-hover:rotate-12 transition-transform duration-500">
                                            <ScissorsIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Date Strip */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Sua Agenda</h2>
                        <div className="flex gap-2">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-muted rounded-full">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="flex items-center text-sm font-medium capitalize min-w-[120px] justify-center">
                                {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
                            </span>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-muted rounded-full">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} bookingCounts={bookingCounts} />
                </div>

                {/* Bookings List - Pending */}
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                        <h2 className="font-bold uppercase tracking-tight text-white flex items-center gap-2">
                            <History className="w-4 h-4 text-primary" />
                            Agenda do Dia (Pendentes)
                        </h2>
                        <button
                            onClick={() => setNewBookingModalOpen(true)}
                            className="text-xs font-bold uppercase tracking-widest bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Novo Agendamento
                        </button>
                    </div>

                    <div className="divide-y">
                        {bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length > 0 ? (
                            bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').map(booking => {
                                const late = isLate(booking);
                                return (
                                    <div key={booking.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${late ? 'bg-amber-50 hover:bg-amber-100/80 border-l-4 border-l-amber-500 dark:bg-amber-950/30 dark:hover:bg-amber-900/40' : 'hover:bg-muted/10'}`}>
                                        <div className="flex gap-4">
                                            <div className={`font-bold rounded-lg p-2 min-w-[5rem] text-center flex flex-col justify-center ${late ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' : 'bg-primary/10 text-primary'}`}>
                                                <span className="text-lg leading-tight">{booking.time}</span>
                                                <span className="text-[10px] opacity-70 border-t border-current/20 mt-1 pt-1 font-medium">até {minutesToTime(timeToMinutes(booking.time) + (booking.duration_minutes || 30))}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 font-medium">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    {booking.client.name}
                                                    {booking.is_mensalista && (
                                                        <span className="text-[10px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-amber-500/10">
                                                            Mensalista
                                                        </span>
                                                    )}
                                                    {late && <span className="text-[10px] bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Aguardando Conclusão</span>}
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
                                        <div className="flex gap-2">
                                            <a
                                                href={getWhatsAppUrl(booking.client.phone, booking.client.name, booking.time, booking.service_name)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs border border-green-200 bg-green-50 text-green-700 px-3 py-1.5 rounded-md hover:bg-green-100 flex items-center gap-1"
                                                title="Enviar WhatsApp"
                                            >
                                                <MessageCircle className="w-3 h-3" />
                                                <span className="hidden sm:inline">WhatsApp</span>
                                            </a>
                                            <button
                                                onClick={() => openCancellationModal(booking)}
                                                className="text-xs border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors"
                                                title="Cancelar Agendamento"
                                            >
                                                <Ban className="w-3 h-3" />
                                                <span className="hidden sm:inline">Cancelar</span>
                                            </button>
                                            <button
                                                onClick={() => openActionModal(booking)}
                                                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 flex items-center gap-1"
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                                Concluir
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="p-12 text-center text-muted-foreground">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20 text-green-500" />
                                <p>Nenhum agendamento pendente para este dia!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bookings List - Completed Today (Discreet section) */}
                {bookings.filter(b => b.status === 'completed').length > 0 && (
                    <div className="bg-card/50 rounded-xl border border-dashed shadow-sm overflow-hidden mt-6">
                        <div className="p-3 border-b bg-muted/10 flex justify-between items-center">
                            <h2 className="font-bold uppercase tracking-tight text-white/50 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-green-500/50" />
                                Recentemente Concluídos
                            </h2>
                        </div>
                        <div className="divide-y divide-border/20">
                            {bookings.filter(b => b.status === 'completed').map(booking => (
                                <div key={booking.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-60">
                                    <div className="flex gap-4">
                                        <div className="font-bold rounded-lg p-1.5 min-w-[4rem] text-center flex flex-col justify-center bg-muted/20 text-muted-foreground text-sm">
                                            {booking.time}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 font-medium text-sm">
                                                {booking.client.name}
                                                <CheckCircle2 className="w-3 h-3 text-green-500/50" />
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                {booking.service_name} • R$ {booking.price.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-green-500/50 uppercase tracking-widest bg-green-500/5 px-2 py-1 rounded border border-green-500/10">
                                        Finalizado
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main >

            {/* Action Modal (Completion/No-Show) */}
            {
                modalOpen && selectedBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <div className="bg-card border rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="text-center">
                                <h3 className="text-lg font-bold">Encerrar Atendimento</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    O que aconteceu com o agendamento de <span className="font-medium text-foreground">{selectedBooking.client.name}</span> às {selectedBooking.time}?
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => handleAction('completed')}
                                    className="flex items-center justify-center gap-2 p-3 bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 rounded-lg font-medium transition-colors shadow-sm"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Atendimento Realizado
                                </button>

                                <button
                                    onClick={() => handleAction('cancelled')}
                                    className="flex items-center justify-center gap-2 p-3 bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 rounded-lg font-medium transition-colors shadow-sm"
                                >
                                    <LogOut className="w-5 h-5 rotate-180" /> {/* Using LogOut as 'Exit/Cancel' icon */}
                                    Cliente Não Compareceu
                                </button>
                            </div>

                            <button
                                onClick={() => setModalOpen(false)}
                                className="w-full p-2 text-sm text-muted-foreground hover:bg-muted rounded-lg"
                            >
                                Cancelar (Fechar)
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Cancellation Modal (Barber Cancel) */}
            {
                cancellationModalOpen && selectedBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <div className="bg-card border-2 border-red-100 dark:border-red-900/50 rounded-xl shadow-lg max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="text-center">
                                <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
                                    <Ban className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Cancelar Agendamento?</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Você está prestes a cancelar o horário de <span className="font-medium text-foreground">{selectedBooking.client.name}</span>.
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Ao confirmar, o WhatsApp será aberto com uma mensagem de desculpas para o cliente.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={confirmBarberCancellation}
                                    className="flex items-center justify-center gap-2 p-3 bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 rounded-lg font-medium transition-colors shadow-sm"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    Confirmar e Avisar Cliente
                                </button>
                            </div>

                            <button
                                onClick={() => setCancellationModalOpen(false)}
                                className="w-full p-2 text-sm text-muted-foreground hover:bg-muted rounded-lg"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                )
            }

            <NewBookingModal
                isOpen={newBookingModalOpen}
                onClose={() => setNewBookingModalOpen(false)}
                onSuccess={() => {
                    fetchDashboardData();
                    fetchDaysWithBookings();
                }}
                initialDate={selectedDate}
            />
        </div >
    );
}
