import type { Metadata } from "next";

import { LegalList, LegalSection, LegalWarning } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Mentions légales — Plarya",
  description: "Informations légales sur l'éditeur de Plarya, plateforme d'analyses sportives.",
};

export default function MentionsLegalesPage() {
  return (
    <article className="mx-auto w-full max-w-[872px] px-4 py-16 md:px-6">
      <h1 className="font-display text-h2 text-foreground">Mentions légales</h1>
      <p className="mt-3 font-body text-body-16 text-muted-foreground">
        Dernière mise à jour le 22 mai 2026
      </p>

      <LegalWarning />

      <LegalSection title="Éditeur du site">
        <p>Le site Plarya, accessible à l&apos;adresse plarya.com, est édité par :</p>
        <LegalList>
          <li>
            <strong>Raison sociale</strong> :{" "}
            <em className="text-muted-foreground">à compléter par le client</em>
          </li>
          <li>
            <strong>Forme juridique</strong> :{" "}
            <em className="text-muted-foreground">
              à compléter par le client (SAS, SARL, EI, etc.)
            </em>
          </li>
          <li>
            <strong>Capital social</strong> :{" "}
            <em className="text-muted-foreground">à compléter par le client</em>
          </li>
          <li>
            <strong>RCS / SIRET</strong> :{" "}
            <em className="text-muted-foreground">à compléter par le client</em>
          </li>
          <li>
            <strong>Numéro de TVA intracommunautaire</strong> :{" "}
            <em className="text-muted-foreground">à compléter par le client</em>
          </li>
          <li>
            <strong>Siège social</strong> :{" "}
            <em className="text-muted-foreground">à compléter par le client</em>
          </li>
          <li>
            <strong>Directeur de la publication</strong> :{" "}
            <em className="text-muted-foreground">à compléter par le client</em>
          </li>
          <li>
            <strong>Contact</strong> : contact@plarya.com
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>Le site est hébergé par :</p>
        <LegalList>
          <li>
            <strong>Vercel Inc.</strong>
          </li>
          <li>440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis</li>
          <li>Site web : vercel.com</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L&apos;ensemble du contenu présent sur Plarya — incluant sans s&apos;y limiter les textes,
          analyses, graphismes, logos, icônes, images, sons, vidéos, ainsi que leur agencement — est
          la propriété exclusive de Plarya ou de ses partenaires, et est protégé par les lois
          françaises et internationales relatives à la propriété intellectuelle.
        </p>
        <p>
          Toute reproduction, représentation, modification, publication ou adaptation, totale ou
          partielle, par quelque procédé que ce soit, est interdite sans l&apos;autorisation écrite
          préalable de Plarya.
        </p>
        <p>
          Les analyses publiées par les experts restent leur propriété intellectuelle. Plarya
          bénéficie d&apos;une licence d&apos;exploitation non exclusive pour la durée de diffusion
          sur la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilité">
        <p>
          Plarya est une plateforme d&apos;analyses sportives à vocation informative et de conseil.
          Les analyses publiées par les experts reflètent leurs opinions personnelles et leur
          expertise propre.
        </p>
        <p>
          <strong>
            Aucune analyse, aucune sélection et aucune prédiction publiée sur Plarya ne constitue
            une garantie de gain.
          </strong>{" "}
          Les performances passées ne préjugent en aucune façon des performances futures.
          L&apos;utilisateur reconnaît qu&apos;il prend ses décisions de manière autonome et en
          pleine connaissance des risques associés.
        </p>
        <p>
          Plarya rappelle l&apos;importance d&apos;une pratique responsable. En cas de difficulté
          liée à la pratique du jeu, il est possible de contacter le service Joueurs Info Service au
          09 74 75 13 13 (appel non surtaxé) ou de consulter le site joueurs-info-service.fr.
        </p>
        <p>
          Plarya ne pourra être tenue responsable des décisions prises par ses utilisateurs sur la
          base des analyses publiées.
        </p>
      </LegalSection>

      <LegalSection title="Liens externes">
        <p>
          Plarya peut contenir des liens vers des sites tiers (notamment des opérateurs
          partenaires). Plarya n&apos;exerce aucun contrôle sur le contenu de ces sites et décline
          toute responsabilité quant à leur contenu ou à leur fonctionnement.
        </p>
      </LegalSection>

      <LegalSection title="Loi applicable">
        <p>
          Les présentes mentions légales sont régies par le droit français. Tout litige relatif à
          leur interprétation ou à leur exécution relève de la compétence exclusive des tribunaux
          français.
        </p>
      </LegalSection>
    </article>
  );
}
