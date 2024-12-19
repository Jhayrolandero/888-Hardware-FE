export interface Variant {
    variant_ID: number,
    product_ID: number,
    variant_code: string,
    variant_type: string,
    product_name: string,
    variant_group_name: string,
    variant_name: string,
    variant_stock_price: number,
    variant_stock_discount: string,
    variant_unit_price: number,
    variant_unit_discount: string,
    variant_stock: number,
    variant_description: string,
    variant_image: string
    low_stock_level: number
    critical_stock_level: number
    latest_stock_entry_id: number
    is_archived: boolean
    archived_at?: Date
}

export interface FormVariant {
    variant_ID: number,
    variant_code: string,
    variant_type: string,
    name: string
    stock_price: number,
    variant_stock_discount: string,
    sell_price: number,
    variant_unit_discount: string,
    stock: number
    description: string
    image: string
    low_stock_level: number
    critical_stock_level: number
    latest_stock_entry_id?: number

}

export interface VariantGroup {
    groupName: string
    variants: FormVariant[]
}