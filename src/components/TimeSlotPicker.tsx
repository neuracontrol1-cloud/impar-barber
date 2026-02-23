import { cn } from "../lib/utils";
import { Clock } from "lucide-react";

interface TimeSlotPickerProps {
    selectedTime: string | null;
    onTimeSelect: (time: string) => void;
    takenTimes?: string[];
    date?: Date; // Receive the selected date
}

// Generate time slots from 09:00 to 19:00 with 1 hour intervals (or 30 mins)
const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"
];

export function TimeSlotPicker({ selectedTime, onTimeSelect, takenTimes = [], date }: TimeSlotPickerProps) {
    const isTimePast = (time: string) => {
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

    const availableSlots = timeSlots.filter(time => {
        const isTaken = takenTimes.includes(time);
        const isPast = isTimePast(time);
        return !isTaken && !isPast;
    });

    if (availableSlots.length === 0) {
        return (
            <div className="text-center p-6 border border-dashed rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Nenhum horário disponível para esta data.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 animate-in fade-in duration-500">
            {availableSlots.map((time) => (
                <button
                    key={time}
                    onClick={() => onTimeSelect(time)}
                    className={cn(
                        "flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-all hover:scale-105 active:scale-95",
                        selectedTime === time
                            ? "border-2 border-primary bg-primary/10 text-primary font-bold shadow-md"
                            : "bg-background text-foreground border-input hover:bg-accent hover:border-primary/50 shadow-sm"
                    )}
                >
                    <Clock className="w-3 h-3" />
                    {time}
                </button>
            ))}
        </div>
    );
}
