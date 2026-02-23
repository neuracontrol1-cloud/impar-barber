import { useEffect, useState } from 'react';
import { supabase, blockTimes } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00'
];

export function AdminSchedule() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Date Selection State
    const [blockingDate, setBlockingDate] = useState<Date>(new Date());
    const [showCalendar, setShowCalendar] = useState(false);

    // Blocking State
    const [selectedBlockTimes, setSelectedBlockTimes] = useState<string[]>([]);
    const [isRecurrent, setIsRecurrent] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) navigate('/');
            setLoading(false);
        };
        checkUser();
    }, []);

    const toggleBlockTime = (time: string) => {
        setSelectedBlockTimes(prev =>
            prev.includes(time)
                ? prev.filter(t => t !== time)
                : [...prev, time]
        );
    };

    const handleBlock = async () => {
        if (selectedBlockTimes.length === 0) return;

        setIsBlocking(true);
        try {
            const datesToBlock = [];

            if (isRecurrent) {
                // Generate dates for next 90 days
                for (let i = 0; i < 90; i++) {
                    const date = addDays(blockingDate, i);
                    datesToBlock.push(date);
                }
            } else {
                datesToBlock.push(blockingDate);
            }

            await blockTimes(datesToBlock, selectedBlockTimes);

            alert('Horários bloqueados com sucesso!');
            setSelectedBlockTimes([]);
        } catch (error: any) {
            console.error('Erro ao bloquear horários:', error);
            alert(`Erro ao bloquear horários: ${error.message || error.details || 'Erro desconhecido'}`);
        } finally {
            setIsBlocking(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

    return (
        <div className="min-h-screen bg-muted/20 p-6">
            <div className="container mx-auto max-w-4xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin" className="p-2 hover:bg-background rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Ban className="w-6 h-6 text-red-600" />
                            Bloqueio de Horários
                        </h1>
                    </div>

                    {/* Date Filter & Picker */}
                    <div className="relative flex items-center gap-2 bg-background p-1 rounded-lg border shadow-sm">
                        <button onClick={() => setBlockingDate(prev => addDays(prev, -1))} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowCalendar(!showCalendar)}
                                className="font-medium min-w-[160px] text-center capitalize hover:bg-muted px-2 py-1 rounded-md transition-colors flex items-center justify-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                {format(blockingDate, "EEE, dd 'de' MMMM", { locale: ptBR })}
                            </button>

                            {showCalendar && (
                                <div className="absolute top-full right-0 mt-2 bg-card border rounded-xl shadow-xl z-20 p-2">
                                    <DayPicker
                                        mode="single"
                                        selected={blockingDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                setBlockingDate(date);
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

                        <button onClick={() => setBlockingDate(prev => addDays(prev, 1))} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {showCalendar && (
                    <div className="fixed inset-0 z-10" onClick={() => setShowCalendar(false)} />
                )}

                <div className="bg-card p-6 rounded-xl border shadow-sm">
                    <div className="space-y-6">
                        {/* Time Slots Grid */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-lg">Selecione os horários para bloquear</h3>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => setSelectedBlockTimes(TIME_SLOTS)}
                                        className="text-sm text-primary hover:underline font-medium"
                                    >
                                        Selecionar Todos
                                    </button>
                                    <span className="text-muted-foreground">|</span>
                                    <button
                                        onClick={() => setSelectedBlockTimes([])}
                                        className="text-sm text-primary hover:underline font-medium"
                                    >
                                        Limpar Seleção
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                {TIME_SLOTS.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => toggleBlockTime(time)}
                                        className={`px-2 py-3 rounded-lg text-sm font-bold transition-all border ${selectedBlockTimes.includes(time)
                                            ? 'bg-red-500 border-red-600 text-white shadow-md transform scale-105'
                                            : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                            }`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t">
                            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none bg-muted/30 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors w-full sm:w-auto border">
                                <input
                                    type="checkbox"
                                    checked={isRecurrent}
                                    onChange={(e) => setIsRecurrent(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium">Repetir diariamente</span>
                                    <span className="text-xs text-muted-foreground">Replica o bloqueio pelos próximos 90 dias</span>
                                </div>
                            </label>

                            <button
                                onClick={handleBlock}
                                disabled={selectedBlockTimes.length === 0 || isBlocking}
                                className="w-full sm:w-auto bg-red-600 text-white px-8 py-3 rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                            >
                                {isBlocking ? 'Processando...' : (
                                    <>
                                        <Ban className="w-5 h-5" />
                                        Confirmar Bloqueio {selectedBlockTimes.length > 0 ? `(${selectedBlockTimes.length})` : ''}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
