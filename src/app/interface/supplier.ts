export interface Supplier {
    supplier_ID: number,
    supplier_name: string,
    supplier_contact: string,
    supplier_note: string
    isDropdown: boolean,
    isEditing: boolean,
    addingPromo: boolean,
    isLoading: boolean
}

export interface SupplierPromo {
    supplier_promo_ID: number,
    supplier_ID: number,
    promo_name: string,
    promo_description: string | null,
    isEditing: boolean
    isAdding: boolean
    isLoading: boolean
}

export interface SupplierProduct{
    supplier_transaction_ID: number,
    supplier_promo_ID: number,
    product_ID: number,
    variant_ID: number,
    product_name: string,
    variant_name: string,
    incoming_quantity: number,
    discount: string,
    final_cost: number,
}

export interface SupplierTransaction {
    supplier_transaction_ID: number,
    supplier_name: string,
    dr_number: string,
    date: Date,
    total_cost: number,
    method_of_payment: string,
    total_discount: number,
    is_paid: boolean,
    paid_date?: Date,
    paid_date_unix?: string,
    unix_dates?: string[],
    paid_amount?: string,
    total_paid?: number,
    payment_left?: number,
    is_dropdown: boolean,
}