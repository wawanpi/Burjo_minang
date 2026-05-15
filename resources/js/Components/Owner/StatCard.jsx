export default function StatCard({ title, value, icon, color = "amber" }) {
    const colorMap = {
        amber:  { bg: "bg-amber-50",  icon: "bg-amber-100 text-amber-700",  text: "text-amber-700"  },
        green:  { bg: "bg-green-50",  icon: "bg-green-100 text-green-700",  text: "text-green-700"  },
        blue:   { bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-700",    text: "text-blue-700"   },
        red:    { bg: "bg-red-50",    icon: "bg-red-100 text-red-700",      text: "text-red-700"    },
    };

    const c = colorMap[color] ?? colorMap.amber;

    return (
        <div className={`rounded-xl ${c.bg} p-5 shadow-sm border border-gray-100`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className={`mt-1 text-2xl font-bold ${c.text}`}>{value}</p>
                </div>
                <div className={`rounded-full p-3 ${c.icon}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}