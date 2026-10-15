import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "start",
  action,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "start" | "center";
  action?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${align === "center" ? "items-center text-center md:flex-col md:items-center" : ""}`} data-reveal>
      <div className={align === "center" ? "max-w-2xl" : "max-w-3xl"}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Tag className={`mt-3 text-balance font-extrabold ${Tag === "h1" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"}`}>{title}</Tag>
        {lead && <p className="mt-4 text-pretty text-base leading-relaxed text-muted sm:text-lg">{lead}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
