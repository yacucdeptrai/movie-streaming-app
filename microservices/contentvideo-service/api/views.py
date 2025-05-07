import boto3
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
from django.conf import settings
import psycopg2

@csrf_exempt
def upload_video(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    # Lấy dữ liệu từ body
    try:
        body = json.loads(request.body)
        title = body.get('title')
        description = body.get('description')
        video_file = body.get('video_file')
        if not all([title, description, video_file]):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Invalid JSON: ' + str(e)}, status=400)

    # Kết nối PostgreSQL với SSL
    try:
        conn = psycopg2.connect(
            dbname='movie_db',
            user='admindb',
            password='admin123',
            host=settings.DATABASES['default']['HOST'],
            port='5432',
            sslmode='require'  # Bật SSL
        )
        cursor = conn.cursor()
        cursor.execute("INSERT INTO movies (title, description) VALUES (%s, %s) RETURNING movie_id",
                       (title, description))
        movie_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        return JsonResponse({'error': 'Database error: ' + str(e)}, status=500)

    # Upload video lên S3 bucket origin
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        video_key = f"{movie_id}/input/{video_file.split('/')[-1]}"
        s3_client.upload_file(video_file, settings.AWS_S3_ORIGIN_BUCKET, video_key)
    except Exception as e:
        return JsonResponse({'error': 'S3 upload error: ' + str(e)}, status=500)

    # Gọi MediaConvert để mã hóa video
    try:
        mediaconvert_client = boto3.client(
            'mediaconvert',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            endpoint_url='https://mediaconvert.us-east-1.amazonaws.com'
        )
        job_settings = {
            "Inputs": [
                {
                    "FileInput": f"s3://{settings.AWS_S3_ORIGIN_BUCKET}/{video_key}",
                    "AudioSelectors": {
                        "Audio Selector 1": {
                            "Offset": 0,
                            "DefaultSelection": "DEFAULT",
                            "SelectorType": "TRACK",
                            "Tracks": [1]
                        }
                    }
                }
            ],
            "OutputGroups": [
                {
                    "Name": "Apple HLS",
                    "Outputs": [
                        {
                            "Preset": settings.AWS_MEDIACONVERT_TEMPLATE,
                            "NameModifier": "_1080p"
                        }
                    ],
                    "OutputGroupSettings": {
                        "Type": "HLS_GROUP_SETTINGS",
                        "HlsGroupSettings": {
                            "Destination": f"s3://{settings.AWS_S3_DEST_BUCKET}/{movie_id}/hls/",
                            "SegmentLength": 6,
                            "MinSegmentLength": 0
                        }
                    }
                }
            ]
        }
        response = mediaconvert_client.create_job(
            Role=settings.AWS_MEDIACONVERT_ROLE_ARN,
            Settings=job_settings,
            Queue="arn:aws:mediaconvert:us-east-1:<your-account-id>:queues/Default"
        )
    except Exception as e:
        return JsonResponse({'error': 'MediaConvert error: ' + str(e)}, status=500)

    return JsonResponse({'message': 'Video uploaded and processing started', 'movie_id': movie_id}, status=200)