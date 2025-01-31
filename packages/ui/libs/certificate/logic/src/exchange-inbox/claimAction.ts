import { AccountAssetDTO } from '@energyweb/exchange-react-query-client';
import { BeneficiaryDTO } from '@energyweb/origin-organization-irec-api-react-query-client';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { formatSelectedExchangeItems } from './formatSelectedExchangeItems';
import {
  SelectedItem,
  TUseClaimActionLogic,
  TUseClaimBeneficiariesFormLogic,
} from './types';

export const useClaimActionLogic: TUseClaimActionLogic<
  AccountAssetDTO['asset']['id']
> = ({ selectedIds, exchangeCertificates, allDevices, allFuelTypes }) => {
  const { t } = useTranslation();

  const selectedItems: SelectedItem<AccountAssetDTO['asset']['id']>[] =
    selectedIds
      ? formatSelectedExchangeItems({
          selectedIds,
          exchangeCertificates,
          allDevices,
          allFuelTypes,
        })
      : [];

  return {
    title: t('certificate.exchangeInbox.selectedForClaim'),
    buttonText: t('certificate.exchangeInbox.claimButton'),
    selectedItems,
    selectDisabledTooltip: t(
      'certificate.exchangeInbox.addBeneficiariesTooltip'
    ),
  };
};

export const useClaimBeneficiaryFormLogic: TUseClaimBeneficiariesFormLogic = (
  beneficiaries
) => {
  const { t } = useTranslation();
  return {
    initialValues: {
      beneficiary: undefined,
      startDate: '',
      endDate: '',
      purpose: '',
    },
    validationSchema: yup.object({
      beneficiary: yup
        .number()
        .required()
        .label(t('certificate.exchangeInbox.beneficiary')),
      startDate: yup
        .string()
        .required()
        .label(t('certificate.exchangeInbox.startDate')),
      endDate: yup
        .string()
        .required()
        .label(t('certificate.exchangeInbox.endDate')),
      purpose: yup
        .string()
        .required()
        .label(t('certificate.exchangeInbox.purpose')),
    }),
    fields: [
      {
        name: 'beneficiary',
        label: t('certificate.exchangeInbox.selectBeneficiary'),
        select: true,
        options: prepareBeneficiariesOptions(beneficiaries),
        textFieldProps: {
          variant: 'filled' as any,
        },
      },
      {
        name: 'startDate',
        label: t('certificate.exchangeInbox.startDate'),
        datePicker: true,
        textFieldProps: {
          variant: 'filled' as any,
          margin: 'none',
        },
      },
      {
        name: 'endDate',
        label: t('certificate.exchangeInbox.endDate'),
        datePicker: true,
        textFieldProps: {
          variant: 'filled' as any,
          margin: 'none',
        },
      },
      {
        name: 'purpose',
        label: t('certificate.exchangeInbox.purpose'),
        textFieldProps: {
          variant: 'filled' as any,
          margin: 'none',
        },
      },
    ],
  };
};

const prepareBeneficiariesOptions = (beneficiaries: BeneficiaryDTO[]) => {
  return beneficiaries?.map((beneficiary) => ({
    label: beneficiary.name,
    value: beneficiary.id,
  }));
};
