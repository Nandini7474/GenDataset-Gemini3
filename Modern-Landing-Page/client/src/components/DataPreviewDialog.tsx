import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface PreviewProps {
  schema: Array<{ name: string; type: string }>;
}

export function DataPreviewDialog({ schema }: PreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate fake mock data based on schema
  const mockData = Array.from({ length: 100 }).map((_, i) => {
    const row: Record<string, string> = {};
    schema.forEach(field => {
      if (field.type === 'Row Number') row[field.name] = (i + 1).toString();
      else if (field.type === 'First Name') row[field.name] = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'][i % 5];
      else if (field.type === 'Last Name') row[field.name] = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][i % 5];
      else if (field.type === 'Email') row[field.name] = `user${i+1}@example.com`;
      else row[field.name] = 'Sample Data';
    });
    return row;
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
          <Eye className="w-4 h-4" />
          Preview Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl glass-panel border-white/50 max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Data Preview (Read-only)
          </DialogTitle>
        </DialogHeader>
        
        <div className="rounded-xl border border-border overflow-auto bg-white/50 mt-4 flex-1">
          <Table>
            <TableHeader className="bg-primary/5 sticky top-0 z-10">
              <TableRow>
                {schema.map((field, idx) => (
                  <TableHead key={idx} className="font-semibold text-primary">{field.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((row, idx) => (
                <TableRow 
                  key={idx}
                  className="hover:bg-primary/5 transition-colors"
                >
                  {schema.map((field, cellIdx) => (
                    <TableCell key={cellIdx} className="font-mono text-xs">{row[field.name]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
