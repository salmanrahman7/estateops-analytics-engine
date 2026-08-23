/**
 * Handles communication with Greenweb Bangladesh SMS Gateway
 */
class SmsService {
  /**
   * @param {string} recipientPhone 
   * @param {string} messageText 
   */
  static sendSMS(recipientPhone, messageText) {
    if (!recipientPhone || !messageText) return;

    const token = getGreenwebApiToken();
    const formattedPhone = recipientPhone.toString().replace(/[^0-9]/g, "");
    
    const payload = {
      'token': token,
      'to': formattedPhone,
      'message': messageText
    };

    const options = {
      'method': 'post',
      'contentType': 'application/x-www-form-urlencoded',
      'payload': payload,
      'muteHttpExceptions': true
    };

    try {
      const response = UrlFetchApp.fetch(CONFIG.GREENWEB_API_URL, options);
      Logger.log(`SMS Sent to ${formattedPhone}: ${response.getContentText()}`);
    } catch (error) {
      Logger.log(`Failed to send SMS to ${formattedPhone}: ${error.message}`);
    }
  }
}