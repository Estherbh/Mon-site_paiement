/**
 * BACKEND GOOGLE APPS SCRIPT - EUREKA.PX
 * 
 * Ce script gère:
 * 1. Réception des commandes via webhook
 * 2. Stockage dans Google Sheets
 * 3. Envoi d'emails automatiques (facture + confirmation)
 * 4. Rappels de paiement programmés
 * 
 * INSTALLATION:
 * 1. Créer un nouveau Google Sheet
 * 2. Extensions → Apps Script
 * 3. Coller ce code
 * 4. Déployer en tant que Web App
 * 5. Copier l'URL du webhook
 * 6. Remplacer dans payment-instructions.html
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SPREADSHEET_ID: 'VOTRE_GOOGLE_SHEET_ID', // ID de votre Google Sheet
  SHEET_NAME: 'Commandes',
  COMPANY_NAME: 'Eureka.Px',
  COMPANY_EMAIL: 'contact@eurekapx.com',
  AIRTEL_NUMBER: '+243 997264738',
  ORANGE_NUMBER: '+243 997264738',
  CDF_RATE: 2350 // 1 USD = 2350 FC
};

// ============================================================================
// WEBHOOK ENDPOINT - Reçoit les données de paiement
// ============================================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Validation basique
    if (!data.email || !data.reference) {
      return createResponse(400, { error: 'Données manquantes' });
    }
    
    // 1. Enregistrer dans Google Sheets
    saveToSheet(data);
    
    // 2. Envoyer facture pro forma
    sendProFormaInvoice(data);
    
    // 3. Programmer les rappels
    scheduleReminders(data);
    
    return createResponse(200, { 
      success: true, 
      reference: data.reference,
      message: 'Commande enregistrée avec succès'
    });
    
  } catch (error) {
    Logger.log('Erreur doPost: ' + error.toString());
    return createResponse(500, { error: error.toString() });
  }
}

// ============================================================================
// STOCKAGE GOOGLE SHEETS
// ============================================================================

function saveToSheet(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  // Créer la feuille si elle n'existe pas
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow([
      'Date', 'Référence', 'Statut', 'Prénom', 'Nom', 'Email', 'Téléphone', 
      'Entreprise', 'Plan', 'Méthode', 'Devise', 'Montant 1', 'Montant 2', 
      'Montant 3', 'Date Paiement 1', 'Date Paiement 2', 'Date Paiement 3',
      'Notes'
    ]);
  }
  
  // Calculer les montants selon le plan
  const amounts = calculateAmounts(data);
  
  // Ajouter la ligne
  sheet.appendRow([
    new Date(),
    data.reference,
    'En attente',
    data.firstName,
    data.lastName,
    data.email,
    data.phone,
    data.company || '',
    data.paymentPlan === '4weeks' ? '3x 4 semaines' : '3x 3 mois',
    getMethodName(data.paymentMethod),
    data.currency.toUpperCase(),
    amounts[0],
    amounts[1],
    amounts[2],
    '', '', '', // Dates de paiement (à remplir manuellement)
    ''
  ]);
}

function calculateAmounts(data) {
  const rate = data.currency === 'cdf' ? CONFIG.CDF_RATE : 1;
  
  if (data.paymentPlan === '4weeks') {
    return [200 * rate, 200 * rate, 200 * rate];
  } else {
    return [200 * rate, 235 * rate, 235 * rate];
  }
}

function getMethodName(method) {
  const methods = {
    'airtel': 'Airtel Money',
    'orange': 'Orange Money',
    'bank': 'Virement Bancaire'
  };
  return methods[method] || method;
}

// ============================================================================
// EMAIL - FACTURE PRO FORMA
// ============================================================================

function sendProFormaInvoice(data) {
  const subject = `Facture Pro Forma N° ${data.reference}`;
  const htmlBody = createProFormaEmail(data);
  
  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.COMPANY_NAME
  });
  
  Logger.log(`Facture pro forma envoyée à ${data.email}`);
}

function createProFormaEmail(data) {
  const amounts = calculateAmounts(data);
  const firstAmount = formatAmount(amounts[0], data.currency);
  
  let paymentInstructions = '';
  if (data.paymentMethod === 'airtel') {
    paymentInstructions = `
      <p><strong>📱 Airtel Money</strong></p>
      <p>Numéro: <strong>${CONFIG.AIRTEL_NUMBER}</strong></p>
      <p>Référence obligatoire: <strong>${data.reference}</strong></p>
    `;
  } else if (data.paymentMethod === 'orange') {
    paymentInstructions = `
      <p><strong>📱 Orange Money</strong></p>
      <p>Numéro: <strong>${CONFIG.ORANGE_NUMBER}</strong></p>
      <p>Référence obligatoire: <strong>${data.reference}</strong></p>
    `;
  } else {
    paymentInstructions = `
      <p><strong>🏦 Virement Bancaire</strong></p>
      <p>Les informations bancaires vous seront envoyées séparément.</p>
      <p>Référence obligatoire: <strong>${data.reference}</strong></p>
    `;
  }
  
  const schedule = createPaymentSchedule(data, amounts);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563EB 0%, #EA580C 100%); 
                  color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .content { background: #f9f9f9; padding: 30px; margin: 20px 0; border-radius: 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #2563EB; }
        .schedule { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
        .schedule-item { display: flex; justify-content: space-between; padding: 10px 0; 
                         border-bottom: 1px solid #eee; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; color: #666; margin-top: 30px; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 FACTURE PRO FORMA</h1>
          <p>N° ${data.reference}</p>
          <p style="color: #FFC107;">🟠 En attente de vérification</p>
        </div>
        
        <div class="content">
          <h2>Bonjour ${data.firstName},</h2>
          <p>Merci pour votre confiance !</p>
          <p>Voici votre facture pro forma pour le développement de votre application IA sur-mesure.</p>
          
          <div class="info-box">
            <h3>Informations Client</h3>
            <p><strong>Nom:</strong> ${data.firstName} ${data.lastName}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Téléphone:</strong> ${data.phone}</p>
            ${data.company ? `<p><strong>Entreprise:</strong> ${data.company}</p>` : ''}
          </div>
          
          <div class="info-box">
            <h3>Détails de la Commande</h3>
            <p><strong>Service:</strong> Développement Application IA</p>
            <p><strong>Plan:</strong> ${data.paymentPlan === '4weeks' ? '3 paiements sur 4 semaines' : '3 paiements sur 3 mois'}</p>
            <p><strong>Premier paiement:</strong> ${firstAmount}</p>
          </div>
          
          <div class="info-box">
            <h3>📋 Instructions de Paiement</h3>
            ${paymentInstructions}
            <p style="margin-top: 15px;">
              <strong>Étapes:</strong><br>
              1. Ouvrez votre application de paiement<br>
              2. Envoyez <strong>${firstAmount}</strong><br>
              3. Mentionnez la référence: <strong>${data.reference}</strong><br>
              4. Conservez la preuve de paiement
            </p>
          </div>
          
          <div class="schedule">
            <h3>⏰ Calendrier de Paiement</h3>
            ${schedule}
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong><br>
            Une fois le paiement effectué, vous recevrez automatiquement:
            <ul>
              <li>Un reçu de confirmation</li>
              <li>La confirmation du début du développement</li>
              <li>Des rappels avant chaque échéance</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>${CONFIG.COMPANY_NAME}</strong></p>
          <p>Systèmes intelligents sur-mesure</p>
          <p>Email: ${CONFIG.COMPANY_EMAIL}</p>
          <p style="margin-top: 15px; color: #999;">
            © 2025 ${CONFIG.COMPANY_NAME} - Tous droits réservés
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function createPaymentSchedule(data, amounts) {
  let schedule = '';
  
  if (data.paymentPlan === '4weeks') {
    schedule = `
      <div class="schedule-item">
        <span>Aujourd'hui</span>
        <strong>${formatAmount(amounts[0], data.currency)}</strong>
      </div>
      <div class="schedule-item">
        <span>Jour 14 (dans 2 semaines)</span>
        <strong>${formatAmount(amounts[1], data.currency)}</strong>
      </div>
      <div class="schedule-item">
        <span>Jour 28 - Livraison (dans 4 semaines)</span>
        <strong>${formatAmount(amounts[2], data.currency)}</strong>
      </div>
    `;
  } else {
    schedule = `
      <div class="schedule-item">
        <span>Aujourd'hui</span>
        <strong>${formatAmount(amounts[0], data.currency)}</strong>
      </div>
      <div class="schedule-item">
        <span>Mois 1 (dans 30 jours)</span>
        <strong style="color: #10B981;">GRATUIT 🎁</strong>
      </div>
      <div class="schedule-item">
        <span>Fin Mois 2 (dans 60 jours)</span>
        <strong>${formatAmount(amounts[1], data.currency)}</strong>
      </div>
      <div class="schedule-item">
        <span>Fin Mois 3 (dans 90 jours)</span>
        <strong>${formatAmount(amounts[2], data.currency)}</strong>
      </div>
    `;
  }
  
  return schedule;
}

// ============================================================================
// EMAIL - CONFIRMATION DE PAIEMENT
// ============================================================================

function sendPaymentConfirmation(email, reference, amount, method) {
  const subject = `✅ Paiement confirmé - ${reference}`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10B981 0%, #2563EB 100%); 
                  color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .success-icon { font-size: 60px; margin-bottom: 10px; }
        .content { background: #f9f9f9; padding: 30px; margin: 20px 0; border-radius: 10px; }
        .payment-box { background: white; padding: 25px; margin: 20px 0; 
                       text-align: center; border-radius: 10px; border: 2px solid #10B981; }
        .steps { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
        .step { padding: 10px 0; border-left: 3px solid #2563EB; padding-left: 15px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>PAIEMENT CONFIRMÉ !</h1>
          <p>Nous avons bien reçu votre paiement</p>
        </div>
        
        <div class="content">
          <h2>Excellente nouvelle ! 🎉</h2>
          <p>Votre paiement a été validé avec succès.</p>
          
          <div class="payment-box">
            <h3>Montant reçu</h3>
            <p style="font-size: 2em; color: #10B981; margin: 10px 0;"><strong>${amount}</strong></p>
            <p>${method}</p>
            <p><strong>${reference}</strong></p>
          </div>
          
          <div class="steps">
            <h3>✅ Prochaines étapes</h3>
            <div class="step">
              <strong>1.</strong> Votre projet entre en développement immédiatement
            </div>
            <div class="step">
              <strong>2.</strong> Vous recevrez des mises à jour régulières sur l'avancement
            </div>
            <div class="step">
              <strong>3.</strong> Rappels automatiques 2 jours avant chaque échéance
            </div>
            <div class="step">
              <strong>4.</strong> Livraison selon le calendrier convenu
            </div>
          </div>
          
          <p style="margin-top: 20px;">
            Merci de votre confiance ! 🚀
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.COMPANY_NAME
  });
}

// ============================================================================
// RAPPELS AUTOMATIQUES
// ============================================================================

function scheduleReminders(data) {
  // Cette fonction devrait créer des triggers pour envoyer des rappels
  // 2 jours avant chaque échéance de paiement
  
  const dates = calculateReminderDates(data);
  
  // Créer des triggers Google Apps Script
  dates.forEach((date, index) => {
    const triggerData = {
      email: data.email,
      reference: data.reference,
      paymentNumber: index + 2, // Paiement 2 et 3
      date: date
    };
    
    // Note: Implémenter la création de triggers
    // ScriptApp.newTrigger('sendReminder')
    //   .timeBased()
    //   .at(date)
    //   .create();
  });
}

function calculateReminderDates(data) {
  const now = new Date();
  const dates = [];
  
  if (data.paymentPlan === '4weeks') {
    // Rappel pour paiement 2 (jour 14-2 = jour 12)
    dates.push(new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000));
    // Rappel pour paiement 3 (jour 28-2 = jour 26)
    dates.push(new Date(now.getTime() + 26 * 24 * 60 * 60 * 1000));
  } else {
    // Rappel pour paiement 2 (60 jours - 2)
    dates.push(new Date(now.getTime() + 58 * 24 * 60 * 60 * 1000));
    // Rappel pour paiement 3 (90 jours - 2)
    dates.push(new Date(now.getTime() + 88 * 24 * 60 * 60 * 1000));
  }
  
  return dates;
}

// ============================================================================
// FONCTION MANUELLE - MARQUER COMME PAYÉ
// ============================================================================

function markAsPaid(reference) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  // Trouver la ligne avec cette référence
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === reference) { // Colonne B = Référence
      // Marquer comme payé
      sheet.getRange(i + 1, 3).setValue('Payé'); // Colonne C = Statut
      
      // Envoyer email de confirmation
      const email = data[i][5]; // Colonne F = Email
      const amount = data[i][11]; // Colonne L = Montant 1
      const method = data[i][9]; // Colonne J = Méthode
      
      sendPaymentConfirmation(email, reference, amount, method);
      
      Logger.log(`Paiement marqué comme payé pour ${reference}`);
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

function formatAmount(amount, currency) {
  if (currency === 'usd') {
    return `${amount} USD`;
  } else {
    return `${amount.toLocaleString()} FC`;
  }
}

function createResponse(code, data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// FONCTION DE TEST
// ============================================================================

function testEmailSending() {
  const testData = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'test@example.com',
    phone: '+243 XXX XXX XXX',
    company: 'Test Company',
    paymentPlan: '4weeks',
    paymentMethod: 'airtel',
    currency: 'usd',
    reference: 'EUREKA-PX-TEST123'
  };
  
  sendProFormaInvoice(testData);
  Logger.log('Email de test envoyé');
}
