interface PageTitleProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageTitle({ title, description, actions }: PageTitleProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-foreground text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
