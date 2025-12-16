import { IsNotEmpty, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

ValidateNested()
export class JokerRobotMemberDto {

    @ApiProperty()
    @IsNotEmpty()
    downlineCode: string;

}