// src/components/ErrorAlert.tsx
import {AlertTriangle} from "lucide-react";

export default function ErrorAlert({message}: { message: string }) {
    return (
        <div
            className="flex items-start gap-2 p-3 mb-4 rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700">
            <AlertTriangle className="w-4 h-4 mt-0.5"/>
            <span>{message}</span>
        </div>
    );
}
