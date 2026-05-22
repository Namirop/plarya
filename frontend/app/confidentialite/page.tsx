import type { Metadata } from "next";

import {
  LegalList,
  LegalSection,
  LegalWarning,
} from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Plarya",
  description:
    "Découvre comment Plarya collecte et protège tes données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <article className="mx-auto w-full max-w-[872px] px-4 py-16 md:px-6">
      <h1 className="font-display text-h2 text-foreground">
        Politique de confidentialité
      </h1>
      <p className="mt-3 font-body text-body-16 text-muted-foreground">
        Dernière mise à jour le 22 mai 2026
      </p>

      <LegalWarning />

      <LegalSection title="Préambule">
        <p>
          Plarya est une plateforme d&apos;analyses sportives qui met en
          relation des analystes experts et des utilisateurs souhaitant
          accéder à leurs publications. Le présent document explique les
          données personnelles que nous collectons, les finalités de leur
          traitement, ainsi que les droits dont tu disposes en vertu du
          Règlement Général sur la Protection des Données (RGPD).
        </p>
        <p>
          Le responsable du traitement est Plarya, joignable à l&apos;adresse
          contact@plarya.com.
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <p>Nous collectons les catégories de données suivantes :</p>
        <LegalList>
          <li>
            <strong>Email</strong> : utilisé pour l&apos;authentification via
            lien magique (magic-link) et pour la facturation.
          </li>
          <li>
            <strong>Données techniques</strong> : adresse IP, navigateur,
            système d&apos;exploitation, dates de connexion.
          </li>
          <li>
            <strong>Données de paiement</strong> : traitées exclusivement par
            notre prestataire Stripe. Plarya ne stocke jamais ton numéro de
            carte ni ton code de sécurité.
          </li>
          <li>
            <strong>Données d&apos;usage</strong> : historique des achats,
            analyses consultées, statistiques agrégées de navigation.
          </li>
          <li>
            <strong>Pour les experts</strong> : pseudo public, biographie,
            sports couverts, photo de profil.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Finalités du traitement">
        <LegalList>
          <li>Permettre l&apos;authentification et l&apos;accès à ton compte.</li>
          <li>Exécuter les paiements et émettre les factures.</li>
          <li>
            Mettre à disposition les analyses débloquées par tes abonnements
            ou achats ponctuels.
          </li>
          <li>
            Communiquer avec toi (emails transactionnels, notifications
            J+1).
          </li>
          <li>
            Améliorer le service via des statistiques anonymisées
            d&apos;utilisation.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Base légale">
        <LegalList>
          <li>
            <strong>Exécution du contrat</strong> : authentification,
            paiement, livraison des analyses.
          </li>
          <li>
            <strong>Intérêt légitime</strong> : sécurité du service,
            prévention des fraudes, statistiques agrégées.
          </li>
          <li>
            <strong>Consentement</strong> : communications marketing
            optionnelles (le cas échéant).
          </li>
          <li>
            <strong>Obligation légale</strong> : conservation des factures et
            documents comptables.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Destinataires des données">
        <p>
          Tes données sont accessibles à l&apos;équipe Plarya dans la stricte
          limite de leurs missions. Nous partageons certaines données avec
          des prestataires qualifiés :
        </p>
        <LegalList>
          <li>
            <strong>Stripe</strong> (Stripe, Inc.) : traitement des
            paiements. Hébergement aux États-Unis avec garanties RGPD via
            les Clauses Contractuelles Types.
          </li>
          <li>
            <strong>Resend</strong> : envoi des emails transactionnels et
            magic-links.
          </li>
          <li>
            <strong>Vercel</strong> : hébergement du site et du back-end.
          </li>
          <li>
            <strong>Autorités</strong> : sur réquisition légale uniquement.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <LegalList>
          <li>
            <strong>Compte actif</strong> : aussi longtemps que le compte est
            actif.
          </li>
          <li>
            <strong>Compte inactif</strong> : supprimé après 3 ans
            d&apos;inactivité (sauf obligation légale contraire).
          </li>
          <li>
            <strong>Factures et données comptables</strong> : 10 ans
            (obligation fiscale française).
          </li>
          <li>
            <strong>Logs techniques</strong> : 12 mois maximum.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Tes droits">
        <p>
          Conformément au RGPD, tu disposes des droits suivants sur tes
          données personnelles :
        </p>
        <LegalList>
          <li>
            <strong>Accès</strong> : obtenir une copie des données que nous
            détenons sur toi.
          </li>
          <li>
            <strong>Rectification</strong> : corriger des données inexactes
            ou incomplètes.
          </li>
          <li>
            <strong>Suppression</strong> (droit à l&apos;oubli) : supprimer
            tes données dans les limites légales.
          </li>
          <li>
            <strong>Portabilité</strong> : recevoir tes données dans un
            format structuré et machine-lisible.
          </li>
          <li>
            <strong>Opposition</strong> : t&apos;opposer à certains
            traitements (notamment marketing).
          </li>
          <li>
            <strong>Limitation</strong> : demander la suspension temporaire
            d&apos;un traitement.
          </li>
        </LegalList>
        <p>
          Pour exercer ces droits, écris-nous à contact@plarya.com. Nous
          répondons sous 30 jours maximum.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Plarya utilise des cookies strictement nécessaires au
          fonctionnement du service (cookie de session pour
          l&apos;authentification, durée de vie 30 jours). Nous
          n&apos;utilisons pas de cookies publicitaires ou de tracking
          tiers.
        </p>
      </LegalSection>

      <LegalSection title="Comment exercer tes droits">
        <p>
          Toute demande relative à tes données personnelles doit être
          adressée par email à contact@plarya.com. Nous pourrons te
          demander une pièce d&apos;identité pour vérifier ton identité
          avant d&apos;accéder à ta demande.
        </p>
        <p>
          Tu disposes également du droit d&apos;introduire une réclamation
          auprès de la CNIL (www.cnil.fr) si tu estimes que tes droits ne
          sont pas respectés.
        </p>
      </LegalSection>

      <LegalSection title="Modifications de la politique">
        <p>
          Cette politique peut être modifiée à tout moment. Nous
          t&apos;informerons des changements substantiels par email ou via
          une notification sur la plateforme. La date de dernière mise à
          jour est indiquée en haut de cette page.
        </p>
      </LegalSection>
    </article>
  );
}
