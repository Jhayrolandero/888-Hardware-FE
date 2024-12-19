export interface Product {
    product_ID: number,
    category_ID: number,
    category_name: string,
    product_name: string,
    product_code: string,
    product_stock: number,
    product_stock_discount: string,
    default_stock_price: number,
    unit_price_discount: string,
    unit_price: number,
    description: string,
    product_image: string,
    brand: string,
    unit_name: string,
    has_variant: boolean,
    has_volume: boolean,
    isDropdown: boolean,
    showTransaction: boolean,
    discounted_price: number | null,
    discount_value: number | null,
    variant_name?: string,
    variant_unit_price?: number,
    critical_stock_level?: number
    low_stock_level?: number
    latest_stock_entry_id: number | null;
    is_archived: boolean
    archived_at?: Date
}

export interface ManageProductList extends Product {
    has_low_stock?: boolean
}

export interface Units {
    unit_ID: number,
    unit_name: string,
    unit_quantity: number,
    product_ID: number
}

export interface Volume {
    volume_ID: number,
    volume_price: number,
    volume_quantity: number,
    product_ID: number
}

//for transaction-product
export interface Order {
    transaction_ID: number | null,
    product_ID: number,
    variant_ID: number | null,
    quantity: number,
    bonus_quantity: number,
    flat_discount: number | null,
    percentage_discount: number | null,
    discount: number[] | null,
    final_total: number,
    lowest_ID: number | null
}

export interface Promo {
    promotion_ID: number,
    promotion_type: string,
    promotion_name: string,
    promotion_from: string,
    promotion_to : string,
    type_Promo_ID: number,
    status: string,
    products: Product[],
    bundle_details: any,
    bundle_tier: any
}

export interface DiscountPromo {
    discount_ID: number
    discount_product_ID: number
    discount_value: number
    discounted_price: number
    product_ID: number
    variant_ID: number
    discount_to: any
}

export interface CurrBundleProduct extends Product {
    bundle_status: string
    products: Product[],
    deal_name: string,
    bundle_details?: BundleDetails;
    deal_ID?: number;
}

export interface BundleDetails {
    bundle_tier: BundleTier[];
    deal_type: string;
    active: number;
    purchase_limit: number;
    purchase_amount: number;
}

export interface BundleTier {
    deal_tier_ID: number;
    deal_ID: number;
    tier_number: string;
    percentage: number | null;
    amount: number | null;
    free_product_qty: number | null;
    required_qty: number;
}
  

export interface ProductLowStock {
    product_ID: number
    variant_ID: number | null
    product_name: string
    product_image: string
    product_stock: number
    has_variant: boolean
    variant_image: string | null
    variant_name: string | null
    stock_status: string
    variant_stock: number | null
}

export interface StockDiscountEntry {
    lowest_id: number,
    normalized_discount: string,
    product_id?: number,
    variant_id?: number,
    total_quantity: number
}

export interface VariantArchive {
    variant_name: string | null;
    variant_code: string | null;
    variant_stock: number | null;
    variant_image: string | null;
    variant_archived_at: Date | null;
    variant_ID: number | null;
    variant_is_archive: boolean | null;
}
export interface ProductArchive extends VariantArchive{
    product_ID: number;
    product_name: string;
    product_image: string;
    product_stock: number
    product_code: string
    archived_at: Date
    has_variant: boolean
    product_is_archived: boolean
    variants: VariantArchive[]
    show_accordion: boolean
}