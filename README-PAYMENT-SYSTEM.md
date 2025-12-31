# Système de Paiement Eureka.Px

## Vue d'ensemble

Ce système de paiement permet à vos clients de:
1. Choisir leur plan de paiement (3x sur 4 semaines OU 3x sur 3 mois)
2. Sélectionner leur méthode (Airtel Money, Orange Money, ou Virement Bancaire)
3. Choisir la devise (USD ou CDF pour Mobile Money)
4. Recevoir des instructions claires avec une référence unique
5. Confirmer leur paiement

## Structure des Fichiers

```
eureka-px/
├── index.html                      # Page d'accueil (mise à jour avec boutons de paiement)
├── payment.html                    # Formulaire de commande
├── payment-instructions.html       # Instructions de paiement avec référence
├── payment-confirmation.html       # Page de confirmation
├── favicon.svg                     # Logo Eureka.Px
├── vercel.json                     # Configuration Vercel
└── package.json                    # Configuration npm
```

## Plans de Paiement

### Plan 1: 3 paiements sur 4 semaines
- **Paiement 1**: Jour 0 - 200 USD
- **Paiement 2**: Jour 14 - 200 USD
- **Paiement 3**: Jour 28 (Livraison) - 200 USD

### Plan 2: 3 paiements sur 3 mois
- **Paiement 1**: Aujourd'hui - 200 USD
- **Mois 1**: GRATUIT
- **Fin Mois 2**: 235 USD (200 USD développement + 35 USD hébergement)
- **Fin Mois 3**: 235 USD (200 USD développement + 35 USD hébergement)

## Méthodes de Paiement

### Airtel Money / Orange Money
- Numéro: **+243 997264738**
- Devise: USD ou CDF (1 USD = 2350 FC)
- Référence obligatoire dans le motif de paiement

### Virement Bancaire
- Informations bancaires envoyées par email
- Référence obligatoire

## Workflow de Paiement

### 1. Client clique "Démarrer"
- Redirige vers `payment.html`

### 2. Formulaire de Commande (`payment.html`)
Le client remplit:
- Prénom, Nom
- Email
- Téléphone
- Entreprise (optionnel)
- Plan de paiement
- Méthode de paiement
- Devise (si Mobile Money)

### 3. Instructions (`payment-instructions.html`)
Le système génère:
- **Référence unique**: `EUREKA-PX-XXXXXXXXX`
- Instructions étape par étape
- Calendrier de paiement personnalisé
- Numéro de téléphone à utiliser

### 4. Confirmation (`payment-confirmation.html`)
Après que le client clique "J'ai effectué le paiement":
- Affiche statut "En attente de vérification"
- Rappelle la référence
- Explique les prochaines étapes

## Génération de Référence

Format: `EUREKA-PX-[TIMESTAMP][RANDOM]`

Exemple: `EUREKA-PX-456789123`

Cette référence est:
- Unique pour chaque commande
- Utilisée pour tracer le paiement
- Mentionnée dans tous les emails
- Stockée dans localStorage

## Données Stockées (localStorage)

### orderData
```javascript
{
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean.dupont@example.com",
  phone: "+243 XXX XXX XXX",
  company: "Ma Société",
  paymentPlan: "4weeks" | "3months",
  paymentMethod: "airtel" | "orange" | "bank",
  currency: "usd" | "cdf",
  reference: "EUREKA-PX-XXXXXXXXX"
}
```

### paymentConfirmed
Après confirmation, contient `orderData` + :
```javascript
{
  ...orderData,
  paymentDate: "2025-01-01T10:00:00.000Z",
  status: "pending_verification"
}
```

## Backend à Implémenter

Le système actuel utilise localStorage. Pour le backend:

### Option 1: Google Apps Script (Gratuit)

**Avantages:**
- Gratuit
- Intégration Google Sheets
- Envoi emails automatique
- Facile à déployer

**Fonctionnalités à implémenter:**
1. Recevoir les données de paiement
2. Stocker dans Google Sheets
3. Générer facture PDF
4. Envoyer email avec facture
5. Créer rappels automatiques

**Code de démarrage:**
```javascript
// Code.gs dans Google Apps Script
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  // 1. Enregistrer dans Google Sheets
  const sheet = SpreadsheetApp.openById('VOTRE_SHEET_ID').getActiveSheet();
  sheet.appendRow([
    new Date(),
    data.reference,
    data.firstName,
    data.lastName,
    data.email,
    data.phone,
    data.paymentPlan,
    data.paymentMethod,
    data.currency,
    'pending'
  ]);
  
  // 2. Envoyer email
  sendInvoiceEmail(data);
  
  return ContentService.createTextOutput(JSON.stringify({success: true}));
}

function sendInvoiceEmail(data) {
  const template = HtmlService.createTemplateFromFile('email-template');
  template.data = data;
  
  MailApp.sendEmail({
    to: data.email,
    subject: `Facture Pro Forma ${data.reference}`,
    htmlBody: template.evaluate().getContent()
  });
}
```

### Option 2: Vercel + Edge Functions

Pour un backend plus robuste :

**Créer `/api/payment.js`:**
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  
  // Validation
  if (!data.email || !data.reference) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Stocker dans base de données (Vercel KV, Supabase, etc.)
    await storePayment(data);
    
    // 2. Envoyer email (Resend, SendGrid, etc.)
    await sendEmail(data);
    
    return res.status(200).json({ success: true, reference: data.reference });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

## Templates Email

### Email 1: Facture Pro Forma

```
Sujet: Facture Pro Forma N° [REFERENCE]

Bonjour [PRENOM],

Merci pour votre confiance !

Voici votre facture pro forma pour le développement de votre application IA.

┌─────────────────────────────────────┐
│  FACTURE PRO FORMA                  │
│  N° [REFERENCE]                     │
│                                     │
│  En attente de vérification         │
└─────────────────────────────────────┘

Client: [PRENOM] [NOM]
Email: [EMAIL]
Montant: [MONTANT]

📋 INSTRUCTIONS DE PAIEMENT

[SI AIRTEL/ORANGE]
Numéro: +243 997264738
Référence: [REFERENCE]

[SI BANK]
Informations bancaires:
[DÉTAILS BANCAIRES]

⏰ Calendrier de paiement
[CALENDRIER SELON PLAN]

Une fois le paiement effectué, vous recevrez un reçu de confirmation.

Cordialement,
L'équipe Eureka.Px
```

### Email 2: Confirmation de Paiement

```
Sujet: Paiement confirmé - [REFERENCE]

Bonjour [PRENOM],

Excellente nouvelle !

Nous avons bien reçu et validé votre paiement.

┌─────────────────────┐
│  Montant reçu       │
│     [MONTANT]       │
│                     │
│  [METHODE]          │
│  [REFERENCE]        │
└─────────────────────┘

✅ Prochaines étapes:
1. Votre projet entre en développement
2. Mises à jour régulières
3. Rappels automatiques avant échéances

Merci de votre confiance !

L'équipe Eureka.Px
```

### Email 3: Rappel de Paiement (2 jours avant)

```
Sujet: Rappel - Prochain paiement dans 2 jours

Bonjour [PRENOM],

Rappel amical : votre prochain paiement arrive dans 2 jours.

Montant: [MONTANT]
Date: [DATE]
Référence: [REFERENCE]

Instructions de paiement:
[INSTRUCTIONS]

En cas de question, nous sommes là pour vous aider.

L'équipe Eureka.Px
```

## Déploiement sur Vercel

### Méthode Simple (Glisser-Déposer)

1. Allez sur https://vercel.com
2. Connectez-vous
3. Cliquez "Add New Project"
4. Glissez-déposez le dossier `public/`
5. Cliquez "Deploy"
6. Votre site est en ligne !

### Méthode Git (Recommandée)

```bash
# 1. Créer un repo GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/eureka-px.git
git push -u origin main

# 2. Sur Vercel
# - Import Git Repository
# - Sélectionnez votre repo
# - Deploy
```

## Configuration du Domaine eurekapx.com

### Dans Vercel

1. Settings → Domains
2. Ajoutez: `eurekapx.com` et `www.eurekapx.com`

### Configuration DNS

Chez votre registrar (OVH, GoDaddy, etc.):

**Enregistrement A (domaine racine)**
```
Type: A
Nom: @
Valeur: 76.76.21.21
```

**Enregistrement CNAME (www)**
```
Type: CNAME
Nom: www
Valeur: cname.vercel-dns.com
```

Temps de propagation: 5 minutes à 48 heures.

## Personnalisation

### Changer les Numéros de Téléphone

Dans `payment-instructions.html`, ligne ~156 et ~167:
```javascript
let phoneNumber = '+243 997264738'; // Remplacer par votre numéro
```

### Changer le Taux de Change

Dans `payment.html`, ligne ~461 et autres fichiers:
```javascript
const rate = 2350; // Modifier selon le taux actuel
```

### Ajouter Informations Bancaires

Dans `payment-instructions.html`, section instructions pour 'bank':
```javascript
instructions = [
  `Connectez-vous à votre banque en ligne`,
  `Sélectionnez <strong>Virement international</strong>`,
  `<strong>Bénéficiaire:</strong> Eureka.Px`,
  `<strong>IBAN:</strong> VOTRE_IBAN`,
  `<strong>BIC/SWIFT:</strong> VOTRE_BIC`,
  // ... etc
];
```

## Sécurité

### Important

1. **Ne jamais** stocker de données sensibles dans localStorage en production
2. **Toujours** valider les paiements manuellement avant de commencer le développement
3. **Utiliser** HTTPS (automatique avec Vercel)
4. **Implémenter** un backend sécurisé pour les données réelles

### Headers de Sécurité

Déjà configurés dans `vercel.json`:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## Prochaines Étapes

### Phase 1: Backend (Recommandé dans les 48h)
- [ ] Implémenter Google Apps Script ou Vercel Functions
- [ ] Connecter à Google Sheets pour stockage
- [ ] Configurer envoi d'emails automatiques

### Phase 2: Automatisation (Semaine 1)
- [ ] Créer système de rappels automatiques
- [ ] Générer factures PDF
- [ ] Dashboard admin pour suivre les paiements

### Phase 3: Amélioration (Mois 1)
- [ ] Intégration API Mobile Money (si disponible)
- [ ] Webhook de confirmation automatique
- [ ] Analytics et tracking des conversions

## Support

Pour toute question:
- Email: contact@eurekapx.com
- Documentation Vercel: https://vercel.com/docs

## Licence

© 2025 Eureka.Px - Tous droits réservés
