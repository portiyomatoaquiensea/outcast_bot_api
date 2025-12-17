import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsIn
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class KhRobotDepositInsertDto {

  @ApiProperty({ example: 'MRT855' })
  @IsString()
  @IsNotEmpty()
  downlineCode: string;

  @ApiProperty({ example: '855kh' })
  @IsString()
  @IsOptional()
  relatedUser?: string;

  @ApiProperty({ example: '1.50' })
  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;

  @ApiProperty({ example: '??????' })
  @IsString()
  @IsOptional()
  bankAccountTranslate?: string;

  @ApiProperty({ example: '116.212.139.248' })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiProperty({ example: '2025-12-17 19:54:34' })
  @IsString()
  @IsOptional()
  confirmTime?: string;

  @ApiProperty({ example: '46597' })
  @IsString()
  @IsOptional()
  transferId?: string;

  @ApiProperty({ example: 'ops01' })
  @IsString()
  @IsNotEmpty()
  operator: string;

  @ApiProperty({ example: '35998628' })
  @IsString()
  @IsNotEmpty()
  noId: string;

  @ApiProperty({ example: 'Manual' })
  @IsString()
  @IsOptional()
  categoryType?: string;

  @ApiProperty({ example: 'BANK' })
  @IsString()
  @IsOptional()
  bankAccountType?: string;

  @ApiProperty({ example: '', required: false })
  @IsOptional()
  @IsString()
  userBankName?: string;

  @ApiProperty({ example: 'DEPOSIT' })
  @IsIn(['DEPOSIT', 'WITHDRAW'])
  action: string;

  @ApiProperty({ example: '', required: false })
  @IsOptional()
  @IsString()
  transferType?: string;

  @ApiProperty({ example: '2025-12-17 19:54:08' })
  @IsString()
  @IsOptional()
  createdTime?: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: '', required: false })
  @IsString()
  @IsOptional()
  userBankAccountName?: string;

  @ApiProperty({ example: '', required: false })
  @IsString()
  @IsOptional()
  userBankNo?: string;

  @ApiProperty({ example: 'Finish' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'pozzphea' })
  @IsString()
  @IsNotEmpty()
  username: string;
}

// {
//    "downlineCode": "MRT855",
//    "relatedUser":"855kh",
//    "amount":"1.50",
//    "bankAccountTranslate":"??????",
//    "ip":"116.212.139.248",
//    "confirmTime":"2025-12-17 19:54:34",
//    "transferId":"46597",
//    "operator":"ops01",
//    "noId":"35998628",
//    "categoryType":"Manual",
//    "bankAccountType":"BANK",
//    "userBankName":"",
//    "action":"DEPOSIT",
//    "transferType":"",
//    "createdTime":"2025-12-17 19:54:08",
//    "currency":"USD",
//    "userBankAccountName":"",
//    "userBankNo":"",
//    "status":"Finish",
//    "username":"pozzphea"
// }