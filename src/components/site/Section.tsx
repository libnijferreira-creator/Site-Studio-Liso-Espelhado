import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  align = "center",
  tone = "dark",
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  description?: string;
  align?: "center" | "left";
  tone?: "dark" | "light";
}) {
  const centered = align === "center";
  const titleColor = tone === "light" ? "text-champagne" : "text-ink";
  const descColor =
    tone === "light" ? "text-champagne/70" : "text-espresso-soft/85";

  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? <p className={`eyebrow mb-5 ${tone === "light" ? "!text-gold-soft" : ""}`}>{eyebrow}</p> : null}
      <h2 className={`text-[34px] leading-[1.05] sm:text-[44px] lg:text-[54px] ${titleColor}`}>
        {title}
        {highlight ? (
          <>
            {" "}
            <span className="italic gold-text">{highlight}</span>
          </>
        ) : null}
      </h2>
      {centered ? <div className="rule-gold mx-auto mt-7 w-40" /> : <div className="rule-gold mt-7 w-40" />}
      {description ? (
        <p className={`mt-7 text-[15px] leading-relaxed sm:text-base ${descColor}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Section({
  children,
  className = "",
  id,
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "light" | "dark";
}) {
  return (
    <section
      id={id}
      className={`py-20 sm:py-24 lg:py-28 ${
        tone === "dark" ? "bg-ink text-champagne" : ""
      } ${className}`}
    >
      <div className="container-site">{children}</div>
    </section>
  );
}
