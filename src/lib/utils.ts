import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

export const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export function getWhatsAppUrl(phone: string, name: string, date: string, time: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;

    // Format date if needed (assuming YYYY-MM-DD)
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    const message = `Olá ${name}! Passando para confirmar seu agendamento:\n\n📅 Data: ${formattedDate}\n⏰ Horário: ${time}\n\nEstá tudo certo?`;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
