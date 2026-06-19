import {
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from '../store/apiSlice';

export default function useAddresses() {
  const { data: addresses = [], isLoading, error, refetch } = useGetAddressesQuery();
  const [addAddress, { isLoading: isAdding }] = useAddAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const [deleteAddress, { isLoading: isDeleting }] = useDeleteAddressMutation();
  const [setDefaultAddress, { isLoading: isSettingDefault }] = useSetDefaultAddressMutation();

  const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0] || null;

  return {
    addresses,
    defaultAddress,
    isLoading,
    error,
    refetch,
    addAddress,
    isAdding,
    updateAddress,
    isUpdating,
    deleteAddress,
    isDeleting,
    setDefaultAddress,
    isSettingDefault,
  };
}
