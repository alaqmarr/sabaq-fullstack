'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ItsImageTest() {
    const [itsNumber, setItsNumber] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleTest = () => {
        if (!itsNumber) return;
        // Direct link to ITS52 image
        const url = `https://www.its52.com/GetImage.aspx?ID=${itsNumber}`;
        setImageUrl(url);
        setError(null);
    };

    return (
        <Card className="w-full max-w-md mx-auto mt-8">
            <CardHeader>
                <CardTitle>Test ITS Image Loading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                    <p className="mb-2">To fetch the image, you must be logged into ITS52.com in this browser.</p>
                    <a
                        href="https://www.its52.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                    >
                        Open ITS52.com to Login
                    </a>
                </div>

                <div className="flex gap-2">
                    <Input
                        placeholder="Enter ITS Number"
                        value={itsNumber}
                        onChange={(e) => setItsNumber(e.target.value)}
                    />
                    <Button onClick={handleTest}>Load Image</Button>
                </div>

                {imageUrl && (
                    <div className="border rounded-lg p-4 flex flex-col items-center gap-2">
                        <p className="text-xs text-muted-foreground break-all">{imageUrl}</p>
                        <img
                            src={imageUrl}
                            alt="ITS Profile"
                            className="w-32 h-32 object-cover rounded-full border-2 border-gray-200"
                            onError={() => setError('Failed to load image. Likely due to authentication or hotlinking protection.')}
                        />
                        {error && (
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
