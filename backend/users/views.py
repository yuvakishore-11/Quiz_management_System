from django.conf import settings
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .models import CustomUser
from .serializers import UserSerializer, RegisterSerializer, GoogleAuthSerializer


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth_view(request):
    """
    Accepts a Google ID token from the frontend, verifies it,
    and creates/retrieves the user, returning JWT tokens.
    """
    serializer = GoogleAuthSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    token = serializer.validated_data['token']
    role = serializer.validated_data.get('role', CustomUser.Role.STUDENT)

    try:
        id_info = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        return Response({'error': f'Invalid Google token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    google_id = id_info.get('sub')
    email = id_info.get('email')
    first_name = id_info.get('given_name', '')
    last_name = id_info.get('family_name', '')
    avatar = id_info.get('picture', '')

    # Get or create user
    user, created = CustomUser.objects.get_or_create(
        google_id=google_id,
        defaults={
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'avatar': avatar,
            'role': role,
        }
    )

    if not created:
        # Update avatar in case it changed
        user.avatar = avatar
        user.save(update_fields=['avatar'])

    tokens = get_tokens_for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'tokens': tokens,
        'created': created,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
