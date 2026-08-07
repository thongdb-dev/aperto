import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = this.config.getOrThrow<string>('RESEND_FROM_EMAIL');
  }

  async sendOtpEmail(to: string, otp: string) {
    // resend-node không throw khi API trả lỗi — nó resolve về { data: null, error }.
    // Không kiểm tra `error` thì mọi thất bại gửi mail (domain sandbox, quota, sai địa chỉ...)
    // bị nuốt im lặng và request phía trên vẫn coi như thành công.
    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Mã xác thực OTP của bạn',
      html: `<p>Mã xác thực OTP của bạn là: <strong>${otp}</strong>. Mã có hiệu lực trong 10 phút, không chia sẻ mã này cho ai.</p>`,
    });
    if (error) {
      this.logger.error(`Gửi OTP email tới ${to} thất bại: ${error.message}`);
      throw new Error(`Gửi email thất bại: ${error.message}`);
    }
  }
}
