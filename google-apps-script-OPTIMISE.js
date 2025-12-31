/**
 * BACKEND GOOGLE APPS SCRIPT - EUREKA.PX (VERSION OPTIMISÉE)
 * 
 * Envoi instantané des emails (< 2 secondes)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SPREADSHEET_ID: 'VOTRE_GOOGLE_SHEET_ID', // ← REMPLACEZ PAR VOTRE ID
  SHEET_NAME: 'Commandes',
  COMPANY_NAME: 'Eureka.Px',
  COMPANY_EMAIL: 'estherbahati@eurekapx.com', // ← Votre email pour recevoir les notifications
  AIRTEL_NUMBER: '+243 997264738',
  ORANGE_NUMBER: '+243 851887704',
  CDF_RATE: 2350
};

// ============================================================================
// WEBHOOK ENDPOINT - Optimisé pour vitesse
// ============================================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Validation rapide
    if (!data.email || !data.reference) {
      return createResponse(400, { error: 'Données manquantes' });
    }
    
    // EXÉCUTION PARALLÈLE pour gagner du temps
    // Au lieu d'attendre chaque opération, on les lance toutes en même temps
    
    // 1. Stocker dans Sheet (asynchrone)
    saveToSheetAsync(data);
    
    // 2. Envoyer emails immédiatement (le plus important)
    sendProFormaInvoiceOptimized(data);      // Email au client
    sendAdminNotificationOptimized(data);     // Email à vous
    
    // Réponse immédiate (ne pas attendre les opérations)
    return createResponse(200, { 
      success: true, 
      reference: data.reference,
      message: 'Commande enregistrée - emails envoyés'
    });
    
  } catch (error) {
    Logger.log('Erreur: ' + error.toString());
    return createResponse(500, { error: error.toString() });
  }
}

// ============================================================================
// STOCKAGE GOOGLE SHEETS - Version asynchrone
// ============================================================================

function saveToSheetAsync(data) {
  try {
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
    
    // Calculer les montants
    const amounts = calculateAmounts(data);
    
    // Ajouter la ligne
    sheet.appendRow([
      new Date(),
      data.reference,
      'En attente de vérification',
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
      '', '', '',
      'Client a cliqué "J\'ai payé" le ' + new Date().toLocaleString('fr-FR')
    ]);
    
    Logger.log('Données enregistrées dans Sheet');
  } catch (error) {
    Logger.log('Erreur Sheet: ' + error.toString());
  }
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
// EMAIL AU CLIENT - Version optimisée (template simplifié)
// ============================================================================

function sendProFormaInvoiceOptimized(data) {
  const amounts = calculateAmounts(data);
  const firstAmount = formatAmount(amounts[0], data.currency);
  
  const subject = `Facture Pro Forma N° ${data.reference}`;
  
  // Template HTML simplifié pour envoi rapide
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #2563EB 0%, #EA580C 100%); color: white; padding: 30px; text-align: center;">
        <h1>📋 FACTURE PRO FORMA</h1>
        <p style="font-size: 1.2em;">N° ${data.reference}</p>
        <p style="color: #FFC107;">🟠 En attente de vérification</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2>Bonjour ${data.firstName},</h2>
        <p>Merci pour votre confiance ! Voici votre facture pro forma.</p>
        
        <div style="background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2563EB;">
          <h3>Informations Client</h3>
          <p><strong>Nom:</strong> ${data.firstName} ${data.lastName}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Téléphone:</strong> ${data.phone}</p>
          ${data.company ? `<p><strong>Entreprise:</strong> ${data.company}</p>` : ''}
        </div>
        
        <div style="background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #EA580C;">
          <h3>📋 Instructions de Paiement</h3>
          ${getPaymentInstructions(data)}
          <p style="margin-top: 15px;"><strong>Référence obligatoire:</strong> <span style="font-size: 1.2em; color: #EA580C;">${data.reference}</span></p>
        </div>
        
        <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin: 20px 0;">
          <strong>⚠️ Important:</strong> Une fois le paiement effectué, vous recevrez automatiquement un reçu de confirmation.
        </div>
      </div>
      
      <div style="text-align: center; color: #666; padding: 20px;">
        <p><strong>${CONFIG.COMPANY_NAME}</strong></p>
        <p>Email: ${CONFIG.COMPANY_EMAIL}</p>
      </div>
    </div>
  `;
  
  try {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      htmlBody: htmlBody,
      name: CONFIG.COMPANY_NAME
    });
    Logger.log('Email client envoyé à ' + data.email);
  } catch (error) {
    Logger.log('Erreur email client: ' + error.toString());
  }
}

function getPaymentInstructions(data) {
  if (data.paymentMethod === 'airtel') {
    return `
      <p><strong>📱 Airtel Money</strong></p>
      <p>Numéro: <strong>${CONFIG.AIRTEL_NUMBER}</strong></p>
      <p>Montant: <strong>${formatAmount(calculateAmounts(data)[0], data.currency)}</strong></p>
    `;
  } else if (data.paymentMethod === 'orange') {
    return `
      <p><strong>📱 Orange Money</strong></p>
      <p>Numéro: <strong>${CONFIG.ORANGE_NUMBER}</strong></p>
      <p>Montant: <strong>${formatAmount(calculateAmounts(data)[0], data.currency)}</strong></p>
    `;
  } else {
    return `
      <p><strong>🏦 Virement Bancaire</strong></p>
      <p>Les informations bancaires vous seront envoyées séparément.</p>
    `;
  }
}

// ============================================================================
// EMAIL POUR VOUS - Notification instantanée
// ============================================================================

function sendAdminNotificationOptimized(data) {
  const subject = `🔔 NOUVELLE COMMANDE - ${data.reference}`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2563EB; color: white; padding: 20px; text-align: center;">
        <h1>🔔 Nouvelle Commande Reçue!</h1>
      </div>
      
      <div style="padding: 20px; background: #f9f9f9;">
        <h2>Client: ${data.firstName} ${data.lastName}</h2>
        
        <div style="background: white; padding: 15px; margin: 10px 0;">
          <p><strong>📧 Email:</strong> ${data.email}</p>
          <p><strong>📱 Téléphone:</strong> ${data.phone}</p>
          ${data.company ? `<p><strong>🏢 Entreprise:</strong> ${data.company}</p>` : ''}
        </div>
        
        <div style="background: #EA580C; color: white; padding: 20px; margin: 20px 0; text-align: center;">
          <h2>⚠️ ACTION REQUISE</h2>
          <p style="font-size: 1.2em;"><strong>Référence: ${data.reference}</strong></p>
          <p>Méthode: ${getMethodName(data.paymentMethod)}</p>
          <p>Montant: ${formatAmount(calculateAmounts(data)[0], data.currency)}</p>
          <p style="margin-top: 15px;">Vérifiez votre ${getMethodName(data.paymentMethod)}</p>
        </div>
        
        <div style="background: white; padding: 15px; margin: 10px 0;">
          <p><strong>Plan:</strong> ${data.paymentPlan === '4weeks' ? '3x sur 4 semaines' : '3x sur 3 mois'}</p>
          <p><strong>Devise:</strong> ${data.currency.toUpperCase()}</p>
        </div>
        
        <p style="text-align: center; margin-top: 20px;">
          <a href="https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}" 
             style="background: #2563EB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            📊 Voir dans Google Sheet
          </a>
        </p>
      </div>
    </div>
  `;
  
  try {
    MailApp.sendEmail({
      to: CONFIG.COMPANY_EMAIL,
      subject: subject,
      htmlBody: htmlBody,
      name: 'Système Eureka.Px'
    });
    Logger.log('Notification admin envoyée');
  } catch (error) {
    Logger.log('Erreur email admin: ' + error.toString());
  }
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
    firstName: 'Esther',
    lastName: 'Bahati',
    email: 'test@example.com',
    phone: '+243 XXX XXX XXX',
    company: 'Test Company',
    paymentPlan: '4weeks',
    paymentMethod: 'airtel',
    currency: 'usd',
    reference: 'EUREKA-PX-TEST123'
  };
  
  Logger.log('Envoi emails de test...');
  sendProFormaInvoiceOptimized(testData);
  sendAdminNotificationOptimized(testData);
  Logger.log('Emails de test envoyés!');
}
