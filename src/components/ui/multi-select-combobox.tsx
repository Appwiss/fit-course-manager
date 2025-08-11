import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboItem = {
  value: string;
  label: string;
  description?: string;
};

interface MultiSelectComboboxProps {
  items: ComboItem[];
  value: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

export function MultiSelectCombobox({
  items,
  value,
  onChange,
  placeholder = "Sélectionner...",
  emptyText = "Aucun résultat",
  className,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const toggleValue = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const clearOne = (val: string) => onChange(value.filter((v) => v !== val));
  const clearAll = () => onChange([]);

  const selectedLabels = React.useMemo(() => {
    const map = new Map(items.map((i) => [i.value, i.label] as const));
    return value.map((v) => map.get(v) ?? v);
  }, [items, value]);

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value.length > 0
              ? `${value.length} sélectionné${value.length > 1 ? "s" : ""}`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover">
          <Command shouldFilter>
            <CommandInput placeholder="Rechercher..." />
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {items.map((item) => {
                const selected = value.includes(item.value);
                return (
                  <CommandItem
                    key={item.value}
                    value={item.label}
                    onSelect={() => toggleValue(item.value)}
                    className="cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col">
                      <span>{item.label}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((val) => {
            const item = items.find((i) => i.value === val);
            return (
              <Badge key={val} variant="secondary" className="flex items-center gap-1">
                <span className="truncate max-w-[200px]">{item?.label ?? val}</span>
                <button
                  type="button"
                  onClick={() => clearOne(val)}
                  className="ml-1 rounded-sm hover:bg-muted p-0.5"
                  aria-label={`Retirer ${item?.label ?? val}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 px-2">
            Effacer tout
          </Button>
        </div>
      )}
    </div>
  );
}
