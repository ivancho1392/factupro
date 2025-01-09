import json
import boto3
import os
import base64
from uuid import uuid4
from boto3.dynamodb.conditions import Attr
from decimal import Decimal

# Configuración de S3
s3_client = boto3.client('s3')
bucket_name = os.getenv('BUCKET_NAME', 'factuprobucket')

# Configuración de DynamoDB
dynamodb = boto3.resource('dynamodb')
table_name = os.getenv('TABLE_NAME', 'Invoices')
table = dynamodb.Table(table_name)

def query_invoices(month=None):
    try:
        scan_kwargs = {}
        
        if month:
            scan_kwargs['FilterExpression'] = Attr('Date').begins_with(month)

        items = []
        done = False
        start_key = None

        while not done:
            if start_key:
                scan_kwargs['ExclusiveStartKey'] = start_key

            response = table.scan(**scan_kwargs)
            items.extend(response.get('Items', []))
            start_key = response.get('LastEvaluatedKey', None)
            done = start_key is None

        # Convert Decimal to float
        for item in items:
            for key, value in item.items():
                if isinstance(value, Decimal):
                    item[key] = float(value)

        return items, None
    except Exception as e:
        return None, str(e)


def upload_to_s3(file_content, file_extension):
    try:
        file_key = f"invoices/{str(uuid4())}.{file_extension}"
        decode_file = base64.b64decode(file_content)
        
        # Determinar el tipo de contenido basado en la extensión del archivo
        if file_extension == 'jpg' or file_extension == 'jpeg':
            content_type = 'image/jpeg'
        elif file_extension == 'png':
            content_type = 'image/png'
        elif file_extension == 'pdf':
            content_type = 'application/pdf'
        else:
            raise Exception("Unsupported file extension")
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=decode_file,
            ContentType=content_type,  # Agregar Content-Type
            ContentDisposition='inline'  # Agregar Content-Disposition
        )
        s3_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
        return s3_url, None
    except Exception as e:
        return None, str(e)

def save_to_dynamodb(data, s3_url):
    try:
        invoice_id = str(uuid4())
        invoice_data = {
            'InvoiceId': invoice_id,
            'UserName': data['UserName'],
            'Value': Decimal(str(data['Value'])), 
            'Date': data['Date'],
            'Description': data['Description'],
            'Category': data['Category'],
            'ImgLink': s3_url,
            'ITBMSUSD': Decimal(str(data['ITBMSUSD'])),  
            'Subtotal': Decimal(str(data['Subtotal'])),
        }
        table.put_item(Item=invoice_data)
        return None
    except Exception as e:
        return str(e)
        
def delete_from_s3(file_url):
    try:
        s3_client.delete_object(Bucket=bucket_name, Key=file_url)
        return None
    except Exception as e:
        return str(e)
        
def delete_invoice(invoice_id, file_url):
    try:
        error = delete_from_s3(file_url)
        if error:
            raise Exception(f"Error deleting S3 object: {error}")

        table.delete_item(
            Key={
                'InvoiceId': invoice_id
            },
            ConditionExpression="attribute_exists(InvoiceId)"
        )
        return None
    except Exception as e:
        return str(e)

def lambda_handler(event, context):
    try:
        print("Event: ", json.dumps(event))

        if 'requestContext' not in event or 'authorizer' not in event['requestContext'] or 'claims' not in event['requestContext']['authorizer']:
            raise Exception('User is not authenticated')

        http_method = event['httpMethod']
        path = event['path']
        
        user_claims = event['requestContext']['authorizer']['claims']
        user_name = user_claims.get('cognito:username', 'unknown')
        user_email = user_claims.get('email', 'unknown')

        if http_method == 'POST' and path == '/invoice':
            body = event['body']
            data = json.loads(body)

            file_content = data['Content']
            
            if file_content.startswith('/9j/'):
                file_extension = 'jpg'
            elif file_content.startswith('JVBER'):
                file_extension = 'pdf'
            else:
                raise Exception("Tipo de archivo no soportado")

            s3_url, error = upload_to_s3(file_content, file_extension)
            if error:
                raise Exception(f"Error al subir archivo a S3: {error}")
                
            data['UserName'] = user_email
            data['Value'] = Decimal(str(data['Value']))
            data['ITBMSUSD'] = Decimal(str(data['ITBMSUSD']))
            data['Subtotal'] = Decimal(str(data['Subtotal']))
            
            error = save_to_dynamodb(data, s3_url)
            if error:
                raise Exception(f"Error al guardar datos en DynamoDB: {error}")

            response = {
                'statusCode': 201,
                'body': json.dumps({
                    'message': 'Factura cargada exitosamente!',
                    'event': event
                })
            }
        elif http_method == 'GET' and path == '/invoice':
            month = event['queryStringParameters'].get('month', '') if event['queryStringParameters'] else ''
            invoices, error = query_invoices(month=month)
            if error:
                raise Exception(f"Error al consultar facturas: {error}")

            response = {
                'statusCode': 200,
                'body': json.dumps(invoices)
            }
        elif http_method == 'DELETE' and path == '/invoice':
            invoice_id = event['queryStringParameters'].get('invoiceId','')if event['queryStringParameters'] else ''
            file_url = event['queryStringParameters'].get('fileUrl','')if event['queryStringParameters'] else ''
            error = delete_invoice(invoice_id, file_url)
            if error:
                raise Exception(f"Error al eliminar la factura: {error}")

            response = {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Factura eliminada exitosamente!'
                })
            }
        else:
            response = {
                'statusCode': 400,
                'body': json.dumps({
                    'message': 'Método o ruta inválida!'
                })
            }
    except Exception as e:
        response = {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error en la ejecución de la función Lambda',
                'error': str(e)
            })
        }

    response['headers'] = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE',
    }

    return response