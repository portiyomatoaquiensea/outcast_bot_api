import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class KhRobotMemberUpdateDto {
  
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    downlineCode: string;

    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    memberId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    bankAccount?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    agent?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    totalReferral?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    registerTime?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    totalDeposit?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    ip?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastRefer?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    remark?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    noId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastDepositTime?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastLoginTime?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    balance?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    userBankName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastDeposit?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    userBankNo?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    status?: string;

}
