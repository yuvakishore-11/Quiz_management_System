from rest_framework import serializers
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role', 'avatar', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'google_id']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['email', 'first_name', 'last_name', 'role', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        if attrs.get('role') not in [CustomUser.Role.TEACHER, CustomUser.Role.STUDENT]:
            raise serializers.ValidationError({'role': 'Role must be teacher or student.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class GoogleAuthSerializer(serializers.Serializer):
    token = serializers.CharField()
    role = serializers.ChoiceField(
        choices=[CustomUser.Role.TEACHER, CustomUser.Role.STUDENT],
        required=False,
        default=CustomUser.Role.STUDENT
    )
