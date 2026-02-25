
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Search, CheckCircle2, Ban, Clock, Scissors as ScissorsIcon, MessageCircle } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Booking } from '../types';

export function AdminOverview() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

    useEffect(() => {
        checkUser();
        fetchBookings();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) navigate('/');
    };

    const fetchBookings = async () => {
        setLoading(true);
        try {
            // Fetch all future bookings (including today)
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id, 
                    date, 
                    time, 
                    service_name, 
                    price, 
                    duration_minutes,
                    status, 
                    client_id,
                    clients (name, phone, email)
                `)
                .gte('date', today)
                .order('date', { ascending: true })
                .order('time', { ascending: true });

            if (error) throw error;

            const formatted: Booking[] = (data || []).map((b: any) => ({
                id: b.id,
                date: b.date,
                time: b.time,
                service_name: b.service_name,
                price: b.price,
                duration_minutes: b.duration_minutes || 30,
                status: b.status || 'pending',
                client: {
                    name: b.clients?.name || 'Cliente',
                    phone: b.clients?.phone || '',
                    email: b.clients?.email || ''
                }
            }));

            setBookings(formatted);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: 'completed' | 'cancelled') => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setBookings(prev => prev.map(b =>
                b.id === id ? { ...b, status: newStatus } : b
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status');
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = booking.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (booking.client.phone && booking.client.phone.includes(searchTerm));

        // Show all active (non-cancelled) for "all" view, or specific status match
        if (filterStatus === 'all') return matchesSearch && booking.status !== 'cancelled';

        return matchesSearch && booking.status === filterStatus;
    });

    return (
        <div className="min-h-screen bg-muted/20 p-6 font-sans">
            <div className="container mx-auto max-w-5xl space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
                    <div className="flex items-center gap-4">
                        <Link to="/admin" className="p-2 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-foreground">Visão Geral</h1>
                            <p className="text-sm text-muted-foreground mt-1">Todos os agendamentos futuros em uma única lista.</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou telefone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === 'all'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background border hover:bg-muted text-muted-foreground'
                                }`}
                        >
                            Todos (Ativos)
                        </button>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === 'pending'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-background border hover:bg-muted text-muted-foreground'
                                }`}
                        >
                            Pendentes
                        </button>
                        <button
                            onClick={() => setFilterStatus('completed')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === 'completed'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-background border hover:bg-muted text-muted-foreground'
                                }`}
                        >
                            Concluídos
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground">Carregando agenda...</div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Nenhum agendamento encontrado.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredBookings.map((booking) => {
                                // Safe date parsing
                                const dateStr = booking.date.includes('T') ? booking.date : `${booking.date}T00:00:00`;
                                const dateObj = new Date(dateStr);
                                const isBookingToday = isToday(dateObj);

                                return (
                                    <div key={booking.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            {/* Date Box */}
                                            <div className={`p-3 rounded-lg text-center min-w-[70px] ${isBookingToday ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                <span className="block text-xs font-bold uppercase">{format(dateObj, 'MMM', { locale: ptBR })}</span>
                                                <span className="block text-xl font-bold">{format(dateObj, 'dd')}</span>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-foreground text-lg">{booking.client.name}</h3>
                                                    {booking.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                                    {booking.status === 'cancelled' && <Ban className="w-4 h-4 text-red-600" />}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{booking.time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <ScissorsIcon className="w-3.5 h-3.5" />
                                                        <span>{booking.service_name}</span>
                                                    </div>
                                                    {booking.client.phone && (
                                                        <a
                                                            href={`https://wa.me/55${booking.client.phone.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-green-600 hover:underline"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                            {booking.client.phone}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {booking.status === 'pending' && (
                                            <div className="flex items-center gap-2 self-end md:self-auto">
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Cancelar este agendamento?')) updateStatus(booking.id, 'cancelled');
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(booking.id, 'completed')}
                                                    className="px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm transition-colors flex items-center gap-1"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Concluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
