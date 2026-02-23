
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
                className="relative p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground outline-none"
                title="Notificações"
            >
                <Bell className="w-5 h-5" />
                {newBookingsCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse border-2 border-background">
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
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Últimos Agendamentos</h3>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {bookings.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p>Nenhuma notificação.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
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
                                            className={`block p-3 hover:bg-muted/50 transition-colors cursor-pointer text-left ${isNew ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${isNew ? 'bg-blue-500' : 'bg-transparent'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {booking.client.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {booking.service_name}
                                                    </p>

                                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(dateObj, "dd/MM", { locale: ptBR })}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {booking.time}
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
                </div>
            )}
        </div>
    );
}
