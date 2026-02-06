import React, { useState } from 'react';
import {
    Upload, Plus, Trash2, Download, Table,
    FileJson, FileSpreadsheet, Database, Sparkles, Eye
} from 'lucide-react';
import clsx from 'clsx';

const DatasetForm = () => {
    const [domain, setDomain] = useState('');
    const [description, setDescription] = useState('');
    const [rowCount, setRowCount] = useState(100);
    const [colCount, setColCount] = useState(5);
    const [schema, setSchema] = useState([
        { id: 1, name: 'id', type: 'Row Number', required: true },
        { id: 2, name: 'first_name', type: 'First Name', required: true },
        { id: 3, name: 'last_name', type: 'Last Name', required: true },
        { id: 4, name: 'email', type: 'Email', required: true },
        { id: 5, name: 'created_at', type: 'Date', required: true },
    ]);

    // Schema Column Types
    const columnTypes = [
        'Row Number', 'First Name', 'Last Name', 'Email', 'Phone',
        'Address', 'City', 'Country', 'Date', 'Boolean',
        'Integer', 'Float', 'Currency', 'Text', 'Paragraph',
        'IP Address', 'UUID'
    ];

    const handleAddRow = () => {
        const newId = schema.length > 0 ? Math.max(...schema.map(r => r.id)) + 1 : 1;
        setSchema([...schema, { id: newId, name: '', type: 'Text', required: false }]);
    };

    const handleRemoveRow = (id) => {
        setSchema(schema.filter(row => row.id !== id));
    };

    const handleSchemaChange = (id, field, value) => {
        setSchema(schema.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

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
                {/* Decorative Background Blob */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

                {/* 2. Prompt Input */}
                <div className="relative z-10 space-y-2">
                    <label className="text-sm font-semibold text-slate-600 ml-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Dataset Description <span className="text-slate-400 font-normal">(Optional)</span>
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
                            min="1" max="100000"
                            value={rowCount}
                            onChange={(e) => setRowCount(parseInt(e.target.value))}
                            className="w-full glass-input py-3 px-4"
                        />
                        <p className="text-xs text-slate-400 ml-1">Min: 1, Max: 100,000</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 ml-1">Number of Columns</label>
                        <input
                            type="number"
                            min="1" max="30"
                            value={colCount}
                            onChange={(e) => setColCount(parseInt(e.target.value))}
                            className="w-full glass-input py-3 px-4"
                        />
                        <p className="text-xs text-slate-400 ml-1">Min: 1, Max: 30</p>
                    </div>
                </div>

                {/* 4. Schema Definition Table */}
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
                                    <th className="px-6 py-4 w-16"></th>
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
                                        <td className="px-6 py-3 text-center">
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

                {/* 5. Sample Data Upload */}
                <div className="relative z-10 flex justify-center pt-2">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all group">
                        <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                        <span className="text-sm text-slate-500 group-hover:text-indigo-600">Upload Sample Data (CSV/Excel)</span>
                        <input type="file" className="hidden" accept=".csv, .xlsx" />
                    </label>
                </div>

                {/* 6. Generate Button */}
                <div className="pt-8 pb-4 flex justify-center relative z-10">
                    <button className="gradient-btn px-12 py-4 rounded-full text-lg font-bold flex items-center gap-3 shadow-xl shadow-indigo-500/20">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                        Generate Dataset
                    </button>
                </div>

            </div>

            {/* 7. Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 py-4 px-8 flex flex-col md:flex-row items-center justify-between gap-4 z-40 animate-slide-up">

                <button className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <Eye className="w-5 h-5" />
                    Preview Data
                </button>

                <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-lg">
                    <span className="text-xs font-semibold text-slate-500 px-3 uppercase tracking-wider">Format:</span>
                    <select className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer pr-2">
                        <option>CSV</option>
                        <option>JSON</option>
                        <option>Excel</option>
                        <option>SQL</option>
                    </select>
                </div>

                <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-slate-900/20">
                    <Download className="w-4 h-4" />
                    Download
                </button>
            </div>

        </div>
    );
};

export default DatasetForm;
