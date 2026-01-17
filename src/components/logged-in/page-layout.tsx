function Root({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      {children}
    </div>
  );
}

function Header({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between">{children}</div>;
}

function HeaderTitle({ title }: { title: string }) {
  return <h1 className="font-bold text-2xl">{title}</h1>;
}

function HeaderDescription({ description }: { description: string }) {
  return <p className="text-muted-foreground text-sm">{description}</p>;
}

function HeaderContent({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-start gap-2">{children}</div>;
}

export const PageLayout = {
  Root,
  Header,
  HeaderContent,
  HeaderTitle,
  HeaderDescription,
};
