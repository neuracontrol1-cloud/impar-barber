import { useNavigate } from 'react-router-dom';
import { Scissors, User, CalendarDays, ArrowRight, Instagram, MapPin } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Sticky Header */}
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/impar_logo.png" alt="Logo Impar" className="h-12 w-auto object-contain mix-blend-screen" />
                        <span className="font-serif text-2xl tracking-wider text-white hidden sm:block">IMPAR BARBEARIA</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 font-medium text-sm tracking-widest uppercase">
                        <a href="#home" className="text-zinc-400 hover:text-white transition-colors">Home</a>
                        <a href="#sobre" className="text-zinc-400 hover:text-white transition-colors">A Barbearia</a>
                        <a href="#servicos" className="text-zinc-400 hover:text-white transition-colors">Serviços</a>
                        <a href="#profissionais" className="text-zinc-400 hover:text-white transition-colors">O Barbeiro</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm font-medium text-zinc-400 hover:text-white uppercase tracking-wider hidden sm:block"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/agendar')}
                            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-none font-bold uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <CalendarDays className="w-4 h-4" />
                            Agendar
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section id="home" className="relative h-screen flex items-center justify-center pt-20">
                <div className="absolute inset-0 top-20 z-0 bg-background overflow-hidden">
                    {/* Faded Image Overlay */}
                    <div className="absolute inset-0 w-full md:w-3/4 left-0 h-full"
                        style={{
                            maskImage: 'linear-gradient(to right, black 40%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to right, black 40%, transparent 100%)',
                        }}>
                        <img
                            src="/impar_rafael_bg.png"
                            alt="Barbeiro Rafael"
                            className="w-full h-full object-cover object-[left_top] opacity-90"
                        />
                    </div>

                    {/* Additional gradient overlays for text readability and smooth transition */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/80 to-background" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
                    <img src="/impar_logo.png" alt="Logo" className="h-32 md:h-48 w-auto object-contain mb-8 mix-blend-screen" />

                    <h1 className="text-5xl md:text-8xl font-serif text-white mb-6 leading-none drop-shadow-2xl">
                        BEM-VINDO A <br className="hidden md:block" /> IMPAR BARBEARIA
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto mb-10 font-light tracking-wide">
                        Uma barbearia moderna com uma dose retrô que se diferencia pela forma tradicional de atendimento e proporciona aos clientes um local aconchegante, agradável e discreto.
                    </p>

                    <button
                        onClick={() => navigate('/agendar')}
                        className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-black uppercase tracking-widest bg-primary overflow-hidden hover:scale-105 transition-transform duration-300"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Agendar Horário <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 group-hover:scale-150 group-hover:bg-white/20"></div>
                    </button>
                </div>
            </section>

            {/* About Section */}
            <section id="sobre" className="py-24 bg-background relative border-t border-white/5">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2 flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                <img src="/shop_interior.png" alt="Interior" className="relative z-10 max-w-sm md:max-w-md rounded-2xl grayscale hover:grayscale-0 transition-all duration-700 border border-white/10" />
                            </div>
                        </div>
                        <div className="md:w-1/2 space-y-8 text-center md:text-left">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mb-2">
                                <Scissors className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-6xl font-serif text-white">A BARBEARIA</h2>
                            <p className="text-zinc-400 text-lg leading-relaxed font-light">
                                Situado em um ponto nobre, a Impar Barbearia destaca-se pela excelência de seus profissionais e ambiente acolhedor.
                            </p>
                            <p className="text-zinc-400 text-lg leading-relaxed font-light">
                                Muito mais que um simples corte de cabelo ou barba, oferecemos uma experiência completa de cuidado masculino.
                                Nosso espaço foi pensado para ser seu refúgio, combinando técnicas clássicas de barbearia com o conforto atual.
                            </p>
                            <div className="pt-4">
                                <button onClick={() => navigate('/agendar')} className="border border-primary text-primary hover:bg-primary hover:text-black px-8 py-3 uppercase tracking-widest font-bold transition-colors">
                                    Conheça o Espaço
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Minimalist Menu Section */}
            <section id="servicos" className="py-24 bg-zinc-950 relative border-t border-white/5">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-serif text-white mb-4">NOSSOS SERVIÇOS</h2>
                        <div className="w-24 h-1 bg-primary mx-auto" />
                    </div>

                    <div className="space-y-6">
                        {/* Service Item 1 */}
                        <div className="group flex justify-between items-end border-b border-zinc-800 pb-4 hover:border-primary transition-colors">
                            <div>
                                <h3 className="text-2xl font-serif text-zinc-200 group-hover:text-white transition-colors">CORTE CLÁSSICO</h3>
                                <p className="text-sm text-zinc-500 font-sans mt-1">Acabamento na navalha, lavagem e finalização.</p>
                            </div>
                            <div className="text-xl font-serif text-primary">R$ 55</div>
                        </div>
                        {/* Service Item 2 */}
                        <div className="group flex justify-between items-end border-b border-zinc-800 pb-4 hover:border-primary transition-colors">
                            <div>
                                <h3 className="text-2xl font-serif text-zinc-200 group-hover:text-white transition-colors">BARBA TERAPIA</h3>
                                <p className="text-sm text-zinc-500 font-sans mt-1">Toalha quente, massagem facial e produtos premium.</p>
                            </div>
                            <div className="text-xl font-serif text-primary">R$ 45</div>
                        </div>
                        {/* Service Item 3 */}
                        <div className="group flex justify-between items-end border-b border-zinc-800 pb-4 hover:border-primary transition-colors">
                            <div>
                                <h3 className="text-2xl font-serif text-zinc-200 group-hover:text-white transition-colors">CORTE + BARBA VIP</h3>
                                <p className="text-sm text-zinc-500 font-sans mt-1">Combo completo com lavagem especial e alinhamento dos fios.</p>
                            </div>
                            <div className="text-xl font-serif text-primary">R$ 90</div>
                        </div>
                        {/* Service Item 4 */}
                        <div className="group flex justify-between items-end border-b border-zinc-800 pb-4 hover:border-primary transition-colors">
                            <div>
                                <h3 className="text-2xl font-serif text-zinc-200 group-hover:text-white transition-colors">SOBRANCELHA</h3>
                                <p className="text-sm text-zinc-500 font-sans mt-1">Limpeza e alinhamento do design na navalha.</p>
                            </div>
                            <div className="text-xl font-serif text-primary">R$ 20</div>
                        </div>
                    </div>

                    <div className="mt-16 text-center">
                        <button onClick={() => navigate('/agendar')} className="bg-white text-black hover:bg-zinc-200 px-8 py-4 uppercase tracking-widest font-bold transition-colors">
                            Ver Lista Completa e Agendar
                        </button>
                    </div>
                </div>
            </section>

            {/* Professionals Section */}
            <section id="profissionais" className="py-24 bg-background border-t border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
                    <User className="w-[500px] h-[500px]" />
                </div>

                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 relative z-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-primary/50 mb-6">
                            <User className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-serif text-white">NOSSOS PROFISSIONAIS</h2>
                        <p className="text-zinc-400 mt-4 max-w-2xl mx-auto font-light">
                            A Impar Barbearia conta com profissionais altamente capacitados para atender todos os perfis, utilizando as melhores técnicas para adequar o corte ao seu estilo.
                        </p>
                    </div>

                    <div className="flex justify-center relative z-10">
                        {/* Rafael Card */}
                        <div className="group cursor-pointer">
                            <div className="relative overflow-hidden w-72 h-96 border border-zinc-800 bg-zinc-900">
                                <img
                                    src="/barber_portrait.png"
                                    alt="Rafael Goulart"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:opacity-80 grayscale group-hover:grayscale-0"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-20">
                                    <h3 className="text-3xl font-serif text-white mb-1">RAFAEL GOULART</h3>
                                    <p className="text-primary font-sans text-sm tracking-widest uppercase font-bold">Mestre Barbeiro</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-zinc-950 border-t border-white/10 pt-16 pb-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 text-center md:text-left">
                        <div>
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                                <img src="/impar_logo.png" alt="Logo" className="h-12 w-auto object-contain mix-blend-screen" />
                                <span className="font-serif text-xl tracking-wider text-white">IMPAR BARBEARIA</span>
                            </div>
                            <p className="text-zinc-500 font-light max-w-sm mx-auto md:mx-0">
                                Tradição, respeito e excelência no cuidado masculino. Sua melhor versão começa aqui.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-serif text-xl mb-6 tracking-wide">CONTATO</h4>
                            <ul className="space-y-4 text-zinc-500">
                                <li className="flex items-center justify-center md:justify-start gap-3">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    <span>Rua Exemplo, 123 - Centro</span>
                                </li>
                                <li className="flex items-center justify-center md:justify-start gap-3">
                                    <Instagram className="w-5 h-5 text-primary" />
                                    <a href="#" className="hover:text-white transition-colors">@imparbarbearia</a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-serif text-xl mb-6 tracking-wide">HORÁRIO</h4>
                            <ul className="space-y-2 text-zinc-500 font-sans text-sm">
                                <li className="flex justify-between border-b border-white/5 pb-2">
                                    <span>Seg - Sex</span>
                                    <span>09:00 - 20:00</span>
                                </li>
                                <li className="flex justify-between border-b border-white/5 pb-2">
                                    <span>Sábado</span>
                                    <span>09:00 - 18:00</span>
                                </li>
                                <li className="flex justify-between border-b border-white/5 pb-2">
                                    <span>Domingo</span>
                                    <span className="text-primary">Fechado</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="text-center text-zinc-600 text-sm border-t border-white/5 pt-8 font-sans">
                        &copy; {new Date().getFullYear()} Impar Barbearia. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}
