import { FC } from "react";

interface PageTitleProps {
  title: string;
  description?: string;
}

export const PageTitle: FC<PageTitleProps> = ({ title, description }) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-foreground">{title}</h1>
      {description && (
        <p className="mt-2 text-muted-foreground">{description}</p>
      )}
    </div>
  );
};