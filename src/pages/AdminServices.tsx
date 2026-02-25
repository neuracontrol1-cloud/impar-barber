import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Service } from '../types';

export function AdminServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<Partial<Service>>({
        name: '',
        price: 0,
        duration_minutes: 30,
        active: true
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('name');

        if (error) console.error('Error fetching services:', error);
        else setServices(data || []);
        setLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setFormData(service);
        setIsCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Erro ao excluir serviço.');
            console.error(error);
        } else {
            fetchServices();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        if (!formData.name || (formData.price === undefined)) return;

        try {
            if (editingService) {
                // Update
                const { error } = await supabase
                    .from('services')
                    .update({
                        name: formData.name,
                        price: formData.price,
                        duration_minutes: formData.duration_minutes
                    })
                    .eq('id', editingService.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('services')
                    .insert([{
                        name: formData.name,
                        price: formData.price,
                        duration_minutes: formData.duration_minutes
                    }]);
                if (error) throw error;
            }

            setEditingService(null);
            setIsCreating(false);
            setFormData({ name: '', price: 0 });
            fetchServices();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar serviço.');
        }
    };

    const handleCancel = () => {
        setEditingService(null);
        setIsCreating(false);
        setFormData({ name: '', price: 0 });
    };

    return (
        <div className="min-h-screen bg-muted/20 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link to="/admin" className="p-2 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-bold">Gerenciar Serviços</h1>
                </div>

                {/* Form Area */}
                {(isCreating || editingService) && (
                    <div className="bg-card p-6 rounded-xl border shadow-sm animate-in fade-in slide-in-from-top-4">
                        <h2 className="font-semibold mb-4">{isCreating ? 'Novo Serviço' : 'Editar Serviço'}</h2>
                        <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="space-y-2 flex-1 w-full">
                                <label className="text-sm font-medium">Nome do Serviço</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    placeholder="Ex: Corte Degrade"
                                    required
                                />
                            </div>
                            <div className="space-y-2 w-full sm:w-32">
                                <label className="text-sm font-medium">Preço (R$)</label>
                                <input
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="space-y-2 w-full sm:w-32">
                                <label className="text-sm font-medium">Duração (min)</label>
                                <input
                                    name="duration_minutes"
                                    type="number"
                                    value={formData.duration_minutes}
                                    onChange={handleChange}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    placeholder="30"
                                    required
                                />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button type="button" onClick={handleCancel} className="flex-1 sm:flex-none p-2 border rounded-md hover:bg-accent text-muted-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                                <button type="submit" className="flex-1 sm:flex-none p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                                    <Save className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* List Area */}
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                        <h3 className="font-semibold">Serviços Cadastrados</h3>
                        {!isCreating && !editingService && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Carregando serviços...</div>
                    ) : services.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Nenhum serviço cadastrado.</div>
                    ) : (
                        <div className="divide-y">
                            {services.map(service => (
                                <div key={service.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                    <div>
                                        <p className="font-medium">{service.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            R$ {service.price.toFixed(2)} • {service.duration_minutes || 30} min
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(service)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(service.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
