interface InvoiceData {
  UserName: string;
  Value: number;
  Date: string;
  Description: string;
  Category: string;
  Content: string;
  ITBMSUSD: number;
  Subtotal: number;
}

function getCreateInvoiceEndpoint() {
  const url = process.env.NEXT_PUBLIC_CREATE_INVOICE_ENDPOINT;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_CREATE_INVOICE_ENDPOINT');
  }

  return url;
}

function getAnalyzeInvoiceIAEndpoint() {
  const url = process.env.NEXT_PUBLIC_ANALYZE_INVOICE_IA_ENDPOINT;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_ANALYZE_INVOICE_IA_ENDPOINT');
  }

  return url;
}

export async function createInvoice(data: InvoiceData): Promise<any> {
  const token = localStorage.getItem('idToken');
  const url = getCreateInvoiceEndpoint();
  
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

export async function analyzeInvoiceIA(data: { Content: string }): Promise<any> {
  const token = localStorage.getItem('idToken');
  const url = getAnalyzeInvoiceIAEndpoint();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Ocurrió un error en el análisis IA');
  }

  return await response.json();
}

export async function getInvoices(month?: string): Promise<any> {
  const token = localStorage.getItem('idToken');
  const url = new URL(getCreateInvoiceEndpoint());
  
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
  const url = new URL(getCreateInvoiceEndpoint());
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
