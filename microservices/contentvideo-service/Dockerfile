FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
COPY us-east-1-bundle.pem /app/us-east-1-bundle.pem
CMD ["gunicorn", "--bind", "0.0.0.0:8003", "contentvideo_service.wsgi:application"]