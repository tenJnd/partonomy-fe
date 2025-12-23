import React from "react";

export const MobileMainTabs: React.FC<{
    t: any;
    mobileMainTab: "preview" | "details";
    setMobileMainTab: React.Dispatch<React.SetStateAction<"preview" | "details">>;
}> = ({t, mobileMainTab, setMobileMainTab}) => {
    return (
        <div className="xl:hidden mb-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setMobileMainTab("preview")}
                        className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                            mobileMainTab === "preview"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                        {t("documents.detail.tabs.preview") ?? "Preview"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileMainTab("details")}
                        className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                            mobileMainTab === "details"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                        {t("documents.detail.tabs.details") ?? "Details"}
                    </button>
                </div>
            </div>
        </div>
    );
};
