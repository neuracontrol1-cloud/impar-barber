// Force Vercel Sync - Commit v6
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

import BookingFlow from './pages/BookingFlow';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminServices } from './pages/AdminServices';
import { AdminHistory } from './pages/AdminHistory';
import { AdminSchedule } from './pages/AdminSchedule';
import { AdminFinance } from './pages/AdminFinance';
import { AdminOverview } from './pages/AdminOverview';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) return <div>Carregando...</div>;

    if (!session) {
        return <Navigate to="/" replace />;
    }

    return children;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/agendar" element={<BookingFlow />} />
                <Route
                    path="/admin"
                    element={
                        <PrivateRoute>
                            <AdminDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/services"
                    element={
                        <PrivateRoute>
                            <AdminServices />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/history"
                    element={
                        <PrivateRoute>
                            <AdminHistory />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/schedule"
                    element={
                        <PrivateRoute>
                            <AdminSchedule />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/finance"
                    element={
                        <PrivateRoute>
                            <AdminFinance />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/overview"
                    element={
                        <PrivateRoute>
                            <AdminOverview />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
