// src/components/EnvBadge.tsx
const ENV = import.meta.env.VITE_APP_ENV;

const ENV_CONFIG: Record<string, { text: string; className: string }> = {
    dev: {
        text: "Development version",
        className: "bg-red-600 text-white",
    },
    staging: {
        text: "Staging version",
        className: "bg-yellow-500 text-black",
    },
};

export default function EnvBadge() {
    if (!ENV || ENV === "prod") return null;

    const config = ENV_CONFIG[ENV];
    if (!config) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div
                className={[
                    "px-4 py-2",
                    "text-sm font-semibold",
                    "rounded-xl shadow-lg",
                    "border border-white/20",
                    "backdrop-blur",
                    config.className,
                ].join(" ")}
            >
                {config.text}
            </div>
        </div>
    );
}
