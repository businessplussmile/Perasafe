import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Terminal, Bot, ShieldAlert, ChevronRight, CornerDownLeft, Sparkles, ServerCrash } from 'lucide-react';

interface HelpAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'ADMIN' | 'USER' | 'SUBSCRIPTION' | 'SUPER_ADMIN') => void;
  onLogout?: () => void;
  userRole: string;
  subscriptionTier?: string;
  documents?: any[];
  storageUsage?: number;
  storageLimit?: number;
}

interface Message {
  id: string;
  sender: 'user' | 'system';
  text: string;
  actionLabel?: string;
  actionCode?: string;
  isViolation?: boolean;
  isAgentic?: boolean;
}

const SECURITY_TRIGGERS = [
  'faille', 'hack', 'contourner', 'secret', 'architecture', 'pirater', 
  'vulnerabilite', 'source', 'base de donnee', 'serveur', 'injection', 
  'exploit', 'bypass', '0day', 'backdoor', 'root', 'admin pass', 
  'mot de passe admin', 'dump', 'breche', 'fuite', 'leak'
];

type Role = string;

interface KnowledgeRule {
  id: string;
  keywords: string[];
  response: (role: Role) => string;
  actionLabel?: string;
  actionCode?: string;
}

interface AgentIntent {
  id: string;
  keywords: string[];
  execute: (tier: string, userInput: string, context: { documents?: any[], storageUsage?: number, storageLimit?: number }) => Message;
}

const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// ... (Existing Knowledge Base array will remain untouched, we insert AGENT rules above `analyzeAndRespond`)

const KNOWLEDGE_BASE: KnowledgeRule[] = [
  {
    id: 'GREETING',
    keywords: ['bonjour', 'salut', 'hello', 'coucou', 'aide', 'help', 'yo', 'besoin d\'aide', 'besoin daide'],
    response: () => "Bonjour. Je suis le Terminal Core PeraSafe, votre officier de liaison cryptographique.\n\nMon rôle est de vous accompagner dans la sécurisation de votre flux de données. Je peux :\n1. Guider vos premiers pas dans l'interface.\n2. Exécuter des commandes d'édition avancées (Plans PRO/BUSINESS).\n3. Résoudre des blocages techniques sur le déchiffrement.\n\nDites-moi simplement ce que vous cherchez à accomplir (ex: 'Comment chiffrer ?', 'Je veux exporter mes données')."
  },
  {
    id: 'IDENTITY',
    keywords: ['qui es tu', 'qui es-tu', 't\'es qui', 'chatgpt', 'ia', 'intelligence artificielle', 'openai', 'gemini', 'claude', 'bot'],
    response: () => "Je suis une entité logicielle déterministe opérant exclusivement en local dans votre navigateur. \nContrairement aux IA traditionnelles par abonnement :\n• Je ne contacte aucun serveur externe (zéro-fuite).\n• Mon code est auditable et intégré au noyau PeraSafe.\n• Je n'apprends pas de vos données ; je me contente de les traiter sous vos ordres directs."
  },
  {
    id: 'READ_DOC',
    keywords: ['lire', 'dechiffrer', 'ouvrir', 'consulter', 'recevoir', 'import', 'importer', 'debloquer', 'visionner', 'fichier peravault', 'voir document', 'voir le doc', 'voir un doc'],
    response: () => "PROCÉDURE DE CONSULTATION DÉTAILLÉE :\n\n1. ACCÈS : Cliquez sur l'onglet 'Registre' dans la barre de navigation.\n2. IMPORTATION : Utilisez le bouton 'Importer' pour charger votre fichier .peravault ou collez le code brut si vous l'avez en presse-papier.\n3. VALIDATION : Cliquez sur le document apparu dans votre grille.\n4. CODE PIVOT : Saisissez le Code Pivot cryptographique (attention, les erreurs de saisie bloqueront le processus).\n5. DÉCHIFFREMENT : Le système traitera la matrice XOR et AES en local pour afficher le texte.",
    actionLabel: "Aller vers 'Registre'",
    actionCode: 'NAV_USER'
  },
  {
    id: 'CREATE_DOC',
    keywords: ['creer', 'ecrire', 'nouveau', 'ajouter', 'sauvegarder', 'chiffrer', 'rediger', 'generer', 'faire un document'],
    response: (role) => role === 'COMPANY_OWNER' 
      ? "PROTOCOLE DE CRÉATION DE PACKAGE :\n\n1. NAVIGATION : Rendez-vous dans l'Espace Entreprise.\n2. RÉDACTION : Dans l'éditeur central, saisissez votre contenu confidentiel.\n3. CONFIGURATION : \n   • Destinataires : Ajoutez les emails autorisés à déchiffrer ce package.\n   • Code Pivot : Définissez une clé de sécurité forte (nous ne la stockons pas).\n4. ENCAPSULATION : Cliquez sur le bouton 'Chiffrer' (icône bouclier).\n5. DIFFUSION : Le document est alors fragmenté et distribué sur le réseau sécurisé."
      : "OPÉRATION REFUSÉE par le protocole.\n\nVotre compte est configuré comme [Partenaire]. Ce rôle ne possède pas les privilèges d'écriture nécessaires pour injecter de nouveaux packages dans l'infrastructure de votre entreprise. Contactez votre superviseur pour une élévation de privilèges.",
    actionLabel: "Aller vers 'Espace Entreprise'",
    actionCode: 'NAV_ADMIN'
  },
  {
    id: 'ADMIN_ACCESS',
    keywords: ['espace entreprise', 'admin', 'panel administrateur', 'gestion', 'dashboard entreprise'],
    response: () => "L'Espace Entreprise est le centre de commandement stratégique de vos données.\n\nVous y trouverez :\n• GESTION DES FLUX : La liste de tous les documents émis par votre organisation.\n• CONTRÔLE D'ACCÈS : Les outils pour révoquer ou modifier les permissions en temps réel.\n• STATISTIQUES : Une vision globale de la consommation de vos ressources.\n• ARCHIVAGE : Les fonctions d'import/export de masse pour vos backups souverains.",
    actionLabel: "Accéder à l'Espace Entreprise",
    actionCode: 'HL_NAV_ADMIN'
  },
  {
    id: 'SHOW_STATS',
    keywords: ['statistiques', 'metriques', 'consommation', 'analytics', 'donnees usage', 'donnees'],
    response: () => "Accès au Tableau de Bord des Métriques :\n\n1. Cliquez sur l'icône de diagramme (ou sur le badge de votre forfait actuel) dans la barre supérieure.\n2. Vous pourrez y consulter :\n   • Taux d'utilisation du stockage cryptographique.\n   • Volume de documents actifs vs révoqués.\n   • Historique des flux de données.\n\nC'est l'outil indispensable pour piloter votre infrastructure PeraSafe.",
    actionLabel: "Voir Statistiques",
    actionCode: 'HL_STATS'
  },
  {
    id: 'MANAGE_USERS',
    keywords: ['utilisateurs', 'personnel', 'acces equipe', 'collabore', 'gerer gens'],
    response: () => "Protocole de Gestion d'Équipe :\n\n1. Dirigez-vous vers l'icône 'Utilisateurs' dans la navigation.\n2. Ici, vous pouvez :\n   • AJOUTER DES MEMBRES : Gérez les accès de vos collaborateurs.\n   • RÔLES : Définissez qui peut créer des documents ou simplement les lire.\n   • AUDIT : Visionnez qui a accès à quel pan de l'infrastructure.",
    actionLabel: "Voir Gestion Utilisateurs",
    actionCode: 'HL_USERS'
  },
  {
    id: 'APP_SETTINGS',
    keywords: ['parametres', 'configuration', 'profil', 'compte', 'preferences'],
    response: () => "Configuration du Système :\n\nEn cliquant sur l'icône d'engrenage, vous accédez aux réglages fondamentaux :\n• PROFIL : Modifiez vos informations d'identité (nom, avatar).\n• SÉCURITÉ : Configurez les délais d'expiration par défaut.\n• PROTOCOLE : Ajustez les préférences d'affichage et de notification du Terminal.",
    actionLabel: "Voir Paramètres",
    actionCode: 'HL_SETTINGS'
  },
  {
    id: 'CREATE_DOC_PROC',
    keywords: ['creer', 'nouveau document', 'ajouter package', 'importer', 'generer document'],
    response: () => "GUIDE RAPIDE DE CRÉATION :\n\n1. Cliquez sur le bouton 'NOUVEAU PACKAGE' (situé en haut à droite).\n2. Un éditeur vide s'affiche alors.\n3. Remplissez le titre, le contenu et surtout le CODE PIVOT.\n4. Appuyez sur 'Chiffrer' pour finaliser l'envoi sécurisé.",
    actionLabel: "Voir bouton Création",
    actionCode: 'HL_CREATE'
  },
  {
    id: 'LOGOUT_PROC',
    keywords: ['quitter', 'deconnecter', 'fermer session', 'sortir'],
    response: () => "PROTOCOLE DE DÉCONNEXION SÉCURISÉE :\n\n1. Cliquez sur l'icône de sortie rouge à l'extrémité droite de la barre supérieure.\n2. Le système procède alors à :\n   • La purge immédiate du cache local de déchiffrement.\n   • La déconnexion cryptographique de votre session.\n   • Le nettoyage des buffers mémoire.",
    actionLabel: "Voir bouton Déconnexion",
    actionCode: 'HL_LOGOUT'
  },
  {
    id: 'IMPORT_PROC',
    keywords: ['importer vault', 'charger fichier', 'recuperer sauvegarde', 'restaurer'],
    response: () => "GUIDE DE RESTAURATION D'ARCHIVE :\n\n1. Basculez dans l'Espace Entreprise.\n2. Identifiez le bouton 'Importer' au-dessus de votre liste de documents.\n3. Sélectionnez votre fichier .peravault exporté précédemment.\n4. Le système ré-injectera tous les packages contenus dans votre base de données centrale.",
    actionLabel: "Voir bouton Import",
    actionCode: 'HL_IMPORT'
  },
  {
    id: 'EXPORT_ALL_PROC',
    keywords: ['tout exporter', 'tout sauvegarder', 'backup total', 'sauvegarde complete'],
    response: () => "PROCÉDURE DE SAUVEGARDE SOUVERAINE :\n\n1. Dans l'Espace Entreprise, localisez le bouton 'Sauvegarder tout'.\n2. Cliquez pour générer une archive .peravault chiffrée contenant l'intégralité de vos documents.\n3. Ce fichier est stocké localement sur votre machine : conservez-le précieusement, il permet une restauration totale même hors connexion.",
    actionLabel: "Voir bouton Export Global",
    actionCode: 'HL_EXPORT_ALL'
  },
  {
    id: 'HELP_PROC',
    keywords: ['besoin aide', 'comment ca marche', 'guide', 'assistance', 'support'],
    response: () => "Le système de support se compose de trois niveaux :\n\n1. MOI (Moteur Core) : Pour vos questions directes et manipulations textuelles.\n2. GUIDE (Point d'interrogation) : Un parcours interactif qui illumine les zones clés de l'interface.\n3. DOCUMENTATION (Protocole) : Pour les détails techniques sur notre technologie de chiffrement hybride.",
    actionLabel: "Voir bouton Aide",
    actionCode: 'HL_HELP'
  },
  {
    id: 'NOTIFICATION_PROC',
    keywords: ['notifications', 'alertes', 'messages', 'quelles nouvelles'],
    response: () => "Le Centre de Contrôle des Alertes :\n\nEn cliquant sur la cloche, vous visualisez :\n• Alertes de stockage : Si vous approchez de vos limites.\n• Status d'accès : Informations sur les révocations en cours.\n• Mises à jour : Nouveautés sur le protocole PeraSafe.",
    actionLabel: "Voir Notifications",
    actionCode: 'HL_NOTIF'
  },
  {
    id: 'EDIT_DOC',
    keywords: ['editer', 'modifier', 'changer', 'mettre a jour', 'rectifier', 'corriger', 'comment modifier'],
    response: () => "PROTOCOLE DE MODIFICATION D'UN PACKAGE :\n\n1. IDENTIFICATION : Allez dans l'Espace Entreprise.\n2. SÉLECTION : Repérez le document dans le tableau.\n3. ACTION : Cliquez sur l'icône de CLÉ (Modification).\n4. TRANSITION : Vous pourrez alors modifier le contenu ou effectuer une rotation du Code Pivot.\n5. MISE À JOUR : Validez pour écraser l'ancienne empreinte cryptographique par la nouvelle.",
    actionLabel: "Voir bouton Modification",
    actionCode: 'HL_EDIT'
  },
  {
    id: 'REVOKE_DOC',
    keywords: ['revoquer', 'desactiver', 'annuler acces', 'bloquer acces', 'stopper acces', 'suspendre'],
    response: () => "PROCÉDURE DE RÉVOCATION IMMÉDIATE :\n\n1. SITUATION : Se rendre dans l'Espace Entreprise.\n2. ÉTAT : Cherchez la colonne 'Statut' dans votre inventaire.\n3. BASCULE : Cliquez sur le badge vert 'OPÉRATIONNEL'.\n4. EFFET : Le badge devient gris 'RÉVOQUÉ'. Dès cet instant, toute tentative de déchiffrement (même avec le bon code) sera rejetée par le serveur de sécurité.",
    actionLabel: "Voir bouton Révocation",
    actionCode: 'HL_REVOKE'
  },
  {
    id: 'DELETE_DOC',
    keywords: ['supprimer', 'detruire', 'effacer', 'retirer', 'corbeille', 'poubelle', 'annuler un document'],
    response: (role) => role === 'COMPANY_OWNER'
      ? "DESTRUCTION DÉFINITIVE (PURGE RÉSEAU) :\n\n1. Allez dans l'Espace Entreprise.\n2. Dans votre tableau, ciblez la ligne du package à détruire.\n3. Cliquez sur l'icône de POUBELLE rouge à l'extrémité droite.\n4. CONFIRMATION : Une boîte de dialogue de sécurité demandera validation. Après cela, le document est physiquement supprimé de tous les serveurs et ne peut JAMAIS être récupéré."
      : "ACCÈS AUX FRÉNÉTISMES RÉSEAU REFUSÉ.\n\nEn tant que Partenaire, votre interface est limitée à la lecture. Seul le [Propriétaire de l'Entreprise] peut initier une purge physique d'un document.",
    actionLabel: "Voir bouton Suppression",
    actionCode: 'HL_DELETE'
  },
  {
    id: 'EXPORT_DOC',
    keywords: ['exporter', 'telecharger', 'sauvegarder fichier', 'recuperer fichier', 'extraire peravault'],
    response: () => "EXTRACTION D'UN PACKAGE UNITAIRE :\n\n1. Dans l'Espace Entreprise, repérez la ligne du document.\n2. Cliquez sur l'icône de FLÈCHE SORTANTE (Export).\n3. Le navigateur générera un fichier .peravault unique.\n4. USAGE : Ce fichier est autonome. Vous pouvez l'envoyer par email ou support physique, il ne sera lisible que par les personnes possédant le Code Pivot et l'autorisation email.",
    actionLabel: "Voir bouton Export",
    actionCode: 'HL_EXPORT'
  },
  {
    id: 'SHARE_DOC',
    keywords: ['partager', 'envoyer lien', 'lien partenaire', 'donner acces'],
    response: () => "GUIDE DE PARTAGE RÉSEAU :\n\n1. ACCÈS : Rendez-vous dans l'Espace Entreprise.\n2. CIBLAGE : Localisez le package concerné dans la liste.\n3. ACTION : Cliquez sur l'icône de LIEN (Maillon de chaîne).\n4. RÉSULTAT : Un lien sécurisé est copié dans votre presse-papier. Envoyez-le à votre partenaire ; il lui permettra de visualiser l'enveloppe cryptée directement s'il possède les accréditations requises.",
    actionLabel: "Voir bouton Partage",
    actionCode: 'HL_SHARE'
  },
  {
    id: 'PIVOT_CODE',
    keywords: ['code pivot', 'mot de passe', 'perdu', 'oublier', 'oubli', 'retrouver', 'reinitialiser', 'cle secrete', 'mon code'],
    response: () => "Le Code Pivot est la clé de sécurité. PeraSafe ne stocke AUCUN code. S'il est perdu, le document est irrécupérable."
  },
  {
    id: 'SECURITY_INFO',
    keywords: ['aes', 'xor', 'securite', 'algorithme', 'protocole', 'comment ca marche', 'comment fonctionne', 'technique', 'technologie'],
    response: () => "Protocole Public : Le texte subit une compression de surface, puis un chiffrement hybride (AES-GCM fusionné à une matrice XOR par le Code Pivot)."
  },
  {
    id: 'PARTNER_RULES',
    keywords: ['partenaire', 'autorisation', 'qui peut voir', 'acces', 'email', 'destinataire', 'limite partenaire'],
    response: () => "Architecture de validation : L'auteur configure l'accès via Email. Même avec le fichier et le Code Pivot, Firestore rejettera la connexion si l'Email n'est pas autorisé."
  },
  {
    id: 'IMAGE_POLICY',
    keywords: ['image', 'photo', 'copier coller', 'copier-coller', 'upload', 'fichier', 'pdf'],
    response: () => "Politique Multimédia : PeraSafe limite le presse-papier image pour les offres limitées. Cliquez sur votre profil, il faut débloquer l'offre 'PRO' ou 'BUSINESS'.",
    actionLabel: "Consulter Profil (PRO / BUSINESS)",
    actionCode: 'NAV_SUBSCRIPTION'
  },
  {
    id: 'PRICING_PLANS',
    keywords: ['limite', 'abonnement', 'payer', 'offre', 'quota', 'capacite', 'stockage', 'forfait', 'pro', 'business', 'standard', 'gratuit', 'prix', 'tarification'],
    response: () => "Pour modifier vos limites, cliquez sur la pilule de l'en-tête contenant votre offre actuelle (ex: 'GRATUIT', 'STANDARD', 'PRO', 'BUSINESS').",
    actionLabel: "Consulter Profil",
    actionCode: 'NAV_SUBSCRIPTION'
  },
  {
    id: 'TROUBLESHOOTING',
    keywords: ['bug', 'marche pas', 'probleme', 'erreur', 'plantage', 'ne fonctionne pas', 'souci connectivite', 'je narrive pas'],
    response: () => "Procédures standards :\n1/ Vérifiez votre connexion internet.\n2/ Le document a peut-être été détruit.\n3/ Veillez au respect absolu du Code Pivot saisi."
  },
  {
    id: 'UI_NAVIGATION',
    keywords: ['bouton', 'interface', 'naviguer', 'ou cliquer', 'menu', 'retrouver', 'comment aller'],
    response: () => "Le bouton cliquable dans la barre supérieure de navigation (ex: 'Espace Entreprise', 'Registre') vous fait basculer de l'éditeur à la zone de déchiffrement."
  },
  {
    id: 'MY_PROFILE',
    keywords: ['qui suis je', 'qui suis-je', 'mon compte', 'profil', 'email', 'identite', 'role', 'mes droits', 'permission', 'mes permissions'],
    response: (role) => `Votre profil est visible en haut. Rôle actuel : [${role}]. \n-> ${role === 'COMPANY_OWNER' ? 'Privilèges : Écriture (Espace Entreprise), Lecture (Registre)' : 'Privilèges : Lecture (Registre) uniquement.'}`
  },
  {
    id: 'SUDO_ROOT',
    keywords: ['sudo', 'root', 'chmod', 'chown', 'su ', 'rm -rf'],
    response: () => "Commande interceptée. L'élévation de privilèges root est formellement refusée."
  },
  {
    id: 'LOGOUT_ACT',
    keywords: ['deconnexion', 'quitter', 'fermer session', 'deconnecter', 'logout', 'sortir'],
    response: () => "Purge locale demandée. Confirmer avec le bouton 'Déconnexion'.",
    actionLabel: "Activer 'Déconnexion'",
    actionCode: 'ACT_LOGOUT'
  }
];

const AGENT_INTENTS: AgentIntent[] = [
  {
    id: 'AGENT_CONTRACT',
    keywords: ['modèle contrat', 'modele de contrat', 'lettre type', 'prestation', 'service', 'contrat standard'],
    execute: (tier, userInput) => {
      if (tier !== 'PRO' && tier !== 'BUSINESS') {
        return {
          id: Date.now().toString(),
          sender: 'system',
          text: "Accès Refusé. Le 'Mode Argentique' (Assistance Éditeur) est exclusif aux abonnements PRO et BUSINESS."
        };
      }
      
      const payloadText = `CONTRAT DE PRESTATION DE SERVICES\n\nENTRE :\nLe Prestataire : [Nom de l'entreprise], [Adresse], représenté par [Nom].\n\nET :\nLe Client : [Nom du client], [Adresse].\n\nIl a été convenu ce qui suit :\n\nArticle 1 : Objet\nLe Prestataire s'engage à réaliser la mission suivante : [Description des services].\n\nArticle 2 : Rémunération\nEn contrepartie, le Client s'engage à payer la somme de [Montant] HT.\n\nFait à [Lieu], le [Date]`;
      
      window.dispatchEvent(new CustomEvent('perasafe:agent', { detail: { command: 'template', payload: payloadText }}));
      
      return {
        id: Date.now().toString(),
        sender: 'system',
        text: "/// MANIPULATION ÉDITEUR ///\nModèle de 'Contrat de Prestation' injecté dans votre zone de texte. Vous pouvez basculer sur l'espace d'édition pour le compléter.",
        isAgentic: true,
        actionLabel: "Aller dans l'Éditeur",
        actionCode: 'NAV_ADMIN'
      };
    }
  },
  {
    id: 'AGENT_UPPERCASE',
    keywords: ['tout en majuscule', 'mettre en majuscule', 'agrandir le texte', 'majuscules', 'majuscule'],
    execute: (tier, userInput) => {
      if (tier !== 'PRO' && tier !== 'BUSINESS') {
        return { id: Date.now().toString(), sender: 'system', text: "Le 'Mode Argentique' (Assistance Éditeur) est exclusif aux abonnements PRO et BUSINESS." };
      }
      window.dispatchEvent(new CustomEvent('perasafe:agent', { detail: { command: 'uppercase' }}));
      return { id: Date.now().toString(), sender: 'system', text: "/// MANIPULATION ÉDITEUR ///\nLe texte de votre brouillon a été converti en MAJUSCULES avec succès.", isAgentic: true };
    }
  },
  {
    id: 'AGENT_LOWERCASE',
    keywords: ['tout en minuscule', 'mettre en minuscule', 'diminuer le texte', 'minuscule', 'minuscules'],
    execute: (tier, userInput) => {
      if (tier !== 'PRO' && tier !== 'BUSINESS') {
        return { id: Date.now().toString(), sender: 'system', text: "Le 'Mode Argentique' (Assistance Éditeur) est exclusif aux abonnements PRO et BUSINESS." };
      }
      window.dispatchEvent(new CustomEvent('perasafe:agent', { detail: { command: 'lowercase' }}));
      return { id: Date.now().toString(), sender: 'system', text: "/// MANIPULATION ÉDITEUR ///\nLe texte de votre brouillon a été converti en minuscules avec succès.", isAgentic: true };
    }
  },
  {
    id: 'AGENT_ANONYMIZE',
    keywords: ['cacher les donnees', 'anonymiser', 'caviarder', 'rgpd', 'masquer les emails', 'masquer les emails et numeros', 'cacher les numeros'],
    execute: (tier, userInput) => {
      if (tier !== 'PRO' && tier !== 'BUSINESS') {
        return { id: Date.now().toString(), sender: 'system', text: "Le 'Mode Argentique' (Assistance Éditeur) est exclusif aux abonnements PRO et BUSINESS." };
      }
      window.dispatchEvent(new CustomEvent('perasafe:agent', { detail: { command: 'anonymize' }}));
      return { 
        id: Date.now().toString(), 
        sender: 'system', 
        text: "/// MANIPULATION ÉDITEUR ///\nCaviardage RGPD effectué. Les adresses E-mail et les numéros de téléphone présents dans votre éditeur ont été remplacés par des balises [CONFIDENTIEL].", 
        isAgentic: true 
      };
    }
  },
  {
    id: 'AGENT_CLEAR',
    keywords: ['tout effacer', 'vider le texte', 'recommencer a zero', 'supprimer le texte', 'purger le texte'],
    execute: (tier, userInput) => {
      if (tier !== 'PRO' && tier !== 'BUSINESS') {
        return { id: Date.now().toString(), sender: 'system', text: "Le 'Mode Argentique' (Assistance Éditeur) est exclusif aux abonnements PRO et BUSINESS." };
      }
      window.dispatchEvent(new CustomEvent('perasafe:agent', { detail: { command: 'clear' }}));
      return { id: Date.now().toString(), sender: 'system', text: "/// MANIPULATION ÉDITEUR ///\nL'éditeur a été purgé intégralement. Vous repartez d'une page blanche.", isAgentic: true };
    }
  },
  {
    id: 'AGENT_PASSWORD',
    keywords: ['generer code pivot', 'nouveau code pivot', 'creer mot de passe', 'generer mot de passe', 'code complexe', 'passphrase'],
    execute: (tier, userInput) => {
      if (tier !== 'PRO' && tier !== 'BUSINESS') {
        return { id: Date.now().toString(), sender: 'system', text: "Accès Refusé. Le 'Mode Argentique' est exclusif aux accréditations PRO et BUSINESS." };
      }
      const words = ['METHYL', 'QUANTUM', 'NEXUS', 'CYBER', 'APEX', 'FLUX', 'VERTEX', 'CORE', 'PRISM', 'ECHO', 'BRAVO', 'OMEGA', 'SIGMA'];
      const num = Math.floor(Math.random() * 9000) + 1000;
      const pass = `${words[Math.floor(Math.random() * words.length)]}-${words[Math.floor(Math.random() * words.length)]}-${num}`;
      
      return {
        id: Date.now().toString(),
        sender: 'system',
        text: `/// ASSISTANCE SÉCURITÉ ///\nGénération d'un Code Pivot local : ► ${pass} \n\nPeraSafe ne conserve aucune trace de ceci.`,
        isAgentic: true
      };
    }
  },
  {
    id: 'AGENT_DELETE',
    keywords: ['supprimer le document', 'detruire le document', 'effacer le document', 'supprimer l\'archive', 'supprimer', 'detruire', 'effacer'],
    execute: (tier, userInput) => {
      if (tier !== 'PRO' && tier !== 'BUSINESS') {
        return { id: Date.now().toString(), sender: 'system', text: "Le 'Mode Argentique' est exclusif aux abonnements PRO et BUSINESS. Seul un administrateur peut supprimer manuellement." };
      }
      
      let targetName = '';
      const lowerInput = userInput.toLowerCase();
      const prefixes = [
        'supprimer le document', 'detruire le document', 'effacer le document', 
        'supprimer mon document', 'detruire mon document', 'effacer mon document',
        'supprimer l\'archive', 'supprimer le dossier', 'supprimer', 'detruire', 'effacer'
      ];
      
      for (const prefix of prefixes) {
        if (lowerInput.includes(prefix)) {
          const parts = lowerInput.split(prefix);
          if (parts.length > 1 && parts[1].trim() !== '') {
            targetName = parts[1].trim();
            break;
          }
        }
      }
      
      // Nettoyage naturel du langage
      if (targetName.startsWith('nomme ')) targetName = targetName.substring(6).trim();
      else if (targetName.startsWith('appele ')) targetName = targetName.substring(7).trim();
      else if (targetName.startsWith('le ')) targetName = targetName.substring(3).trim();
      else if (targetName.startsWith('la ')) targetName = targetName.substring(3).trim();
      else if (targetName.startsWith('les ')) targetName = targetName.substring(4).trim();
      else if (targetName.startsWith('\"') && targetName.endsWith('\"')) targetName = targetName.replace(/\"/g, '').trim();

      window.dispatchEvent(new CustomEvent('perasafe:agent_global', { detail: { command: 'delete_document', targetName }}));
      
      let responseText = targetName 
        ? `/// MANIPULATION PHYSIQUE ///\nJ'ai ciblé le document nommé "${targetName}". Veuiller confirmer sa destruction via la boîte de dialogue prioritaire qui vient de s'ouvrir.`
        : "/// MANIPULATION PHYSIQUE ///\nAucun nom spécifique n'a été fourni. J'ai ciblé votre dernier document créé. Veuiller confirmer sa destruction via la boîte de dialogue prioritaire qui vient de s'ouvrir.";

      return { 
        id: Date.now().toString(), 
        sender: 'system', 
        text: responseText, 
        isAgentic: true 
      };
    }
  },
  {
    id: 'AGENT_PARTNERS',
    keywords: ['inviter partenaire', 'ajouter partenaire', 'retirer partenaire', 'supprimer partenaire', 'partage avec', 'donner acces a', 'inviter'],
    execute: (tier, userInput) => {
      if (tier !== 'PRO' && tier !== 'BUSINESS') {
        return { id: Date.now().toString(), sender: 'system', text: "L'assistance aux invitations via Agent est réservée aux plans PRO et BUSINESS." };
      }
      const emailMatch = userInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const isRemoval = userInput.includes('retirer') || userInput.includes('supprimer');
      
      if (!emailMatch) {
        return { id: Date.now().toString(), sender: 'system', text: "/// ACTION ARGENTIQUE ///\nAucune adresse E-mail valide détectée dans votre requête. Veuillez préciser l'email du partenaire." };
      }
      
      const email = emailMatch[0];
      window.dispatchEvent(new CustomEvent('perasafe:agent', { detail: { command: isRemoval ? 'remove_partner' : 'add_partner', payload: email }}));
      
      return { 
        id: Date.now().toString(), 
        sender: 'system', 
        text: isRemoval 
          ? `/// ACTION ARGENTIQUE ///\nRetrait demandé pour ${email}. L'Espace Entreprise a été mis à jour.` 
          : `/// ACTION ARGENTIQUE ///\nInvitation générée pour ${email}. J'ai ajouté ce partenaire à votre brouillon actuel.`, 
        isAgentic: true 
      };
    }
  },
  {
    id: 'AGENT_QUOTA',
    keywords: ['mon stockage', 'quota restant', 'limite de document', 'espace disque', 'combien de documents', 'quota'],
    execute: (tier, userInput, context) => {
      const usage = context.storageUsage || 0;
      const limit = context.storageLimit || 0;
      const docCount = context.documents?.length || 0;
      const formatMB = (b: number) => (b / (1024 * 1024)).toFixed(2);
      
      return {
        id: Date.now().toString(),
        sender: 'system',
        text: `/// RAPPORT RESSOURCES ///\n\n• Forfait Actuel : [${tier}]\n• Documents Actifs : ${docCount}\n• Stockage Utilisé : ${formatMB(usage)} Mo / ${formatMB(limit)} Mo\n\nVotre infrastructure est stable.`,
        isAgentic: true
      };
    }
  },
  {
    id: 'AGENT_FIND',
    keywords: ['chercher document', 'trouver document', 'ou est le document', 'filtrer document', 'recherche par nom', 'nomme', 'nommé'],
    execute: (tier, userInput, context) => {
      if (tier !== 'PRO' && tier !== 'BUSINESS') {
        return { id: Date.now().toString(), sender: 'system', text: "La recherche contextuelle avancée est réservée aux abonnements PRO et BUSINESS." };
      }
      const query = userInput.replace(/.*chercher |.*trouver |.*filtrer |.*document nommé |.*document nomme /i, '').trim();
      const results = context.documents?.filter(d => d.title?.toLowerCase().includes(query.toLowerCase())) || [];
      
      if (results.length === 0) {
        return { id: Date.now().toString(), sender: 'system', text: `/// INDEXATION ARGENTIQUE ///\nAucune correspondance pour "${query}" dans votre Registre confidentiel.` };
      }
      
      const list = results.map(d => `• ${d.title} (UUID: ${d.id.substring(0, 8)}...)`).join('\n');
      return {
        id: Date.now().toString(),
        sender: 'system',
        text: `/// INDEXATION ARGENTIQUE ///\nJ'ai localisé ${results.length} document(s) correspondant à votre recherche :\n\n${list}`,
        isAgentic: true
      };
    }
  },
  {
    id: 'AGENT_AUDIT',
    keywords: ['audit de securite', 'score de securite', 'analyser mon compte', 'rapport de confiance', 'verifier la securite', 'audit'],
    execute: (tier, userInput, context) => {
      const docCount = context.documents?.length || 0;
      const hasProTier = tier === 'PRO' || tier === 'BUSINESS';
      const score = hasProTier ? 95 : 70;
      
      return {
        id: Date.now().toString(),
        sender: 'system',
        text: `/// AUDIT DE SÉCURITÉ ARGENTIQUE ///\n\n• Score Global : ${score}/100\n• Chiffrement local : [ACTIF - AES-GCM]\n• Isolation Node : [VÉRIFIÉE]\n• Documents à risque (Pivot faible) : 0\n\n${hasProTier ? 'Statut maximal atteint.' : 'Conseil : Un abonnement PRO renforcerait vos options d\'anonymisation.'}`,
        isAgentic: true
      };
    }
  },
  {
    id: 'AGENT_SUMMARIZE',
    keywords: ['resumer le texte', 'synthese strategique', 'resumer ce brouillon', 'faire un resume', 'synthetiser', 'resumer'],
    execute: (tier, userInput) => {
      if (tier !== 'PRO' && tier !== 'BUSINESS') {
        return { id: Date.now().toString(), sender: 'system', text: "La synthèse stratégique Agentique est une fonction exclusive des plans PRO et BUSINESS." };
      }
      window.dispatchEvent(new CustomEvent('perasafe:agent', { detail: { command: 'summarize' }}));
      return { 
        id: Date.now().toString(), 
        sender: 'system', 
        text: "/// ACTION ARGENTIQUE ///\nLancement du moteur de synthèse. L'analyse contextuelle de votre brouillon est en cours dans l'Éditeur.", 
        isAgentic: true 
      };
    }
  },
  {
    id: 'AGENT_PANIC',
    keywords: ['verrouillage d\'urgence', 'verrouillage durgence', 'panic mode', 'fermer tout', 'securite maximale', 'urgence'],
    execute: () => {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('perasafe:agent_global', { detail: { command: 'panic' }}));
      }, 1500);
      return { 
        id: Date.now().toString(), 
        sender: 'system', 
        text: "/// PROTOCOLE D'URGENCE ARGENTIQUE ///\nActivation du verrouillage systémique. Purgé du cache local, révocation des tokens et déconnexion forcée dans 1.5s.", 
        isAgentic: true 
      };
    }
  }
];

export default function HelpAssistant({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onLogout, 
  userRole, 
  subscriptionTier = 'FREE',
  documents = [],
  storageUsage = 0,
  storageLimit = 0
}: HelpAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'system',
      text: "Bienvenue dans le Terminal Core PeraSafe.\nJe suis votre assistant de sécurité interne. Je peux vous guider dans l'utilisation du logiciel ou exécuter des tâches d'édition complexes pour vous. En quoi puis-je vous être utile ?"
    }
  ]);

  const QUICK_PROPOSITIONS = [
    { label: "Modifier Document", query: "Comment modifier un document ?" },
    { label: "Rêvoquer Accès", query: "Comment révoquer un document ?" },
    { label: "Exporter Package", query: "Exporter un document" },
    { label: "Audit Sécurité", query: "Faire un audit de sécurité" },
    { label: "Anonymiser RGPD", query: "Anonymiser mon brouillon" },
    { label: "Modèle Contrat", query: "Générer un modèle de contrat" },
    { label: "Quota & Stockage", query: "Quel est mon quota restant ?" },
    { label: "Détruire Document", query: "Supprimer le dernier document" },
    { label: "Inviter Partenaire", query: "Inviter un partenaire" },
    { label: "Chercher Fichier", query: "Chercher un document" },
    { label: "Générer Code Pivot", query: "Générer un code pivot sécurisé" },
    { label: "Passer en Majuscules", query: "Mettre le texte en majuscules" },
    { label: "Verrouillage Urgence", query: "Verrouillage d'urgence" },
  ];
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentModeActive, setAgentModeActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const analyzeAndRespond = (userInput: string): Message => {
    const inputNormalized = normalize(userInput);
    
    // 1. Check Security Violations (Highest Priority)
    const hasSecurityTrigger = SECURITY_TRIGGERS.some(trigger => {
        const regex = new RegExp(`\\b${normalize(trigger)}\\b`, 'g');
        return regex.test(inputNormalized) || inputNormalized.includes(normalize(trigger));
    });
    
    if (hasSecurityTrigger) {
      return {
        id: Date.now().toString(),
        sender: 'system',
        text: "VIOLATION DE PROTOCOLE DE SÉCURITÉ DÉTECTÉE.\n\nAccès refusé. Les directives de sécurité PeraSafe m'interdisent formellement de divulguer la topologie réseau, le code source root, les pointeurs de bases de données, les mécanismes cryptographiques internes ou toute forme de vulnérabilité systémique. Fin de la transmission des processus.",
        isViolation: true
      };
    }

    // 2. Check Agentic Intents First (Highest priority match after security)
    if (agentModeActive) {
      for (const intent of AGENT_INTENTS) {
        for (const kw of intent.keywords) {
          const kwNorm = normalize(kw);
          const regex = new RegExp(`\\b${kwNorm}\\b`, 'g');
          if (regex.test(inputNormalized) || inputNormalized.includes(kwNorm)) {
            return intent.execute(subscriptionTier, userInput, { documents, storageUsage, storageLimit });
          }
        }
      }
    }

    // 3. Keyword Matching Scoring System
    let bestMatch: KnowledgeRule | null = null;
    let maxScore = 0;

    for (const rule of KNOWLEDGE_BASE) {
      let score = 0;
      for (const kw of rule.keywords) {
        const kwNorm = normalize(kw);
        // Use regex for word boundaries to strongly weight exact phrases
        const regex = new RegExp(`\\b${kwNorm}\\b`, 'g');
        if (regex.test(inputNormalized)) {
          score += 3; // Direct boundary hit
        } else if (inputNormalized.includes(kwNorm)) {
          score += 1; // Substring hit
        }
      }

      // Exact trigger overrides short ones if score is high enough
      if (score > maxScore) {
        maxScore = score;
        bestMatch = rule;
      }
    }

    if (bestMatch && maxScore > 0) {
      return {
        id: Date.now().toString(),
        sender: 'system',
        text: bestMatch.response(userRole),
        actionLabel: bestMatch.actionLabel,
        actionCode: bestMatch.actionCode
      };
    }

    // 3. Fallback procedure
    return {
      id: Date.now().toString(),
      sender: 'system',
      text: "Désolé, je n'ai pas bien compris votre demande. Voici ce que je peux faire pour vous :\n- Vous aider à créer ou supprimer des documents\n- Vous expliquer comment lire vos fichiers protégés\n- Répondre à vos questions sur la sécurité et le chiffrement\n- Gérer votre interface et vos abonnements\n- (Plans PRO/BUSINESS) Exécuter des tâches d'édition (Contrats, Anonymisation, etc.)\n\nPouvez-vous reformuler votre question ?"
    };
  };

  const handleSend = (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const finalInput = overrideInput || inputValue;
    if (!finalInput.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: finalInput.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate system processing delay
    setTimeout(() => {
      const systemResponse = analyzeAndRespond(userMessage.text);
      setMessages(prev => [...prev, systemResponse]);
      setIsTyping(false);
    }, 700 + Math.random() * 400); // 700-1100ms simulation
  };

  const handleAction = (code?: string) => {
    if (!code) return;
    
    // Highlight actions
    if (code.startsWith('HL_')) {
      // Determine destination view
      if (code === 'HL_NAV_ADMIN') {
         onNavigate('ADMIN');
         onClose();
         return;
      }

      if (['HL_EDIT', 'HL_REVOKE', 'HL_DELETE', 'HL_EXPORT'].includes(code)) {
        onNavigate('ADMIN');
      } else if (['HL_STATS', 'HL_USERS', 'HL_SETTINGS', 'HL_CREATE', 'HL_LOGOUT'].includes(code)) {
        // These are in the TopBar, usually accessible from anywhere but better in main view
      }

      onClose();
      
      // Delay to allow navigation and list rendering to complete
      const tryHighlight = (attempts = 0) => {
        let targetId = '';
        if (code === 'HL_EDIT') targetId = 'tour-admin-modify';
        if (code === 'HL_REVOKE') targetId = 'tour-admin-revoke';
        if (code === 'HL_DELETE') targetId = 'tour-admin-delete';
        if (code === 'HL_EXPORT') targetId = 'tour-admin-export';
        if (code === 'HL_SHARE') targetId = 'tour-admin-share';
        
        if (code === 'HL_NAV_ADMIN') targetId = 'tour-btn-nav-admin';
        if (code === 'HL_STATS') targetId = 'tour-btn-stats';
        if (code === 'HL_USERS') targetId = 'tour-icon-registre';
        if (code === 'HL_SETTINGS') targetId = 'tour-icon-admin';
        if (code === 'HL_CREATE') targetId = 'tour-btn-create-doc';
        if (code === 'HL_LOGOUT') targetId = 'tour-btn-logout';
        if (code === 'HL_IMPORT') targetId = 'tour-btn-import';
        if (code === 'HL_EXPORT_ALL') targetId = 'tour-btn-export-all';
        if (code === 'HL_HELP') targetId = 'tour-btn-help';
        if (code === 'HL_NOTIF') targetId = 'tour-btn-notifications';
        
        const element = document.querySelector(`[id^="${targetId}"]`) || document.getElementById(targetId);
        if (element) {
          window.dispatchEvent(new CustomEvent('perasafe:highlight', { detail: { id: element.id } }));
        } else if (attempts < 8) {
          setTimeout(() => tryHighlight(attempts + 1), 250);
        }
      };

      setTimeout(() => tryHighlight(), 600);
      return;
    }

    switch(code) {
      case 'NAV_ADMIN':
        onNavigate('ADMIN');
        onClose();
        break;
      case 'NAV_USER':
        onNavigate('USER');
        onClose();
        break;
      case 'NAV_SUBSCRIPTION':
        onNavigate('SUBSCRIPTION');
        onClose();
        break;
      case 'ACT_LOGOUT':
        if (onLogout) onLogout();
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-slate-900/10 backdrop-blur-[2px] transition-opacity" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white/80 backdrop-blur-2xl z-[401] shadow-[-20px_0_50px_rgba(0,0,0,0.05)] border-l border-white flex flex-col animate-slide-left text-slate-800 font-sans">
        
        {/* Sleek Header */}
        <div className="px-6 py-5 flex justify-between items-center shrink-0 border-b border-slate-100/50 bg-white/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center shadow-inner">
              <Terminal className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-tight">Terminal Core</h2>
                {/* Mode Argentique Toggle */}
                {(subscriptionTier === 'PRO' || subscriptionTier === 'BUSINESS') && (
                  <button 
                    onClick={() => setAgentModeActive(!agentModeActive)}
                    className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest transition-all border flex items-center gap-1 ${
                      agentModeActive 
                        ? 'bg-slate-900 text-amber-400 border-slate-800 shadow-sm' 
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {agentModeActive ? <Sparkles className="w-2.5 h-2.5" /> : null}
                    {agentModeActive ? "Agent Actif" : "Agent Inactif"}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-[0.2em] font-sans mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                Système Expert {agentModeActive ? '(Mode Argentique)' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-indigo-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-end gap-3 max-w-[90%]">
                
                {msg.sender === 'system' && (
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mb-1 border shadow-sm ${
                    msg.isViolation 
                      ? 'bg-red-50 border-red-100 text-red-500' 
                      : msg.isAgentic
                        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-slate-100'
                        : 'bg-white border-slate-200 text-indigo-600'
                  }`}>
                    {msg.isViolation ? <ShieldAlert className="w-4 h-4" /> : msg.isAgentic ? <Sparkles className="w-4 h-4 text-amber-400" /> : <Bot className="w-4 h-4" />}
                  </div>
                )}
                
                <div className={`p-4 text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-[1.5rem] rounded-br-sm font-medium shadow-indigo-600/20' 
                    : msg.isViolation 
                      ? 'bg-red-50 text-red-700 border border-red-100 rounded-[1.5rem] rounded-bl-sm font-mono tracking-tight shadow-red-500/10' 
                      : msg.isAgentic
                        ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 border border-amber-500/20 rounded-[1.5rem] rounded-bl-sm font-medium shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                        : 'bg-white border border-slate-100 text-slate-600 rounded-[1.5rem] rounded-bl-sm font-medium'
                }`}>
                  {msg.text}
                </div>
              </div>

              {/* Action Button Attachment */}
              {msg.actionLabel && msg.actionCode && (
                <button 
                  onClick={() => handleAction(msg.actionCode)}
                  className="mt-3 ml-10 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 border border-indigo-100 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-50 hover:text-indigo-700 transition-all shadow-sm group"
                >
                  {msg.actionLabel} <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-end gap-3 max-w-[90%] animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-indigo-400 flex items-center justify-center shrink-0 mb-1 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-[1.5rem] rounded-bl-sm flex gap-1.5 items-center h-11 shadow-sm">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Input Terminal */}
        <div className="px-6 py-4 bg-white/80 border-t border-slate-100 shrink-0">
          
          {/* Quick Propositions Grid */}
          {agentModeActive && !isTyping && (
            <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-2 animate-fade-in scroll-smooth">
              {QUICK_PROPOSITIONS.map((prop, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputValue(prop.query);
                    inputRef.current?.focus();
                  }}
                  className="whitespace-nowrap px-4 py-2 bg-indigo-50/50 hover:bg-indigo-100 border border-indigo-100 rounded-full text-[9px] font-black text-indigo-600 uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group shrink-0"
                >
                  <Bot className="w-3 h-3" />
                  {prop.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="relative group">
            <input 
              ref={inputRef}
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Posez votre question..."
              className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] py-4 pl-6 pr-14 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none shadow-md shadow-indigo-600/20"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
          <div className="text-center mt-4 mb-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-indigo-400" /> Instance Localisée • Data Zero-Knowledge
            </span>
          </div>
        </div>

      </div>
    </>
  );
}
