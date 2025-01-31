import { BatchClaimCertificatesHandler } from './batch-claim-certificates.handler';
import { BatchIssueCertificatesHandler } from './batch-issue-certificates.handler';
import { BatchTransferCertificatesHandler } from './batch-transfer-certificates.handler';
import { CertificatesCreatedHandler } from './certificates-created.handler';
import { ClaimCertificateHandler } from './claim-certificate.handler';
import { GetAggregateCertifiedEnergyDeviceIdHandler } from './get-aggregate-certified-energy-by-device.handler';
import { GetAllCertificateEventsHandler } from './get-all-certificate-events.handler';
import { GetAllCertificatesHandler } from './get-all-certificates.handler';
import { GetCertificateHandler } from './get-certificate.handler';
import { IssueCertificateHandler } from './issue-certificate.handler';
import { NewTransactionProcessedHandler } from './new-transaction-processed.handler';
import { SyncCertificateHandler } from './sync-certificate.handler';
import { TransferCertificateHandler } from './transfer-certificate.handler';
import { GetCertificatesWithLogsHandler } from './get-certificates-with-logs.handler';
import { GetCertificateByTxHashHandler } from './get-certificate-by-tx-hash.handler';

export {
    BatchClaimCertificatesHandler,
    BatchIssueCertificatesHandler,
    BatchTransferCertificatesHandler,
    CertificatesCreatedHandler as CertificateCreatedHandler,
    ClaimCertificateHandler,
    GetAggregateCertifiedEnergyDeviceIdHandler,
    GetAllCertificateEventsHandler,
    GetAllCertificatesHandler,
    GetCertificateHandler,
    IssueCertificateHandler,
    SyncCertificateHandler,
    TransferCertificateHandler,
    GetCertificateByTxHashHandler
};

export const CertificateHandlers = [
    BatchClaimCertificatesHandler,
    BatchIssueCertificatesHandler,
    BatchTransferCertificatesHandler,
    CertificatesCreatedHandler,
    ClaimCertificateHandler,
    GetAggregateCertifiedEnergyDeviceIdHandler,
    GetAllCertificateEventsHandler,
    GetAllCertificatesHandler,
    GetCertificateHandler,
    IssueCertificateHandler,
    SyncCertificateHandler,
    TransferCertificateHandler,
    GetCertificateByTxHashHandler
];

/** Because of irec-issuer-api using handlers above, and we don't want to migrate it yet to transaction logs */
export const InternalHandlers = [NewTransactionProcessedHandler, GetCertificatesWithLogsHandler];
