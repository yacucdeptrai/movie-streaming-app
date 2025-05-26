import boto3
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
import json
from django.conf import settings
import psycopg2

@csrf_exempt
def upload_video(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    # Hỗ trợ multipart/form-data
    if 'multipart/form-data' in request.headers.get('Content-Type', ''):
        # Lấy dữ liệu từ form
        title = request.POST.get('title')
        description = request.POST.get('description')
        video_file = request.FILES.get('video')  # Sửa từ 'video_file' thành 'video'
        genre = request.POST.get('genre')
        release_year = request.POST.get('release_year')

        if not all([title, description, video_file]):
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        # Kết nối PostgreSQL với SSL
        try:
            conn = psycopg2.connect(
                dbname='movie_db',
                user=os.getenv('DATABASE_USER', 'admindb'),
                password=os.getenv('DATABASE_PASSWORD', 'admin123'),
                host=settings.DATABASES['default']['HOST'],
                port='5432',
                sslmode='verify-full',
                sslrootcert='/app/us-east-1-bundle.pem'
            )
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO movies (title, description, genre, release_year) VALUES (%s, %s, %s, %s) RETURNING movie_id",
                (title, description, genre, release_year if release_year else None)
            )
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
            video_key = f"{movie_id}/input/{video_file.name}"
            s3_client.upload_fileobj(video_file, settings.AWS_S3_ORIGIN_BUCKET, video_key)
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
                                "Preset": settings.AWS_MEDIACONVERT_TEMPLATE_1080,  # Preset cho 1080p
                                "NameModifier": "_1080p"
                            },
                            {
                                "Preset": settings.AWS_MEDIACONVERT_TEMPLATE_720,  # Preset cho 720p
                                "NameModifier": "_720p"
                            },
                            {
                                "Preset": settings.AWS_MEDIACONVERT_TEMPLATE_480,  # Preset cho 480p
                                "NameModifier": "_480p"
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
                Queue="arn:aws:mediaconvert:us-east-1:078287195810:queues/Default"
            )
        except Exception as e:
            return JsonResponse({'error': 'MediaConvert error: ' + str(e)}, status=500)

        return JsonResponse({'message': 'Video uploaded and processing started', 'movie_id': movie_id}, status=200)

    # Hỗ trợ application/json (lệnh cũ)
    elif request.headers.get('Content-Type') == 'application/json':
        try:
            data = json.loads(request.body)
            title = data.get('title')
            description = data.get('description')
            video_file = data.get('video_file')
            genre = data.get('genre')
            release_year = data.get('release_year')

            if not all([title, description, video_file]):
                return JsonResponse({'error': 'Missing required fields'}, status=400)

            # Kết nối PostgreSQL
            conn = psycopg2.connect(
                dbname='movie_db',
                user=os.getenv('DATABASE_USER', 'admindb'),
                password=os.getenv('DATABASE_PASSWORD', 'admin123'),
                host=settings.DATABASES['default']['HOST'],
                port='5432',
                sslmode='verify-full',
                sslrootcert='/app/us-east-1-bundle.pem'
            )
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO movies (title, description, genre, release_year) VALUES (%s, %s, %s, %s) RETURNING movie_id",
                (title, description, genre, release_year if release_year else None)
            )
            movie_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            conn.close()

            return JsonResponse({'message': 'Metadata saved (JSON mode)', 'movie_id': movie_id}, status=200)
        except Exception as e:
            return JsonResponse({'error': 'Error: ' + str(e)}, status=400)

    return JsonResponse({'error': 'Unsupported Content-Type'}, status=400)