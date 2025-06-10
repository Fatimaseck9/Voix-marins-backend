import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private token: string = '';
  private readonly SENDER = '221778225816';

  constructor() {
    this.refreshTokenPeriodically(); // Démarre la mise à jour automatique
  }

  private async getNewToken(): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.orange.com/oauth/v3/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: 'Basic RFdDd1NwY215ZHFzRWtObk5Za1FGdXFMOGNSeThmUlQ6Y2R3azkwdWFSS292eHhsWFpsd0N6VWV3V0Y2SGViT1Zwa2xERWU5bVZQaks=',
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        },
      );
      return response.data.access_token;
    } catch (error) {
      this.logger.error('Erreur récupération token', error.response?.data || error.message);
      throw error;
    }
  }

  private async refreshTokenPeriodically(): Promise<void> {
    this.token = await this.getNewToken();
    setInterval(async () => {
      try {
        this.token = await this.getNewToken();
      } catch (err) {
        this.logger.error('Erreur lors du refresh token', err.message);
      }
    }, 3600000); // chaque 1h
  }

  private normalizePhoneNumber(number: string): string {
    number = number.trim();
    if (number.startsWith('tel:+')) return number;
    if (number.startsWith('+')) return `tel:${number}`;
    return `tel:+${number}`;
  }

  async sendSms(recipient: string, message: string): Promise<void> {
    const sender = this.normalizePhoneNumber(this.SENDER);
    const to = this.normalizePhoneNumber(recipient);

    const url = `https://api.orange.com/smsmessaging/v1/outbound/${encodeURIComponent(sender)}/requests`;
    const data = {
      outboundSMSMessageRequest: {
        address: to,
        senderAddress: sender,
        outboundSMSTextMessage: {
          message,
        },
      },
    };

    try {
      await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`SMS envoyé à ${recipient}`);
    } catch (error) {
      this.logger.error('Erreur envoi SMS', error.response?.data || error.message);
      throw new Error('Échec de l\'envoi du SMS');
    }
  }
}
