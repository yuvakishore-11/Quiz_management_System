from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView

from . import views

urlpatterns = [
    # Standard JWT login (email + password)
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Registration
    path('register/', views.register_view, name='register'),
    # Google OAuth
    path('google/', views.google_auth_view, name='google_auth'),
    # Profile
    path('me/', views.me_view, name='me'),
    path('me/update/', views.update_profile_view, name='update_profile'),
]
