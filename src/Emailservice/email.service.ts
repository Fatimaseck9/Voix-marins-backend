import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'fatimseck54@gmail.com',
        pass: 'fgzb qkch fsnf anhf',
      },
       tls: {
    rejectUnauthorized: false, // 🔥 Ignore les certificats auto-signés
  },
    });
  }

  async sendActivationAndTempPassword(email: string, token: string, tempPassword: string): Promise<void> {
    const activationLink = `https://api.gaalgui.sn/activate?token=${token}`;

    const mailOptions = {
      from: 'fatimseck54@gmail.com',
      to: email,
      subject: 'Activation de votre compte - Informations de connexion',
      html: `
        <p>Bonjour,</p>
        <p>Un compte a été créé pour vous sur notre plateforme.</p>
        <p>Voici votre mot de passe temporaire : <strong>${tempPassword}</strong></p>
        <p>Pour activer votre compte, cliquez sur le lien suivant :</p>
        <p><a href="${activationLink}">Activer mon compte</a></p>
        <p>Merci de changer votre mot de passe après la première connexion.</p>
        <p>Cordialement,<br>L'équipe Support</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
