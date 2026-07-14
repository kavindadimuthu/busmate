'use client';

import { Button } from '@busmate/ui';
import { RotateCcw } from 'lucide-react';

interface DraftRecoveryBannerProps {
    timestamp: string;
    onRestore: () => void;
    onDiscard: () => void;
}

export default function DraftRecoveryBanner({ timestamp, onRestore, onDiscard }: DraftRecoveryBannerProps) {
    const formattedTime = new Date(timestamp).toLocaleString();

    return (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-3 flex items-center gap-3">
            <RotateCcw className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-primary">
                    You have unsaved changes from <strong>{formattedTime}</strong>
                </p>
            </div>
            <Button size="sm" variant="outline" onClick={onDiscard} className="text-xs h-7">
                Discard
            </Button>
            <Button size="sm" onClick={onRestore} className="text-xs h-7">
                <RotateCcw className="h-3 w-3 mr-1" />
                Restore
            </Button>
        </div>
    );
}
