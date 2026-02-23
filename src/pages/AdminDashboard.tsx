import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Scissors as ScissorsIcon, ChevronLeft, ChevronRight, User, Phone, MessageCircle, CheckCircle2, History, Ban, TrendingUp } from 'lucide-react';
import { format, addDays, isSameDay, endOfDay, startOfDay, subDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Booking } from '../types';
import { RecentBookings } from '../components/RecentBookings';
import { ThemeToggle } from '../components/ThemeToggle';
import { DateStrip } from '../components/DateStrip';

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
                    status,
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
                        status: b.status || 'pending', // Default to pending if null
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
    }, []);

    // New function to fetch dates that have bookings for the "dots" on DateStrip
    const fetchDaysWithBookings = async () => {
        try {
            const today = new Date();
            const startRange = subDays(today, 60); // Look back 60 days
            const endRange = addDays(today, 60); // Look ahead 60 days

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
            const { error } = await supabase
                .from('bookings')
                .update({ status: action })
                .eq('id', selectedBooking.id);

            if (error) throw error;

            // Update status locally instead of removing
            setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: action } : b));
            setModalOpen(false);
            setSelectedBooking(null);

            // Optional: Show success feedback (toast would be better, but alert for now is consistent)
            // alert(`Agendamento ${ action === 'completed' ? 'concluído' : 'cancelado'}!`); 
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
        <div className="min-h-screen bg-muted/20">
            <nav className="bg-background border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="font-serif font-bold text-xl flex items-center gap-3">
                    <img src="/shop_interior.png" alt="Logo" className="w-10 h-10 object-cover rounded-full border border-primary/30" />
                    <span className="hidden sm:inline text-primary">Painel do Barbeiro</span>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <RecentBookings />
                    <button
                        onClick={handleLogout}
                        className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Sair</span>
                    </button>
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

                    {/* 2. Today's Summary Card (Compact) */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-xl dark:shadow-amber-900/20">
                        {/* Background Pattern */}
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                            <ScissorsIcon className="w-48 h-48" />
                        </div>

                        <div className="relative p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-amber-100 font-medium text-sm mb-0.5">Resumo do Dia</h3>
                                <div className="flex items-baseline gap-2">
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
                                    <p className="text-2xl font-bold">
                                        R$ {realizedRevenue.toFixed(2)}
                                    </p>
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
                    <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} scheduledDates={daysWithBookings} />
                </div>

                {/* Bookings List */}
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                        <h2 className="font-bold">Agenda do Dia (Pendentes)</h2>
                        <button className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full">
                            Novo Agendamento
                        </button>
                    </div>

                    <div className="divide-y">
                        {bookings.length > 0 ? (
                            bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').map(booking => {
                                const late = isLate(booking);
                                return (
                                    <div key={booking.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${late ? 'bg-amber-50 hover:bg-amber-100/80 border-l-4 border-l-amber-500 dark:bg-amber-950/30 dark:hover:bg-amber-900/40' : 'hover:bg-muted/10'}`}>
                                        <div className="flex gap-4">
                                            <div className={`font-bold rounded-lg p-3 min-w-[4rem] text-center flex flex-col justify-center ${late ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' : 'bg-primary/10 text-primary'}`}>
                                                <span className="text-lg">{booking.time}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 font-medium">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    {booking.client.name}
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
        </div >
    );
}

