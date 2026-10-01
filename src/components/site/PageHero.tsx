import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  highlight,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden bg-ink pt-[var(--header-h)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 15%, rgba(194,161,93,.28) 0, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(220,196,144,.18) 0, transparent 50%)",
        }}
      />
      <div className="container-site relative py-16 sm:py-20 lg:py-24">
        {eyebrow ? <p className="eyebrow !text-gold-soft mb-5">{eyebrow}</p> : null}
        <h1 className="max-w-4xl text-[38px] leading-[1.02] text-champagne sm:text-[54px] lg:text-[66px]">
          {title}
          {highlight ? (
            <>
              {" "}
              <span className="italic gold-text">{highlight}</span>
            </>
          ) : null}
        </h1>
        <div className="rule-gold mt-7 w-44" />
        {description ? (
          <p className="mt-7 max-w-2xl text-[16px] leading-relaxed text-champagne/75 sm:text-[17px]">
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
