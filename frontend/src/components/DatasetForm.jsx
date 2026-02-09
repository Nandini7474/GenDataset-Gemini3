import React, { useState, useMemo, useEffect } from 'react';
import {
    Upload, Plus, Trash2, Download, Table,
    FileJson, FileSpreadsheet, Database, Sparkles, Eye, Loader2, CheckCircle2, AlertCircle, ChevronDown, X, Edit3
} from 'lucide-react';
import clsx from 'clsx';
import { generateDataset, uploadSample } from '../services/api';

const DOMAIN_SUGGESTIONS = {
    'Healthcare': [
        { name: 'patient_id', type: 'Integer', required: true },
        { name: 'patient_name', type: 'Name', required: true },
        { name: 'date_of_birth', type: 'Date', required: true },
        { name: 'email', type: 'Email', required: false },
        { name: 'blood_type', type: 'String', required: false },
        { name: 'diagnosis', type: 'String', required: true },
        { name: 'doctor_id', type: 'Integer', required: true }
    ],
    'Finance': [
        { name: 'transaction_id', type: 'Integer', required: true },
        { name: 'account_number', type: 'String', required: true },
        { name: 'amount', type: 'Currency', required: true },
        { name: 'transaction_date', type: 'Date', required: true },
        { name: 'transaction_type', type: 'String', required: true },
        { name: 'status', type: 'String', required: false }
    ],
    'E-commerce': [
        { name: 'order_id', type: 'Integer', required: true },
        { name: 'product_name', type: 'String', required: true },
        { name: 'category', type: 'String', required: true },
        { name: 'price', type: 'Currency', required: true },
        { name: 'customer_email', type: 'Email', required: true },
        { name: 'order_date', type: 'Date', required: true }
    ],
    'Education': [
        { name: 'student_id', type: 'Integer', required: true },
        { name: 'student_name', type: 'Name', required: true },
        { name: 'grade_level', type: 'Integer', required: true },
        { name: 'subjects', type: 'String', required: false },
        { name: 'enrollment_date', type: 'Date', required: true }
    ],
    'HR': [
        { name: 'employee_id', type: 'Integer', required: true },
        { name: 'full_name', type: 'Name', required: true },
        { name: 'department', type: 'String', required: true },
        { name: 'salary', type: 'Currency', required: true },
        { name: 'joining_date', type: 'Date', required: true }
    ],
    'CRM': [
        { name: 'lead_id', type: 'Integer', required: true },
        { name: 'contact_name', type: 'Name', required: true },
        { name: 'company', type: 'String', required: true },
        { name: 'lead_status', type: 'String', required: true },
        { name: 'last_contact', type: 'Date', required: false }
    ],
    'Logistics': [
        { name: 'shipment_id', type: 'String', required: true },
        { name: 'origin', type: 'Address', required: true },
        { name: 'destination', type: 'Address', required: true },
        { name: 'delivery_date', type: 'Date', required: true },
        { name: 'weight_kg', type: 'Float', required: true }
    ],
    'Real Estate': [
        { name: 'property_id', type: 'Integer', required: true },
        { name: 'address', type: 'Address', required: true },
        { name: 'property_type', type: 'String', required: true },
        { name: 'price', type: 'Currency', required: true },
        { name: 'sqft', type: 'Integer', required: true }
    ],
    'Social Media': [
        { name: 'user_id', type: 'Integer', required: true },
        { name: 'username', type: 'String', required: true },
        { name: 'post_content', type: 'String', required: true },
        { name: 'likes_count', type: 'Integer', required: false },
        { name: 'post_date', type: 'Date', required: true }
    ]
};

const domainsList = [
    "Healthcare", "Finance", "E-commerce", "Education", "HR", "CRM",
    "Logistics", "Real Estate", "Automotive", "Sports", "Travel",
    "Cybersecurity", "Social Media", "Retail", "Other"
];

const DatasetForm = () => {
    const [domain, setDomain] = useState('');
    const [customDomain, setCustomDomain] = useState('');
    const [description, setDescription] = useState('');
    const [rowCount, setRowCount] = useState(100);
    const [colCount, setColCount] = useState(5);
    const [schema, setSchema] = useState([]);
    const [editedFields, setEditedFields] = useState(new Set());

    // Status states
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [generatedData, setGeneratedData] = useState(null);

    // Preview & Export states
    const [showPreview, setShowPreview] = useState(false);
    const [previewRows, setPreviewRows] = useState(25);
    const [exportFormat, setExportFormat] = useState('JSON');

    const columnTypes = [
        'String', 'Number', 'Integer', 'Float', 'Boolean',
        'Date', 'Email', 'Phone', 'URL', 'Address', 'Name',
        'Percentage', 'Currency'
    ];

    // Sync schema with colCount and Domain
    useEffect(() => {
        const suggestions = DOMAIN_SUGGESTIONS[domain] || [];
        const newSchema = [...schema];

        if (newSchema.length < colCount) {
            // Add rows
            for (let i = newSchema.length; i < colCount; i++) {
                const suggestion = suggestions[i];
                newSchema.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: suggestion ? suggestion.name : '',
                    type: suggestion ? suggestion.type : 'String',
                    required: suggestion ? suggestion.required : false,
                    isSuggested: !!suggestion && !editedFields.has(i)
                });
            }
        } else if (newSchema.length > colCount) {
            // Remove rows
            newSchema.splice(colCount);
        }

        setSchema(newSchema);
    }, [colCount, domain]);

    const handleSchemaChange = (id, field, value) => {
        setSchema(schema.map(row => {
            if (row.id === id) {
                const newRow = { ...row, [field]: value };
                // If the user edited name or type, it's no longer a pure suggestion
                if (field === 'name' || field === 'type') {
                    setEditedFields(prev => new Set(prev).add(id));
                }
                return newRow;
            }
            return row;
        }));
    };

    const handleDomainChange = (e) => {
        const val = e.target.value;
        setDomain(val);
        setEditedFields(new Set()); // Reset edited state when domain changes to allow new suggestions

        // Populate schema based on domain
        const suggestions = DOMAIN_SUGGESTIONS[val] || [];
        const newSchema = [];
        for (let i = 0; i < colCount; i++) {
            const suggestion = suggestions[i];
            newSchema.push({
                id: Math.random().toString(36).substr(2, 9),
                name: suggestion ? suggestion.name : '',
                type: suggestion ? suggestion.type : 'String',
                required: suggestion ? suggestion.required : false
            });
        }
        setSchema(newSchema);
    };

    const handleGenerate = async () => {
        const actualDomain = domain === 'Other' ? customDomain : domain;
        if (!actualDomain) {
            setStatus({ type: 'error', message: 'Please select or enter a domain.' });
            return;
        }

        if (!description.trim()) {
            setStatus({ type: 'error', message: 'Please provide a description for the dataset.' });
            return;
        }

        setIsGenerating(true);
        setStatus({ type: '', message: '' });

        try {
            const columns = schema.map(({ name, type, required }) => ({
                name: name || 'column_' + Math.random().toString(36).substr(2, 4),
                datatype: type.toLowerCase(),
                required
            }));

            const payload = {
                topic: actualDomain,
                description,
                rowCount: parseInt(rowCount),
                columns
            };

            const result = await generateDataset(payload);
            setGeneratedData(result.generatedData);
            setStatus({ type: 'success', message: 'Dataset generated successfully!' });
        } catch (error) {
            setStatus({ type: 'error', message: error.message || 'Failed to generate dataset.' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setStatus({ type: '', message: '' });

        try {
            const result = await uploadSample(file);
            setStatus({ type: 'success', message: `File "${result.data.filename}" uploaded and analyzed! Found ${result.data.totalRows} rows.` });

            if (description === '') {
                setDescription(`Based on sample file: ${result.data.filename}`);
            }
        } catch (error) {
            setStatus({ type: 'error', message: error.message || 'Failed to upload sample file.' });
        } finally {
            setIsUploading(false);
        }
    };

    const jsonToCsv = (json) => {
        if (!json || json.length === 0) return '';
        const header = Object.keys(json[0]);
        const csv = [
            header.join(','),
            ...json.map(row => header.map(field => JSON.stringify(row[field] ?? '')).join(','))
        ].join('\r\n');
        return csv;
    };

    const handleDownload = () => {
        if (!generatedData) return;
        let content = exportFormat === 'JSON' ? JSON.stringify(generatedData, null, 2) : jsonToCsv(generatedData);
        let mime = exportFormat === 'JSON' ? 'application/json' : 'text/csv';
        let ext = exportFormat === 'JSON' ? 'json' : 'csv';

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(domain === 'Other' ? customDomain : domain).toLowerCase()}_dataset.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="max-w-4xl mx-auto mt-8 px-4 pb-20 animate-fade-in">

            {/* Expanded Domain Selector */}
            <div className="w-full mb-8 space-y-4">
                <div className="relative group w-full">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-10 group-hover:opacity-20 transition duration-300 blur-xl"></div>
                    <div className="relative bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-2 flex flex-col md:flex-row gap-2">
                        <div className="flex-1 relative">
                            <select
                                value={domain}
                                onChange={handleDomainChange}
                                className="w-full appearance-none bg-transparent pl-4 pr-10 py-3 text-lg font-bold text-slate-700 outline-none cursor-pointer"
                            >
                                <option value="" disabled>Select Core Domain *</option>
                                {domainsList.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>

                        {domain === 'Other' && (
                            <div className="flex-1 animate-scale-in">
                                <input
                                    type="text"
                                    placeholder="Enter your custom domain..."
                                    value={customDomain}
                                    onChange={(e) => setCustomDomain(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-lg font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="glass-panel p-8 space-y-8 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                {/* Status Messages */}
                {status.message && (
                    <div className={clsx(
                        "relative z-20 flex items-center gap-3 p-4 rounded-xl border animate-fade-in",
                        status.type === 'error' ? "bg-red-50 border-red-100 text-red-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"
                    )}>
                        {status.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        <p className="text-sm font-medium">{status.message}</p>
                    </div>
                )}

                {/* Dataset Description */}
                <div className="relative z-10 space-y-2">
                    <label className="text-sm font-semibold text-slate-600 ml-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Dataset Description <span className="text-red-500 font-bold">*</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full glass-input p-4 min-h-[120px] resize-y text-slate-700 placeholder:text-slate-400"
                        placeholder="Describe your data requirements in detail..."
                    />
                </div>

                {/* Row & Column Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 ml-1">Number of Rows</label>
                        <input
                            type="number"
                            min="1" max="1000"
                            value={rowCount}
                            onChange={(e) => setRowCount(parseInt(e.target.value) || 0)}
                            className="w-full glass-input py-3 px-4 font-bold"
                        />
                        <p className="text-xs text-slate-400 ml-1">Limit: 1,000</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 ml-1">Number of Columns</label>
                        <input
                            type="number"
                            min="1" max="30"
                            value={colCount}
                            onChange={(e) => setColCount(Math.min(30, parseInt(e.target.value) || 1))}
                            className="w-full glass-input py-3 px-4 font-bold border-indigo-200 ring-2 ring-indigo-50"
                        />
                        <p className="text-xs text-indigo-400 ml-1 font-medium italic">Adjusting this will update the schema table below.</p>
                    </div>
                </div>

                {/* Schema Definition */}
                <div className="relative z-10 pt-4">
                    <label className="text-lg font-bold text-slate-700 flex items-center gap-2 mb-4">
                        <Table className="w-5 h-5 text-indigo-500" />
                        Schema Configuration
                        {schema.length > 0 && <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{schema.length} fields</span>}
                    </label>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                                    <th className="px-6 py-4">Field Name</th>
                                    <th className="px-6 py-4">Datatype</th>
                                    <th className="px-6 py-4 text-center">Required</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {schema.map((row) => (
                                    <tr key={row.id} className="hover:bg-indigo-50/20 transition-colors group">
                                        <td className="px-6 py-3">
                                            <input
                                                type="text"
                                                value={row.name}
                                                onChange={(e) => handleSchemaChange(row.id, 'name', e.target.value)}
                                                placeholder="Field name..."
                                                className={clsx(
                                                    "w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none py-1 transition-all font-medium",
                                                    !editedFields.has(row.id) ? "text-slate-400 italic" : "text-slate-700"
                                                )}
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <select
                                                value={row.type}
                                                onChange={(e) => handleSchemaChange(row.id, 'type', e.target.value)}
                                                className={clsx(
                                                    "w-full bg-transparent outline-none cursor-pointer text-sm py-1 font-medium",
                                                    !editedFields.has(row.id) ? "text-slate-400 italic" : "text-slate-700"
                                                )}
                                            >
                                                {columnTypes.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={row.required}
                                                onChange={(e) => handleSchemaChange(row.id, 'required', e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="relative z-10 flex justify-center">
                    <label className={clsx(
                        "flex items-center gap-2 px-6 py-2 rounded-xl border border-dashed transition-all group cursor-pointer",
                        isUploading ? "bg-slate-50 border-slate-200" : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50"
                    )}>
                        {isUploading ? <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" /> : <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />}
                        <span className="text-sm font-medium text-slate-500 group-hover:text-indigo-600">Upload Reference Sample</span>
                        <input type="file" className="hidden" accept=".csv, .xlsx" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                </div>

                {/* Main Generate Button */}
                <div className="flex justify-center pt-4 relative z-10">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={clsx(
                            "gradient-btn px-20 py-4 rounded-full text-xl font-black flex items-center gap-4 shadow-2xl transition-all",
                            isGenerating ? "opacity-70 scale-95" : "hover:scale-105 active:scale-95"
                        )}
                    >
                        {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 animate-pulse text-yellow-300" />}
                        {isGenerating ? 'Building Dataset...' : 'Generate Dataset'}
                    </button>
                </div>

                {/* Actions & Preview Area */}
                {generatedData && (
                    <div className="pt-8 border-t border-slate-100 animate-slide-up relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className={clsx(
                                        "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm",
                                        showPreview ? "bg-indigo-600 text-white" : "bg-white text-slate-700 border hover:bg-slate-50"
                                    )}
                                >
                                    <Eye className="w-5 h-5" />
                                    {showPreview ? 'Close Preview' : 'Preview Result'}
                                </button>
                                <div className="flex items-center gap-3 bg-white border rounded-2xl px-4 py-2.5 shadow-sm">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Viewport</span>
                                    <select
                                        value={previewRows}
                                        onChange={(e) => setPreviewRows(parseInt(e.target.value))}
                                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                                    >
                                        {[25, 50, 75, 100].map(n => <option key={n} value={n}>{n} rows</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 bg-white border rounded-2xl px-4 py-2.5 shadow-sm">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Export As</span>
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value)}
                                        className="bg-transparent text-sm font-black text-indigo-600 outline-none cursor-pointer"
                                    >
                                        <option value="JSON">JSON</option>
                                        <option value="CSV">CSV</option>
                                        <option value="Excel">EXCEL</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-black transition-all shadow-xl active:scale-95"
                                >
                                    <Download className="w-5 h-5" />
                                    Export
                                </button>
                            </div>
                        </div>

                        {showPreview && (
                            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-scale-in max-h-[500px] overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-100 z-10">
                                        <tr>
                                            {Object.keys(generatedData[0]).map(k => (
                                                <th key={k} className="px-6 py-4 text-xs font-black text-slate-500 uppercase border-b">{k}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {generatedData.slice(0, previewRows).map((r, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                {Object.values(r).map((v, j) => (
                                                    <td key={j} className="px-6 py-4 text-sm text-slate-600">{v?.toString()}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatasetForm;
