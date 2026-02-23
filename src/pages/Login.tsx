import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Scissors, Lock } from 'lucide-react';

import { ThemeToggle } from '../components/ThemeToggle';



export function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isForgotPassword) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/reset-password', // We might need a route for this later, but for now standard link
                });
                if (error) throw error;
                alert('Email de recuperação enviado! Verifique sua caixa de entrada.');
                setIsForgotPassword(false);
            } else if (isSignUp) {
                // ... existing sign up logic
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (authError) throw authError;

                if (authData.user) {
                    const { error: profileError } = await supabase
                        .from('clients')
                        .insert({
                            name,
                            email,
                            phone,
                        });

                    if (profileError) {
                        console.error('Erro ao criar perfil:', profileError);
                    }

                    alert('Conta criada com sucesso! Você já pode fazer login.');
                    setIsSignUp(false);
                }
            } else {
                // ... existing login logic
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                const adminEmails = ['admin@imparbarbearia.com', 'thalesmartins.th@hotmail.com'];
                if (adminEmails.includes(email)) {
                    navigate('/admin');
                } else {
                    navigate('/agendar');
                }
            }
        } catch (error: any) {
            console.error(error);
            // ... existing error handling
            if (error.message && error.message.includes('Email not confirmed')) {
                alert('Seu email ainda não foi confirmado. Verifique sua caixa de entrada (e spam) e clique no link enviado pelo Supabase.');
            } else if (error.message && error.message.includes('Invalid login credentials')) {
                alert('Email ou senha incorretos.');
            } else {
                alert(error.message || 'Erro autenticação. Verifique seus dados.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Side - Image (Visible on Desktop) */}
            <div className="hidden lg:block lg:w-1/2 relative bg-zinc-950 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-background/40 to-transparent z-10" />
                {/* CSS Crop: Scale up the image and shift it to hide the PDF margins */}
                <img
                    src="/barber_portrait.png"
                    alt="Rafael Goulart"
                    className="w-full h-full object-cover opacity-80 scale-[1.35] origin-center -translate-y-[5%]"
                />
                <div className="absolute bottom-12 left-12 z-20 space-y-4">
                    <img src="/shop_interior.png" alt="Logo" className="w-32 h-auto opacity-90 rounded-full border-2 border-primary/50" />
                    <h1 className="text-4xl font-serif text-white max-w-md leading-tight">
                        Transforme sua confiança e recupere sua autoestima
                    </h1>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative">
                <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>
                <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border shadow-lg relative z-20">
                    <div className="text-center space-y-2">
                        <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            <Scissors className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {isForgotPassword ? 'Recuperar Senha' : isSignUp ? 'Crie sua conta' : 'Acesse sua conta'}
                        </h2>
                        <p className="text-muted-foreground">
                            {isForgotPassword ? 'Digite seu email para receber o link' : isSignUp ? 'Preencha seus dados para começar' : 'Entre para agendar ou gerenciar'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        {isSignUp && !isForgotPassword && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" htmlFor="name">Nome Completo</label>
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        placeholder="Seu nome"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" htmlFor="phone">Telefone</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        required
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        placeholder="(00) 00000-0000"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        {!isForgotPassword && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium" htmlFor="password">Senha</label>
                                    {!isSignUp && (
                                        <button
                                            type="button"
                                            onClick={() => setIsForgotPassword(true)}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Esqueceu a senha?
                                        </button>
                                    )}
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Processando...' : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    {isForgotPassword ? 'Enviar Link' : isSignUp ? 'Criar Conta' : 'Entrar'}
                                </>
                            )}
                        </button>

                        {isForgotPassword && (
                            <button
                                type="button"
                                onClick={() => setIsForgotPassword(false)}
                                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Voltar para o Login
                            </button>
                        )}
                    </form>

                    <div className="text-center text-sm">
                        {!isForgotPassword && (
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-primary hover:underline hover:text-primary/80 transition-colors"
                            >
                                {isSignUp ? 'Já tem uma conta? Faça Login' : 'Não tem conta? Crie uma agora'}
                            </button>
                        )}
                    </div>

                    <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Ou</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/agendar')}
                        className="w-full flex items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground py-2 px-4 rounded-md transition-colors cursor-pointer mt-4"
                    >
                        <Scissors className="w-4 h-4" />
                        Continuar sem Login (Convidado)
                    </button>
                </div>
            </div>
        </div>
    );
}
