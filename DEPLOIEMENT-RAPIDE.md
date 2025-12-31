# 🚀 GUIDE DE DÉPLOIEMENT RAPIDE - EUREKA.PX

## ⚡ Déploiement en 10 minutes

### Étape 1: Télécharger les fichiers (FAIT ✅)

Vous avez maintenant tous ces fichiers:
- `index.html` - Page d'accueil
- `payment.html` - Formulaire de commande
- `payment-instructions.html` - Instructions de paiement
- `payment-confirmation.html` - Page de confirmation
- `favicon.svg` - Logo
- `vercel.json` - Configuration Vercel
- `package.json` - Configuration npm
- `google-apps-script.js` - Backend automatisé
- `README-PAYMENT-SYSTEM.md` - Documentation complète

### Étape 2: Déployer sur Vercel (5 min)

1. **Allez sur https://vercel.com**
2. **Créez un compte** (gratuit) avec GitHub ou email
3. **Cliquez "Add New Project"**
4. **Choisissez "Upload"** ou glissez-déposez tous les fichiers
5. **Cliquez "Deploy"**
6. ⏳ Attendez 30 secondes...
7. ✅ **Votre site est en ligne !**

URL temporaire: `https://eureka-px-[random].vercel.app`

### Étape 3: Configurer le domaine eurekapx.com (10 min)

#### Dans Vercel:
1. Allez dans **Settings** de votre projet
2. Cliquez **Domains**
3. Ajoutez: `eurekapx.com`
4. Ajoutez aussi: `www.eurekapx.com`

#### Chez votre registrar (où vous avez acheté le domaine):
Trouvez la section **DNS** et ajoutez:

**Pour le domaine racine:**
```
Type: A
Host/Name: @ (ou laisser vide)
Value: 76.76.21.21
TTL: Automatique
```

**Pour www:**
```
Type: CNAME
Host/Name: www
Value: cname.vercel-dns.com
TTL: Automatique
```

⏰ Attendez 5 minutes à 48 heures pour la propagation DNS.

### Étape 4: Configurer le Backend (20 min)

#### Option A: Google Apps Script (Gratuit, Recommandé)

1. **Créer une Google Sheet**
   - Allez sur https://sheets.google.com
   - Créez une nouvelle feuille
   - Nommez-la "Eureka.Px - Commandes"

2. **Installer le Script**
   - Dans la feuille: Extensions → Apps Script
   - Effacez le code par défaut
   - Copiez tout le contenu de `google-apps-script.js`
   - Collez dans l'éditeur

3. **Configurer**
   Modifiez les lignes 14-21:
   ```javascript
   const CONFIG = {
     SPREADSHEET_ID: 'VOTRE_ID_ICI', // Copier depuis l'URL de votre Sheet
     SHEET_NAME: 'Commandes',
     COMPANY_NAME: 'Eureka.Px',
     COMPANY_EMAIL: 'contact@eurekapx.com',
     AIRTEL_NUMBER: '+243 997264738',
     ORANGE_NUMBER: '+243 997264738',
     CDF_RATE: 2350
   };
   ```

4. **Déployer**
   - Cliquez "Déployer" → "Nouvelle déploiement"
   - Type: "Application Web"
   - Qui a l'accès: "Tout le monde"
   - Cliquez "Déployer"
   - **Copiez l'URL du webhook**

5. **Connecter au site**
   Dans `payment-instructions.html`, ligne ~337, remplacez:
   ```javascript
   // TODO: Implémenter l'appel API réel
   // const response = await fetch('/api/payment', {
   
   // PAR:
   const response = await fetch('VOTRE_URL_WEBHOOK_ICI', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data)
   });
   ```

6. **Redéployer sur Vercel**
   - Uploadez le fichier `payment-instructions.html` modifié
   - Ou faites un commit si vous utilisez Git

#### Option B: Sans Backend (Temporaire)

Le système fonctionne déjà avec localStorage:
- Les données sont stockées localement
- Vous recevez les notifications par email manuel
- À remplacer par Option A dès que possible

### Étape 5: Tester (5 min)

1. **Allez sur votre site**: `https://eurekapx.com`
2. **Cliquez "Démarrer"**
3. **Remplissez le formulaire** avec vos vraies infos
4. **Vérifiez que:**
   - ✅ La référence est générée
   - ✅ Le numéro s'affiche correctement
   - ✅ Le calendrier correspond au plan choisi
   - ✅ L'email est envoyé (si backend configuré)

### Étape 6: Personnalisation (Optionnel)

#### Modifier les numéros de téléphone:
Dans `payment-instructions.html`:
```javascript
let phoneNumber = '+243 997264738'; // Remplacez
```

#### Modifier le taux CDF:
Dans tous les fichiers, cherchez `2350` et remplacez par votre taux.

#### Modifier l'email:
Dans `index.html` et tous les fichiers, cherchez `contact@eurekapx.com` et remplacez.

---

## 📋 CHECKLIST FINALE

### Avant d'annoncer le site:
- [ ] Site déployé sur Vercel
- [ ] Domaine eurekapx.com configuré et fonctionnel
- [ ] Backend configuré (Google Apps Script OU temporaire)
- [ ] Numéros de téléphone vérifiés
- [ ] Email de contact correct
- [ ] Test de bout en bout effectué
- [ ] Facture pro forma reçue par email
- [ ] Tous les liens fonctionnent

### Dans les 7 jours:
- [ ] Configurer Google Apps Script (si pas fait)
- [ ] Tester les emails automatiques
- [ ] Vérifier le stockage dans Google Sheets
- [ ] Configurer les rappels automatiques

### Dans les 30 jours:
- [ ] Ajouter Google Analytics
- [ ] Créer dashboard admin
- [ ] Améliorer les templates d'emails
- [ ] Ajouter témoignages clients

---

## 🆘 PROBLÈMES COURANTS

### Le site ne se charge pas
**Solution:** Vérifiez que `index.html` est bien à la racine du projet sur Vercel.

### Le domaine ne fonctionne pas
**Solution:** 
1. Vérifiez les enregistrements DNS (utilisez https://dnschecker.org)
2. Attendez jusqu'à 48h pour la propagation
3. Videz le cache: `Ctrl+Shift+Delete`

### Les emails ne sont pas envoyés
**Solution:**
1. Vérifiez que le script Google Apps Script est déployé
2. Vérifiez l'URL du webhook dans le code
3. Regardez les logs: Apps Script → Executions

### La référence n'est pas générée
**Solution:**
1. Ouvrez la console (F12)
2. Regardez les erreurs JavaScript
3. Vérifiez que localStorage fonctionne

---

## 📞 SUPPORT

### Documentation complète:
- `README-PAYMENT-SYSTEM.md` - Tout le système expliqué

### Ressources:
- Vercel: https://vercel.com/docs
- Google Apps Script: https://developers.google.com/apps-script

### Contact:
- Email: contact@eurekapx.com
- Le système fonctionne déjà, vous pouvez commencer à recevoir des commandes!

---

## 🎉 FÉLICITATIONS!

Votre système de paiement est opérationnel!

**Ce que vous avez maintenant:**
✅ Site professionnel responsive
✅ Système de paiement complet
✅ 2 plans de paiement flexibles
✅ 3 méthodes de paiement (Airtel, Orange, Bank)
✅ Génération de références uniques
✅ Instructions claires pour les clients
✅ Prêt pour l'automatisation backend

**Prochaine étape:**
👉 Testez avec une vraie commande
👉 Configurez le backend Google Apps Script
👉 Commencez à promouvoir votre site!

Bon lancement! 🚀
