import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import type { Service } from "../types";

interface ServiceSelectionProps {
    services: Service[];
    selectedServices: string[];
    onSelect: (serviceId: string) => void;
}

export function ServiceSelection({ services, selectedServices, onSelect }: ServiceSelectionProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                    <div
                        key={service.id}
                        className={cn(
                            "cursor-pointer rounded-xl border p-4 transition-all hover:border-primary hover:shadow-md",
                            isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border bg-card"
                        )}
                        onClick={() => onSelect(service.id)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="font-medium leading-none">{service.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    R$ {service.price.toFixed(2)}
                                </p>
                            </div>
                            {isSelected && (
                                <Check className="h-4 w-4 text-primary" />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
