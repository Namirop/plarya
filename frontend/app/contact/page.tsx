import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Plarya",
  description: "Contacte l'équipe Plarya pour toute question.",
};

const CONTACT_EMAIL = "contact@plarya.com";

export default function ContactPage() {
  return (
    <article className="mx-auto w-full max-w-[872px] px-4 py-16 md:px-6">
      <h1 className="font-display text-h2 text-foreground">Contact</h1>

      <section className="mt-12">
        <p className="font-body text-body-16 leading-relaxed text-foreground">
          Pour toute question, suggestion ou problème, contactez-nous par email à :
        </p>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-6 inline-block font-body text-body-18 font-semibold text-accent transition-opacity hover:opacity-80 hover:underline"
        >
          {CONTACT_EMAIL}
        </a>

        <p className="mt-6 font-body text-body-16 leading-relaxed text-muted-foreground">
          Nous nous engageons à répondre sous 48&nbsp;heures ouvrées.
        </p>
      </section>
    </article>
  );
}
