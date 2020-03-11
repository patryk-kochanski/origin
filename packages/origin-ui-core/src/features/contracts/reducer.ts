import { ContractsActions, IContractsAction } from './actions';
import { IContractsLookup } from '@energyweb/origin-backend-core';

export interface IContractsState {
    contractsLookup: IContractsLookup;
}

const defaultState: IContractsState = {
    contractsLookup: {
        userLogic: null,
        deviceLogic: null,
        registry: null,
        issuer: null
    }
};

export default function reducer(state = defaultState, action: IContractsAction): IContractsState {
    switch (action.type) {
        case ContractsActions.setContractsLookup:
            return { ...state, contractsLookup: action.payload };

        default:
            return state;
    }
}
