interface InvoiceData {
    UserName: string;
    Value: number;
    Date: string;
    Description: string;
    Category: string;
    Content: string;
  }
  
  export async function createInvoice(data: InvoiceData): Promise<any> {
    const url = process.env.CREATE_INVOICE_ENDPOIN || 'https://pitvd10usa.execute-api.us-east-1.amazonaws.com/production//Invoice';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    console.log('Response from API:', responseData);
    return response.json();
  }
  