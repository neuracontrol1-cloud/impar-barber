import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, PieChart } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ServiceStat {
    name: string;
    count: number;
    revenue: number;
}

interface FinancialStats {
    totalRevenue: number;
    totalAppointments: number;
    averageTicket: number;
}

export function AdminFinance() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [stats, setStats] = useState<FinancialStats>({
        totalRevenue: 0,
        totalAppointments: 0,
        averageTicket: 0
    });
    const [serviceData, setServiceData] = useState<ServiceStat[]>([]);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) navigate('/');
            setLoading(false);
        };
        checkUser();
    }, []);

    useEffect(() => {
        fetchFinancialData();
    }, [selectedMonth]);

    const fetchFinancialData = async () => {
        try {
            const start = startOfMonth(selectedMonth).toISOString();
            const end = endOfMonth(selectedMonth).toISOString();

            const { data, error } = await supabase
                .from('bookings')
                .select('price, service_name')
                .eq('status', 'completed')
                .gte('date', start)
                .lte('date', end);

            if (error) throw error;

            if (!data) return;

            // Calculate KPIs
            const totalRevenue = data.reduce((acc, curr) => acc + curr.price, 0);
            const totalAppointments = data.length;
            const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

            setStats({
                totalRevenue,
                totalAppointments,
                averageTicket
            });

            // 1. Fetch all active services to ensure they all appear in the chart
            const { data: services, error: servicesError } = await supabase
                .from('services')
                .select('name')
                .eq('active', true);

            if (servicesError) throw servicesError;

            // 2. Initialize Map with all services
            const serviceMap = new Map<string, { count: number; revenue: number }>();
            services?.forEach(service => {
                serviceMap.set(service.name, { count: 0, revenue: 0 });
            });

            // 3. Process Bookings
            data.forEach(booking => {
                // Split combined services (e.g. "Corte + Barba")
                const serviceNames = booking.service_name.split('+').map((s: string) => s.trim());
                const pricePerService = booking.price / serviceNames.length;

                serviceNames.forEach((serviceName: string) => {
                    // Update if exists (it should, but handle custom/legacy cases if needed)
                    if (serviceMap.has(serviceName)) {
                        const current = serviceMap.get(serviceName)!;
                        serviceMap.set(serviceName, {
                            count: current.count + 1,
                            revenue: current.revenue + pricePerService
                        });
                    } else {
                        // If for some reason a service name in booking doesn't match active services, add it
                        const current = serviceMap.get(serviceName) || { count: 0, revenue: 0 };
                        serviceMap.set(serviceName, {
                            count: current.count + 1,
                            revenue: current.revenue + pricePerService
                        });
                    }
                });
            });

            const processedData = Array.from(serviceMap.entries())
                .map(([name, stat]) => ({
                    name,
                    count: stat.count,
                    revenue: stat.revenue
                }))
                .sort((a, b) => b.count - a.count); // Sort by popularity

            setServiceData(processedData);

        } catch (error) {
            console.error('Erro ao buscar dados financeiros:', error);
        }
    };

    const changeMonth = (increment: number) => {
        setSelectedMonth(prev => addMonths(prev, increment));
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

    // Custom colors for the chart - Gold/Bronze Palette
    const COLORS = ['#b45309', '#d97706', '#92400e', '#78350f', '#451a03'];

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
                            <h1 className="text-3xl font-serif font-bold text-foreground">
                                Relatório Financeiro
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">Acompanhe o desempenho do seu negócio</p>
                        </div>
                    </div>

                    {/* Month Selector */}
                    <div className="flex items-center bg-background rounded-full border shadow-sm p-1 px-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <span className="mx-6 font-medium capitalize min-w-[140px] text-center text-foreground font-serif text-lg">
                            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Faturamento */}
                    <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mensal</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Faturamento Total</p>
                            <h3 className="text-4xl font-serif font-bold text-foreground">
                                R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>

                    {/* Atendimentos */}
                    <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Volume</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Atendimentos Realizados</p>
                            <h3 className="text-4xl font-serif font-bold text-foreground">
                                {stats.totalAppointments}
                            </h3>
                        </div>
                    </div>

                    {/* Ticket Médio */}
                    <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Média</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Ticket Médio</p>
                            <h3 className="text-4xl font-serif font-bold text-foreground">
                                R$ {stats.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Services Bar Chart */}
                    <div className="bg-card p-8 rounded-xl border border-border/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <PieChart className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-foreground">
                                Desempenho por Serviço
                            </h3>
                        </div>

                        <div className="h-[400px] w-full">
                            {serviceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={serviceData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                padding: '12px 16px',
                                                fontFamily: 'var(--font-sans)'
                                            }}
                                            itemStyle={{ color: '#111827', fontWeight: 600 }}
                                            formatter={(value: any) => [`${value} atendimentos`, 'Quantidade']}
                                        />
                                        <Bar dataKey="count" name="Quantidade" radius={[8, 8, 0, 0]} maxBarSize={60}>
                                            {serviceData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                    <PieChart className="w-12 h-12 opacity-20 mb-4" />
                                    <p>Nenhum dado registrado para este mês.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
