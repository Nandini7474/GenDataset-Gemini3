import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 text-center space-y-6 animate-scale-in">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-10 h-10 text-red-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Something went wrong</h2>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                We encountered an unexpected error. Don't worry, your data is safe.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl text-left overflow-hidden">
                            <p className="text-[10px] font-mono text-slate-400 uppercase mb-2">Error Details</p>
                            <p className="text-xs font-mono text-red-600 truncate">
                                {this.state.error?.toString()}
                            </p>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
