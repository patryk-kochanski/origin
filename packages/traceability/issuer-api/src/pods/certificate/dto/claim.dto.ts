import { ApiProperty } from '@nestjs/swagger';
import { IClaim } from '@energyweb/issuer';
import { Validate, IsInt, IsPositive, IsString, ValidateNested } from 'class-validator';
import { IntUnitsOfEnergy } from '@energyweb/origin-backend-utils';
import { ClaimDataDTO } from './claim-data.dto';

export class ClaimDTO implements IClaim {
    @ApiProperty({ type: Number, description: 'Certificate Id' })
    @IsInt()
    @IsPositive()
    id: number;

    @ApiProperty({
        type: String,
        description: 'Public blockchain address',
        example: '0xd46aC0Bc23dB5e8AfDAAB9Ad35E9A3bA05E092E8'
    })
    @IsString()
    from: string;

    @ApiProperty({
        type: String,
        description: 'Public blockchain address',
        example: '0xd46aC0Bc23dB5e8AfDAAB9Ad35E9A3bA05E092E8'
    })
    @IsString()
    to: string;

    @ApiProperty({ type: String, description: 'Represents topic of certificate', example: '2' })
    @IsString()
    topic: string;

    @ApiProperty({ type: String, example: '100000' })
    @Validate(IntUnitsOfEnergy)
    value: string;

    @ApiProperty({ type: ClaimDataDTO })
    @ValidateNested()
    claimData: ClaimDataDTO;
}
