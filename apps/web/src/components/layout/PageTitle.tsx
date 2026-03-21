interface PageTitleProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: string[];
}

export function PageTitle({ title, description, actions, breadcrumb }: PageTitleProps) {
  return (
    <div className="mb-5 border-b border-border pb-4">
      {breadcrumb && breadcrumb.length > 0 && (
        <p className="text-neutral-400 mb-1 text-xs">
          {breadcrumb.join(" > ")}
        </p>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-neutral-500 mt-0.5 text-xs">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
