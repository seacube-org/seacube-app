import { useMemo } from "react";
import { useDataService } from "@/hooks/core/useDataService";
import { API_ENDPOINTS } from "@/constants/Constants";
import type {
  ProductAttribute as BaseProductAttribute,
  ProductAttributeDataType,
} from "@/components/modules/products/shared";

// The data-type union + its localized label live in the products module (single
// source); re-export so the settings page/drawer keep importing them from here.
export { attributeTypeLabel as dataTypeLabel } from "@/components/modules/products/shared";
export type { ProductAttributeDataType };

// Global, admin-managed catalog row = the shared attribute shape + the is_system flag.
export type ProductAttribute = BaseProductAttribute & { is_system: boolean };

export const DATA_TYPES: ProductAttributeDataType[] = [
  "text",
  "decimal",
  "percent",
  "boolean",
  "choice",
  "choice_or_custom",
];

/** data_types whose `choices` list is meaningful (else choices is null). */
export const CHOICE_TYPES = new Set<ProductAttributeDataType>(["choice", "choice_or_custom"]);

/** Auth-aware viewset for the global product-attribute catalog (admin-only on the backend). */
export function useProductAttributeViewSet() {
  const { getViewSet } = useDataService();
  return useMemo(() => getViewSet(API_ENDPOINTS.productAttributes), [getViewSet]);
}
