import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JokerRobotMemberUpdateDto {
  
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    downlineCode: string;

    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    member_id: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    username: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    nickname?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    type?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    createdTime?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastLogin?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    loginIP?: string;
}
