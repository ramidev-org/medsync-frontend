"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IonArchiveOutline,
  IonArrowBack,
  IonArrowForward,
  IonBusinessOutline,
  IonCalendarOutline,
  IonCardOutline,
  IonCheckmarkCircle,
  IonDocumentLockOutline,
  IonDocumentTextOutline,
  IonFolderOpenOutline,
  IonHeartOutline,
  IonImageOutline,
  IonKeyOutline,
  IonMedkitOutline,
  IonPersonOutline,
  IonShieldCheckmarkOutline,
  IonSparklesOutline,
  IonFemaleOutline,
} from "@/components/ionicons";

const navItems = [
  { label: "Fonctionnalites", id: "features" },
  { label: "Avis medecins", id: "testimonials" },
  { label: "Tarifs", id: "pricing" },
  { label: "FAQ", id: "faq" },
  { label: "Contact", id: "contact" },
];

const features = [
  {
    title: "Agenda du medecin",
    description: "Une vue claire pour les rendez-vous, les passages spontanes et les suivis.",
    icon: <IonCalendarOutline size={21} />,
  },
  {
    title: "Dossiers patients",
    description: "Historique, constantes, consultations et documents retrouves rapidement.",
    icon: <IonFolderOpenOutline size={21} />,
  },
  {
    title: "Facturation simple",
    description: "Suivez les actes, factures, paiements recus et montants en attente.",
    icon: <IonCardOutline size={21} />,
  },
  {
    title: "Ordonnances PDF",
    description: "Imprimez ordonnances, lettres et documents avec en-tete du cabinet.",
    icon: <IonDocumentTextOutline size={21} />,
  },
];

const testimonials = [
  {
    name: "Dr. Amina B.",
    specialty: "Medecine generale",
    text: "Le workflow reste simple pour un cabinet solo tout en gardant les notes, paiements et suivis bien organises.",
  },
  {
    name: "Dr. Karim M.",
    specialty: "Dentisterie",
    text: "Les rendez-vous, traitements et paiements sont plus faciles a suivre sans passer par plusieurs carnets papier.",
  },
  {
    name: "Dr. Lina H.",
    specialty: "Dermatologie",
    text: "Le dossier patient est pratique. Les observations et les taches de suivi restent au meme endroit.",
  },
  {
    name: "Dr. Samir A.",
    specialty: "Urology",
    text: "Une alternative moderne aux logiciels locaux, surtout quand on veut acces web et sauvegarde.",
  },
  {
    name: "Dr. Nesrine T.",
    specialty: "Cardiology",
    text: "Le tableau de bord rend la journee plus lisible : visites, taches, paiements et actions patient.",
  },
];

const specialties = [
  "Medecine generale",
  "Pediatrie",
  "Orthopedie",
  "Ophtalmologie",
  "Cardiologie",
  "Urologie",
  "Dermatologie",
  "Neurologie",
];

const stats = [
  { value: 120, suffix: "+", label: "Cabinets cibles" },
  { value: 35000, suffix: "+", label: "Patients organises" },
  { value: 300, suffix: "+", label: "Medecins a servir" },
];

const pricingPlans = [
  {
    name: "Medecin solo",
    price: "9 900 DA",
    cadence: "/ an",
    description: "Pour un cabinet prive gere par un seul medecin.",
    icon: <IonPersonOutline size={22} />,
    featured: false,
    features: ["Agenda et rendez-vous", "Dossiers patients", "Consultations et constantes", "Ordonnances et lettres", "Paiements simples"],
  },
  {
    name: "Clinique",
    price: "26 000 DA",
    cadence: "/ an",
    description: "Pour cabinet avec assistant, equipe ou plusieurs postes.",
    icon: <IonBusinessOutline size={22} />,
    featured: false,
    features: ["Tout le plan solo", "Medecins et assistants", "Services et facturation", "Taches partagees", "Support prioritaire"],
  },
  {
    name: "Pro",
    price: "35 000 DA",
    cadence: "/ an",
    description: "Pour les cliniques structurees avec plus d operations, de supervision et d accompagnement.",
    icon: <IonSparklesOutline size={22} />,
    featured: true,
    features: ["Tout le plan clinique", "Multi-postes et suivi d equipe avance", "Rapports mensuels et annuels", "Journal d activite et supervision", "Accompagnement prioritaire au lancement"],
  },
  {
    name: "Test",
    price: "0 DA",
    cadence: "10 jours",
    description: "Essai accompagne avant activation reelle du cabinet.",
    icon: <IonKeyOutline size={22} />,
    featured: false,
    features: ["Demonstration complete", "Donnees exemple", "Configuration guidee", "Retour metier", "Sans engagement"],
  },
];

const faqItems = [
  {
    question: "Mes donnees patients sont-elles securisees ?",
    answer: "Le lancement production doit inclure acces strict par cabinet, sauvegardes et journal audit avant les vrais patients.",
  },
  {
    question: "Est-ce que je peux etre accompagne ?",
    answer: "Oui. Le lancement doit inclure une configuration guidee et un support WhatsApp pour les cabinets pilotes.",
  },
  {
    question: "Est-ce reserve aux grandes cliniques ?",
    answer: "Non. Le workflow principal est pense d abord pour un medecin seul dans un cabinet prive.",
  },
  {
    question: "Que se passe-t-il si je change ordinateur ?",
    answer: "En mode reel, les donnees du cabinet sont liees au compte et non a une seule machine.",
  },
];

const complianceHighlights = [
  {
    title: "Acces par role",
    description: "Medecin, assistant et administrateur avec permissions separees pour limiter les erreurs et proteger les dossiers.",
    icon: <IonShieldCheckmarkOutline size={22} />,
  },
  {
    title: "Sauvegardes et tracabilite",
    description: "Journal d actions, sauvegardes planifiees et reprise plus simple avant mise en production reelle.",
    icon: <IonArchiveOutline size={22} />,
  },
  {
    title: "Hebergement et confidentialite",
    description: "Preparation du cadre de confidentialite, des conditions d utilisation et des engagements de traitement des donnees.",
    icon: <IonDocumentLockOutline size={22} />,
  },
];

const productScreens = [
  {
    title: "Agenda et file d attente",
    subtitle: "Vue reception + medecin pour la journee en cours",
    accent: "#0D6EFD",
    metrics: ["18 rendez-vous", "4 patients en attente", "2 rappels envoyes"],
  },
  {
    title: "Dossier patient complet",
    subtitle: "Constantes, antecedents, consultation et documents",
    accent: "#16a34a",
    metrics: ["Antecedents", "Mesures vitales", "Ordonnances PDF"],
  },
  {
    title: "Paiements et services",
    subtitle: "Facturation simple avec suivi des actes et recus",
    accent: "#f59e0b",
    metrics: ["6 paiements recus", "2 impayes", "Journal du jour"],
  },
];

const workflowSteps = [
  {
    title: "1. Setup",
    description: "Activation du cabinet, configuration de base et personnalisation des informations de pratique.",
  },
  {
    title: "2. Onboard team",
    description: "Invitation des medecins et assistants avec les bons acces selon leurs roles.",
  },
  {
    title: "3. Start consultations",
    description: "Commencez les rendez-vous, les dossiers patients, les ordonnances et les paiements dans le meme espace.",
  },
];

const audienceCards = [
  {
    title: "Medecin solo",
    description: "Pour un cabinet prive qui veut gagner du temps sur les rendez-vous, les notes et les ordonnances.",
    bullets: ["Vue simple", "Demarrage rapide", "Suivi patient centralise"],
  },
  {
    title: "Cabinet avec assistant",
    description: "Pour une organisation reception + medecin avec planning partage, paiements et coordination du flux patient.",
    bullets: ["Accueil et file d attente", "Gestion des paiements", "Taches partagees"],
  },
  {
    title: "Clinique multi-docteurs",
    description: "Pour les structures qui ont besoin de plusieurs postes, de supervision et de reporting.",
    bullets: ["Multi-postes", "Suivi equipe", "Pilotage plus avance"],
  },
];

const specialtyCards = [
  {
    title: "Dentisterie",
    description: "Suivi soins, actes, odontogramme et historique de traitement.",
    icon: <IonMedkitOutline size={22} />,
    tags: ["Odontogramme", "Actes", "Historique"],
  },
  {
    title: "Dermatologie",
    description: "Photos, suivi de lesions et comparaisons avant/apres.",
    icon: <IonImageOutline size={22} />,
    tags: ["Photos", "Suivi lesions", "Comparaison"],
  },
  {
    title: "Cardiologie",
    description: "Observations cliniques, suivi tension et consultation structuree.",
    icon: <IonHeartOutline size={22} />,
    tags: ["Constantes", "Observation", "Suivi"],
  },
  {
    title: "Gynecologie",
    description: "Formulaires specialises, historique et parcours de consultation.",
    icon: <IonFemaleOutline size={22} />,
    tags: ["Formulaire", "Historique", "Parcours"],
  },
];

const comparisonRows = [
  { label: "Agenda et rendez-vous", values: ["Oui", "Oui", "Oui", "Oui"] },
  { label: "Utilisateurs d equipe", values: ["1 medecin", "Equipe", "Equipe avancee", "Demo guidee"] },
  { label: "Paiements et services", values: ["Essentiel", "Complet", "Complet", "Apercu"] },
  { label: "Rapports et supervision", values: ["-", "Basique", "Avance", "-"] },
  { label: "Accompagnement", values: ["Standard", "Prioritaire", "Prioritaire + migration", "Guide"] },
];

const trustLinks = [
  "Politique de confidentialite",
  "Conditions d utilisation",
  "Traitement des donnees",
];

function CountUpNumber({
  value,
  suffix = "",
  start,
}: {
  value: number;
  suffix?: string;
  start: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    let frameId = 0;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [start, value]);

  const formatted = displayValue >= 1000 ? `${Math.round(displayValue / 1000)}k` : `${displayValue}`;
  return <>{formatted}{suffix}</>;
}

function HeroIllustration() {
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => i + 1), []);
  const slots = ["09:30", "10:00", "10:30", "11:00"];

  return (
    <div className="landing-hero-visual">
      <div className="landing-hero-blob landing-hero-blob--one" />
      <div className="landing-hero-blob landing-hero-blob--two" />
      <div className="landing-hero-pulse" />

      <div className="landing-hero-surface">
        <div className="landing-hero-surface__header">
          <div className="landing-hero-brandmark">MS</div>
          <div className="landing-hero-surface__copy">
            <h3>Tableau de bord</h3>
            <p>Agenda • Patients • Consultations • Paiements</p>
          </div>
          <div className="landing-status-pill">Cabinet actif</div>
        </div>

        <div className="landing-hero-surface__body">
          <div className="landing-hero-days">
            <p>Journee du cabinet</p>
            <div className="landing-hero-days__grid">
              {days.map((day) => (
                <div key={day} className={`landing-hero-day ${day === 9 ? "is-active" : ""}`}>
                  {day}
                </div>
              ))}
            </div>
          </div>

          <div className="landing-hero-slots">
            {slots.map((slot, index) => (
              <div key={slot} className={`landing-hero-slot ${index === 1 ? "is-highlighted" : ""}`}>
                {slot}
              </div>
            ))}
          </div>
        </div>

        <div className="landing-hero-progress">
          <div className="landing-hero-progress__fill" />
        </div>
      </div>

      <div className="landing-float-card landing-float-card--left">
        <strong>Rappel envoye</strong>
        <span>Patient confirme</span>
      </div>
      <div className="landing-float-card landing-float-card--right">
        <strong>Paiement enregistre</strong>
        <span>4 500 DA recus aujourd hui</span>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [hasPlayedStats, setHasPlayedStats] = useState(false);
  const statsRef = useRef<HTMLElement | null>(null);
  const reviewsTrackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!statsRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setHasPlayedStats(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollToTestimonial = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, testimonials.length - 1));
    setActiveTestimonial(nextIndex);

    const node = reviewsTrackRef.current?.children.item(nextIndex) as HTMLElement | null;
    node?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="landing-shell landing-header__inner">
          <Link href="/" className="landing-logo">MedSync</Link>
          <nav className="landing-nav">
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="landing-nav__link">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="landing-header__actions">
            <Link href="/login" className="button button--secondary">CONNEXION</Link>
            <Link href="/signup" className="button button--primary">ESSAI GRATUIT</Link>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-shell landing-hero__grid">
          <div className="landing-hero__copy">
            <div className="landing-chip">Agenda - Patients - Ordonnances - Paiements</div>
            <h1>Gerez votre cabinet medical, simplement.</h1>
            <p>
              Une experience moderne pour les medecins en Algerie : rendez-vous, dossiers patients,
              consultations, ordonnances, paiements et taches dans un seul espace.
            </p>
            <div className="landing-actions">
              <Link href="/signup" className="button button--primary">OBTENIR UNE CLE ESSAI</Link>
              <a href="#features" className="button button--secondary">VOIR LES FONCTIONNALITES</a>
            </div>
            <div className="landing-pill-row">
              {["Prise en main rapide", "Acces securise", "Support WhatsApp"].map((item) => (
                <div key={item} className="landing-micro-pill">
                  <span className="landing-micro-pill__dot" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <HeroIllustration />
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-shell">
          <div className="landing-section__header">
            <p className="landing-eyebrow">GESTION DE CABINET</p>
            <h2>Tout pour gerer le quotidien</h2>
            <p>Simple a apprendre, assez complet pour les consultations, les ordonnances, le suivi patient et les paiements.</p>
          </div>

          <div className="landing-overview">
            <div className="landing-checklist">
              {[
                "Appointments and waiting flow",
                "Consultation notes and vitals",
                "Patient files and documents",
                "Payments and invoices",
                "Ordonnances et lettres",
              ].map((item) => (
                <div key={item} className="landing-checklist__item">
                  <span className="landing-checklist__dot" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="landing-overview-card">
              <h3>Ecran principal du cabinet</h3>
              <p>Une interface unifiee pour l accueil, la consultation, les documents et les paiements.</p>
              <div className="landing-overview-card__stack">
                {[
                  { title: "Accueil du jour", value: "18 rendez-vous", tone: "#0D6EFD" },
                  { title: "Patients suivis", value: "124 dossiers actifs", tone: "#16a34a" },
                  { title: "Paiements", value: "6 recus aujourd hui", tone: "#f59e0b" },
                ].map((item) => (
                  <div key={item.title} className="landing-overview-card__item">
                    <div className="landing-overview-card__row">
                      <strong>{item.title}</strong>
                      <span className="landing-overview-card__tone" style={{ backgroundColor: item.tone }} />
                    </div>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="landing-section landing-section--muted">
        <div className="landing-shell">
          <div className="landing-section__header landing-section__header--center">
            <h2>Better than a simple desktop cabinet tool</h2>
            <p>Keep the familiar clean design, but add the cloud workflow, solo-doctor focus, and launch-ready operations your market needs.</p>
          </div>

          <div className="landing-screen-row">
            {productScreens.map((item) => (
              <article key={item.title} className="landing-screen-card">
                <div className="landing-screen-card__header">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.subtitle}</p>
                  </div>
                  <span className="landing-screen-card__accent" style={{ backgroundColor: item.accent }} />
                </div>
                <div className="landing-screen-card__stack">
                  {item.metrics.map((metric, index) => (
                    <div key={metric} className={`landing-screen-card__metric ${index === 0 ? "is-emphasis" : ""}`}>
                      {metric}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="landing-feature-grid">
            {features.map((feature) => (
              <article key={feature.title} className="landing-feature-card">
                <div className="landing-feature-card__icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>

          <div className="landing-section__header landing-section__header--center landing-top-gap">
            <p className="landing-eyebrow">SPECIALITES</p>
            <h2>Adapte aux specialites courantes</h2>
            <p>Le meme workflow de base, avec des espaces specialises quand le cabinet en a besoin.</p>
          </div>

          <div className="landing-chip-cloud">
            {specialties.map((specialty) => (
              <span key={specialty} className="landing-chip-cloud__item">{specialty}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-shell">
          <div className="landing-section__header landing-section__header--center">
            <p className="landing-eyebrow">ESPACES SPECIALISES</p>
            <h2>Des modules medicaux qui vont plus loin</h2>
            <p>Chaque specialite garde le meme cadre produit tout en ajoutant ses besoins les plus utiles.</p>
          </div>

          <div className="landing-specialty-grid">
            {specialtyCards.map((card) => (
              <article key={card.title} className="landing-specialty-card">
                <div className="landing-specialty-card__icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div className="landing-tag-row">
                  {card.tags.map((tag) => (
                    <span key={tag} className="landing-tag">{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--muted">
        <div className="landing-shell">
          <div className="landing-section__header landing-section__header--center">
            <p className="landing-eyebrow">MISE EN ROUTE</p>
            <h2>Comment ca marche</h2>
            <p>Un parcours simple pour activer le cabinet, integrer l equipe et commencer a consulter.</p>
          </div>
          <div className="landing-step-grid">
            {workflowSteps.map((step) => (
              <article key={step.title} className="landing-step-card">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-shell">
          <div className="landing-section__header landing-section__header--center">
            <p className="landing-eyebrow">POUR QUI</p>
            <h2>Un produit adapte a plusieurs tailles de cabinet</h2>
            <p>Le meme coeur produit, avec le bon niveau d organisation selon votre pratique.</p>
          </div>
          <div className="landing-audience-grid">
            {audienceCards.map((card) => (
              <article key={card.title} className="landing-audience-card">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div className="landing-checkline-row">
                  {card.bullets.map((bullet) => (
                    <div key={bullet} className="landing-checkline">
                      <span aria-hidden="true" className="landing-checkline__icon">
                        <IonCheckmarkCircle size={16} />
                      </span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section ref={statsRef} className="landing-stats">
        <div className="landing-shell landing-stats__row">
          {stats.map((item) => (
            <div key={item.label} className="landing-stat-card">
              <div className="landing-stat-card__value">
                <CountUpNumber value={item.value} suffix={item.suffix} start={hasPlayedStats} />
              </div>
              <div className="landing-stat-card__label">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="testimonials" className="landing-section">
        <div className="landing-shell">
          <div className="landing-section__header landing-section__header--center">
            <p className="landing-eyebrow">AVIS MEDECINS</p>
            <h2>Pense pour les cabinets medicaux en Algerie</h2>
          </div>

          <div className="landing-reviews__topbar">
            <p>Parcourez les retours des medecins avec les fleches ou en glissant horizontalement.</p>
            <div className="landing-reviews__controls">
              <button type="button" onClick={() => scrollToTestimonial(activeTestimonial - 1)} disabled={activeTestimonial === 0}>
                <IonArrowBack size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollToTestimonial(activeTestimonial + 1)}
                disabled={activeTestimonial === testimonials.length - 1}
              >
                <IonArrowForward size={18} />
              </button>
            </div>
          </div>

          <div ref={reviewsTrackRef} className="landing-reviews__track">
            {testimonials.map((item) => (
              <article key={item.name} className="landing-review-card">
                <div className="landing-review-card__header">
                  <div className="landing-review-card__avatar">{item.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}</div>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.specialty}</p>
                  </div>
                </div>
                <p className="landing-review-card__copy">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="landing-reviews__dots">
            {testimonials.map((item, index) => (
              <button
                key={item.name}
                type="button"
                aria-label={`Aller au temoignage ${index + 1}`}
                onClick={() => scrollToTestimonial(index)}
                className={activeTestimonial === index ? "is-active" : ""}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="landing-section landing-section--muted">
        <div className="landing-shell">
          <div className="landing-section__header landing-section__header--center">
            <p className="landing-eyebrow">TARIFS</p>
            <h2>Des offres simples pour demarrer</h2>
            <p>Facturation annuelle pour les plans actifs, avec un essai accompagne pour valider le workflow avant activation.</p>
          </div>

          <div className="landing-pricing-note">Tarifs annuels • activation et onboarding inclus</div>

          <div className="landing-onboarding-card">
            <h3>Promesse onboarding</h3>
            <div className="landing-tag-row">
              {["Setup initial guide", "Aide migration des donnees", "Support lun-sam 08h-18h"].map((item) => (
                <span key={item} className="landing-tag">{item}</span>
              ))}
            </div>
          </div>

          <div className="landing-pricing-grid">
            {pricingPlans.map((plan) => (
              <article key={plan.name} className={`landing-price-card ${plan.featured ? "is-featured" : ""}`}>
                <div className="landing-price-card__header">
                  <div className={`landing-price-card__icon ${plan.featured ? "is-featured" : ""}`}>{plan.icon}</div>
                  <div>
                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>
                  </div>
                </div>
                <div className="landing-price-card__price">
                  <strong>{plan.price}</strong>
                  <span>{plan.cadence}</span>
                </div>
                <div className="landing-price-card__features">
                  {plan.features.map((feature) => (
                    <div key={feature} className="landing-checkline">
                      <span aria-hidden="true" className={`landing-checkline__icon ${plan.featured ? "is-featured" : ""}`}>
                        <IonCheckmarkCircle size={17} />
                      </span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Link href="/signup" className={`landing-price-card__cta ${plan.featured ? "is-featured" : ""}`}>
                  {plan.name === "Test" ? "DEMANDER UN TEST" : "CHOISIR CE PLAN"}
                </Link>
              </article>
            ))}
          </div>

          <div className="landing-section__header landing-section__header--center landing-top-gap">
            <p className="landing-eyebrow">COMPARAISON</p>
            <h2>Comparer les plans</h2>
            <p>Une vue rapide pour choisir le bon niveau de demarrage pour le cabinet.</p>
          </div>

          <div className="landing-comparison-wrap">
            <div className="landing-comparison-table">
              <div className="landing-comparison-head">
                {["Fonction", "Solo", "Clinique", "Pro", "Test"].map((head) => (
                  <div key={head} className={`landing-comparison-head__cell ${head === "Clinique" ? "is-highlighted" : ""}`}>
                    <strong>{head}</strong>
                    {head === "Clinique" ? <span>Le plus choisi</span> : null}
                  </div>
                ))}
              </div>
              {comparisonRows.map((row, idx) => (
                <div key={row.label} className="landing-comparison-row">
                  <div className={`landing-comparison-row__label ${idx % 2 === 1 ? "is-alt" : ""}`}>{row.label}</div>
                  {row.values.map((value, valueIndex) => (
                    <div key={`${row.label}-${value}`} className={`landing-comparison-row__value ${valueIndex === 1 ? "is-highlighted" : ""} ${idx % 2 === 1 ? "is-alt" : ""}`}>
                      {value}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-shell">
          <div className="landing-section__header landing-section__header--center">
            <p className="landing-eyebrow">CONFIANCE</p>
            <h2>Informations importantes avant mise en production</h2>
            <p>Le produit couvre deja le coeur metier du cabinet. Cette zone rappelle aussi les points de securite et d exploitation a cadrer pour un usage reel.</p>
          </div>

          <div className="landing-trust-grid">
            {complianceHighlights.map((item) => (
              <article key={item.title} className="landing-trust-card">
                <div className="landing-trust-card__icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="landing-section landing-section--muted">
        <div className="landing-shell">
          <div className="landing-section__header landing-section__header--center">
            <h2>Questions frequentes</h2>
          </div>

          <div className="landing-faq">
            {faqItems.map((item, index) => {
              const open = activeFaq === index;
              return (
                <article key={item.question} className="landing-faq__item">
                  <button type="button" className="landing-faq__trigger" onClick={() => setActiveFaq(open ? null : index)}>
                    <span>{item.question}</span>
                    <span className={`landing-faq__badge ${open ? "is-open" : ""}`}>{open ? "-" : "+"}</span>
                  </button>
                  {open ? <p className="landing-faq__answer">{item.answer}</p> : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-shell landing-cta__inner">
          <p className="landing-cta__eyebrow">ESSAI GRATUIT</p>
          <h2>Lancez votre cabinet pilote</h2>
          <Link href="/signup" className="landing-cta__button">OBTENIR UNE CLE ESSAI</Link>
        </div>
      </section>

      <footer id="contact" className="landing-footer">
        <div className="landing-shell">
          <div className="landing-footer__grid">
            <div className="landing-footer__column">
              <h3>Contact</h3>
              <div className="landing-footer__contacts">
                {[
                  { label: "WhatsApp", value: "Numero onboarding a renseigner" },
                  { label: "Email", value: "Email commercial a renseigner" },
                  { label: "Onboarding", value: "Contact mise en route a renseigner" },
                ].map((item) => (
                  <div key={item.label}>
                    <strong>{item.label}</strong>
                    <p>{item.value}</p>
                  </div>
                ))}
              </div>

              <h4>Liens de confiance</h4>
              <div className="landing-footer__chips">
                {trustLinks.map((item) => (
                  <span key={item} className="landing-footer__chip">{item}</span>
                ))}
              </div>

              <h4>Reseaux sociaux</h4>
              <div className="landing-footer__chips">
                {["Facebook", "Instagram", "X"].map((item) => (
                  <span key={item} className="landing-footer__chip landing-footer__chip--social">{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="landing-footer__bottom">© 2026 MyDoctor. Tous droits reserves.</div>
        </div>
      </footer>
    </main>
  );
}
