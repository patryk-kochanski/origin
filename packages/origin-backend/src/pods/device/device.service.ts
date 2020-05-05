import {
    DeviceCreateData,
    DeviceStatusChangedEvent,
    DeviceUpdateData,
    IDevice,
    IDeviceProductInfo,
    IDeviceWithRelationsIds,
    IExternalDeviceId,
    ISmartMeterRead,
    ISmartMeterReadingsAdapter,
    SupportedEvents,
    DeviceSettingsUpdateData
} from '@energyweb/origin-backend-core';
import {
    Inject,
    Injectable,
    NotFoundException,
    UnprocessableEntityException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { FindOneOptions, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { SM_READS_ADAPTER } from '../../const';
import { StorageErrors } from '../../enums/StorageErrors';
import { ConfigurationService } from '../configuration';
import { ExtendedBaseEntity } from '../ExtendedBaseEntity';
import { NotificationService } from '../notification';
import { OrganizationService } from '../organization/organization.service';
import { Device } from './device.entity';

@Injectable()
export class DeviceService {
    constructor(
        @InjectRepository(Device)
        private readonly repository: Repository<Device>,
        private readonly configurationService: ConfigurationService,
        private readonly organizationService: OrganizationService,
        private readonly notificationService: NotificationService,
        @Inject(SM_READS_ADAPTER) private smartMeterReadingsAdapter?: ISmartMeterReadingsAdapter
    ) {}

    async findByExternalId(
        externalId: IExternalDeviceId
    ): Promise<ExtendedBaseEntity & IDeviceWithRelationsIds> {
        const devices = ((await this.repository.find({
            loadEagerRelations: true
        })) as IDevice[]) as (ExtendedBaseEntity & IDeviceWithRelationsIds)[];

        return devices.find((device) =>
            device.externalDeviceIds.find(
                (id) => id.id === externalId.id && id.type === externalId.type
            )
        );
    }

    async findOne(
        id: string,
        options: FindOneOptions<Device> = {}
    ): Promise<ExtendedBaseEntity & IDeviceWithRelationsIds> {
        const device = ((await this.repository.findOne(id, {
            loadRelationIds: true,
            ...options
        })) as IDevice) as ExtendedBaseEntity & IDeviceWithRelationsIds;

        if (this.smartMeterReadingsAdapter) {
            device.lastSmartMeterReading = await this.smartMeterReadingsAdapter.getLatest(device);
            device.smartMeterReads = [];
        }

        return device;
    }

    async create(data: DeviceCreateData & Pick<IDeviceWithRelationsIds, 'organization'>) {
        const configuration = await this.configurationService.get();

        const newEntity = new Device();

        Object.assign(newEntity, {
            ...data,
            externalDeviceIds: data.externalDeviceIds
                ? data.externalDeviceIds.map(({ id, type }) => {
                      if (
                          typeof id === 'undefined' &&
                          configuration.externalDeviceIdTypes?.find((t) => t.type === type)
                              ?.autogenerated
                      ) {
                          return { id: uuid(), type };
                      }

                      return { id, type };
                  })
                : []
        });

        const validationErrors = await validate(newEntity);

        if (validationErrors.length > 0) {
            throw new UnprocessableEntityException({
                success: false,
                errors: validationErrors
            });
        }

        await this.repository.save(newEntity);

        return newEntity;
    }

    async remove(entity: Device | (ExtendedBaseEntity & IDeviceWithRelationsIds)) {
        this.repository.remove((entity as IDevice) as Device);
    }

    async getAllSmartMeterReadings(id: string) {
        const device = await this.findOne(id);

        if (this.smartMeterReadingsAdapter) {
            return this.smartMeterReadingsAdapter.getAll(device);
        }

        return device.smartMeterReads;
    }

    async addSmartMeterReading(id: string, newSmartMeterRead: ISmartMeterRead): Promise<void> {
        const device = await this.findOne(id);

        if (this.smartMeterReadingsAdapter) {
            this.smartMeterReadingsAdapter.save(device, newSmartMeterRead);
            return;
        }

        const latestSmartMeterReading = (smReads: ISmartMeterRead[]) => smReads[smReads.length - 1];

        if (device.smartMeterReads.length > 0) {
            if (
                newSmartMeterRead.timestamp <=
                latestSmartMeterReading(device.smartMeterReads).timestamp
            ) {
                throw new UnprocessableEntityException({
                    message: `Smart meter reading timestamp should be higher than latest.`
                });
            }
        }

        device.smartMeterReads = [...device.smartMeterReads, newSmartMeterRead];
        device.lastSmartMeterReading = latestSmartMeterReading(device.smartMeterReads);

        await this.repository.save(device);
    }

    async getAll(
        options: FindOneOptions<Device> = {}
    ): Promise<Array<ExtendedBaseEntity & IDeviceWithRelationsIds>> {
        const devices = ((await this.repository.find({
            loadRelationIds: true,
            ...options
        })) as IDevice[]) as (ExtendedBaseEntity & IDeviceWithRelationsIds)[];

        if (this.smartMeterReadingsAdapter) {
            for (const device of devices) {
                device.lastSmartMeterReading = await this.smartMeterReadingsAdapter.getLatest(
                    device
                );

                device.smartMeterReads = [];
            }
        }

        return devices;
    }

    async findDeviceProductInfo(externalId: IExternalDeviceId): Promise<IDeviceProductInfo> {
        const devices = await this.repository.find();

        return devices.find((device) =>
            device.externalDeviceIds.find(
                (id) => id.id === externalId.id && id.type === externalId.type
            )
        );
    }

    async update(id: string, update: DeviceUpdateData) {
        const device = await this.findOne(id);

        if (!device) {
            throw new NotFoundException(StorageErrors.NON_EXISTENT);
        }

        device.status = update.status;

        try {
            await this.repository.save(device);

            const deviceManagers = await this.organizationService.getDeviceManagers(
                device.organization
            );

            const event: DeviceStatusChangedEvent = {
                deviceId: id,
                status: device.status,
                deviceManagersEmails: deviceManagers.map((u) => u.email)
            };

            this.notificationService.handleEvent({
                type: SupportedEvents.DEVICE_STATUS_CHANGED,
                data: event
            });

            return {
                message: `Device ${id} successfully updated`
            };
        } catch (error) {
            throw new UnprocessableEntityException({
                message: `Device ${id} could not be updated due to an error ${error.message}`
            });
        }
    }

    async updateSettings(id: string, update: DeviceSettingsUpdateData) {
        const device = await this.findOne(id);

        if (!device) {
            throw new NotFoundException(StorageErrors.NON_EXISTENT);
        }

        device.automaticPostForSale = update.automaticPostForSale;
        if (update.automaticPostForSale) {
            device.defaultAskPrice = update.defaultAskPrice;
        }

        try {
            await this.repository.save(device);

            return {
                message: `Device ${id} successfully updated`
            };
        } catch (error) {
            throw new UnprocessableEntityException({
                message: `Device ${id} could not be updated due to an error ${error.message}`
            });
        }
    }
}
