import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Clock, User, Phone, Scissors, CheckCircle2, MessageCircle } from "lucide-react";
import { getWhatsAppUrl } from "../lib/utils";

interface BookingDetailsModalProps {
    booking: any;
    onClose: () => void;
}

export function BookingDetailsModal({ booking, onClose }: BookingDetailsModalProps) {
    if (!booking) return null;

    const dateStr = booking.date.includes('T') ? booking.date : `${booking.date}T00:00:00`;
    const dateObj = new Date(dateStr);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header */}
                <div className="relative h-32 bg-primary/10 flex items-center justify-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-background/50 hover:bg-background rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="h-20 w-20 bg-background rounded-full flex items-center justify-center shadow-sm">
                        <Scissors className="w-10 h-10 text-primary" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <h2 className="text-xl font-bold">{booking.service_name}</h2>
                        <p className="text-muted-foreground text-sm font-medium mt-1">
                            {format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/30 rounded-xl flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground">Horário</p>
                                <p className="font-semibold">{booking.time}</p>
                            </div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground">Status</p>
                                <p className="font-semibold capitalize">{booking.status === 'pending' ? 'Pendente' : booking.status}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 border rounded-xl">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{booking.client.name}</p>
                                <p className="text-xs text-muted-foreground">Cliente</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-3 border rounded-xl">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Phone className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{booking.client.phone}</p>
                                <p className="text-xs text-muted-foreground">Telefone</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2">
                        <button
                            onClick={() => {
                                const url = getWhatsAppUrl(booking.client.phone, booking.client.name, booking.date, booking.time);
                                window.open(url, '_blank');
                            }}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Chamar no WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
