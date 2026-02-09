import React, { useState, useMemo } from 'react';
import {
    Upload, Plus, Trash2, Download, Table,
    FileJson, FileSpreadsheet, Database, Sparkles, Eye, Loader2, CheckCircle2, AlertCircle, ChevronDown, X
} from 'lucide-react';
import clsx from 'clsx';
import { generateDataset, uploadSample } from '../services/api';

const DatasetForm = () => {
    const [domain, setDomain] = useState('');
    const [description, setDescription] = useState('');
    const [rowCount, setRowCount] = useState(100);
    const [colCount, setColCount] = useState(5);
    const [schema, setSchema] = useState([
        { id: 1, name: 'id', type: 'Integer', required: true },
        { id: 2, name: 'first_name', type: 'Name', required: true },
        { id: 3, name: 'last_name', type: 'Name', required: true },
        { id: 4, name: 'email', type: 'Email', required: true },
        { id: 5, name: 'created_at', type: 'Date', required: true },
    ]);

    // Status states
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [generatedData, setGeneratedData] = useState(null);

    // Preview & Export states
    const [showPreview, setShowPreview] = useState(false);
    const [previewRows, setPreviewRows] = useState(25);
    const [exportFormat, setExportFormat] = useState('JSON');

    // Schema Column Types (Mapped to Backend SUPPORTED_DATATYPES)
    const columnTypes = [
        'String', 'Number', 'Integer', 'Float', 'Boolean',
        'Date', 'Email', 'Phone', 'URL', 'Address', 'Name',
        'Percentage', 'Currency'
    ];

    const handleAddRow = () => {
        const newId = schema.length > 0 ? Math.max(...schema.map(r => r.id)) + 1 : 1;
        setSchema([...schema, { id: newId, name: '', type: 'String', required: false }]);
    };

    const handleRemoveRow = (id) => {
        setSchema(schema.filter(row => row.id !== id));
    };

    const handleSchemaChange = (id, field, value) => {
        setSchema(schema.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleGenerate = async () => {
        if (!domain) {
            setStatus({ type: 'error', message: 'Please select a domain first.' });
            return;
        }

        if (!description.trim()) {
            setStatus({ type: 'error', message: 'Please provide a description for the dataset.' });
            return;
        }

        if (rowCount > 1000) {
            setStatus({ type: 'error', message: 'Maximum 1000 rows allowed for generation.' });
            return;
        }

        setIsGenerating(true);
        setStatus({ type: '', message: '' });
        setGeneratedData(null);
        setShowPreview(false);

        try {
            const columns = schema.map(({ name, type, required }) => ({
                name,
                datatype: type.toLowerCase(),
                required
            }));

            const payload = {
                topic: domain,
                description,
                rowCount: parseInt(rowCount),
                columns
            };

            const result = await generateDataset(payload);
            setGeneratedData(result.generatedData);
            setStatus({ type: 'success', message: 'Dataset generated successfully!' });
        } catch (error) {
            setStatus({ type: 'error', message: error.message || 'Failed to generate dataset. Please try again.' });
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
        const items = json;
        const replacer = (key, value) => value === null ? '' : value;
        const header = Object.keys(items[0]);
        const csv = [
            header.join(','),
            ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
        ].join('\r\n');
        return csv;
    };

    const handleDownload = () => {
        if (!generatedData) {
            setStatus({ type: 'error', message: 'No data to download. Generate a dataset first.' });
            return;
        }

        let content = '';
        let mimeType = '';
        let extension = '';

        if (exportFormat === 'JSON') {
            content = JSON.stringify(generatedData, null, 2);
            mimeType = 'application/json';
            extension = 'json';
        } else if (exportFormat === 'CSV' || exportFormat === 'Excel') {
            content = jsonToCsv(generatedData);
            mimeType = 'text/csv';
            extension = exportFormat === 'Excel' ? 'csv' : 'csv'; // Using CSV for Excel compatibility for now
            if (exportFormat === 'Excel') mimeType = 'application/vnd.ms-excel';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${domain.toLowerCase()}_dataset.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const previewData = useMemo(() => {
        if (!generatedData) return [];
        return generatedData.slice(0, previewRows);
    }, [generatedData, previewRows]);

    return (
        <div className="max-w-4xl mx-auto mt-8 px-4 pb-20 animate-fade-in">

            {/* 1. Top Section - Domain Selector */}
            <div className="flex justify-center mb-8">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-200 blur"></div>
                    <div className="relative bg-white rounded-xl p-1">
                        <select
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="appearance-none bg-transparent pl-4 pr-10 py-2 text-lg font-medium text-slate-700 outline-none cursor-pointer w-64 text-center"
                        >
                            <option value="" disabled>Select Domain *</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Finance">Finance</option>
                            <option value="E-commerce">E-commerce</option>
                            <option value="Education">Education</option>
                            <option value="HR">Human Resources</option>
                            <option value="CRM">CRM & Sales</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-8 space-y-8 relative overflow-hidden">
                {/* Decorative Background */}
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

                {/* 2. Prompt Input */}
                <div className="relative z-10 space-y-2">
                    <label className="text-sm font-semibold text-slate-600 ml-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Dataset Description <span className="text-red-500 font-bold">*</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full glass-input p-4 min-h-[120px] resize-y text-slate-700 placeholder:text-slate-400"
                        placeholder="Describe your data — e.g., Generate customer data for an e-commerce store with purchase history, including VIP status and lifetime value."
                    />
                </div>

                {/* 3. Row & Column Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 ml-1">Number of Rows</label>
                        <input
                            type="number"
                            min="1" max="1000"
                            value={rowCount}
                            onChange={(e) => setRowCount(parseInt(e.target.value) || 0)}
                            className="w-full glass-input py-3 px-4"
                        />
                        <p className="text-xs text-slate-400 ml-1">Min: 1, Max: 1,000</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 ml-1">Number of Columns</label>
                        <input
                            type="number"
                            min="1" max="30"
                            value={colCount}
                            onChange={(e) => setColCount(parseInt(e.target.value) || 0)}
                            className="w-full glass-input py-3 px-4"
                        />
                        <p className="text-xs text-slate-400 ml-1">Min: 1, Max: 30</p>
                    </div>
                </div>

                {/* 4. Schema Definition */}
                <div className="relative z-10 pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-lg font-bold text-slate-700 flex items-center gap-2">
                            <Table className="w-5 h-5 text-indigo-500" />
                            Schema Definition
                        </label>
                        <button
                            onClick={handleAddRow}
                            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Field
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Field Name</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4 text-center">Required</th>
                                    <th className="px-1 py-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {schema.map((row) => (
                                    <tr key={row.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-3">
                                            <input
                                                type="text"
                                                value={row.name}
                                                onChange={(e) => handleSchemaChange(row.id, 'name', e.target.value)}
                                                placeholder="e.g. user_id"
                                                className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none py-1 text-slate-700 placeholder:text-slate-300 transition-all font-medium"
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <select
                                                value={row.type}
                                                onChange={(e) => handleSchemaChange(row.id, 'type', e.target.value)}
                                                className="w-full bg-transparent outline-none text-slate-600 cursor-pointer text-sm py-1"
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
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleRemoveRow(row.id)}
                                                className="text-slate-300 group-hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 5. Upload Sample */}
                <div className="relative z-10 flex justify-center pt-2">
                    <label className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed transition-all group cursor-pointer",
                        isUploading ? "bg-slate-50 border-slate-200" : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50"
                    )}>
                        {isUploading ? <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" /> : <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />}
                        <span className="text-sm text-slate-500 group-hover:text-indigo-600">
                            {isUploading ? 'Uploading...' : 'Upload Sample Data (CSV/Excel)'}
                        </span>
                        <input
                            type="file"
                            className="hidden"
                            accept=".csv, .xlsx"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>
                </div>

                {/* 6. Generate Button */}
                <div className="pt-4 pb-4 flex justify-center relative z-10">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={clsx(
                            "gradient-btn px-12 py-4 rounded-full text-lg font-bold flex items-center gap-3 shadow-xl transition-all",
                            isGenerating ? "opacity-70 cursor-not-allowed" : "shadow-indigo-500/20 active:scale-95"
                        )}
                    >
                        {isGenerating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        )}
                        {isGenerating ? 'Generating...' : 'Generate Dataset'}
                    </button>
                </div>

                {/* 7. Post-Generation Actions (Preview & Download) */}
                {generatedData && (
                    <div className="pt-6 border-t border-slate-100 animate-fade-in relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                            {/* Left: Preview & Row Count */}
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className={clsx(
                                        "flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm",
                                        showPreview
                                            ? "bg-indigo-600 text-white shadow-indigo-200"
                                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                    )}
                                >
                                    <Eye className="w-4 h-4" />
                                    {showPreview ? 'Hide Preview' : 'Preview Data'}
                                </button>

                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Rows:</span>
                                    <select
                                        value={previewRows}
                                        onChange={(e) => setPreviewRows(parseInt(e.target.value))}
                                        className="bg-transparent text-sm font-semibold text-slate-600 outline-none cursor-pointer"
                                    >
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={75}>75</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                            </div>

                            {/* Right: Export & Download */}
                            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
                                    <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Export Format:</span>
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value)}
                                        className="bg-transparent text-sm font-bold text-indigo-600 outline-none cursor-pointer min-w-[70px]"
                                    >
                                        <option value="JSON">JSON</option>
                                        <option value="CSV">CSV</option>
                                        <option value="Excel">Excel</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>
                        </div>

                        {/* Data Preview Table */}
                        {showPreview && (
                            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md shadow-2xl animate-slide-up">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Database className="w-4 h-4 text-indigo-500" />
                                        Data Preview (First {previewRows} records)
                                    </h3>
                                    <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="overflow-x-auto max-h-[400px]">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur">
                                            <tr className="border-b border-slate-200">
                                                {Object.keys(generatedData[0]).map(key => (
                                                    <th key={key} className="px-6 py-4 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                                        {key}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {previewData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                                                    {Object.values(row).map((val, i) => (
                                                        <td key={i} className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                                            {typeof val === 'boolean' ? val.toString() : val}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default DatasetForm;
