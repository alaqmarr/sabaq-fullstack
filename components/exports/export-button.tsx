'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { getSessionExportData, getSabaqExportData } from '@/actions/exports';

interface ExportButtonProps {
    type: 'session' | 'sabaq';
    id: string;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    label?: string;
}

export function ExportButton({ type, id, variant = 'outline', size = 'default', label = 'Export' }: ExportButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            let result;
            if (type === 'session') {
                result = await getSessionExportData(id);
            } else {
                result = await getSabaqExportData(id);
            }

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to fetch data');
            }

            if (result.data.length === 0) {
                toast.warning('No data to export');
                return;
            }

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(result.data);

            // Auto-width columns
            const maxWidth = result.data.reduce((w, r) => Math.max(w, JSON.stringify(r).length), 10);
            const colWidth = { wch: maxWidth / Object.keys(result.data[0]).length + 5 };
            ws['!cols'] = Object.keys(result.data[0]).map(() => colWidth);

            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

            // Download file
            XLSX.writeFile(wb, result.filename || 'export.xlsx');
            toast.success('Export downloaded successfully');
        } catch (error: any) {
            console.error('Export failed:', error);
            toast.error(error.message || 'Failed to export data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleExport}
            disabled={loading}
            className="gap-2"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {label}
        </Button>
    );
}
