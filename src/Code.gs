/**
 * Real Estate Analytics & Financial Tracking System Template
 */
function updateClientPaymentSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var summarySheet = ss.getSheetByName("Client Payment Summary");

  if (!summarySheet) {
    summarySheet = ss.insertSheet("Client Payment Summary");
  }

  var excludeSheets = [
    "Dashboard",
    "Final FORMAT Sheet",
    "Client Summary",
    "Client Payment Summary",
    "How To Use",
    "Chart Data",
  ];
  var sheets = ss.getSheets();

  var summaryRows = [];
  var tz = ss.getSpreadsheetTimeZone();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var grandTotalFlatPrice = 0;
  var grandTotalDueTillDate = 0;
  var grandTotalPaidToDate = 0;
  var grandTotalRemainingDue = 0;
  var grandTotalOverdueAmount = 0;
  var grandTotalPayableOverdueWithFine = 0;
  var grandTotalOverdueInstallments = 0;

  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var sheetName = sheet.getName();

    if (excludeSheets.indexOf(sheetName) !== -1) continue;

    var lastRow = sheet.getLastRow();
    if (lastRow < 8) continue;

    // 1. EXTRACT CLIENT NAME & DETAILS
    var rawClientName =
      sheet.getRange("H2").getValue() ||
      sheet.getRange("L2").getValue() ||
      sheet.getRange("K3").getValue() ||
      sheet.getRange("L3").getValue() ||
      "";
    var clientName = rawClientName
      .toString()
      .replace(/Client Name[\s\-:]*/gi, "")
      .trim();
    if (!clientName) {
      var parts = sheetName.split("_");
      clientName =
        parts.length >= 3
          ? parts
              .slice(2)
              .join(" ")
              .replace(/_Final/gi, "")
              .trim()
          : sheetName;
    }

    var rawProjNo =
      sheet.getRange("A2").getValue() ||
      sheet.getRange("K4").getValue() ||
      sheet.getRange("L4").getValue() ||
      "";
    var projNo = rawProjNo
      .toString()
      .replace(/Project No[\s\-:]*/gi, "")
      .trim();
    if (!projNo) {
      projNo = sheetName.split("_")[0] || "P-";
    }

    var rawFlatNo =
      sheet.getRange("A3").getValue() ||
      sheet.getRange("K5").getValue() ||
      sheet.getRange("L5").getValue() ||
      "";
    var flatNo = rawFlatNo
      .toString()
      .replace(/Flat No\.?\s*&?\s*Size[\s\-:]*/gi, "")
      .trim();
    if (!flatNo) {
      flatNo = sheetName.split("_")[1] || "-";
    }

    // 2. FETCH CLIENT PAYMENT LEDGER ROWS (ROW 8 DOWNWARD)
    var numRows = lastRow - 7;
    var dueColsE = sheet.getRange(8, 5, numRows, 1).getValues(); // Col E: Total Installment Due Amount
    var paidCols = sheet.getRange(8, 6, numRows, 1).getValues(); // Col F: Total Paid to Date
    var remCols = sheet.getRange(8, 7, numRows, 1).getValues(); // Col G: Total Remaining Due
    var dueDates = sheet.getRange(8, 8, numRows, 1).getValues(); // Col H: Installment Due Date
    var payDates = sheet.getRange(8, 9, numRows, 1).getValues(); // Col I: Installment Payment Date
    var statuses = sheet.getRange(8, 11, numRows, 1).getValues(); // Col K: Payment Status

    var latestF = 0;
    var latestG = 0;
    var overdueCount = 0;
    var firstOverdueDueDate = null;
    var nextFutureDueDate = null;
    var maxDueTillDateColE = 0;
    var lastOverdueColE = 0;

    for (var r = 0; r < numRows; r++) {
      var eVal = Number(dueColsE[r][0]) || 0;
      var fVal = paidCols[r][0];
      var gVal = remCols[r][0];
      var rawDueDate = dueDates[r][0];
      var pVal = payDates[r][0];
      var st = statuses[r][0]
        ? statuses[r][0].toString().toLowerCase().trim()
        : "";

      if (fVal !== "" && fVal !== null && !isNaN(fVal)) latestF = Number(fVal);
      if (gVal !== "" && gVal !== null && !isNaN(gVal)) latestG = Number(gVal);

      var dueDate = parseDate(rawDueDate);
      var hasPayment =
        pVal !== "" &&
        pVal !== null &&
        pVal !== undefined &&
        pVal.toString().trim() !== "";
      var isPaidStatus = st === "paid" || st === "completed";

      // Track max Column E for rows due up to today
      if (dueDate && dueDate <= today && !isPaidStatus) {
        if (eVal > maxDueTillDateColE) {
          maxDueTillDateColE = eVal;
        }
      }

      // Overdue check
      var isOverdue = false;
      if (st.includes("overdue") || st === "due") {
        if (dueDate && dueDate <= today && !hasPayment && !isPaidStatus) {
          isOverdue = true;
        }
      }
      if (st.includes("overdue")) {
        isOverdue = true;
      }

      if (isOverdue) {
        overdueCount++;
        lastOverdueColE = eVal;
        if (!firstOverdueDueDate && dueDate) {
          firstOverdueDueDate = dueDate;
        }
      } else if (dueDate && dueDate > today && !hasPayment && !isPaidStatus) {
        if (!nextFutureDueDate) {
          nextFutureDueDate = dueDate;
        }
      }
    }

    var flatPrice = latestF + latestG;

    if (maxDueTillDateColE === 0 && overdueCount > 0) {
      maxDueTillDateColE = lastOverdueColE;
    }

    // Determine Next Due Date string
    var nextDueDateStr = "-";
    if (firstOverdueDueDate) {
      nextDueDateStr = Utilities.formatDate(
        firstOverdueDueDate,
        tz,
        "dd-MMM-yyyy",
      );
    } else if (nextFutureDueDate) {
      nextDueDateStr = Utilities.formatDate(
        nextFutureDueDate,
        tz,
        "dd-MMM-yyyy",
      );
    }

    // Determine Collection %
    var collectionPct = flatPrice > 0 ? latestF / flatPrice : 0;

    // Determine Account Status
    var accountStatus = "Regular";
    if (overdueCount > 0) {
      accountStatus = "Overdue";
    } else if (collectionPct >= 0.999) {
      accountStatus = "Completed";
    }

    var overdueAmountVal = overdueCount > 0 ? lastOverdueColE : 0;
    var clientDueTillDate =
      maxDueTillDateColE > 0 ? maxDueTillDateColE : lastOverdueColE;

    // Fine calculations
    var finePct = overdueCount > 0 ? overdueCount * 3 : 0; // % of Fine = Overdue Installments * 3
    var fineDecimal = finePct / 100;
    var payableOverdueWithFine =
      overdueAmountVal + overdueAmountVal * fineDecimal;

    // Accumulate Grand Totals
    grandTotalFlatPrice += flatPrice;
    grandTotalDueTillDate += clientDueTillDate;
    grandTotalPaidToDate += latestF;
    grandTotalRemainingDue += latestG;
    grandTotalOverdueAmount += overdueAmountVal;
    grandTotalPayableOverdueWithFine += payableOverdueWithFine;
    grandTotalOverdueInstallments += overdueCount;

    summaryRows.push([
      projNo, // Col A: Project No
      clientName, // Col B: Client Name
      flatNo, // Col C: Flat No. & Size
      flatPrice, // Col D: Total Flat Price (BDT)
      clientDueTillDate, // Col E: Clients Total Installment Due Amount (BDT) Till Current Month
      latestF, // Col F: Total Paid to Date (BDT)
      latestG, // Col G: Total Remaining Due (BDT)
      collectionPct, // Col H: Collection %
      nextDueDateStr, // Col I: Next Due Date
      overdueAmountVal, // Col J: Overdue Amount (BDT)
      fineDecimal, // Col K: % of Fine for Overdue
      payableOverdueWithFine, // Col L: Payable Overdue Amount (BDT) with Fine
      overdueCount, // Col M: Overdue Installments
      accountStatus, // Col N: Account Status
    ]);
  }

  // 3. WRITE DATA & TOTAL ROW TO SUMMARY SHEET
  var existingRows = summarySheet.getLastRow();
  if (existingRows >= 8) {
    summarySheet
      .getRange(8, 1, existingRows - 7 + 10, 14)
      .clearContent()
      .clearFormat();
  }

  if (summaryRows.length > 0) {
    var range = summarySheet.getRange(8, 1, summaryRows.length, 14);
    range.setValues(summaryRows);

    // Apply Number Formats
    summarySheet.getRange(8, 4, summaryRows.length, 4).setNumberFormat("#,##0"); // Cols D, E, F, G
    summarySheet.getRange(8, 8, summaryRows.length, 1).setNumberFormat("0.00%"); // Col H: Collection %
    summarySheet
      .getRange(8, 10, summaryRows.length, 1)
      .setNumberFormat("#,##0"); // Col J: Overdue Amount
    summarySheet.getRange(8, 11, summaryRows.length, 1).setNumberFormat("0%"); // Col K: % of Fine
    summarySheet
      .getRange(8, 12, summaryRows.length, 1)
      .setNumberFormat("#,##0"); // Col L: Payable Overdue with Fine
    summarySheet
      .getRange(8, 13, summaryRows.length, 1)
      .setNumberFormat("#,##0"); // Col M: Overdue Installments

    var totalRowIndex = 8 + summaryRows.length;
    var totalRow = [
      "TOTAL",
      "",
      "",
      grandTotalFlatPrice,
      grandTotalDueTillDate,
      grandTotalPaidToDate,
      grandTotalRemainingDue,
      "",
      "",
      grandTotalOverdueAmount,
      "",
      grandTotalPayableOverdueWithFine,
      grandTotalOverdueInstallments,
      "",
    ];

    var totalRange = summarySheet.getRange(totalRowIndex, 1, 1, 14);
    totalRange.setValues([totalRow]);
    totalRange.setFontWeight("bold");
    totalRange.setBackground("#d9ead3");

    // Format Total Row Numbers
    summarySheet.getRange(totalRowIndex, 4, 1, 4).setNumberFormat("#,##0");
    summarySheet.getRange(totalRowIndex, 10, 1, 1).setNumberFormat("#,##0");
    summarySheet.getRange(totalRowIndex, 12, 1, 1).setNumberFormat("#,##0");
    summarySheet.getRange(totalRowIndex, 13, 1, 1).setNumberFormat("#,##0");
  }
}

/**
 * Robust date parser supporting DD-MMM-YYYY (e.g. 05-Jul-2026), DD/MM/YYYY, serial numbers, and native dates.
 */
function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    var d = new Date(val.getTime());
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === "number") {
    var d = new Date(Math.round((val - (25567 + 2)) * 86400 * 1000));
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === "string") {
    val = val.trim();
    if (val === "" || val === "-") return null;

    // Match DD-MMM-YYYY or DD MMM YYYY (e.g., 05-Jul-2026)
    var dmmmyyyy = val.match(/^(\d{1,2})[\/\-\s]([A-Za-z]{3})[\/\-\s](\d{4})$/);
    if (dmmmyyyy) {
      var day = parseInt(dmmmyyyy[1], 10);
      var monthStr = dmmmyyyy[2].toLowerCase();
      var year = parseInt(dmmmyyyy[3], 10);

      var months = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };

      if (months.hasOwnProperty(monthStr)) {
        var d = new Date(year, months[monthStr], day);
        d.setHours(0, 0, 0, 0);
        return isNaN(d.getTime()) ? null : d;
      }
    }

    // Match DD-MM-YYYY or DD/MM/YYYY
    var dmyMatch = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      var day = parseInt(dmyMatch[1], 10);
      var month = parseInt(dmyMatch[2], 10) - 1;
      var year = parseInt(dmyMatch[3], 10);
      var d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      return isNaN(d.getTime()) ? null : d;
    }

    var parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0);
      return parsed;
    }
  }
  return null;
}

// =========================================================================
// NEW SEPARATE FUNCTIONS: GREENWEB SMS & EMAIL INTEGRATION
// =========================================================================

/**
 * Sends SMS via Greenweb Bangladesh API
 * @param {string} recipientPhone - Recipient phone number (e.g. "01712345678" or "8801712345678")
 * @param {string} messageText - Content of the SMS message
 * @param {string} apiToken - Greenweb API token
 * @returns {string} Response output from Greenweb server
 */
function sendGreenwebSMS(recipientPhone, messageText, apiToken) {
  var url = "https://api.bdbulksms.net/g_api.php";

  // Format phone number to clean digits
  var formattedPhone = recipientPhone.toString().replace(/[^0-9]/g, "");

  var payload = {
    token: apiToken,
    to: formattedPhone,
    message: messageText,
  };

  var options = {
    method: "post",
    contentType: "application/x-www-form-urlencoded",
    payload: payload,
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    Logger.log(
      "Greenweb SMS Response for " + formattedPhone + ": " + responseText,
    );
    return responseText;
  } catch (error) {
    Logger.log(
      "Error sending Greenweb SMS to " +
        formattedPhone +
        ": " +
        error.toString(),
    );
    return "Error: " + error.toString();
  }
}

/**
 * Sends Email notification via Apps Script MailApp
 * @param {string} recipientEmail - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} body - Email body content
 */
function sendEmailNotification(recipientEmail, subject, body) {
  try {
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: body,
    });
    Logger.log("Email successfully sent to: " + recipientEmail);
  } catch (error) {
    Logger.log(
      "Error sending Email to " + recipientEmail + ": " + error.toString(),
    );
  }
}
