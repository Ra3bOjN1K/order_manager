from django.contrib.auth.models import Permission

from rest_framework import serializers

from orders_manager.models import (UserProfile, Client, Order, Program,
    AdditionalService, ClientChild, ProgramPrice, Discount)


class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        fields = kwargs.pop('required_fields', None)

        super(DynamicFieldsModelSerializer, self).__init__(*args, **kwargs)

        if fields is not None:
            allowed = set(fields)
            existing = set(self.fields.keys())
            for field_name in existing - allowed:
                self.fields.pop(field_name)


class UserPermissionSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Permission
        fields = ('codename',)


class UserProfileSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(source='user.id', required=False)
    username = serializers.CharField(source='user.username')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    full_name = serializers.SerializerMethodField()
    email = serializers.CharField(source='user.email')
    role = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = '__all__'
        extra_kwargs = {
            'weekends': {'required': False},
            'user': {
                'required': False,
                'validators': []
            }
        }

    def get_full_name(self, obj):
        return '{0.user.last_name} {0.user.first_name}'.format(obj)

    def get_role(self, obj):
        return obj.get_role_name()


class ClientSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField()

    class Meta:
        model = Client
        extra_kwargs = {
            'name': {'required': False}
        }


class ClientChildrenSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(required=False)
    age = serializers.SerializerMethodField()

    class Meta:
        model = ClientChild

    def get_age(self, obj):
        def _check_age_lbl(age):
            if age > 0 and age // 10 != 1:
                if age % 10 == 1:
                    return 'год'
                elif age % 10 in (2, 3, 4):
                    return 'года'
                else:
                    return 'лет'
            else:
                return 'лет'

        return '%d %s' % (obj.age(), _check_age_lbl(obj.age()))

    def create(self, validated_data):
        validated_data.update({'client_id': validated_data.get('client').id})
        del validated_data['client']

        if validated_data.get('id'):
            instance = ClientChild.objects.update_or_create(**validated_data)
        else:
            instance = ClientChild.objects.create(**validated_data)

        return instance


class ProgramSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(required=False)
    possible_executors = UserProfileSerializer(
        required_fields=['id', 'full_name', 'role'], many=True, required=False)

    class Meta:
        model = Program
        extra_kwargs = {
            'characters': {'required': False},
            'title': {'required': False}
        }

    def create(self, validated_data):
        if validated_data.get('id'):
            instance = Program.objects.update_or_create(**validated_data)
        else:
            instance = Program.objects.create(**validated_data)

        return instance


class ProgramPriceSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(required=False)

    class Meta:
        model = ProgramPrice

    def create(self, validated_data):
        validated_data.update({'program_id': validated_data.get('program').id})
        del validated_data['program']

        if validated_data.get('id'):
            instance = ProgramPrice.objects.update_or_create(**validated_data)
        else:
            instance = ProgramPrice.objects.create(**validated_data)

        return instance


class AdditionalServiceSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(required=False)
    possible_executors = UserProfileSerializer(
        required_fields=['id', 'full_name', 'role'], many=True, required=False)

    class Meta:
        model = AdditionalService
        extra_kwargs = {
            'title': {'required': False}
        }

    def create(self, validated_data):
        if validated_data.get('id'):
            instance = AdditionalService.objects.update_or_create(**validated_data)
        else:
            instance = AdditionalService.objects.create(**validated_data)

        return instance


class DiscountSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField()

    class Meta:
        model = Discount


class OrderSerializer(DynamicFieldsModelSerializer):
    id = serializers.CharField(required=False)

    code = serializers.CharField(required=False, read_only=True)
    author = UserProfileSerializer(required_fields=['id', 'full_name'],
                                   required=False)
    client = ClientSerializer(required_fields=['id'])
    client_children = ClientChildrenSerializer(required_fields=['id'],
                                               many=True)
    program = ProgramSerializer(required_fields=['id', 'title'])
    program_executors = UserProfileSerializer(
        required_fields=['id'], many=True, required=False)
    additional_services = AdditionalServiceSerializer(
        required_fields=['id'], many=True, required= False)
    services_executors = UserProfileSerializer(
        required_fields=['id'], many=True, required=False)
    discount = DiscountSerializer(required_fields=['id'])

    class Meta:
        model = Order

    def create(self, validated_data):
        client_children = [x.get('id') for x in validated_data.get(
            'client_children')]
        validated_data['client_children'] = client_children
        program_executors = [x.get('user').get('id') for x in
                             validated_data.get('program_executors')]
        validated_data['program_executors'] = program_executors
        services_executors = [x.get('user').get('id') for x in
                              validated_data.get('services_executors')]
        validated_data['services_executors'] = services_executors
        additional_services = [x.get('id') for x in validated_data.get(
            'additional_services')]
        validated_data['additional_services'] = additional_services

        if validated_data.get('id'):
            instance = Order.objects.update(**validated_data)
        else:
            instance = Order.objects.create(**validated_data)

        return instance
