export interface BestPerformanceProduct {
    total_quantity_sold: string
    total_revenue: number
    has_variant: boolean
    product_name?: string
    variant_name?: string
}

export interface SalesAnalytics {
    gross_revenue: number;
    average_gross_revenue: number;
    net_revenue: number;
    average_net_revenue: number;
    prev_gross_revenue: number;
    prev_average_gross_revenue: number;
    prev_net_revenue: number;
    prev_average_net_revenue: number;
    gross_revenue_diff: number;
    average_gross_revenue_diff: number;
    net_revenue_diff: number;
    average_net_revenue_diff: number;
    curr_expenses: number;
    prev_expenses: number;
    expenses_diff: number;
}

interface CostTotal {
    dates: number;
    cost: number;    
}
export interface SaleVsExpenses {
    sales: CostTotal[];
    expenses: CostTotal[]
}

export interface TodoListNumber {
    unpaid_clients: number;
    to_deliver: number;
    unpaid_transaction: number;
}


export interface ProductHistory {
    product_ID: number;
    has_variant: number;
    variant_ID: number;
    variant_name: number;
    product_name: number;
    recent_transaction_date: string;
    stock_number: number;
    image_url: string
}
