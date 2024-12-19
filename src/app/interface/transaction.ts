import { Order } from "./product";

export interface Transaction {
    transaction_ID: number,
    client_ID: number,
    client_name: string,
    client_contact: string,
    client_address: string,
    dr_number: string,
    transaction_processor: string,
    subtotal_price: number,
    discount: number,
    transaction_date: string,
    paid_date?: string,
    paid_date_unix?: string,
    unix_dates?: string[],
    paid_amount?: string,
    total_paid?: number,
    payment_left?: number,
    term: string,
    transaction_detail: string,
    is_paid: boolean,
    is_delivered: boolean,
    is_dropdown: boolean,
    is_deleted: boolean,
    order: Order[]
}
