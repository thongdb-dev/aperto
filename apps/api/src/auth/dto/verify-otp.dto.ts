import { IsMongoId, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsMongoId()
  userId!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
