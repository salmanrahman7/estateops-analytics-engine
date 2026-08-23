/**
 * Handles notification dispatching logic
 */
function processClientNotifications() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const summarySheet = ss.getSheetByName(CONFIG.SUMMARY_SHEET_NAME);

  if (!summarySheet) {
    Logger.log("Error: Summary sheet not found.");
    return;
  }

  const lastRow = summarySheet.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) {
    Logger.log("No data rows found in summary sheet.");
    return;
  }

  const data = summarySheet.getRange(CONFIG.DATA_START_ROW, 1, lastRow - (CONFIG.DATA_START_ROW - 1), 14).getValues();

  // Build contact map targeting H2:L2 (Name), H3:L3 (Phone), and H5:L5 (Email)
  const clientContactMap = buildClientContactMap(ss);

  let processedCount = 0;

  data.forEach(row => {
    const [projNo, clientName, flatNo, , , , , , nextDueDate, overdueAmount, , payableWithFine, , accountStatus] = row;

    if (!projNo || projNo === "TOTAL" || !clientName || accountStatus !== "Overdue" || overdueAmount <= 0) return;

    processedCount++;
    Logger.log(`Processing Overdue Account: ${clientName} | Project: ${projNo} | Payable: BDT ${payableWithFine}`);

    const contact = clientContactMap[clientName.toLowerCase()] || {};
    
    if (contact.phone) {
      const smsText = `Dear ${clientName}, your payment of BDT ${payableWithFine.toLocaleString()} for Flat ${flatNo} (${projNo}) is overdue. Please settle your installment.`;
      SmsService.sendSMS(contact.phone, smsText);
    } else {
      Logger.log(`Warning: No phone number found for ${clientName}. SMS skipped.`);
    }

    if (contact.email) {
      const emailSubject = `Payment Overdue Notice - ${projNo} (${flatNo})`;
      const emailBody = `Dear ${clientName},\n\nThis is a payment reminder for Flat ${flatNo} under Project ${projNo}.\n\nOverdue Amount: BDT ${overdueAmount.toLocaleString()}\nPayable with Fine: BDT ${payableWithFine.toLocaleString()}\nNext Due Date: ${nextDueDate}\n\nBest regards,\nVista Builders Limited`;
      
      try {
        MailApp.sendEmail(contact.email, emailSubject, emailBody);
        Logger.log(`Email successfully sent to ${contact.email}`);
      } catch (err) {
        Logger.log(`Failed to send email to ${contact.email}: ${err.message}`);
      }
    } else {
      Logger.log(`Warning: No email address found for ${clientName}. Email skipped.`);
    }
  });

  if (processedCount === 0) {
    Logger.log("No overdue accounts required notifications.");
  }
}

/**
 * Builds a lookup map for Client Contact Info targeting H2:L2, H3:L3, and H5:L5
 */
function buildClientContactMap(spreadsheet) {
  const map = {};

  spreadsheet.getSheets().forEach(sheet => {
    const name = sheet.getName();
    if (CONFIG.EXCLUDE_SHEETS.includes(name)) return;

    // 1. Direct Extraction from Specified Header Ranges
    const nameRangeValues = sheet.getRange("H2:L2").getValues()[0].join(" ");
    const phoneRangeValues = sheet.getRange("H3:L3").getValues()[0].join(" ");
    const emailRangeValues = sheet.getRange("H5:L5").getValues()[0].join(" ");

    // 2. Full Sheet Text Fallback (in case headers are shifted or moved)
    const fullText = sheet.getDataRange().getValues().flat().join(" ");

    // Extract Client Name (clean prefix)
    let extractedName = nameRangeValues.replace(/Client Name[\s\-:]*/gi, "").trim();
    if (!extractedName) {
      extractedName = name;
    }

    // Extract Phone (check H3:L3 first, then fallback to full sheet scan)
    let phoneMatch = phoneRangeValues.match(/(\+?\d{10,14})/);
    if (!phoneMatch) {
      phoneMatch = fullText.match(/Phone\s*[\-:]*\s*(\+?\d{10,14})/i);
    }

    // Extract Email (check H5:L5 first, then fallback to full sheet scan)
    let emailMatch = emailRangeValues.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (!emailMatch) {
      emailMatch = fullText.match(/Email\s*[\-:]*\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    }

    const contactObj = {
      phone: phoneMatch ? phoneMatch[1] : null,
      email: emailMatch ? emailMatch[1] : null
    };

    // Store map entries by sheet name and extracted client name
    map[name.toLowerCase()] = contactObj;
    if (extractedName) {
      map[extractedName.toLowerCase()] = contactObj;
    }
  });

  return map;
}