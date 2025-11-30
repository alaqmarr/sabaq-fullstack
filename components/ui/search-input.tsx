'use client';

import { Search, X } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { useState, useEffect } from 'react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
    className?: string;
}

export function SearchInput({
    value,
    onChange,
    placeholder = "Search...",
    debounceMs = 300,
    className = ""
}: SearchInputProps) {
    const [localValue, setLocalValue] = useState(value);

    // Debounce the search
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localValue);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [localValue, debounceMs, onChange]);

    // Sync with external value changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleClear = () => {
        setLocalValue('');
        onChange('');
    };

    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder={placeholder}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="pl-9 pr-9"
            />
            {localValue && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={handleClear}
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}
