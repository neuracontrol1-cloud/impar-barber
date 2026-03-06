
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Calendar, Bell } from 'lucide-react';


interface RecentBooking {
    id: string;
    created_at: string;
    date: string;
    time: string;
    service_name: string;
    status: string;
    client: {
        name: string;
        phone: string;
    };
}
import { BookingDetailsModal } from './BookingDetailsModal';

export function RecentBookings() {
    const [bookings, setBookings] = useState<RecentBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<RecentBooking | null>(null);

    useEffect(() => {
        fetchRecentBookings();

        // Real-time subscription for new bookings
        const subscription = supabase
            .channel('public:bookings')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => {
                fetchRecentBookings(); // Refresh list on new insert
            })
            .subscribe();

        // Close on click outside
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.notification-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            subscription.unsubscribe();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchRecentBookings = async () => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id, 
                    created_at, 
                    date, 
                    time, 
                    service_name, 
                    status,
                    clients (name, phone)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            const formatted: RecentBooking[] = (data || []).map((b: any) => ({
                id: b.id,
                created_at: b.created_at,
                date: b.date,
                time: b.time,
                service_name: b.service_name,
                status: b.status,
                client: {
                    name: b.clients?.name || 'Cliente',
                    phone: b.clients?.phone || ''
                }
            }));

            setBookings(formatted);
        } catch (error) {
            console.error('Error fetching recent bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const newBookingsCount = bookings.filter(b => differenceInHours(new Date(), new Date(b.created_at)) < 24).length;

    if (loading) return null;

    return (
        <div className="relative notification-container">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 hover:bg-secondary rounded-full transition-all text-muted-foreground hover:text-foreground outline-none border border-transparent hover:border-white/5 bg-white/5"
                title="Notificações"
            >
                <Bell className="w-5 h-5" />
                {newBookingsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center rounded-full border-2 border-background shadow-lg shadow-primary/20">
                        {newBookingsCount}
                    </span>
                )}
            </button>

            {/* Modal de Detalhes */}
            {selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}

            {/* Popover */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-3 w-[450px] bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xs uppercase tracking-[0.2em]">Fluxo Recente</h3>
                            {newBookingsCount > 0 && (
                                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                                    {newBookingsCount} Novos
                                </span>
                            )}
                        </div>
                        <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">
                            Limpar Tudo
                        </button>
                    </div>

                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                        {bookings.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-6 h-6 opacity-20" />
                                </div>
                                <p className="text-sm font-medium">Sem novas atividades.</p>
                                <p className="text-xs opacity-50 mt-1">Acompanhe seus últimos agendamentos aqui.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {bookings.map((booking) => {
                                    const isNew = differenceInHours(new Date(), new Date(booking.created_at)) < 24;
                                    const dateStr = booking.date.includes('T') ? booking.date : `${booking.date}T00:00:00`;
                                    const dateObj = new Date(dateStr);

                                    return (
                                        <div
                                            key={booking.id}
                                            onClick={() => {
                                                setSelectedBooking(booking);
                                                setIsOpen(false);
                                            }}
                                            className={`group block p-4 hover:bg-white/[0.02] transition-all cursor-pointer text-left relative overflow-hidden ${isNew ? 'bg-primary/5' : ''}`}
                                        >
                                            {isNew && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary shadow-lg shadow-primary/50" />}

                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                                                    <Calendar className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                                                            {booking.client.name}
                                                        </p>
                                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-white/10 bg-white/5 text-muted-foreground">
                                                            {booking.status === 'completed' ? 'Finalizado' : 'Confirmado'}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                                        Solicitou: <span className="text-white font-medium">{booking.service_name}</span>
                                                    </p>

                                                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-primary/50" />
                                                            {format(dateObj, "dd 'de' MMMM", { locale: ptBR })}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                                                            <Clock className="w-3.5 h-3.5 text-primary/50" />
                                                            ÀS {booking.time}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-white/5 bg-white/5 text-center">
                        <button className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
                            Ver Histórico Completo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
