import type { ElementType } from "react";

export function PlaceholderScreen({
  title,
  version,
  description,
  Icon,
}: {
  title: string;
  version: string;
  description: string;
  Icon: ElementType;
}) {
  return (
    <>
      <div className="border-b border-border bg-card">
        <div className="px-8 py-6">
          <div className="font-body text-[10px] uppercase tracking-widest text-muted">
            {version}
          </div>
          <h1 className="font-head font-bold text-[36px] tracking-tightest leading-none mt-1">
            {title}
          </h1>
        </div>
      </div>
      <div className="px-8 py-12">
        <div className="card-base p-12 max-w-2xl mx-auto text-center">
          <Icon size={36} className="text-accent mx-auto" strokeWidth={1.5} />
          <div className="font-head font-bold text-2xl tracking-tightest mt-4">
            COMING SOON
          </div>
          <p className="font-body text-sm text-muted mt-3 max-w-lg mx-auto leading-relaxed">
            {description}
          </p>
          <p className="font-body text-[10px] uppercase tracking-widest text-muted mt-6">
            See ClipEngine_PRD_v1.0.md for the full spec
          </p>
        </div>
      </div>
    </>
  );
}
