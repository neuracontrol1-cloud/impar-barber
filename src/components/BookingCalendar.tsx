import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import "react-day-picker/dist/style.css"; // Trying standard path first
import { cn } from "../lib/utils";

interface BookingCalendarProps {
    selectedDate: Date | undefined;
    onDateSelect: (date: Date | undefined) => void;
}

export function BookingCalendar({ selectedDate, onDateSelect }: BookingCalendarProps) {
    return (
        <div className="p-4 border rounded-xl bg-card shadow-sm flex justify-center">
            <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={onDateSelect}
                locale={ptBR}
                disabled={[{ before: new Date() }, { dayOfWeek: [0] }]}
                modifiersClassNames={{
                    selected: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md",
                    today: "font-bold text-primary"
                }}
                className={cn("p-3", "rdp-root")}
            />
        </div>
    );
}
