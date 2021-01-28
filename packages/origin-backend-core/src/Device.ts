import { BigNumber } from 'ethers';
import { IPublicOrganization } from '.';

export enum DeviceStatus {
    Submitted = 'Submitted',
    Denied = 'Denied',
    Active = 'Active'
}

export interface IExternalDeviceId {
    id: string;
    type: string;
}

export type ExternalDeviceIdType = Pick<IExternalDeviceId, 'type'> & {
    autogenerated?: boolean;
    required?: boolean;
};

export interface ISmartMeterRead {
    meterReading: BigNumber | string;
    timestamp: number;
}

export interface ISmartMeterReadWithStatus extends ISmartMeterRead {
    certified: boolean;
}

export interface IEnergyGenerated {
    energy: BigNumber;
    timestamp: number;
}

export interface IEnergyGeneratedWithStatus extends IEnergyGenerated {
    certified: boolean;
}

export interface ISmartMeterReadStats {
    certified: BigNumber | string;
    uncertified: BigNumber | string;
}

export interface ISmartMeterReadingsAdapter {
    getAll(device: IDevice): Promise<ISmartMeterRead[]>;
    save(device: IDevice, smReads: ISmartMeterRead[]): Promise<void>;
}

export interface IDeviceProductInfo {
    deviceType: string;
    region: string;
    province: string;
    country: string;
    operationalSince: number;
    gridOperator: string;
}

export interface IDevice extends IDeviceProductInfo {
    id: number;
    status: DeviceStatus;
    facilityName: string;
    description: string;
    images: string;
    address: string;
    capacityInW: number;
    gpsLatitude: string;
    gpsLongitude: string;
    timezone: string;
    complianceRegistry: string;
    otherGreenAttributes: string;
    typeOfPublicSupport: string;
    externalDeviceIds?: IExternalDeviceId[];
    meterStats?: ISmartMeterReadStats;
    deviceGroup?: string;
    smartMeterReads?: ISmartMeterRead[];
    defaultAskPrice?: number;
    automaticPostForSale: boolean;
    files?: string;
    organizationId: number;
}

export type DeviceCreateData = Omit<IDevice, 'id' | 'meterStats' | 'organizationId'>;
export type DeviceSettingsUpdateData = Pick<IDevice, 'defaultAskPrice' | 'automaticPostForSale'>;

export const sortLowestToHighestTimestamp = (
    a: ISmartMeterRead | IEnergyGenerated,
    b: ISmartMeterRead | IEnergyGenerated
): number => {
    if (a.timestamp > b.timestamp) return 1;
    if (b.timestamp > a.timestamp) return -1;

    return 0;
};
