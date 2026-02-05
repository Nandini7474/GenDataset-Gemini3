import { Layout } from "@/components/ui/Layout";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Wand2, Download, FileJson, FileSpreadsheet, Database, Upload, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { SchemaBuilder } from "@/components/SchemaBuilder";
import { useCreateDataset } from "@/hooks/use-datasets";
import { useToast } from "@/hooks/use-toast";
import { DataPreviewDialog } from "@/components/DataPreviewDialog";
import { useState } from "react";

// Schema for form validation
const datasetFormSchema = z.object({
  domain: z.string().min(1, "Please select a domain"),
  description: z.string().optional(),
  rowCount: z.coerce.number().min(1).max(100000),
  colCount: z.coerce.number().min(1).max(30),
  schema: z.array(z.object({
    name: z.string().min(1, "Field name required"),
    type: z.string(),
    required: z.boolean(),
  })).min(1, "At least one field is required"),
});

export type DatasetFormData = z.infer<typeof datasetFormSchema>;

export default function Home() {
  const { toast } = useToast();
  const createDataset = useCreateDataset();
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const form = useForm<DatasetFormData>({
    resolver: zodResolver(datasetFormSchema),
    defaultValues: {
      domain: "",
      description: "",
      rowCount: 100,
      colCount: 5,
      schema: [
        { name: "id", type: "Row Number", required: true },
        { name: "first_name", type: "First Name", required: true },
        { name: "last_name", type: "Last Name", required: true },
        { name: "email", type: "Email", required: true },
        { name: "created_at", type: "Date", required: true },
      ],
    },
  });

  const schema = useWatch({ control: form.control, name: "schema" });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
      toast({
        title: "File Uploaded",
        description: `Successfully loaded schema from ${file.name}`,
      });
      // In a real app, parse CSV here to populate schema
    }
  };

  const onSubmit = (data: DatasetFormData) => {
    createDataset.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Dataset Configuration Saved",
          description: "Your dataset is being generated. Check history for details.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-tight">
            Generate synthetic data <br />
            <span className="text-gradient">in seconds.</span>
          </h1>
          <p className="text-lg text-muted-foreground font-light">
            Create realistic datasets for testing, ML training, and demos without compromising privacy.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Main Configuration Card */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Settings */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-base font-semibold">Dataset Domain <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <select 
                      {...form.register("domain")}
                      className="w-full h-12 px-4 rounded-xl border border-border bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all appearance-none"
                    >
                      <option value="" disabled>Select a domain...</option>
                      <option value="healthcare">Healthcare (Patients, Records)</option>
                      <option value="finance">Finance (Transactions, Accounts)</option>
                      <option value="ecommerce">E-commerce (Orders, Products)</option>
                      <option value="education">Education (Students, Grades)</option>
                      <option value="crm">CRM (Leads, Deals)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                       <Database className="w-4 h-4 opacity-50" />
                    </div>
                  </div>
                  {form.formState.errors.domain && <p className="text-sm text-destructive">{form.formState.errors.domain.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                  <Textarea 
                    {...form.register("description")}
                    placeholder="Describe the context of your data e.g., Generate customer transaction history for Q4 2024..." 
                    className="min-h-[120px] rounded-xl bg-white/50 border-border focus:bg-white resize-none"
                  />
                </div>
              </div>

              {/* Right Column: Dimensions */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rowCount" className="text-base font-semibold">Rows</Label>
                    <Input 
                      type="number"
                      {...form.register("rowCount")}
                      className="h-12 rounded-xl bg-white/50 border-border focus:bg-white"
                    />
                    <p className="text-xs text-muted-foreground">Max 100,000</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colCount" className="text-base font-semibold">Columns</Label>
                    <Input 
                      type="number"
                      {...form.register("colCount")}
                      readOnly
                      className="h-12 rounded-xl bg-gray-50 border-border opacity-70 cursor-not-allowed"
                      value={schema.length}
                    />
                    <p className="text-xs text-muted-foreground">Auto-calculated</p>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Upload className="w-5 h-5" />
                    <h3>Import Structure</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV or Excel file to automatically detect and build the schema.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      {uploadedFile ? uploadedFile : "Choose File"}
                    </Button>
                    <input 
                      id="file-upload" 
                      type="file" 
                      accept=".csv,.xlsx" 
                      className="hidden"
                      onChange={handleFileUpload} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Schema Builder Section */}
            <div className="pt-4 border-t border-border/50 space-y-4">
              <SchemaBuilder control={form.control} register={form.register} />
              
              <div className="flex justify-center pt-2">
                <Button 
                  type="button"
                  size="lg"
                  className="btn-gradient w-full sm:w-auto px-8 text-base font-semibold shadow-lg shadow-primary/20"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Dataset by AI
                </Button>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <DataPreviewDialog schema={schema} />
                
                <Select defaultValue="csv">
                  <SelectTrigger className="w-[140px] bg-white">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv"><div className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4"/> CSV</div></SelectItem>
                    <SelectItem value="json"><div className="flex items-center gap-2"><FileJson className="w-4 h-4"/> JSON</div></SelectItem>
                    <SelectItem value="sql"><div className="flex items-center gap-2"><Database className="w-4 h-4"/> SQL</div></SelectItem>
                    <SelectItem value="txt"><div className="flex items-center gap-2"><FileText className="w-4 h-4"/> Text</div></SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  type="button"
                  size="lg"
                  className="btn-gradient w-full sm:w-auto px-8 text-base font-semibold shadow-lg shadow-primary/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Dataset
                </Button>
              </div>

              <div className="hidden sm:block text-sm text-muted-foreground">
                Estimated size: <span className="font-mono text-foreground font-medium">~2.4 MB</span>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
}
