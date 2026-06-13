import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Code2, Search } from "lucide-react";
import { TEMPLATE_VARIABLES } from "@/lib/template-variables";

interface VariableInserterProps {
  onInsert: (variable: string) => void;
}

export function VariableInserter({ onInsert }: VariableInserterProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredVariables = TEMPLATE_VARIABLES.filter(
    (v) =>
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.key.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleInsert = (key: string) => {
    onInsert(key);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Code2 className="w-4 h-4" />
          Sett inn variabel
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter variabler..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filteredVariables.length > 0 ? (
            <div className="p-2 space-y-1">
              {filteredVariables.map((variable) => (
                <button
                  key={variable.key}
                  onClick={() => handleInsert(variable.key)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">
                          {variable.label}
                        </span>
                        <code className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                          {variable.key}
                        </code>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {variable.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Eksempel: {variable.example}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Ingen variabler funnet</p>
            </div>
          )}
        </div>
        <div className="p-3 border-t bg-gray-50">
          <p className="text-xs text-gray-600">
            <strong>Tips:</strong> Variabler erstattes automatisk med faktiske verdier når e-post sendes.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
