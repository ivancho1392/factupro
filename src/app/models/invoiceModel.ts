export interface Invoice {
    id: string;
    date: Date; 
    category: string;
    description: string;
    value: number;
    imageUrl: string;
    userName: string;
    Subtotal: number;
    ITBMSUSD: number;
}