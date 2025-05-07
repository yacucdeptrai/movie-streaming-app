from dotenv import load_dotenv
import os
load_dotenv()

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'movie_db',
        'USER': 'admindb',
        'PASSWORD': 'admin123',
        'HOST': 'movie-db.cohuqu6m26h2.us-east-1.rds.amazonaws.com',
        'PORT': '5432',
    }
}