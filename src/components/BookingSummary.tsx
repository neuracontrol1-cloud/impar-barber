import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Service, UserData } from "../types";
import { Calendar, Clock, User, Mail, Phone, ListChecks } from "lucide-react";

interface BookingSummaryProps {
    services: Service[];
    date: Date;
    time: string;
    userData: UserData;
}

export function BookingSummary({ services, date, time, userData }: BookingSummaryProps) {
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="flex flex-col space-y-1.5 p-6 pb-4">
                <h3 className="font-semibold leading-none tracking-tight">Resumo do Agendamento</h3>
                <p className="text-sm text-muted-foreground">Confira os detalhes antes de confirmar.</p>
            </div>
            <div className="p-6 pt-0 space-y-6">
                <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                            <ListChecks className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground">Serviços Selecionados</p>
                            <div className="mt-1 space-y-1">
                                {services.map(service => (
                                    <div key={service.id} className="flex justify-between text-sm">
                                        <span>{service.name}</span>
                                        <span className="font-medium">R$ {service.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Data</p>
                            <p className="font-medium capitalize">{format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Horário</p>
                            <p className="font-medium">{time}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Seus Dados</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{userData.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{userData.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{userData.phone}</span>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-xl font-bold text-primary">R$ {totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
