from django.urls import path, include

urlpatterns = [
    path('api/content/', include('api.urls')),
]