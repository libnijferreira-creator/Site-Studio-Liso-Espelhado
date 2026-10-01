import type { Metadata } from "next";
import { PageHero } from "./PageHero";
import { CtaBanner } from "./CtaBanner";

export interface LegalSection {
  h: string;
  p?: string[];
  ul?: string[];
  table?: { k: string; v: string }[];
}

export function LegalPage({
  title,
  highlight,
  eyebrow,
  description,
  updated,
  sections,
}: {
  title: string;
  highlight?: string;
  eyebrow: string;
  description: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero
        eyebrow={eyebrow}
        title={title}
        highlight={highlight}
        description={description}
      />

      <section className="py-14 sm:py-20">
        <div className="container-site max-w-3xl">
          <p className="mb-9 border-l-2 border-gold/60 pl-5 text-[13px] text-espresso-soft/75">
            Última atualização: <strong>{updated}</strong>
          </p>

          <div className="space-y-11">
            {sections.map((s, i) => (
              <article key={s.h}>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold-deep">
                  {`${i + 1}`.padStart(2, "0")}
                </p>
                <h2 className="mt-2.5 text-[25px] leading-tight">{s.h}</h2>

                {s.p?.map((par, j) => (
                  <p
                    key={j}
                    className="mt-4 text-[15px] leading-[1.85] text-espresso-soft/85"
                  >
                    {par}
                  </p>
                ))}

                {s.ul ? (
                  <ul className="mt-5 space-y-2.5">
                    {s.ul.map((item, j) => (
                      <li
                        key={j}
                        className="relative pl-6 text-[15px] leading-[1.8] text-espresso-soft/85"
                      >
                        <span className="absolute left-0 top-[0.72em] h-[5px] w-[5px] rotate-45 bg-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {s.table ? (
                  <div className="mt-5 overflow-x-auto border border-champagne">
                    <table className="w-full text-left text-[14px]">
                      <tbody>
                        {s.table.map((row) => (
                          <tr key={row.k} className="border-b border-champagne last:border-0">
                            <th className="w-[42%] bg-offwhite px-5 py-3.5 font-medium text-espresso-soft/75">
                              {row.k}
                            </th>
                            <td className="px-5 py-3.5 text-espresso-soft/85">{row.v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner
        title="Ficou com alguma dúvida?"
        description="Fale com a Beatriz pelo WhatsApp — respondemos rapidinho."
      />
    </>
  );
}

export function legalMetadata(title: string, description: string): Metadata {
  return { title, description, robots: { index: true, follow: true } };
}
