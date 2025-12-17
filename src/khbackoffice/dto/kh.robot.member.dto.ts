import { IsNotEmpty, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

ValidateNested()
export class KhRobotMemberDto {

    @ApiProperty()
    @IsNotEmpty()
    downlineCode: string;

}