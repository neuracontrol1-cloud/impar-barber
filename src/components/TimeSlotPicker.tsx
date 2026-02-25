import { cn } from "../lib/utils";

interface TimeSlotPickerProps {
    selectedTime: string | null;
    onTimeSelect: (time: string | null) => void;
    existingBookings?: { time: string; duration_minutes: number }[];
    date?: Date;
    totalDuration: number;
}

const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Generate time slots from 09:00 to 19:00 with 15 mins intervals 
// Including the break (usually 12:00 to 13:00)
const generateTimeSlots = () => {
    const slots = [];
    // Morning: 09:00 - 12:00
    for (let m = 9 * 60; m < 12 * 60; m += 15) slots.push(minutesToTime(m));
    // Afternoon/Evening: 13:00 - 19:00
    for (let m = 13 * 60; m <= 19 * 60; m += 15) slots.push(minutesToTime(m));
    return slots;
};

const timeSlots = generateTimeSlots();

export function TimeSlotPicker({ selectedTime, onTimeSelect, existingBookings = [], date, totalDuration }: TimeSlotPickerProps) {
    const isPast = (time: string) => {
        if (!date) return false;
        const now = new Date();
        const isToday =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (!isToday) return false;

        const [hours, minutes] = time.split(':').map(Number);
        const slotDate = new Date();
        slotDate.setHours(hours, minutes, 0, 0);

        return slotDate < now;
    };

    const isWithinWorkHours = (start: number, end: number) => {
        const morningEnd = 12 * 60;
        const afternoonStart = 13 * 60;
        const afternoonEnd = 19 * 60 + 30; // End of day

        // If it starts in the morning, it must end by 12:00
        if (start < morningEnd) {
            return end <= morningEnd;
        }
        // If it starts in the afternoon, it must end by 19:30
        if (start >= afternoonStart) {
            return end <= afternoonEnd;
        }
        return false;
    };

    const availableSlots = timeSlots.filter(time => {
        if (isPast(time)) return false;

        const slotStart = timeToMinutes(time);
        const slotEnd = slotStart + totalDuration;

        // 1. Check if it fits within work hours (morning or afternoon block)
        if (!isWithinWorkHours(slotStart, slotEnd)) return false;

        // 2. Check for collision with any existing booking
        const hasCollision = existingBookings.some(b => {
            const bStart = timeToMinutes(b.time);
            const bEnd = bStart + b.duration_minutes;
            return Math.max(slotStart, bStart) < Math.min(slotEnd, bEnd);
        });

        return !hasCollision;
    });

    const periods = [
        { name: 'Manhã', slots: availableSlots.filter(t => timeToMinutes(t) < 12 * 60) },
        { name: 'Tarde', slots: availableSlots.filter(t => timeToMinutes(t) >= 12 * 60 && timeToMinutes(t) < 18 * 60) },
        { name: 'Noite', slots: availableSlots.filter(t => timeToMinutes(t) >= 18 * 60) },
    ].filter(p => p.slots.length > 0);

    if (availableSlots.length === 0) {
        return (
            <div className="text-center p-6 border border-dashed rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Nenhum horário disponível para esta data com a duração selecionada ({totalDuration} min).</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {periods.map((period) => (
                <div key={period.name} className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <div className="h-px bg-border flex-1" />
                        {period.name}
                        <div className="h-px bg-border flex-1" />
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {period.slots.map((time) => {
                            const start = time;
                            const end = minutesToTime(timeToMinutes(time) + totalDuration);
                            return (
                                <button
                                    key={time}
                                    onClick={() => onTimeSelect(time)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 group",
                                        selectedTime === time
                                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                                            : "bg-card border-border hover:border-primary/50"
                                    )}
                                >
                                    <span className={cn(
                                        "text-sm font-bold",
                                        selectedTime === time ? "text-primary" : "text-foreground"
                                    )}>
                                        {start}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground group-hover:text-primary/70 transition-colors">
                                        até {end}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
