import { useState, useEffect, useRef } from 'react';
import { ServiceSelection } from '../components/ServiceSelection';
import { BookingCalendar } from '../components/BookingCalendar';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { BookingForm } from '../components/BookingForm';
import { BookingSummary } from '../components/BookingSummary';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import type { UserData, Service } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Link } from 'react-router-dom';

import { supabase, saveBooking, getBookingsForDate } from '../lib/supabase';

function BookingFlow() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [takenTimes, setTakenTimes] = useState<string[]>([]);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    phone: '',
  });
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const timeSlotRef = useRef<HTMLDivElement>(null);

  // Scroll to time slots when date is selected
  useEffect(() => {
    // Clear selected time when date changes
    setSelectedTime(null);

    if (selectedDate && timeSlotRef.current) {
      // Timeout increased to 300ms to handle mobile keyboard closing / layout shifts
      const timer = setTimeout(() => {
        timeSlotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedDate]);


  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('name, phone, email') // Ensure email is selected too
          .eq('email', session.user.email)
          .single();

        if (clientData) {
          setUserData({
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone
          });
        }
      }
    };
    checkUser();
  }, []);

  // Fetch Services
  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('name');

      if (data) {
        setServices(data);
      }
    };
    fetchServices();
  }, []);

  // Fetch Taken Times
  useEffect(() => {
    if (selectedDate) {
      setTakenTimes([]);
      getBookingsForDate(selectedDate).then(times => {
        setTakenTimes(times);
      });
    } else {
      setTakenTimes([]);
    }
  }, [selectedDate]);

  const selectedServicesList = services.filter(s => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServicesList.reduce((sum, s) => sum + s.price, 0);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    // Se tiver 10 ou 11 dígitos, assume que é Brasil e adiciona 55
    return clean.length >= 10 && clean.length <= 11 ? `55${clean}` : clean;
  };

  const sendToMakeWebhook = async (bookingData: any) => {
    const WEBHOOK_URL = 'https://hook.us2.make.com/y77w3ul2j4xdlsqabbx8epwmau2g9edw';
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
          phone: formatPhoneForWhatsApp(bookingData.phone)
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar para o Make:", error);
    }
  };

  const handleConfirm = async () => {
    if (selectedServicesList.length === 0 || !selectedDate || !selectedTime) return;

    setIsLoading(true);
    try {
      // Agregando serviços para o banco de dados
      const combinedService = {
        id: selectedServiceIds.join(','),
        name: selectedServicesList.map(s => s.name).join(' + '),
        price: totalPrice
      };

      await saveBooking({
        client: userData,
        service: combinedService,
        date: selectedDate,
        time: selectedTime
      });

      // Disparar Webhook do Make para Automação (WhatsApp/ManyChat)
      // Importante: O Make deve apenas SALVAR os dados nos Campos do ManyChat, não enviar a mensagem direto.
      // A mensagem será disparada pelo "Gatilho de Palavra-chave" quando o cliente enviar a mensagem no WhatsApp.
      sendToMakeWebhook({
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        services: selectedServicesList.map(s => s.name).join(', '),
        total: totalPrice
      });

      // Não abrir window.open aqui automaticamente pois bloqueadores de popup (iOS/Safari) impedem se for async.
      // Apenas setamos o estado e mostramos o botão na tela de sucesso.
      setIsConfirmed(true);
    } catch (error) {
      console.error("Erro ao agendar:", error);
      alert("Ocorreu um erro ao salvar o agendamento.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    const barberPhone = '5537998280515';
    const message = encodeURIComponent('Confirmar agendamento');
    window.open(`https://wa.me/${barberPhone}?text=${message}`, '_blank');
  };

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center space-y-6">
        <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Agendamento Salvo!</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Para finalizar, clique no botão abaixo e confirme no WhatsApp.
          </p>
        </div>
        <div className="p-6 border rounded-lg max-w-sm w-full bg-card text-left space-y-4">
          <p className="font-medium text-center border-b pb-2">Resumo</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Serviços:</span>
              <span className="font-medium text-right">{selectedServicesList.map(s => s.name).join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data:</span>
              <span className="font-medium">{selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horário:</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-bold">
              <span>Total:</span>
              <span className="text-primary">R$ {totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleWhatsAppRedirect}
          className="w-full max-w-sm px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 animate-pulse"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
          Confirmar no WhatsApp
        </button>

        <button onClick={() => window.location.reload()} className="px-6 py-2 text-primary hover:underline rounded-md mt-4">
          Novo Agendamento
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      <header className="border-b sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
        <div className="container mx-auto flex h-20 items-center px-4 justify-between">
          <div className="flex items-center gap-3">
            <img src="/header_logo_v2.png" alt="Impar Barbearia Logo" className="h-12 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden sm:block">
              Passo {step} de 4
            </div>
            <Link to="/login" className="text-sm font-medium hover:underline text-primary">
              Sou Barbeiro
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        {step === 1 && (
          <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-8 relative shadow-lg border border-border/50">
            <img src="/barber_action.png" alt="Barbeiro em ação" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-center">
              <h1 className="text-3xl font-serif font-bold text-white mb-2 tracking-wide">Agende seu horário</h1>
              <p className="text-primary-foreground/90 font-medium">Excelência em cada detalhe do seu visual.</p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-8">
          {step > 1 && (
            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif font-bold tracking-tight">Agende seu horário</h1>
              <p className="text-muted-foreground mt-2">
                {step === 2 && "Escolha a melhor data e horário."}
                {step === 3 && "Informe seus dados para contato."}
                {step === 4 && "Confira e confirme seu agendamento."}
              </p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="relative mb-8">
            <div className="absolute left-0 top-1/2 w-full h-1 bg-muted -translate-y-1/2 rounded-full"></div>
            <div className="absolute left-0 top-1/2 h-1 bg-primary -translate-y-1/2 rounded-full transition-all" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
            <div className="relative flex justify-between">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={cn("h-8 w-8 rounded-full border-2 bg-background flex items-center justify-center", step >= s ? "border-primary text-primary" : "border-muted text-muted-foreground")}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <ServiceSelection
                services={services}
                selectedServices={selectedServiceIds}
                onSelect={handleServiceSelect}
              />
              <div className="flex justify-end items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <span className="font-medium">Total:</span>
                <span className="text-2xl font-bold text-primary">R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold">Data</h3>
                <BookingCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
              </div>
              <div className="space-y-4 scroll-mt-24" ref={timeSlotRef}>
                <h3 className="font-semibold">Horário</h3>
                {selectedDate ? <TimeSlotPicker selectedTime={selectedTime} onTimeSelect={setSelectedTime} takenTimes={takenTimes} date={selectedDate} /> : <div className="p-8 border border-dashed rounded-xl text-center text-muted-foreground">Selecione uma data</div>}
              </div>
            </div>
          )}

          {step === 3 && <div className="max-w-md mx-auto"><BookingForm userData={userData} onChange={setUserData} /></div>}

          {step === 4 && selectedServicesList.length > 0 && selectedDate && selectedTime && (
            <div className="max-w-md mx-auto">
              <BookingSummary services={selectedServicesList} date={selectedDate} time={selectedTime} userData={userData} />
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 shadow-lg">
        <div className="container mx-auto flex max-w-3xl justify-between">
          <button onClick={handleBack} disabled={step === 1} className={cn("flex items-center gap-2", step === 1 && "invisible")}>
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={(step === 1 && selectedServiceIds.length === 0) || (step === 2 && (!selectedDate || !selectedTime)) || (step === 3 && (!userData.name || !userData.email || !userData.phone))}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              Próximo <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={isLoading} className="bg-green-600 text-white px-8 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">
              {isLoading ? "Salvando..." : "Confirmar Agendamento"} <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default BookingFlow;
