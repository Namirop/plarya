import type { Metadata } from "next";

import {
  LegalList,
  LegalSection,
  LegalWarning,
} from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Plarya",
  description: "Les conditions d'utilisation de la plateforme Plarya.",
};

export default function CguPage() {
  return (
    <article className="mx-auto w-full max-w-[872px] px-4 py-16 md:px-6">
      <h1 className="font-display text-h2 text-foreground">
        Conditions générales d&apos;utilisation
      </h1>
      <p className="mt-3 font-body text-body-16 text-muted-foreground">
        Dernière mise à jour le 22 mai 2026
      </p>

      <LegalWarning />

      <LegalSection title="Acceptation des conditions">
        <p>
          Les présentes Conditions Générales d&apos;Utilisation (ci-après
          «&nbsp;CGU&nbsp;») régissent les modalités d&apos;utilisation de
          la plateforme Plarya. En accédant au site ou en créant un
          compte, l&apos;utilisateur reconnaît avoir pris connaissance des
          présentes CGU et accepte de s&apos;y conformer sans réserve.
        </p>
        <p>
          Si l&apos;utilisateur n&apos;accepte pas tout ou partie des
          présentes CGU, il s&apos;engage à renoncer à l&apos;utilisation
          du service.
        </p>
      </LegalSection>

      <LegalSection title="Description du service">
        <p>
          Plarya est une plateforme d&apos;analyses sportives premium qui
          met en relation des analystes experts avec des utilisateurs
          souhaitant accéder à leurs publications. Le service propose deux
          modes d&apos;accès aux analyses :
        </p>
        <LegalList>
          <li>
            <strong>Accès à la journée (Day Pass)</strong> : 3,50€ pour
            accéder à l&apos;ensemble des analyses du jour d&apos;un expert
            choisi.
          </li>
          <li>
            <strong>Abonnement mensuel</strong> : 29€ par mois pour un
            accès illimité aux analyses d&apos;un expert, renouvellement
            tacite.
          </li>
        </LegalList>
        <p>
          Plarya ne propose aucun service de paris en ligne. Les analyses
          publiées sont des contenus informatifs et de conseil.
        </p>
      </LegalSection>

      <LegalSection title="Inscription et compte utilisateur">
        <p>
          La création d&apos;un compte se fait par lien magique (magic-link)
          envoyé à l&apos;adresse email fournie par l&apos;utilisateur.
          Aucun mot de passe n&apos;est requis. L&apos;utilisateur
          s&apos;engage à :
        </p>
        <LegalList>
          <li>Fournir une adresse email valide et lui appartenant.</li>
          <li>Maintenir la confidentialité de son accès.</li>
          <li>
            Informer Plarya sans délai en cas d&apos;utilisation non
            autorisée de son compte.
          </li>
        </LegalList>
        <p>
          L&apos;utilisateur doit être majeur (18 ans ou plus) pour utiliser
          la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="Conditions du service expert">
        <p>
          Pour devenir expert sur Plarya, le candidat doit soumettre une
          candidature via le formulaire dédié. La validation de la
          candidature est effectuée manuellement par l&apos;équipe Plarya.
        </p>
        <p>
          L&apos;activité d&apos;expert est conditionnée à un abonnement
          trimestriel de 39€, débité automatiquement par renouvellement
          tacite. Cet abonnement donne accès au tableau de bord expert et
          permet de publier des analyses sur la plateforme.
        </p>
        <p>
          L&apos;expert perçoit 70% du chiffre d&apos;affaires généré par
          les achats de ses analyses ; Plarya retient 30% au titre de la
          commission plateforme. Les reversements sont effectués
          mensuellement par virement bancaire.
        </p>
      </LegalSection>

      <LegalSection title="Paiements">
        <p>
          Les paiements sont traités par notre prestataire Stripe, certifié
          PCI-DSS niveau 1. Plarya ne stocke aucune donnée bancaire.
        </p>
        <LegalList>
          <li>
            <strong>Day Pass</strong> : paiement unique de 3,50€, accès
            valable 24 heures à compter de la confirmation du paiement.
          </li>
          <li>
            <strong>Abonnement mensuel</strong> : 29€ par mois,
            renouvellement automatique. L&apos;utilisateur peut résilier à
            tout moment en contactant contact@plarya.com.
          </li>
          <li>
            <strong>Abonnement expert</strong> : 39€ par trimestre,
            renouvellement automatique. Résiliation possible jusqu&apos;à
            48h avant la date de renouvellement.
          </li>
        </LegalList>
        <p>
          <strong>Remboursements</strong> : conformément à l&apos;article
          L221-28 du Code de la consommation, l&apos;utilisateur renonce
          expressément à son droit de rétractation dès lors qu&apos;il a
          accédé au contenu numérique débloqué. Aucun remboursement ne sera
          accordé pour un Day Pass dont l&apos;accès a été utilisé. Pour
          les abonnements, aucun remboursement prorata temporis n&apos;est
          effectué.
        </p>
      </LegalSection>

      <LegalSection title="Comportement de l'utilisateur">
        <p>L&apos;utilisateur s&apos;engage à ne pas :</p>
        <LegalList>
          <li>
            Copier, reproduire ou redistribuer les analyses débloquées en
            dehors de l&apos;usage personnel.
          </li>
          <li>
            Partager son compte ou ses accès avec un tiers.
          </li>
          <li>
            Tenter de contourner les mécanismes de protection des analyses
            verrouillées.
          </li>
          <li>
            Utiliser le service à des fins commerciales sans accord écrit
            préalable de Plarya.
          </li>
          <li>
            Publier des contenus offensants, diffamatoires ou illégaux
            (s&apos;applique aux experts).
          </li>
          <li>
            Perturber le fonctionnement de la plateforme (scraping, attaques,
            spam).
          </li>
        </LegalList>
        <p>
          Toute violation peut entraîner la suspension ou la résiliation du
          compte sans préavis ni remboursement.
        </p>
      </LegalSection>

      <LegalSection title="Avis de non-responsabilité">
        <p>
          Les analyses publiées sur Plarya sont des contenus informatifs
          reflétant l&apos;opinion de leurs auteurs.{" "}
          <strong>
            Aucune analyse ne constitue une garantie de résultat ni un conseil
            en investissement.
          </strong>{" "}
          L&apos;utilisateur prend ses décisions sous sa seule
          responsabilité et en pleine connaissance des risques associés.
        </p>
        <p>
          Les performances passées d&apos;un expert ne préjugent en aucune
          façon de ses performances futures.
        </p>
      </LegalSection>

      <LegalSection title="Résiliation">
        <p>
          L&apos;utilisateur peut demander la résiliation de son compte à
          tout moment en écrivant à contact@plarya.com. La résiliation
          entraîne la suppression du compte et de l&apos;accès aux services
          payants associés.
        </p>
        <p>
          Plarya se réserve le droit de résilier unilatéralement un compte
          en cas de violation des présentes CGU, avec ou sans préavis selon
          la gravité.
        </p>
      </LegalSection>

      <LegalSection title="Modifications des CGU">
        <p>
          Plarya se réserve le droit de modifier les présentes CGU à tout
          moment. Les utilisateurs seront informés des modifications
          substantielles par email ou via une notification sur la
          plateforme. La poursuite de l&apos;utilisation du service après
          notification vaut acceptation des nouvelles CGU.
        </p>
      </LegalSection>

      <LegalSection title="Loi applicable et juridiction">
        <p>
          Les présentes CGU sont régies par le droit français. En cas de
          litige, et après tentative de résolution amiable, les tribunaux
          français seront seuls compétents.
        </p>
        <p>
          Conformément à l&apos;article L612-1 du Code de la consommation,
          l&apos;utilisateur a la possibilité de recourir gratuitement à un
          médiateur de la consommation en cas de litige non résolu avec
          Plarya.
        </p>
      </LegalSection>
    </article>
  );
}
