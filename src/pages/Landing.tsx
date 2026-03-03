import { useNavigate } from 'react-router-dom';
import { Scissors, User, CalendarDays, ArrowRight, Instagram, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export function Landing() {
    const navigate = useNavigate();

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 80; // Height of the fixed header
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Sticky Header */}
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/header_logo_v3.png" alt="Logo Impar" className="h-10 sm:h-14 w-auto object-contain" />
                    </div>

                    <nav className="hidden md:flex items-center gap-8 font-medium text-sm tracking-widest uppercase">
                        <a href="#home" onClick={(e) => scrollToSection(e, 'home')} className="text-zinc-400 hover:text-white transition-colors">Home</a>
                        <a href="#sobre" onClick={(e) => scrollToSection(e, 'sobre')} className="text-zinc-400 hover:text-white transition-colors">A Barbearia</a>
                        <a href="#servicos" onClick={(e) => scrollToSection(e, 'servicos')} className="text-zinc-400 hover:text-white transition-colors">Serviços</a>
                        <a href="#profissionais" onClick={(e) => scrollToSection(e, 'profissionais')} className="text-zinc-400 hover:text-white transition-colors">O Barbeiro</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm font-medium text-zinc-400 hover:text-white uppercase tracking-wider hidden sm:block"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/agendar')}
                            className="bg-primary text-primary-foreground px-4 sm:px-6 py-2 sm:py-2.5 rounded-none text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <CalendarDays className="w-4 h-4" />
                            Agendar
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section id="home" className="relative mt-20 flex flex-col md:block md:h-[calc(100vh-5rem)] bg-[#0a0a0a] overflow-hidden">
                {/* Mobile Image Container / Desktop Background */}
                <div className="relative h-[45vh] md:absolute md:inset-0 z-0 w-full shrink-0 md:h-full flex justify-center items-start overflow-hidden">
                    <img
                        src="/hero_bg_scissors.jpg"
                        alt="Impar Barbearia"
                        className="w-full h-full object-cover object-top md:object-center opacity-90"
                    />
                    {/* Gradient overlay to blend the bottom edge on mobile */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent md:hidden"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative z-10 w-full px-8 flex flex-col items-center md:items-center pt-8 pb-16 md:h-full md:justify-end md:pb-20"
                >
                    {/* Mobile Only Typography Elements */}
                    <div className="md:hidden w-full flex flex-col items-center text-center">
                        <span className="text-primary text-[10px] sm:text-xs tracking-[0.4em] uppercase mb-4 font-bold">
                            Realce & Exclusividade
                        </span>

                        <h1 className="text-4xl sm:text-5xl font-serif text-white leading-[1.15] mb-2 px-2">
                            BELEZA QUE<br />
                            <span className="italic text-[#c29c5a] font-normal">se renova.</span>
                        </h1>

                        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mt-6 max-w-[90%] font-light">
                            Uma barbearia moderna com uma dose retrô que se diferencia pela forma tradicional de atendimento e proporciona aos clientes um local aconchegante.
                        </p>

                        <button
                            onClick={() => navigate('/agendar')}
                            className="mt-10 w-full bg-[#c29c5a] text-black font-black py-5 tracking-[0.2em] text-sm uppercase shadow-2xl hover:bg-[#d4ae6b] transition-colors active:scale-95"
                        >
                            AGENDAR AGORA
                        </button>

                        <a
                            href="#sobre"
                            onClick={(e) => scrollToSection(e, 'sobre')}
                            className="text-[10px] tracking-[0.3em] uppercase text-zinc-600 mt-10 flex flex-col items-center gap-2 hover:text-zinc-400 transition-colors"
                        >
                            NOSSA HISTÓRIA
                            <ArrowRight className="w-3 h-3 rotate-90" />
                        </a>
                    </div>

                    {/* Desktop Only Typography (kept for consistency) */}
                    <div className="hidden md:flex flex-col items-center text-center">
                        <button
                            onClick={() => navigate('/agendar')}
                            className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-black uppercase tracking-widest bg-primary overflow-hidden hover:scale-105 transition-transform duration-300 mb-8 w-full sm:w-auto shadow-2xl"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Agendar Horário <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 group-hover:scale-150 group-hover:bg-white/20"></div>
                        </button>

                        <p className="text-2xl md:text-2xl text-white max-w-2xl text-center font-serif italic tracking-wide leading-relaxed drop-shadow-xl mb-10">
                            "Uma barbearia moderna com uma dose retrô que se diferencia pela forma tradicional de atendimento e proporciona aos clientes um local aconchegante, agradável e discreto."
                        </p>
                    </div>
                </motion.div>

                {/* Floating WhatsApp Button */}
                <a
                    href="https://wa.me/5500000000000" // Replace with real number later
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 z-[60] bg-[#25D366] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-90 md:hidden"
                >
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </a>
            </section>

            {/* About Section */}
            <section id="sobre" className="py-16 sm:py-24 bg-background relative border-t border-white/5 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="container mx-auto px-4"
                >
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                        <div className="md:w-1/2 flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                <img src="/shop_interior_real_v2.jpg" alt="Interior da Barbearia" className="relative z-10 w-full max-w-lg aspect-video object-cover rounded-2xl grayscale border border-white/10 shadow-2xl" />
                            </div>
                        </div>
                        <div className="md:w-1/2 space-y-8 text-center md:text-left">
                            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-900 border border-zinc-800 mb-2">
                                <Scissors className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif text-white">A BARBEARIA</h2>
                            <p className="text-zinc-400 text-base sm:text-lg leading-relaxed font-light">
                                Situado em um ponto nobre, a Impar Barbearia destaca-se pela excelência de seus profissionais e ambiente acolhedor.
                            </p>
                            <p className="text-zinc-400 text-base sm:text-lg leading-relaxed font-light">
                                Muito mais que um simples corte de cabelo ou barba, oferecemos uma experiência completa de cuidado masculino.
                                Nosso espaço foi pensado para ser seu refúgio, combinando técnicas clássicas de barbearia com o conforto atual.
                            </p>
                            <div className="pt-4">
                                <button onClick={() => navigate('/agendar')} className="border border-primary text-primary hover:bg-primary hover:text-black px-6 py-3 sm:px-8 text-sm sm:text-base uppercase tracking-widest font-bold transition-colors">
                                    Conheça o Espaço
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Services Minimalist Menu Section */}
            <section id="servicos" className="py-16 sm:py-24 bg-zinc-950 relative border-t border-white/5 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="container mx-auto px-4 max-w-4xl"
                >
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif text-white mb-4">NOSSOS SERVIÇOS</h2>
                        <div className="w-16 sm:w-24 h-1 bg-primary mx-auto" />
                    </div>

                    <div className="space-y-6">
                        {/* Service Item 1 */}
                        <div className="group flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 sm:gap-0 border-b border-zinc-800 pb-4 hover:border-primary transition-colors">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-serif text-zinc-200 group-hover:text-white transition-colors">CORTE CLÁSSICO</h3>
                                <p className="text-xs sm:text-sm text-zinc-500 font-sans mt-1">Acabamento na navalha, lavagem e finalização.</p>
                            </div>
                            <div className="text-lg sm:text-xl font-serif text-primary">R$ 55</div>
                        </div>
                        {/* Service Item 2 */}
                        <div className="group flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 sm:gap-0 border-b border-zinc-800 pb-4 hover:border-primary transition-colors">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-serif text-zinc-200 group-hover:text-white transition-colors">BARBA TERAPIA</h3>
                                <p className="text-xs sm:text-sm text-zinc-500 font-sans mt-1">Toalha quente, massagem facial e produtos premium.</p>
                            </div>
                            <div className="text-lg sm:text-xl font-serif text-primary">R$ 45</div>
                        </div>
                        {/* Service Item 3 */}
                        <div className="group flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 sm:gap-0 border-b border-zinc-800 pb-4 hover:border-primary transition-colors">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-serif text-zinc-200 group-hover:text-white transition-colors">CORTE + BARBA VIP</h3>
                                <p className="text-xs sm:text-sm text-zinc-500 font-sans mt-1">Combo completo com lavagem especial e alinhamento dos fios.</p>
                            </div>
                            <div className="text-lg sm:text-xl font-serif text-primary">R$ 90</div>
                        </div>
                        {/* Service Item 4 */}
                        <div className="group flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 sm:gap-0 border-b border-zinc-800 pb-4 hover:border-primary transition-colors">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-serif text-zinc-200 group-hover:text-white transition-colors">SOBRANCELHA</h3>
                                <p className="text-xs sm:text-sm text-zinc-500 font-sans mt-1">Limpeza e alinhamento do design na navalha.</p>
                            </div>
                            <div className="text-lg sm:text-xl font-serif text-primary">R$ 20</div>
                        </div>
                    </div>

                    <div className="mt-12 sm:mt-16 text-center">
                        <button onClick={() => navigate('/agendar')} className="bg-white text-black hover:bg-zinc-200 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base uppercase tracking-widest font-bold transition-colors">
                            Ver Lista Completa e Agendar
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* Professionals Section */}
            <section id="profissionais" className="py-16 sm:py-24 bg-background border-t border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
                    <User className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="container mx-auto px-4"
                >
                    <div className="text-center mb-12 sm:mb-16 relative z-10">
                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-primary/50 mb-4 sm:mb-6">
                            <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif text-white">NOSSOS PROFISSIONAIS</h2>
                        <p className="text-zinc-400 mt-4 max-w-2xl mx-auto font-light text-sm sm:text-base px-2">
                            A Impar Barbearia conta com profissionais altamente capacitados para atender todos os perfis, utilizando as melhores técnicas para adequar o corte ao seu estilo.
                        </p>
                    </div>

                    <div className="flex justify-center relative z-10">
                        {/* Rafael Card */}
                        <div className="group cursor-pointer">
                            <div className="relative overflow-hidden w-72 h-96 border border-zinc-800 bg-zinc-900">
                                <img
                                    src="/rafael_portrait_v2.png"
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
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="bg-zinc-950 border-t border-white/10 pt-12 sm:pt-16 pb-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12 text-center md:text-left">
                        <div>
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                                <img src="/header_logo_v3.png" alt="Logo" className="h-16 w-auto object-contain" />
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
