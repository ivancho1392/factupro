interface InvoiceData {
  UserName: string;
  Value: number;
  Date: string;
  Description: string;
  Category: string;
  Content: string;
  ITBMS: string;
  Subtotal: string;
}

export async function createInvoice(data: InvoiceData): Promise<any> {
  const token = localStorage.getItem('idToken');
  const url = process.env.CREATE_INVOICE_ENDPOINT || 'https://k9nm0v7rpk.execute-api.us-east-1.amazonaws.com/dev/invoice';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    // Handle different status codes
    const errorData = await response.json();
    if (response.status === 401) {
      throw new Error('Unauthorized');
    } else {
      throw new Error(errorData.message || 'An error occurred');
    }
  }

  return await response.json();
}


export async function getInvoices(month?: string): Promise<any> {
  const token = localStorage.getItem('idToken');
  const url = new URL(process.env.CREATE_INVOICE_ENDPOINT || 'https://k9nm0v7rpk.execute-api.us-east-1.amazonaws.com/dev/invoice');
  
  if (month) {
    url.searchParams.append('month', month);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 401) {
      throw new Error('Unauthorized');
    } else {
      throw new Error(errorData.message || 'An error occurred');
    }
  }

  const responseData = await response.json();
  console.log(responseData);

  return responseData;
}


export async function deleteInvoice(invoiceId: string, fileKey: string): Promise<any> {
  const token = localStorage.getItem('idToken');
  const url = new URL(process.env.CREATE_INVOICE_ENDPOINT || 'https://k9nm0v7rpk.execute-api.us-east-1.amazonaws.com/dev/invoice');
  const fileUrl : string = extractFileKey(fileKey);

  if (invoiceId) {
    url.searchParams.append('invoiceId', invoiceId);
  }

  if (fileUrl) {
    url.searchParams.append('fileUrl', fileUrl);
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 401) {
      throw new Error('Unauthorized');
    } else {
      throw new Error(errorData.message || 'An error occurred');
    }
  }
   return await response.json();
}

function extractFileKey(url: any) {
  const start = url.indexOf('invoices/')+9;
  if (start === -1) return null;
  const end = url.indexOf('.jpg', start)+4; 
  if (end === -1) return null;
  return url.substring(start, end);
}

