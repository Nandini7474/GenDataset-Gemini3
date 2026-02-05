import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, GripVertical, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Control, useFieldArray, UseFormRegister } from "react-hook-form";
import type { DatasetFormData } from "@/pages/Home";

const DATA_TYPES = [
  "Row Number", "First Name", "Last Name", "Email", "Gender", 
  "IP Address", "Phone Number", "Street Address", "City", "Country", 
  "Date", "Boolean", "Currency", "GUID", "Custom String"
];

interface SchemaBuilderProps {
  control: Control<DatasetFormData>;
  register: UseFormRegister<DatasetFormData>;
}

export function SchemaBuilder({ control, register }: SchemaBuilderProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "schema",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold font-display text-foreground/80">Schema Definition</h3>
        <Button 
          type="button" 
          onClick={() => append({ name: "", type: "First Name", required: true })}
          variant="outline" 
          size="sm"
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
        >
          <Plus className="w-4 h-4" />
          Add Field
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-white/40 backdrop-blur-sm overflow-hidden shadow-inner">
        {/* Header */}
        <div className="grid grid-cols-10 gap-4 p-4 border-b border-border/50 bg-primary/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">Field Name</div>
          <div className="col-span-4">Data Type</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/30">
          <AnimatePresence initial={false}>
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-10 gap-4 p-4 items-center group hover:bg-white/60 transition-colors"
              >
                <div className="col-span-1 flex justify-center text-muted-foreground cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="col-span-4">
                  <Input 
                    {...register(`schema.${index}.name` as const)}
                    placeholder="e.g. user_id" 
                    className="bg-white/50 border-border/50 focus:bg-white focus:ring-primary/20"
                  />
                </div>

                <div className="col-span-4">
                  <Select 
                    defaultValue={field.type} 
                  >
                    <div className="relative">
                      <select 
                        {...register(`schema.${index}.type` as const)}
                        className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-border/50 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none appearance-none transition-all cursor-pointer text-foreground"
                      >
                        {DATA_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {/* Custom arrow for styling */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </Select>
                </div>

                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {fields.length === 0 && (
          <div className="p-8 text-center text-muted-foreground bg-primary/5">
            <p>No fields defined yet. Add a field to start building your schema.</p>
          </div>
        )}
      </div>
    </div>
  );
}
