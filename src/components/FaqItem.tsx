import {ChevronDown} from "lucide-react";
import {useState} from "react";

const FaqItem = ({
                     question,
                     answer,
                 }: {
    question: string;
    answer: string;
}) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
            >
        <span className="text-base font-semibold text-slate-900">
          {question}
        </span>
                <ChevronDown
                    className={`w-5 h-5 text-slate-500 transition-transform ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {open && (
                <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                    {answer}
                </div>
            )}
        </div>
    );
};

export default FaqItem;
