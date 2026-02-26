/* eslint-disable no-unused-vars */
// Default content shipped with the site (client fallback).
window.DEFAULT_PAGE_DATA = {
  meta: {
    title: "OTI Sud · Bienvenue dans le Sud Sauvage",
    description: "Découvrez l'Entre-Deux, Saint-Joseph, Saint-Philippe et Le Tampon.",
    ogTitle: "OTI Sud · Liens officiels",
    ogDescription: "Infos pratiques, randonnées et billetterie pour le Sud de La Réunion.",
    ogImage: "https://images.unsplash.com/photo-1464823063530-08f10ed1a2dd?auto=format&fit=crop&w=1200&q=80",
    themeColor: "#0F6885"
  },
  theme: {
    brandTeal: "#0F6885",
    brandTealDark: "#0D5C75",
    brandTealDarker: "#09485C"
  },
  lang: "fr",
  languages: [
    ["fr", "Français"],
    ["re", "Kréol"],
    ["en", "English"]
  ],
  fixedText: {
    tagline: "Entre-Deux | Saint-Joseph | Saint-Philippe | Le Tampon"
  },
  assets: {
    heroImages: [
      "https://nnvzjyltcavtccefhmks.supabase.co/storage/v1/object/public/carrousel_link_tree/LT1.jpg",
      "https://nnvzjyltcavtccefhmks.supabase.co/storage/v1/object/public/carrousel_link_tree/LT2.jpg",
      "https://nnvzjyltcavtccefhmks.supabase.co/storage/v1/object/public/carrousel_link_tree/LT3.jpg",
      "https://nnvzjyltcavtccefhmks.supabase.co/storage/v1/object/public/carrousel_link_tree/LT4.jpg",
      "https://nnvzjyltcavtccefhmks.supabase.co/storage/v1/object/public/carrousel_link_tree/LT5.jpg",
      "https://nnvzjyltcavtccefhmks.supabase.co/storage/v1/object/public/carrousel_link_tree/LT6.jpg",
      "https://nnvzjyltcavtccefhmks.supabase.co/storage/v1/object/public/carrousel_link_tree/LT7.jpg"
    ],
    logoMain: "https://nnvzjyltcavtccefhmks.supabase.co/storage/v1/object/public/Public/LOGO_BLANC.png"
  },
  socials: [
    ["facebook", "https://m.facebook.com/Otisud/", "https://img.icons8.com/ios-filled/100/ffffff/facebook-new.png"],
    ["instagram", "https://www.instagram.com/teamtranchepapaye/", "https://img.icons8.com/ios-filled/100/ffffff/instagram-new.png"],
    ["youtube", "https://www.youtube.com/@OTIduSUDR%C3%A9union", "https://img.icons8.com/ios-filled/100/ffffff/youtube-play.png"]
  ],
  footerLinks: [
    { label: "Mentions légales", action: "modal", modalKey: "legal" },
    { label: "Confidentialité", action: "modal", modalKey: "privacy" }
  ],
  modals: {
    legal: {
      title: "Mentions légales",
      html:
        "<p>Cette page regroupe les liens officiels de l’OTI du Sud.</p><p>Les contenus publiés sont fournis à titre informatif et peuvent être mis à jour à tout moment.</p><p>Malgré le soin apporté à la publication, l’OTI du Sud ne peut garantir l’absence totale d’erreurs, d’omissions ou d’indisponibilité temporaire de certains services externes.</p><p>Pour toute demande relative au contenu, à la mise à jour d’une information ou à un signalement, merci de contacter l’OTI du Sud via ses canaux officiels.</p>"
    },
    privacy: {
      title: "Confidentialité",
      html:
        "<p>Cette page a été conçue pour limiter au maximum la collecte de données.</p><p>Nous n’utilisons pas de cookies de suivi publicitaire ni d’outils de traçage marketing sur cette page de liens.</p><p>Selon votre navigateur ou les services externes ouverts depuis cette page (réseaux sociaux, billetterie, sites partenaires), des traitements de données peuvent toutefois être effectués par ces services tiers, selon leurs propres politiques de confidentialité.</p><p>Nous vous invitons à consulter la politique de confidentialité de chaque service externe avant de partager des informations personnelles.</p>"
    }
  },
  links: [
    {
      section: { fr: "À la une", en: "Highlights", re: "La Une" },
      title: { fr: "Site officiel OTI Sud", en: "Official OTI South website", re: "Sit ofisyel OTI Sud" },
      description: {
        fr: "Tout le Sud Sauvage en un clic : infos, offices, activités",
        en: "The entire Wild South at a click: info, offices, activities",
        re: "Tout le Sud Sauvage an 1 klic : zinfos, Kaz Tourist’, bann l’aktivite"
      },
      url: "https://www.sudreuniontourisme.fr/",
      image: "https://nnvzjyltcavtccefhmks.supabase.co/storage/v1/object/public/carrousel_link_tree/LT_SiteWeb.png",
      publishedAt: "",
      order: 1
    },
    {
      section: { fr: "Nos événements", en: "Events", re: "Nout bann l'événements" },
      title: { fr: "Agenda & Événements", en: "Events Calendar", re: "Kalendrié & Événements" },
      description: {
        fr: "Randonnées guidées, ateliers, fêtes créoles, brunchs…",
        en: "Guided hikes, workshops, Creole festivals, brunchs…",
        re: "Rando guidées, ateliers, fèt kréol, brunchs…"
      },
      url: "https://www.sudreuniontourisme.fr/",
      image: "https://nnvzjyltcavtccefhmks.supabase.co/storage/v1/object/public/carrousel_link_tree/LT_Agenda.png",
      publishedAt: "2026-02-28",
      order: 2
    },
    {
      section: { fr: "Infos utiles", en: "Useful Info", re: "Zinfos utiles" },
      title: { fr: "Toutes les brochures PDF", en: "All PDF brochures", re: "Tout bann brochure PDF" },
      description: { fr: "Volcan, rivières, saveurs, forêts, carte du Sud…", en: "Volcano, rivers, flavors, forests, South map…", re: "Volkan, rivièr, saveurs, foré, kart Sud…" },
      url: "https://www.sudreuniontourisme.fr/brochures.html",
      image: "https://nnvzjyltcavtccefhmks.supabase.co/storage/v1/object/public/carrousel_link_tree/LT_Brochures.png",
      publishedAt: "",
      order: 4
    }
  ],
  i18n: {
    fr: {
      footerText: "© 2026 OTI du Sud · Tous droits réservés",
      shareSuccess: "Lien copié dans le presse-papier !",
      shareTitle: "Regarde ça : OTI Sud",
      shareCopyError: "Impossible de copier le lien."
    },
    en: {
      footerText: "© 2026 OTI South · All rights reserved",
      shareSuccess: "Link copied to clipboard!",
      shareTitle: "Check this out: OTI South",
      shareCopyError: "Unable to copy the link."
    },
    re: {
      footerText: "© 2026 OTI Sud · Toute la bann droits réservés",
      shareSuccess: "Lien la finn copié !",
      shareTitle: "Gard sa : OTI Sud",
      shareCopyError: "Impossible kopié lien la."
    }
  }
};

