import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = this.config.getOrThrow<string>('RESEND_FROM_EMAIL');
  }

  async sendOtpEmail(to: string, otp: string) {
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Mã xác thực OTP của bạn',
      html: `<p>Mã xác thực OTP của bạn là: <strong>${otp}</strong>. Mã có hiệu lực trong 10 phút, không chia sẻ mã này cho ai.</p>`,
    });
  }
}
