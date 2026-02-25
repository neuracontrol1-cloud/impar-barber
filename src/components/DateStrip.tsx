import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRef, useState, useEffect } from 'react';

interface DateStripProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    scheduledDates?: string[]; // Array of YYYY-MM-DD
}

export function DateStrip({ selectedDate, onSelectDate, scheduledDates = [] }: DateStripProps) {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
    const scrollRef = useRef<HTMLDivElement>(null);
    const dayRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    // Update current month when selectedDate changes (external control)
    useEffect(() => {
        if (!isSameMonth(selectedDate, currentMonth)) {
            setCurrentMonth(startOfMonth(selectedDate));
        }

        // Auto-scroll to center the selected date
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const element = dayRefs.current.get(dateStr);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [selectedDate]);

    // Generate days for the current month
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    return (
        <div className="w-full space-y-4">
            {/* Days Horizontal Scroll */}
            <div className="w-full overflow-x-auto pb-4 scrollbar-hide" ref={scrollRef}>
                <div className="flex gap-3 px-1 min-w-max justify-start md:justify-center">
                    {daysInMonth.map((date) => {
                        const isSelected = isSameDay(date, selectedDate);
                        const isToday = isSameDay(date, new Date());
                        const isSunday = date.getDay() === 0; // 0 = Sunday
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const hasBooking = scheduledDates.includes(dateStr);

                        return (
                            <button
                                key={date.toISOString()}
                                ref={(el) => {
                                    if (el) dayRefs.current.set(dateStr, el);
                                    else dayRefs.current.delete(dateStr);
                                }}
                                onClick={() => !isSunday && onSelectDate(date)}
                                disabled={isSunday}
                                className={`
                                    relative flex flex-col items-center justify-center 
                                    w-14 h-20 rounded-2xl transition-all duration-300
                                    border
                                    ${isSunday
                                        ? 'bg-muted/50 border-transparent opacity-50 cursor-not-allowed grayscale'
                                        : isSelected
                                            ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-105 z-10'
                                            : 'bg-card border-border text-muted-foreground hover:bg-accent/50 hover:border-primary/50'
                                    }
                                `}
                            >
                                <span className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-80">
                                    {format(date, 'EEE', { locale: ptBR }).replace('.', '')}
                                </span>
                                <span className={`text-xl font-bold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                                    {format(date, 'dd')}
                                </span>

                                {/* Today Indicator (Blue Dot) if not selected */}
                                {isToday && !isSelected && !isSunday && (
                                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500" title="Hoje" />
                                )}

                                {/* Has Booking Indicator (Green Dot) */}
                                {hasBooking && !isSelected && !isToday && !isSunday && (
                                    <span className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                                )}
                                {hasBooking && isSelected && (
                                    <span className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-green-200 shadow-sm" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
