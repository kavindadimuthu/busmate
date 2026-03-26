import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getServices } from "@/lib/services-registry";
import { Badge } from "@/components/ui/badge";

interface ServiceSelectorProps {
  value: string;
  onChange: (serviceId: string) => void;
}

export function ServiceSelector({ value, onChange }: ServiceSelectorProps) {
  const services = getServices();
  const current = services.find((s) => s.id === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[220px]">
        <div className="flex items-center gap-2">
          {current && (
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: current.color }}
            />
          )}
          <SelectValue placeholder="Select service" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {services.map((service) => (
          <SelectItem key={service.id} value={service.id}>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: service.color }}
              />
              <span>{service.shortName}</span>
              <Badge variant="outline" className="ml-auto text-[10px]">
                {service.id}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
