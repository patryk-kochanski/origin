import { put, take, all, fork, select, call, apply } from 'redux-saga/effects';
import { SagaIterator } from 'redux-saga';
import {
    CertificatesActions,
    IRequestCertificatesAction,
    IShowRequestCertificatesModalAction,
    setRequestCertificatesModalVisibility,
    hideRequestCertificatesModal,
    IRequestCertificateEntityFetchAction,
    ICertificateFetcher,
    addCertificate,
    updateCertificate
} from './actions';
import { IStoreState } from '../../types';
import { getConfiguration } from '../selectors';
import { showNotification, NotificationType } from '../../utils/notifications';
import { Role } from '@energyweb/user-registry';
import { MarketUser } from '@energyweb/market';
import { getCurrentUser } from '../users/selectors';
import { setLoading } from '../general/actions';
import { getCertificates, getCertificateFetcher, getCertificateById } from './selectors';
import { Certificate, CertificationRequest } from '@energyweb/issuer';

function* requestCertificatesSaga(): SagaIterator {
    while (true) {
        const action: IRequestCertificatesAction = yield take(
            CertificatesActions.requestCertificates
        );

        yield put(setLoading(true));

        yield put(hideRequestCertificatesModal());
        const configuration: IStoreState['configuration'] = yield select(getConfiguration);

        const { startTime, endTime, files, deviceId } = action.payload;

        try {
            yield apply(CertificationRequest, CertificationRequest.createCertificationRequest, [
                startTime,
                endTime,
                deviceId,
                configuration,
                files
            ]);

            showNotification(`Certificates requested.`, NotificationType.Success);
        } catch (error) {
            console.warn('Error while requesting certificates', error);
            showNotification(`Transaction could not be completed.`, NotificationType.Error);
        }

        yield put(setLoading(false));
    }
}

function* openRequestCertificatesModalSaga(): SagaIterator {
    while (true) {
        const action: IShowRequestCertificatesModalAction = yield take(
            CertificatesActions.showRequestCertificatesModal
        );

        const device = action.payload.producingDevice;
        const currentUser: MarketUser.Entity = yield select(getCurrentUser);

        if (device?.owner?.address?.toLowerCase() !== currentUser?.id?.toLowerCase()) {
            showNotification(
                `You need to own the device to request certificates.`,
                NotificationType.Error
            );
        } else if (!currentUser.isRole(Role.DeviceManager)) {
            showNotification(
                `You need to have Device Manager role to request certificates.`,
                NotificationType.Error
            );
        } else {
            yield put(setRequestCertificatesModalVisibility(true));
        }
    }
}

function* fetchCertificateSaga(id: string, entitiesBeingFetched: any): SagaIterator {
    if (entitiesBeingFetched.has(id)) {
        return;
    }

    const entities: Certificate.Entity[] = yield select(getCertificates);

    const existingEntity: Certificate.Entity = yield call(getCertificateById, entities, id);

    const configuration: IStoreState['configuration'] = yield select(getConfiguration);
    const fetcher: ICertificateFetcher = yield select(getCertificateFetcher);

    entitiesBeingFetched.set(id, true);

    try {
        if (existingEntity) {
            const reloadedEntity: Certificate.Entity = yield call(fetcher.reload, existingEntity);

            if (reloadedEntity) {
                yield put(updateCertificate(reloadedEntity));
            }
        } else {
            const fetchedEntity: Certificate.Entity = yield call(fetcher.fetch, id, configuration);

            if (fetchedEntity) {
                yield put(addCertificate(fetchedEntity));
            }
        }
    } catch (error) {
        console.error('Error while fetching certificate', error);
    }

    entitiesBeingFetched.delete(id);
}

function* requestCertificateSaga(): SagaIterator {
    const usersBeingFetched = new Map<string, boolean>();

    while (true) {
        const action: IRequestCertificateEntityFetchAction = yield take(
            CertificatesActions.requestCertificateEntityFetch
        );

        if (!action.payload) {
            return;
        }

        const entityId = action.payload.toLowerCase();

        try {
            yield fork(fetchCertificateSaga, entityId, usersBeingFetched);
        } catch (error) {
            console.error('requestCertificateSaga: error', error);
        }
    }
}

export function* certificatesSaga(): SagaIterator {
    yield all([
        fork(requestCertificatesSaga),
        fork(openRequestCertificatesModalSaga),
        fork(requestCertificateSaga)
    ]);
}
